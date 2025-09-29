// API route for testing API connections
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, settings } = body;

    switch (service) {
      case 'openai':
        return await testOpenAIConnection(settings.openaiApiKey);

      case 'twitter':
        return await testTwitterConnection(settings);

      case 'facebook':
        return await testFacebookConnection(settings);

      case 'instagram':
        return await testInstagramConnection(settings);

      case 'linkedin':
        return await testLinkedInConnection(settings);

      default:
        return NextResponse.json(
          { error: 'Unsupported service' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      { error: 'Connection test failed' },
      { status: 500 }
    );
  }
}

async function testOpenAIConnection(apiKey: string) {
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'OpenAI API key is required'
    });
  }

  try {
    // Test with a simple API call
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: `Connected successfully. Found ${data.data?.length || 0} models.`,
        details: {
          modelsCount: data.data?.length || 0,
          hasGpt4: data.data?.some((model: any) => model.id.includes('gpt-4')) || false,
        }
      });
    } else {
      const error = await response.text();
      return NextResponse.json({
        success: false,
        error: `OpenAI API error: ${response.status} - ${error}`
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function testTwitterConnection(settings: any) {
  const { twitterApiKey, twitterApiSecret, twitterAccessToken } = settings;

  if (!twitterApiKey || !twitterApiSecret || !twitterAccessToken) {
    return NextResponse.json({
      success: false,
      error: 'Twitter credentials are incomplete'
    });
  }

  try {
    // Test Twitter API v2 endpoint
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${twitterAccessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: `Connected to Twitter as @${data.data?.username || 'unknown'}`,
        details: {
          userId: data.data?.id,
          username: data.data?.username,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Twitter API error: ${response.status}`
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Twitter connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function testFacebookConnection(settings: any) {
  const { facebookAccessToken, facebookPageId } = settings;

  if (!facebookAccessToken) {
    return NextResponse.json({
      success: false,
      error: 'Facebook access token is required'
    });
  }

  try {
    // Test Facebook Graph API
    const endpoint = facebookPageId
      ? `https://graph.facebook.com/v18.0/${facebookPageId}?fields=name,id`
      : 'https://graph.facebook.com/v18.0/me?fields=name,id';

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${facebookAccessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: facebookPageId
          ? `Connected to Facebook Page: ${data.name}`
          : `Connected to Facebook User: ${data.name}`,
        details: {
          id: data.id,
          name: data.name,
          type: facebookPageId ? 'page' : 'user',
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Facebook API error: ${response.status}`
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Facebook connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function testInstagramConnection(settings: any) {
  const { instagramAccessToken, instagramUserId } = settings;

  if (!instagramAccessToken || !instagramUserId) {
    return NextResponse.json({
      success: false,
      error: 'Instagram credentials are incomplete'
    });
  }

  try {
    // Test Instagram Graph API
    const response = await fetch(
      `https://graph.instagram.com/${instagramUserId}?fields=username,account_type&access_token=${instagramAccessToken}`
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: `Connected to Instagram: @${data.username}`,
        details: {
          username: data.username,
          accountType: data.account_type,
          userId: instagramUserId,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Instagram API error: ${response.status}`
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Instagram connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function testLinkedInConnection(settings: any) {
  const { linkedinAccessToken } = settings;

  if (!linkedinAccessToken) {
    return NextResponse.json({
      success: false,
      error: 'LinkedIn access token is required'
    });
  }

  try {
    // Test LinkedIn API
    const response = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${linkedinAccessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: `Connected to LinkedIn: ${data.localizedFirstName} ${data.localizedLastName}`,
        details: {
          firstName: data.localizedFirstName,
          lastName: data.localizedLastName,
          id: data.id,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `LinkedIn API error: ${response.status}`
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `LinkedIn connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
