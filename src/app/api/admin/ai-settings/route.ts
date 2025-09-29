import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get AI settings
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (add your auth check here)
    // const session = await getSession(request);
    // if (!session?.user?.role === 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get settings from database
    const settings = await prisma.siteSettings.findFirst({
      select: {
        id: true,
        aiSettings: true,
      }
    });

    // Parse AI settings from JSON field
    const aiSettings = settings?.aiSettings ? 
      JSON.parse(settings.aiSettings as string) : 
      getDefaultSettings();

    return NextResponse.json({ 
      settings: aiSettings,
      success: true 
    });

  } catch (error) {
    console.error('Failed to get AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

// Update AI settings
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (add your auth check here)
    // const session = await getSession(request);
    // if (!session?.user?.role === 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }

    // Get existing site settings or create new
    const existingSettings = await prisma.siteSettings.findFirst();

    if (existingSettings) {
      // Update existing settings
      await prisma.siteSettings.update({
        where: { id: existingSettings.id },
        data: {
          aiSettings: JSON.stringify(settings),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new settings
      await prisma.siteSettings.create({
        data: {
          aiSettings: JSON.stringify(settings)
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Settings saved successfully'
    });

  } catch (error) {
    console.error('Failed to save AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

// Default AI settings
function getDefaultSettings() {
  return {
    features: {
      chat: {
        enabled: false,
        model: 'gpt-3.5-turbo',
        maxRequestsPerHour: 10,
        requireCaptcha: true,
        allowedDomains: []
      },
      descriptions: {
        enabled: false,
        model: 'gpt-3.5-turbo',
        autoGenerate: false,
        cacheResults: true
      },
      translations: {
        enabled: false,
        model: 'gpt-3.5-turbo',
        languages: ['fr', 'es', 'en'],
        cacheResults: true
      },
      leadAnalysis: {
        enabled: false,
        model: 'gpt-4',
        autoScore: true,
        generateFollowUps: false
      }
    },
    security: {
      rateLimiting: {
        enabled: true,
        maxRequestsPerIP: 20,
        windowMinutes: 60,
        blockDuration: 1440
      },
      captcha: {
        enabled: false,
        provider: 'recaptcha',
        siteKey: '',
        secretKey: '',
        threshold: 0.5
      },
      botDetection: {
        enabled: true,
        checkUserAgent: true,
        checkBehavior: true,
        minimumInteractionTime: 2000,
        requireMouseMovement: true
      },
      ipFiltering: {
        enabled: false,
        whitelist: [],
        blacklist: [],
        blockVPN: false,
        blockTor: true
      }
    },
    costs: {
      monthlyBudget: 50,
      alertThreshold: 40,
      autoDisableOnLimit: true,
      currentUsage: 0
    }
  };
}
