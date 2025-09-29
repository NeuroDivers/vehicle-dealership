import { NextRequest, NextResponse } from 'next/server';
import { handleVehicleChat } from '@/lib/ai-chat';
import { 
  performBotCheck, 
  checkRateLimit,
  verifyTurnstile,
  verifyRecaptcha 
} from '@/lib/bot-protection';
import { prisma } from '@/lib/prisma';

// Protected chat endpoint with bot protection
export async function POST(request: NextRequest) {
  try {
    // Get request data
    const { 
      message, 
      conversationHistory = [],
      captchaToken,
      sessionId,
      pageLoadTime,
      honeypot
    } = await request.json();

    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Load AI settings
    const settings = await prisma.siteSettings.findFirst({
      select: { aiSettings: true }
    });

    const aiSettings = settings?.aiSettings ? 
      JSON.parse(settings.aiSettings as string) : null;

    // Check if chat is enabled
    if (!aiSettings?.features?.chat?.enabled) {
      return NextResponse.json(
        { 
          error: 'Chat service is currently disabled',
          response: 'Our AI assistant is currently unavailable. Please contact us directly.'
        },
        { status: 503 }
      );
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(ip, {
      maxRequests: aiSettings.security.rateLimiting.maxRequestsPerIP || 20,
      windowMinutes: aiSettings.security.rateLimiting.windowMinutes || 60
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          response: 'You have made too many requests. Please try again later.',
          retryAfter: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }

    // Bot detection
    if (aiSettings.security.botDetection.enabled) {
      const botCheck = await performBotCheck({
        ip,
        userAgent,
        sessionId: sessionId || ip,
        honeypot,
        pageLoadTime,
        interactionTime: Date.now()
      });

      if (botCheck.isBot) {
        console.log(`Bot detected: ${botCheck.reason} (score: ${botCheck.score})`);
        return NextResponse.json(
          { 
            error: 'Bot detected',
            response: 'Automated access is not allowed. Please verify you are human.'
          },
          { status: 403 }
        );
      }
    }

    // CAPTCHA verification
    if (aiSettings.security.captcha.enabled && captchaToken) {
      let captchaValid = false;

      if (aiSettings.security.captcha.provider === 'recaptcha') {
        captchaValid = await verifyRecaptcha(
          captchaToken,
          aiSettings.security.captcha.secretKey,
          aiSettings.security.captcha.threshold
        );
      } else if (aiSettings.security.captcha.provider === 'cloudflare') {
        captchaValid = await verifyTurnstile(
          captchaToken,
          aiSettings.security.captcha.secretKey
        );
      }

      if (!captchaValid) {
        return NextResponse.json(
          { 
            error: 'CAPTCHA verification failed',
            response: 'Please complete the CAPTCHA verification.'
          },
          { status: 403 }
        );
      }
    }

    // Check monthly budget
    if (aiSettings.costs.autoDisableOnLimit && 
        aiSettings.costs.currentUsage >= aiSettings.costs.monthlyBudget) {
      return NextResponse.json(
        { 
          error: 'Monthly budget exceeded',
          response: 'Our AI service has reached its monthly limit. Please contact us directly.'
        },
        { status: 503 }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.length > 500) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Handle the chat with AI
    const result = await handleVehicleChat(message, conversationHistory);

    // Add rate limit headers
    return NextResponse.json({
      response: result.response,
      vehicles: result.vehicles,
      suggestedAction: result.suggestedAction,
      conversationHistory: result.conversationHistory,
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
      }
    });

  } catch (error) {
    console.error('Protected chat API error:', error);
    return NextResponse.json(
      {
        error: 'Chat service temporarily unavailable',
        response: "I'm sorry, our AI assistant is currently unavailable. Please contact our dealership directly."
      },
      { status: 500 }
    );
  }
}
