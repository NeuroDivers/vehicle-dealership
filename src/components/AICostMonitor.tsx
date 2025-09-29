'use client';

import { useState, useEffect } from 'react';
import { getUsageStats, estimateMonthlyCost, resetMonthlyUsage } from '@/lib/ai-cost-optimization';

export default function AICostMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [estimates, setEstimates] = useState<any[]>([]);

  useEffect(() => {
    // Get current usage stats
    const currentStats = getUsageStats();
    setStats(currentStats);

    // Get cost estimates
    const scenarios = ['small', 'medium', 'large'].map(scenario =>
      estimateMonthlyCost(scenario as 'small' | 'medium' | 'large')
    );
    setEstimates(scenarios);
  }, []);

  const handleReset = () => {
    resetMonthlyUsage();
    setStats(getUsageStats());
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Current Usage */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Current Month Usage</h3>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Reset Counter
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.requests.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.tokens.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Tokens</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${stats.costs.total.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${stats.averageCostPerRequest.toFixed(4)}
            </div>
            <div className="text-sm text-gray-600">Avg per Request</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">GPT-4 Cost: ${stats.costs.gpt4.toFixed(2)}</div>
            <div className="text-gray-600">Advanced features & analysis</div>
          </div>
          <div>
            <div className="font-medium">GPT-3.5 Cost: ${stats.costs.gpt35.toFixed(2)}</div>
            <div className="text-gray-600">Simple tasks & translations</div>
          </div>
        </div>
      </div>

      {/* Cost Estimates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Estimates by Business Size</h3>

        <div className="space-y-4">
          {estimates.map((estimate) => (
            <div key={estimate.scenario} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium capitalize">{estimate.scenario} Business</h4>
                <div className="text-xl font-bold text-green-600">
                  ${estimate.estimatedCost.toFixed(2)}/month
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                {estimate.scenario === 'small' && '100 chats, 50 descriptions, 20 translations'}
                {estimate.scenario === 'medium' && '500 chats, 200 descriptions, 100 translations'}
                {estimate.scenario === 'large' && '2000 chats, 500 descriptions, 300 translations'}
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>~{estimate.totalTokens.toLocaleString()} tokens</span>
                <span>GPT-4: ${estimate.breakdown.gpt4.toFixed(2)}</span>
                <span>GPT-3.5: ${estimate.breakdown.gpt35.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Optimization Strategies</h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Model Selection</div>
              <div className="text-sm text-gray-600">
                Use GPT-3.5-turbo for translations and simple responses, GPT-4 only for complex analysis
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Response Caching</div>
              <div className="text-sm text-gray-600">
                Cache common greetings, FAQ responses, and repetitive queries
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Fallback Responses</div>
              <div className="text-sm text-gray-600">
                Use predefined responses when AI is unavailable or for common scenarios
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Rate Limiting</div>
              <div className="text-sm text-gray-600">
                Limit chat requests per user per hour to prevent abuse
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
