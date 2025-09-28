import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, this would use your database
interface LeadData {
  id: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  inquiryType: string;
  preferredContact: string;
  leadScore: number;
  status: string;
  source: string;
  timestamp: string;
  userAgent: string;
  url: string;
  ip: string;
  assignedTo?: string;
  followUpDate?: string;
  notes?: string;
}

let leads: LeadData[] = [];

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json();
    
    // Add ID and IP
    const lead: LeadData = {
      id: Date.now().toString(),
      ...leadData,
      timestamp: new Date().toISOString(),
      ip: request.ip || 'unknown',
    };
    
    // Store the lead (in production, save to database)
    leads.push(lead);
    
    // Keep only last 1000 leads to prevent memory issues
    if (leads.length > 1000) {
      leads = leads.slice(-1000);
    }
    
    // In production, you would also:
    // 1. Send email notification to staff
    // 2. Add to CRM system
    // 3. Trigger automated follow-up sequence
    
    return NextResponse.json({ 
      success: true, 
      leadId: lead.id,
      message: 'Lead submitted successfully' 
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const status = searchParams.get('status');
    
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
    
    // Filter leads by date range and status
    let filteredLeads = leads.filter(lead => 
      new Date(lead.timestamp) >= startDate
    );
    
    if (status && status !== 'all') {
      filteredLeads = filteredLeads.filter(lead => lead.status === status);
    }
    
    // Calculate analytics
    const totalLeads = filteredLeads.length;
    const averageLeadScore = totalLeads > 0 ? 
      Math.round(filteredLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / totalLeads) : 0;
    
    // Lead status distribution
    const statusDistribution = filteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Top inquiry types
    const inquiryTypes = filteredLeads.reduce((acc, lead) => {
      acc[lead.inquiryType] = (acc[lead.inquiryType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topInquiryTypes = Object.entries(inquiryTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Lead sources
    const sources = filteredLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const leadSources = Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
    
    // High-value leads (score >= 80)
    const highValueLeads = filteredLeads
      .filter(lead => lead.leadScore >= 80)
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, 10);
    
    // Recent leads
    const recentLeads = filteredLeads
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    // Daily lead trends
    const dailyLeads = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLeads = filteredLeads.filter(lead => 
        lead.timestamp.split('T')[0] === dateStr
      ).length;
      
      dailyLeads.push({ date: dateStr, leads: dayLeads });
    }
    
    // Vehicle interest (most inquired about vehicles)
    const vehicleInterest = filteredLeads.reduce((acc, lead) => {
      const vehicleKey = `${lead.vehicleYear} ${lead.vehicleMake} ${lead.vehicleModel}`;
      if (!acc[vehicleKey]) {
        acc[vehicleKey] = {
          vehicle: vehicleKey,
          vehicleId: lead.vehicleId,
          price: lead.vehiclePrice,
          inquiries: 0,
          averageScore: 0
        };
      }
      acc[vehicleKey].inquiries++;
      acc[vehicleKey].averageScore += lead.leadScore;
      return acc;
    }, {} as Record<string, any>);
    
    const topVehicleInterest = Object.values(vehicleInterest)
      .map((item: any) => ({
        ...item,
        averageScore: Math.round(item.averageScore / item.inquiries)
      }))
      .sort((a: any, b: any) => b.inquiries - a.inquiries)
      .slice(0, 5);
    
    const analytics = {
      totalLeads,
      averageLeadScore,
      statusDistribution,
      topInquiryTypes,
      leadSources,
      highValueLeads,
      recentLeads,
      dailyLeads,
      topVehicleInterest,
      conversionRate: totalLeads > 0 ? 
        Math.round(((statusDistribution.closed || 0) / totalLeads) * 100) : 0
    };
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Leads analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads analytics' }, { status: 500 });
  }
}
