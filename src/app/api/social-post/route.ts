// API route for social media posting
import { NextRequest, NextResponse } from 'next/server';
import { postToSocialMedia, generateSocialPost } from '@/lib/social-media';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, content, vehicleId, imageUrl } = body;

    if (!platform || !content) {
      return NextResponse.json(
        { error: 'Platform and content are required' },
        { status: 400 }
      );
    }

    // Get social media credentials from environment variables
    const credentials = {
      twitter: {
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      },
      facebook: {
        pageId: process.env.FACEBOOK_PAGE_ID,
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      },
      instagram: {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
        userId: process.env.INSTAGRAM_USER_ID,
      },
      linkedin: {
        accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
        organizationId: process.env.LINKEDIN_ORGANIZATION_ID,
      },
    };

    const platformCredentials = credentials[platform as keyof typeof credentials];
    if (!platformCredentials) {
      return NextResponse.json(
        { error: `Credentials not configured for ${platform}` },
        { status: 400 }
      );
    }

    const result = await postToSocialMedia(platform, content, imageUrl, platformCredentials);

    if (result.success) {
      // Log the successful post (you could save to database here)
      console.log(`Successfully posted to ${platform}:`, result.postId);

      return NextResponse.json({
        success: true,
        postId: result.postId,
        message: `Posted to ${platform} successfully`
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to post' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Social media posting error:', error);
    return NextResponse.json(
      { error: 'Social media posting failed' },
      { status: 500 }
    );
  }
}

// Get social media posting history
export async function GET(request: NextRequest) {
  try {
    // This would typically fetch from a database
    // For now, return mock data
    const mockHistory = [
      {
        id: '1',
        platform: 'twitter',
        content: '🚗 New arrival! 2024 Toyota Camry now available!',
        status: 'posted',
        postedAt: new Date().toISOString(),
      },
      {
        id: '2',
        platform: 'facebook',
        content: 'Check out our latest vehicle addition!',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      },
    ];

    return NextResponse.json({ posts: mockHistory });
  } catch (error) {
    console.error('Failed to fetch social media history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
