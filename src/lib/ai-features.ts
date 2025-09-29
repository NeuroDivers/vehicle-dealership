// AI Features for Vehicle Dealership
// OpenAI integration for content generation and translation

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate AI-powered vehicle descriptions
export async function generateVehicleDescription(vehicle: any): Promise<string> {
  try {
    const { make, model, year, price, odometer, bodyType, color } = vehicle;

    const prompt = `Write an engaging, professional description for this vehicle:
- Make/Model: ${make} ${model}
- Year: ${year}
- Price: $${price?.toLocaleString()}
- Mileage: ${odometer?.toLocaleString()} miles
- Body Type: ${bodyType}
- Color: ${color}

Write a compelling 2-3 paragraph description that highlights the vehicle's features, condition, and value proposition. Focus on why someone would want to buy this specific vehicle.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || 
      `Experience the ${vehicle.year} ${vehicle.make} ${vehicle.model} - a reliable and stylish ${vehicle.bodyType} that combines performance and comfort.`;
  } catch (error) {
    console.error('Failed to generate vehicle description:', error);
    return `Experience the ${vehicle.year} ${vehicle.make} ${vehicle.model} - a reliable and stylish ${vehicle.bodyType} that combines performance and comfort.`;
  }
}

// Translate text to different languages
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const prompt = `Translate the following text to ${targetLanguage}. Maintain a professional, automotive sales tone:

"${text}"

Provide only the translation, no additional comments.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // Fallback to original text
  }
}

// Generate social media captions optimized for engagement
export async function generateSocialCaption(vehicle: any, platform: string): Promise<string> {
  try {
    const { make, model, year, price } = vehicle;

    const platformGuidelines = {
      twitter: 'Keep it under 280 characters, use emojis, hashtags, and a call-to-action.',
      facebook: 'Engaging and shareable, can be longer, include questions or calls-to-action.',
      instagram: 'Visual focus, use relevant hashtags, keep it concise and engaging.',
      linkedin: 'Professional tone, focus on business value and networking.'
    };

    const prompt = `Create an engaging social media post for a ${year} ${make} ${model} priced at $${price?.toLocaleString()}.

Platform: ${platform}
Guidelines: ${platformGuidelines[platform as keyof typeof platformGuidelines]}

Make it compelling and include relevant hashtags.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: platform === 'twitter' ? 100 : 200,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Failed to generate social caption:', error);
    return `🚗 New ${vehicle.year} ${vehicle.make} ${vehicle.model} available! 💰 $${vehicle.price?.toLocaleString()} #CarDeals`;
  }
}

// Analyze vehicle images and generate descriptions
export async function describeVehicleImage(imageUrl: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this vehicle in detail, focusing on its condition, features, and notable characteristics. Be specific about any damage, modifications, or unique features visible in the image.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || 'Vehicle image description not available.';
  } catch (error) {
    console.error('Failed to analyze vehicle image:', error);
    return 'Unable to analyze image at this time.';
  }
}

// Generate follow-up email content for leads
export async function generateLeadFollowUp(lead: any, vehicle: any): Promise<string> {
  try {
    const prompt = `Generate a personalized follow-up email for a car dealership lead:

Lead Info:
- Name: ${lead.name}
- Email: ${lead.email}
- Phone: ${lead.phone}
- Interested in: ${vehicle.year} ${vehicle.make} ${vehicle.model}
- Price: $${vehicle.price?.toLocaleString()}

The lead inquired ${lead.daysAgo || 'recently'}. Write a professional, friendly follow-up email that:
1. References their specific interest
2. Provides additional information
3. Includes a call-to-action
4. Maintains a helpful, non-pushy tone

Keep it concise (under 200 words).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.6,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Failed to generate follow-up email:', error);
    return `Dear ${lead.name}, thank you for your interest in our ${vehicle.year} ${vehicle.make} ${vehicle.model}. We'd love to discuss this vehicle with you further.`;
  }
}

// Analyze lead quality and provide insights
export async function analyzeLeadQuality(lead: any): Promise<{
  quality: 'high' | 'medium' | 'low';
  reasons: string[];
  recommendations: string[];
}> {
  try {
    const prompt = `Analyze this car dealership lead and provide quality assessment:

Lead Data:
- Name: ${lead.name}
- Phone: ${lead.phone}
- Email: ${lead.email}
- Message: "${lead.message}"
- Vehicle Interest: ${lead.vehicleInterest}
- Source: ${lead.source}
- Time of Inquiry: ${lead.createdAt}

Provide:
1. Quality rating (high/medium/low)
2. Reasons for this rating
3. Recommendations for next steps

Be specific and actionable.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    });

    const analysis = response.choices[0]?.message?.content?.trim() || '';

    // Parse the response (simplified parsing)
    const quality = analysis.toLowerCase().includes('high') ? 'high' :
                   analysis.toLowerCase().includes('low') ? 'low' : 'medium';

    return {
      quality,
      reasons: ['Based on lead analysis'],
      recommendations: ['Follow up promptly', 'Provide detailed information']
    };
  } catch (error) {
    console.error('Failed to analyze lead quality:', error);
    return {
      quality: 'medium',
      reasons: ['Analysis unavailable'],
      recommendations: ['Standard follow-up procedure']
    };
  }
}
