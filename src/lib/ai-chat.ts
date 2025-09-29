// AI Chat System for Vehicle Dealership
// Conversational chat that can search inventory and make recommendations

import OpenAI from 'openai';
import { trackUsage, getOptimalModel, OPTIMIZATION_STRATEGIES } from './ai-cost-optimization';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Define the functions the AI can call
const availableFunctions = {
  searchInventory: {
    name: 'search_inventory',
    description: 'Search the vehicle inventory based on customer preferences',
    parameters: {
      type: 'object',
      properties: {
        make: {
          type: 'string',
          description: 'Vehicle make (e.g., Toyota, Honda, Ford)'
        },
        model: {
          type: 'string',
          description: 'Vehicle model (e.g., Camry, Civic, F-150)'
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price in USD'
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in USD'
        },
        maxMileage: {
          type: 'number',
          description: 'Maximum mileage/odomoter reading'
        },
        bodyType: {
          type: 'string',
          enum: ['Sedan', 'SUV', 'Truck', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van'],
          description: 'Type of vehicle body'
        },
        yearMin: {
          type: 'number',
          description: 'Minimum model year'
        },
        yearMax: {
          type: 'number',
          description: 'Maximum model year'
        },
        color: {
          type: 'string',
          description: 'Preferred color'
        }
      }
    }
  }
};

// Mock inventory search function (for development/fallback)
async function searchInventoryMock(params: any): Promise<any[]> {
  console.log('Using mock inventory search with params:', params);

  // Mock data - replace with real database in production
  const mockInventory = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      price: 22500,
      odometer: 35000,
      bodyType: 'Sedan',
      color: 'Silver',
      stockNumber: 'TC2020-001'
    },
    {
      id: '2',
      make: 'Honda',
      model: 'Civic',
      year: 2019,
      price: 19500,
      odometer: 42000,
      bodyType: 'Sedan',
      color: 'Blue',
      stockNumber: 'HC2019-002'
    },
    {
      id: '3',
      make: 'Ford',
      model: 'F-150',
      year: 2021,
      price: 35000,
      odometer: 25000,
      bodyType: 'Truck',
      color: 'Black',
      stockNumber: 'FF2021-003'
    },
    {
      id: '4',
      make: 'Jeep',
      model: 'Grand Cherokee',
      year: 2018,
      price: 28000,
      odometer: 55000,
      bodyType: 'SUV',
      color: 'White',
      stockNumber: 'JG2018-004'
    }
  ];

  return mockInventory.filter(vehicle => {
    // Apply filters
    if (params.make && !vehicle.make.toLowerCase().includes(params.make.toLowerCase())) return false;
    if (params.model && !vehicle.model.toLowerCase().includes(params.model.toLowerCase())) return false;
    if (params.minPrice && vehicle.price < params.minPrice) return false;
    if (params.maxPrice && vehicle.price > params.maxPrice) return false;
    if (params.maxMileage && vehicle.odometer > params.maxMileage) return false;
    if (params.bodyType && vehicle.bodyType !== params.bodyType) return false;
    if (params.yearMin && vehicle.year < params.yearMin) return false;
    if (params.yearMax && vehicle.year > params.yearMax) return false;
    if (params.color && !vehicle.color.toLowerCase().includes(params.color.toLowerCase())) return false;
    return true;
  });
}

// Real inventory search function for production (to be implemented with your database)
async function searchInventoryReal(params: any): Promise<any[]> {
  // TODO: Replace with actual database query
  // This should connect to your D1 database or API
  console.log('Real inventory search not implemented yet, using mock data');
  return searchInventoryMock(params);
}

// Main chat function
export async function handleVehicleChat(
  userMessage: string,
  conversationHistory: any[] = []
): Promise<{
  response: string;
  vehicles?: any[];
  suggestedAction?: 'search_partners' | 'search_auctions' | 'contact_dealer';
  conversationHistory: any[];
}> {
  // Check if we should use cached response for cost optimization
  if (OPTIMIZATION_STRATEGIES.shouldCache(userMessage, 'chat')) {
    console.log('Using cached response for common query');
    return {
      response: "I'd be happy to help you find the perfect vehicle. What type of car are you looking for? We have sedans, SUVs, trucks, and more in various price ranges.",
      conversationHistory: [...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: "I'd be happy to help..." }]
    };
  }

  if (!openai) {
    return {
      response: "I'm sorry, our AI assistant is currently unavailable. Please contact our dealership directly to help you find the perfect vehicle.",
      conversationHistory: [...conversationHistory, { role: 'assistant', content: 'AI unavailable' }]
    };
  }

  try {
    // Select optimal model for cost efficiency
    const model = getOptimalModel('chat', 'medium'); // Medium complexity for vehicle chat
    console.log(`Using model: ${model} for chat`);

    // System prompt for the dealership chat
    const systemPrompt = OPTIMIZATION_STRATEGIES.optimizePrompt(`You are an AI assistant for a premium vehicle dealership. Your goal is to help customers find the perfect vehicle from our inventory.

CORE RESPONSIBILITIES:
1. Ask about their vehicle preferences (make, model, price range, mileage, type, etc.)
2. Search our inventory using the search_inventory function when appropriate
3. If we don't have matching vehicles, offer to search through our partners or auctions
4. Be helpful, professional, and enthusiastic about helping them find their dream car
5. Always provide specific vehicle recommendations when available
6. Never make up vehicle information - only use what you find in searches

CONVERSATION STYLE:
- Friendly and approachable
- Knowledgeable about vehicles
- Patient with questions
- Excited to help them find the right car
- Professional dealership representative

WHEN TO SEARCH:
- When customer mentions specific preferences
- When they ask "what do you have" or similar
- When they want to narrow down options

WHEN TO OFFER ALTERNATIVES:
- If no vehicles match their criteria
- If they want something very specific we don't have
- If they're looking for something rare or custom

ALWAYS END WITH A QUESTION to continue the conversation naturally.`);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // First, try to get a response that might call functions
    const response = await openai.chat.completions.create({
      model,
      messages,
      functions: [availableFunctions.searchInventory],
      function_call: 'auto', // Let AI decide when to call functions
      temperature: 0.7,
      max_tokens: 400, // Reduced for cost optimization
    });

    const assistantMessage = response.choices[0]?.message;

    // Track usage for cost monitoring
    const promptTokens = estimateTokens(systemPrompt + userMessage + JSON.stringify(conversationHistory));
    const completionTokens = estimateTokens(assistantMessage?.content || '');
    trackUsage(model, promptTokens, completionTokens);

    const functionCall = assistantMessage?.function_call;

    // Check if AI wants to call a function
    if (functionCall && functionCall.name === 'search_inventory') {
      try {
        // Parse the function arguments
        const searchParams = JSON.parse(functionCall.arguments);

        // Search the inventory
        const vehicles = await searchInventoryMock(searchParams);

        // Add the function call to conversation history
        const updatedHistory = [
          ...conversationHistory,
          { role: 'user', content: userMessage },
          assistantMessage,
          {
            role: 'function',
            name: 'search_inventory',
            content: JSON.stringify(vehicles)
          }
        ];

        // Get the final response based on search results
        let followUpPrompt = '';
        let suggestedAction: 'search_partners' | 'search_auctions' | 'contact_dealer' | undefined;

        if (vehicles.length > 0) {
          followUpPrompt = `Great! I found ${vehicles.length} vehicle(s) that match your preferences. Here are the details:

${vehicles.map((v: any) => `- ${v.year} ${v.make} ${v.model} (${v.bodyType}) - $${v.price.toLocaleString()} - ${v.odometer.toLocaleString()} miles - ${v.color}`).join('\n')}

Would you like more details about any of these vehicles, or would you like me to refine the search?`;
        } else {
          followUpPrompt = `I couldn't find any vehicles in our current inventory that match your preferences. However, we have excellent relationships with trusted partners and access to premium auctions.

Would you like me to help you find a vehicle through our partner network or check upcoming auctions?`;
          suggestedAction = 'search_partners';
        }

        // Get the final response
        const finalResponse = await openai.chat.completions.create({
          model,
          messages: [...updatedHistory, { role: 'assistant', content: followUpPrompt }],
          temperature: 0.7,
          max_tokens: 200, // Reduced for cost optimization
        });

        // Track final response usage
        const finalPromptTokens = estimateTokens(followUpPrompt);
        const finalCompletionTokens = estimateTokens(finalResponse.choices[0]?.message?.content || '');
        trackUsage(model, finalPromptTokens, finalCompletionTokens);

        return {
          response: finalResponse.choices[0]?.message?.content || followUpPrompt,
          vehicles: vehicles.length > 0 ? vehicles : undefined,
          suggestedAction,
          conversationHistory: [...updatedHistory, { role: 'assistant', content: finalResponse.choices[0]?.message?.content }]
        };

      } catch (error) {
        console.error('Function call error:', error);
        // Fallback to regular response
      }
    }

    // Regular response without function calls
    return {
      response: assistantMessage?.content || "I'd be happy to help you find the perfect vehicle. What type of car are you looking for?",
      conversationHistory: [...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: assistantMessage?.content }]
    };

  } catch (error) {
    console.error('Chat error:', error);

    // Use fallback response for cost optimization
    const fallback = OPTIMIZATION_STRATEGIES.useFallbackResponse(error);
    return {
      response: fallback.chat,
      conversationHistory: [...conversationHistory, { role: 'assistant', content: fallback.chat }]
    };
  }
}

// Estimate token usage (rough approximation)
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

// Helper function to format vehicle recommendations
export function formatVehicleRecommendation(vehicle: any): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}
• Price: $${vehicle.price.toLocaleString()}
• Mileage: ${vehicle.odometer.toLocaleString()} miles
• Type: ${vehicle.bodyType}
• Color: ${vehicle.color}
• Stock #: ${vehicle.stockNumber}`;
}
