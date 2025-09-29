import { NextRequest, NextResponse } from 'next/server';
import { handleVehicleChat } from '@/lib/ai-chat';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Handle the chat
    const result = await handleVehicleChat(message, conversationHistory);

    return NextResponse.json({
      response: result.response,
      vehicles: result.vehicles,
      suggestedAction: result.suggestedAction,
      conversationHistory: result.conversationHistory
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Chat service temporarily unavailable',
        response: "I'm sorry, our AI assistant is currently unavailable. Please contact our dealership directly at (555) 123-4567."
      },
      { status: 500 }
    );
  }
}
