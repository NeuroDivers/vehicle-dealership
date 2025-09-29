// API route for admin settings management
import { NextRequest, NextResponse } from 'next/server';

// Mock database for settings (in production, use a real database)
let adminSettings = {
  // AI Features
  aiEnabled: false,
  aiDescriptions: false,
  aiTranslation: false,
  aiSocialCaptions: false,
  aiImageAnalysis: false,
  aiLeadAnalysis: false,

  // Social Media Features
  socialEnabled: false,
  autoPosting: false,
  twitterEnabled: false,
  facebookEnabled: false,
  instagramEnabled: false,
  linkedinEnabled: false,

  // API Keys & Credentials
  openaiApiKey: '',
  twitterApiKey: '',
  twitterApiSecret: '',
  twitterAccessToken: '',
  twitterAccessTokenSecret: '',
  facebookPageId: '',
  facebookAccessToken: '',
  instagramAccessToken: '',
  instagramUserId: '',
  linkedinAccessToken: '',
  linkedinOrganizationId: '',
};

// Dev-controlled global settings (take priority over admin settings)
const devOverrides = {
  // Set to true to globally disable features for all admins
  aiGloballyDisabled: false,
  socialGloballyDisabled: false,

  // Which features require dev approval
  featuresRequireDevApproval: {
    aiEnabled: false, // If true, only dev can enable AI features
    socialEnabled: false, // If true, only dev can enable social features
  },

  // API key restrictions
  restrictApiKeys: false, // If true, only dev can modify API keys
};

// Permission levels
const userPermissions = {
  // In production, this would be per-user and stored in database
  currentUserLevel: 'admin', // 'dev', 'admin', or 'user'
  canModifyKeys: true, // Whether this user can modify API keys
  canEnableFeatures: true, // Whether this user can enable/disable features
};

export async function GET(request: NextRequest) {
  try {
    // Check user permissions
    const userLevel = userPermissions.currentUserLevel;

    // Filter settings based on permissions
    const visibleSettings = { ...adminSettings };

    // If not dev and keys are restricted, hide sensitive data
    if (userLevel !== 'dev' && devOverrides.restrictApiKeys) {
      // Hide API keys from non-dev users
      const keyFields = [
        'openaiApiKey', 'twitterApiKey', 'twitterApiSecret', 'twitterAccessToken',
        'twitterAccessTokenSecret', 'facebookAccessToken', 'instagramAccessToken',
        'linkedinAccessToken'
      ];
      keyFields.forEach(key => {
        if (visibleSettings[key]) {
          visibleSettings[key] = '••••••••••••••••'; // Masked
        }
      });
    }

    return NextResponse.json(visibleSettings);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userLevel = userPermissions.currentUserLevel;

    // Validate permissions
    if (!canUserModifySettings(userLevel, body)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify these settings' },
        { status: 403 }
      );
    }

    // Apply dev overrides
    const validatedSettings = applyDevOverrides(body, userLevel);

    // Update settings
    adminSettings = { ...adminSettings, ...validatedSettings };

    // In production, save to database here
    console.log('Settings updated:', adminSettings);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

// Helper function to check if user can modify settings
function canUserModifySettings(userLevel: string, newSettings: any): boolean {
  // Dev can do everything
  if (userLevel === 'dev') {
    return true;
  }

  // Admin can modify features if not restricted
  if (userLevel === 'admin') {
    // Check if trying to modify restricted features
    const restrictedFeatures = Object.keys(devOverrides.featuresRequireDevApproval)
      .filter(key => devOverrides.featuresRequireDevApproval[key]);

    for (const feature of restrictedFeatures) {
      if (newSettings[feature] !== undefined && newSettings[feature] !== adminSettings[feature]) {
        return false; // Can't modify dev-restricted features
      }
    }

    return userPermissions.canModifyKeys && userPermissions.canEnableFeatures;
  }

  return false;
}

// Apply dev overrides to settings
function applyDevOverrides(settings: any, userLevel: string): any {
  const result = { ...settings };

  // If dev has globally disabled features, override them
  if (devOverrides.aiGloballyDisabled) {
    result.aiEnabled = false;
  }

  if (devOverrides.socialGloballyDisabled) {
    result.socialEnabled = false;
  }

  // Apply feature approval restrictions
  Object.keys(devOverrides.featuresRequireDevApproval).forEach(feature => {
    if (devOverrides.featuresRequireDevApproval[feature] && userLevel !== 'dev') {
      // Non-dev users can't change these features
      delete result[feature];
    }
  });

  // Restrict API key modifications
  if (devOverrides.restrictApiKeys && userLevel !== 'dev') {
    const keyFields = [
      'openaiApiKey', 'twitterApiKey', 'twitterApiSecret', 'twitterAccessToken',
      'twitterAccessTokenSecret', 'facebookAccessToken', 'instagramAccessToken',
      'linkedinAccessToken'
    ];
    keyFields.forEach(key => delete result[key]);
  }

  return result;
}
