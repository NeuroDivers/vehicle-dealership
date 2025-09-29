// API route for AI features
import { NextRequest, NextResponse } from 'next/server';
import {
  generateVehicleDescription,
  translateText,
  generateSocialCaption,
  describeVehicleImage,
  generateLeadFollowUp,
  analyzeLeadQuality
} from '@/lib/ai-features';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'generate-description':
        const description = await generateVehicleDescription(data.vehicle);
        return NextResponse.json({ description });

      case 'translate':
        const translation = await translateText(data.text, data.targetLanguage);
        return NextResponse.json({ translation });

      case 'generate-caption':
        const caption = await generateSocialCaption(data.vehicle, data.platform);
        return NextResponse.json({ caption });

      case 'analyze-image':
        const analysis = await describeVehicleImage(data.imageUrl);
        return NextResponse.json({ analysis });

      case 'generate-followup':
        const email = await generateLeadFollowUp(data.lead, data.vehicle);
        return NextResponse.json({ email });

      case 'analyze-lead':
        const leadAnalysis = await analyzeLeadQuality(data.lead);
        return NextResponse.json(leadAnalysis);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI processing failed' },
      { status: 500 }
    );
  }
}
