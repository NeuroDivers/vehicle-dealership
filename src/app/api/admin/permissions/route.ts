// API route for permission management
import { NextRequest, NextResponse } from 'next/server';

// Permission levels configuration
// In production, this would be stored in a database per user
const permissionLevels: Record<string, any> = {
  dev: {
    level: 'dev',
    canModifyKeys: true,
    canEnableFeatures: true,
    description: 'Full access to all features and settings'
  },
  admin: {
    level: 'admin',
    canModifyKeys: true,
    canEnableFeatures: true,
    description: 'Can manage features and API keys'
  },
  restricted_admin: {
    level: 'admin',
    canModifyKeys: false,
    canEnableFeatures: true,
    description: 'Can enable/disable features but not modify API keys'
  },
  user: {
    level: 'user',
    canEnableFeatures: false,
    description: 'Read-only access'
  }
};

// Hidden dev emails - these users have dev privileges but appear as admin
const HIDDEN_DEV_EMAILS = ['nick@neurodivers.ca'];

// Get user permission level (with hidden dev check)
function getUserPermissionLevel(userEmail?: string): string {
  // In production, this would come from the authenticated user's session
  // Check if user is a hidden dev (appears as admin but has dev privileges)
  if (userEmail && HIDDEN_DEV_EMAILS.includes(userEmail.toLowerCase())) {
    return 'dev'; // Hidden dev privileges
  }
  
  // For testing, default to admin
  return 'admin';
}
// Dev override settings
const devSettings = {
  globalFeatureRestrictions: {
    aiEnabled: false, // true = only dev can enable AI features
    socialEnabled: false, // true = only dev can enable social features
  },
  restrictApiKeys: false, // true = only dev can modify API keys
  restrictFeatureEnabling: false, // true = only dev can enable/disable features
};

export async function GET(request: NextRequest) {
  try {
    // Get current user's permission level
    const userLevel = getUserPermissionLevel();
    const userPermissions = { ...permissionLevels[userLevel] };

    // Apply any dev overrides that affect this user (only if not dev)
    if (userLevel !== 'dev') {
      if (devSettings.restrictApiKeys) {
        userPermissions.canModifyKeys = false;
      }

      if (devSettings.restrictFeatureEnabling) {
        userPermissions.canEnableFeatures = false;
      }
    }

    return NextResponse.json(userPermissions);
  } catch (error) {
    console.error('Failed to get permissions:', error);
    return NextResponse.json(
      { error: 'Failed to load permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, targetUserId, newPermissions } = body;

    // Only dev users can modify permissions
    const userLevel = getUserPermissionLevel();
    if (userLevel !== 'dev') {
      return NextResponse.json(
        { error: 'Only developers can modify permissions' },
        { status: 403 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'update_user_permissions':
        // In production, update user permissions in database
        console.log(`Updating permissions for user ${targetUserId}:`, newPermissions);
        return NextResponse.json({
          success: true,
          message: 'User permissions updated'
        });

      case 'set_global_restrictions':
        // Update global dev settings
        if (newPermissions.globalRestrictions) {
          Object.assign(devSettings, newPermissions.globalRestrictions);
        }
        return NextResponse.json({
          success: true,
          message: 'Global restrictions updated'
        });

      case 'get_all_users':
        // Return mock user list with permissions
        const mockUsers = [
          {
            id: '1',
            name: 'John Admin',
            email: 'admin@dealership.com',
            permissions: permissionLevels.admin
          },
          {
            id: '2',
            name: 'Jane Manager',
            email: 'manager@dealership.com',
            permissions: permissionLevels.restricted_admin
          },
          {
            id: '3',
            name: 'Bob Sales',
            email: 'sales@dealership.com',
            permissions: permissionLevels.user
          }
        ];
        return NextResponse.json({ users: mockUsers });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to update permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}

// Helper function to get available permission levels
export async function PATCH(request: NextRequest) {
  try {
    // Return available permission templates
    return NextResponse.json({
      availableLevels: Object.keys(permissionLevels).map(key => ({
        key,
        ...permissionLevels[key]
      })),
      currentDevSettings: devSettings
    });
  } catch (error) {
    console.error('Failed to get permission levels:', error);
    return NextResponse.json(
      { error: 'Failed to load permission levels' },
      { status: 500 }
    );
  }
}
