// AI Cost Optimization and Monitoring
// Track usage and implement cost-saving strategies

// Cost tracking per model (as of 2024 pricing)
const MODEL_COSTS = {
  'gpt-4': {
    input: 0.03,    // $0.03 per 1K input tokens
    output: 0.06,   // $0.06 per 1K output tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0015,  // $0.0015 per 1K input tokens
    output: 0.002,  // $0.002 per 1K output tokens
  },
  'gpt-4-turbo': {
    input: 0.01,    // $0.01 per 1K input tokens
    output: 0.03,   // $0.03 per 1K output tokens
  }
};

// Usage tracking
let monthlyUsage = {
  tokens: {
    input: 0,
    output: 0,
    total: 0
  },
  requests: 0,
  costs: {
    gpt4: 0,
    gpt35: 0,
    total: 0
  }
};

// Reset usage tracking monthly
export function resetMonthlyUsage() {
  monthlyUsage = {
    tokens: { input: 0, output: 0, total: 0 },
    requests: 0,
    costs: { gpt4: 0, gpt35: 0, total: 0 }
  };
}

// Track API usage
export function trackUsage(model: string, inputTokens: number, outputTokens: number) {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
  if (!costs) return;

  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  const totalCost = inputCost + outputCost;

  monthlyUsage.tokens.input += inputTokens;
  monthlyUsage.tokens.output += outputTokens;
  monthlyUsage.tokens.total += inputTokens + outputTokens;
  monthlyUsage.requests += 1;

  if (model.includes('gpt-4')) {
    monthlyUsage.costs.gpt4 += totalCost;
  } else {
    monthlyUsage.costs.gpt35 += totalCost;
  }
  monthlyUsage.costs.total += totalCost;
}

// Get usage statistics
export function getUsageStats() {
  return {
    ...monthlyUsage,
    averageCostPerRequest: monthlyUsage.requests > 0 ?
      monthlyUsage.costs.total / monthlyUsage.requests : 0,
    projectedMonthlyCost: monthlyUsage.costs.total,
    efficiency: {
      tokensPerRequest: monthlyUsage.requests > 0 ?
        monthlyUsage.tokens.total / monthlyUsage.requests : 0,
      costPerThousandTokens: monthlyUsage.tokens.total > 0 ?
        (monthlyUsage.costs.total / monthlyUsage.tokens.total) * 1000 : 0
    }
  };
}

// Cost optimization strategies
export const OPTIMIZATION_STRATEGIES = {
  // Use cheaper model for simple tasks
  modelSelection: (taskType: string) => {
    const simpleTasks = ['translation', 'basic_descriptions', 'simple_responses'];
    return simpleTasks.includes(taskType) ? 'gpt-3.5-turbo' : 'gpt-4';
  },

  // Cache frequent responses
  shouldCache: (input: string, context: string) => {
    // Cache common greetings, FAQs, basic queries
    const cacheablePatterns = [
      /^hello/i, /^hi/i, /how are you/i,
      /what do you have/i, /show me/i,
      /price range/i, /under \$\d+/i
    ];
    return cacheablePatterns.some(pattern => pattern.test(input));
  },

  // Reduce token usage
  optimizePrompt: (prompt: string) => {
    return prompt
      .replace(/\s+/g, ' ')  // Multiple spaces to single
      .replace(/\n\s*\n/g, '\n')  // Multiple newlines
      .trim();
  },

  // Fallback to cached/predefined responses
  useFallbackResponse: (error: any) => {
    return {
      description: "Experience luxury and performance in this exceptional vehicle.",
      translation: "Contenu non disponible - Content not available",
      chat: "I'd be happy to help you find the perfect vehicle. What are you looking for?"
    };
  }
};

// Cost-effective model selection
export function getOptimalModel(task: string, complexity: 'low' | 'medium' | 'high' = 'medium'): string {
  if (complexity === 'low' || ['translation', 'simple_chat'].includes(task)) {
    return 'gpt-3.5-turbo';
  }
  if (complexity === 'high' || ['analysis', 'creative_writing'].includes(task)) {
    return 'gpt-4';
  }
  return 'gpt-4-turbo'; // Good balance for medium complexity
}

// Estimate costs for different usage scenarios
export function estimateMonthlyCost(scenario: 'small' | 'medium' | 'large') {
  const scenarios = {
    small: { // 100 chats, 50 descriptions, 20 translations
      chatTokens: 100 * 800, // ~800 tokens per conversation
      descriptionTokens: 50 * 300,
      translationTokens: 20 * 100,
      analysisTokens: 10 * 400
    },
    medium: { // 500 chats, 200 descriptions, 100 translations
      chatTokens: 500 * 800,
      descriptionTokens: 200 * 300,
      translationTokens: 100 * 100,
      analysisTokens: 50 * 400
    },
    large: { // 2000 chats, 500 descriptions, 300 translations
      chatTokens: 2000 * 800,
      descriptionTokens: 500 * 300,
      translationTokens: 300 * 100,
      analysisTokens: 100 * 400
    }
  };

  const usage = scenarios[scenario];

  // Assume 70% GPT-3.5, 30% GPT-4 mix
  const gpt35Tokens = (usage.chatTokens + usage.translationTokens) * 0.7 +
                     (usage.descriptionTokens + usage.analysisTokens) * 0.5;
  const gpt4Tokens = (usage.chatTokens + usage.translationTokens) * 0.3 +
                    (usage.descriptionTokens + usage.analysisTokens) * 0.5;

  const gpt35Cost = (gpt35Tokens / 1000) * (MODEL_COSTS['gpt-3.5-turbo'].input * 0.6 + MODEL_COSTS['gpt-3.5-turbo'].output * 0.4);
  const gpt4Cost = (gpt4Tokens / 1000) * (MODEL_COSTS['gpt-4'].input * 0.6 + MODEL_COSTS['gpt-4'].output * 0.4);

  return {
    scenario,
    totalTokens: gpt35Tokens + gpt4Tokens,
    estimatedCost: gpt35Cost + gpt4Cost,
    breakdown: {
      gpt35: gpt35Cost,
      gpt4: gpt4Cost
    }
  };
}
