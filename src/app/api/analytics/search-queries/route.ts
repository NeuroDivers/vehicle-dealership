import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, this would use your database
interface SearchQueryData {
  id: string;
  query: string;
  resultCount: number;
  timestamp: string;
  userAgent: string;
  url: string;
  ip: string;
}

let searchQueries: SearchQueryData[] = [];

export async function POST(request: NextRequest) {
  try {
    const queryData = await request.json();
    
    // Add timestamp and ID
    const searchQuery = {
      id: Date.now().toString(),
      ...queryData,
      timestamp: new Date().toISOString(),
      ip: request.ip || 'unknown',
    };
    
    // Store the search query (in production, save to database)
    searchQueries.push(searchQuery);
    
    // Keep only last 1000 queries to prevent memory issues
    if (searchQueries.length > 1000) {
      searchQueries = searchQueries.slice(-1000);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Search analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track search query' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate time range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Filter queries by date range
    const filteredQueries = searchQueries.filter(query => 
      new Date(query.timestamp) >= startDate
    );
    
    // Calculate analytics
    const totalSearches = filteredQueries.length;
    const uniqueQueries = new Set(filteredQueries.map(q => q.query.toLowerCase())).size;
    
    // Popular search terms
    const queryFrequency: Record<string, { query: string; count: number; avgResults: number }> = {};
    
    filteredQueries.forEach(search => {
      const normalizedQuery = search.query.toLowerCase().trim();
      if (!queryFrequency[normalizedQuery]) {
        queryFrequency[normalizedQuery] = {
          query: search.query, // Keep original casing
          count: 0,
          avgResults: 0
        };
      }
      queryFrequency[normalizedQuery].count++;
      queryFrequency[normalizedQuery].avgResults += search.resultCount;
    });
    
    // Calculate averages and sort by popularity
    const popularSearches = Object.values(queryFrequency)
      .map(item => ({
        ...item,
        avgResults: Math.round(item.avgResults / item.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // No results searches (potential inventory gaps)
    const noResultSearches = filteredQueries
      .filter(search => search.resultCount === 0)
      .reduce((acc, search) => {
        const normalizedQuery = search.query.toLowerCase().trim();
        acc[normalizedQuery] = (acc[normalizedQuery] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const inventoryGaps = Object.entries(noResultSearches)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Recent searches
    const recentSearches = filteredQueries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    // Search trends by day
    const dailySearches = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySearches = filteredQueries.filter(search => 
        search.timestamp.split('T')[0] === dateStr
      ).length;
      
      dailySearches.push({ date: dateStr, searches: daySearches });
    }
    
    const analytics = {
      totalSearches,
      uniqueQueries,
      averageResultsPerSearch: totalSearches > 0 ? 
        Math.round(filteredQueries.reduce((sum, q) => sum + q.resultCount, 0) / totalSearches) : 0,
      popularSearches,
      inventoryGaps,
      recentSearches,
      dailySearches
    };
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Search analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch search analytics' }, { status: 500 });
  }
}
