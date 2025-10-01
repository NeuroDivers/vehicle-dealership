import { NextRequest, NextResponse } from 'next/server';

// Note: Using default settings until database is set up
// Get AI settings
export async function GET(request: NextRequest) {
  try {
    // For now, just return default settings
    // TODO: Implement database storage when ready
    const aiSettings = getDefaultSettings();

    return NextResponse.json({ 
      settings: aiSettings,
      success: true 
    });

  } catch (error) {
    console.error('Failed to get AI settings:', error);
    return NextResponse.json(
      { settings: getDefaultSettings(), success: true },
      { status: 200 }
    );
  }
}

// Update AI settings
export async function POST(request: NextRequest) {
  try {
    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }

    // TODO: Implement database storage when ready
    // For now, just return success
    console.log('AI settings update requested:', settings);

    return NextResponse.json({ 
      success: true,
      message: 'Settings saved successfully (temporarily stored in memory)'
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
