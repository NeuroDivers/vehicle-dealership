'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Car,
  Filter,
  Printer,
  Mail,
  BarChart3,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';

interface ReportData {
  period: string;
  totalRevenue: number;
  vehiclesSold: number;
  averagePrice: number;
  topSalesperson: string;
  leadConversion: number;
  inventoryTurnover: number;
  vehicles: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    soldDate?: string;
    salesperson?: string;
  }>;
  leads: Array<{
    id: string;
    customerName: string;
    status: string;
    leadScore: number;
    assignedTo?: string;
    createdDate: string;
  }>;
  monthlyMetrics: Array<{
    month: string;
    revenue: number;
    unitsSold: number;
    leadsGenerated: number;
  }>;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'leads' | 'performance'>('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/reports?type=${reportType}&range=${dateRange}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Set mock data for demonstration
      setReportData(getMockReportData());
    } finally {
      setLoading(false);
    }
  };

  const getMockReportData = (): ReportData => ({
    period: getPeriodLabel(dateRange),
    totalRevenue: 1250000,
    vehiclesSold: 25,
    averagePrice: 50000,
    topSalesperson: 'John Smith',
    leadConversion: 18.5,
    inventoryTurnover: 2.3,
    vehicles: [
      { id: '1', make: 'Toyota', model: 'Camry', year: 2023, price: 35000, soldDate: '2024-03-15', salesperson: 'John Smith' },
      { id: '2', make: 'Honda', model: 'Accord', year: 2023, price: 38000, soldDate: '2024-03-18', salesperson: 'Jane Doe' },
      { id: '3', make: 'Ford', model: 'F-150', year: 2024, price: 65000, soldDate: '2024-03-20', salesperson: 'John Smith' },
    ],
    leads: [
      { id: '1', customerName: 'Alice Johnson', status: 'qualified', leadScore: 85, assignedTo: 'John Smith', createdDate: '2024-03-10' },
      { id: '2', customerName: 'Bob Williams', status: 'contacted', leadScore: 72, assignedTo: 'Jane Doe', createdDate: '2024-03-12' },
      { id: '3', customerName: 'Carol Davis', status: 'closed', leadScore: 90, assignedTo: 'John Smith', createdDate: '2024-03-08' },
    ],
    monthlyMetrics: [
      { month: 'January', revenue: 380000, unitsSold: 8, leadsGenerated: 45 },
      { month: 'February', revenue: 420000, unitsSold: 9, leadsGenerated: 52 },
      { month: 'March', revenue: 450000, unitsSold: 8, leadsGenerated: 48 },
    ]
  });

  const getPeriodLabel = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d': return `Last 7 Days (${formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))} - ${formatDate(now)})`;
      case '30d': return `Last 30 Days (${formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))} - ${formatDate(now)})`;
      case '90d': return `Last 90 Days (${formatDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))} - ${formatDate(now)})`;
      case '1y': return `Last Year (${now.getFullYear()})`;
      default: return 'Custom Period';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    setGenerating(true);
    
    let csv = '';
    
    // Add header
    csv += `${reportType.toUpperCase()} REPORT\n`;
    csv += `Period: ${reportData.period}\n\n`;
    
    // Add summary metrics
    csv += 'SUMMARY METRICS\n';
    csv += `Total Revenue,${reportData.totalRevenue}\n`;
    csv += `Vehicles Sold,${reportData.vehiclesSold}\n`;
    csv += `Average Price,${reportData.averagePrice}\n`;
    csv += `Top Salesperson,${reportData.topSalesperson}\n`;
    csv += `Lead Conversion Rate,${reportData.leadConversion}%\n`;
    csv += `Inventory Turnover,${reportData.inventoryTurnover}\n\n`;
    
    // Add vehicle data
    if (reportData.vehicles.length > 0) {
      csv += 'VEHICLE SALES\n';
      csv += 'ID,Make,Model,Year,Price,Sold Date,Salesperson\n';
      reportData.vehicles.forEach(v => {
        csv += `${v.id},${v.make},${v.model},${v.year},${v.price},${v.soldDate || 'N/A'},${v.salesperson || 'N/A'}\n`;
      });
      csv += '\n';
    }
    
    // Add lead data
    if (reportData.leads.length > 0) {
      csv += 'LEADS\n';
      csv += 'ID,Customer Name,Status,Lead Score,Assigned To,Created Date\n';
      reportData.leads.forEach(l => {
        csv += `${l.id},${l.customerName},${l.status},${l.leadScore},${l.assignedTo || 'Unassigned'},${l.createdDate}\n`;
      });
      csv += '\n';
    }
    
    // Add monthly metrics
    if (reportData.monthlyMetrics.length > 0) {
      csv += 'MONTHLY METRICS\n';
      csv += 'Month,Revenue,Units Sold,Leads Generated\n';
      reportData.monthlyMetrics.forEach(m => {
        csv += `${m.month},${m.revenue},${m.unitsSold},${m.leadsGenerated}\n`;
      });
    }
    
    // Download the CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setTimeout(() => setGenerating(false), 1000);
  };

  const exportToPDF = () => {
    if (!reportData) return;
    
    setGenerating(true);
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportType.toUpperCase()} Report - ${reportData.period}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .metric { padding: 15px; background: #f9f9f9; border-radius: 5px; }
            .metric-label { font-size: 12px; color: #666; }
            .metric-value { font-size: 24px; font-weight: bold; color: #333; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${reportType.toUpperCase()} REPORT</h1>
          <p><strong>Period:</strong> ${reportData.period}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          
          <h2>Summary Metrics</h2>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-value">$${reportData.totalRevenue.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Vehicles Sold</div>
              <div class="metric-value">${reportData.vehiclesSold}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Average Price</div>
              <div class="metric-value">$${reportData.averagePrice.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Lead Conversion</div>
              <div class="metric-value">${reportData.leadConversion}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Top Performer</div>
              <div class="metric-value">${reportData.topSalesperson}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Inventory Turnover</div>
              <div class="metric-value">${reportData.inventoryTurnover}x</div>
            </div>
          </div>
          
          ${reportData.vehicles.length > 0 ? `
            <h2>Vehicle Sales</h2>
            <table>
              <thead>
                <tr>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Price</th>
                  <th>Sold Date</th>
                  <th>Salesperson</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.vehicles.map(v => `
                  <tr>
                    <td>${v.make}</td>
                    <td>${v.model}</td>
                    <td>${v.year}</td>
                    <td>$${v.price.toLocaleString()}</td>
                    <td>${v.soldDate || 'N/A'}</td>
                    <td>${v.salesperson || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${reportData.monthlyMetrics.length > 0 ? `
            <h2>Monthly Performance</h2>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Revenue</th>
                  <th>Units Sold</th>
                  <th>Leads Generated</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.monthlyMetrics.map(m => `
                  <tr>
                    <td>${m.month}</td>
                    <td>$${m.revenue.toLocaleString()}</td>
                    <td>${m.unitsSold}</td>
                    <td>${m.leadsGenerated}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      setGenerating(false);
    }, 500);
  };

  const exportToExcel = () => {
    // For Excel, we'll create a more structured CSV that Excel can open
    exportToCSV();
  };

  const emailReport = () => {
    if (!reportData) return;
    
    const subject = `${reportType.toUpperCase()} Report - ${reportData.period}`;
    const body = `Please find attached the ${reportType} report for ${reportData.period}.\n\nSummary:\n- Total Revenue: $${reportData.totalRevenue.toLocaleString()}\n- Vehicles Sold: ${reportData.vehiclesSold}\n- Lead Conversion: ${reportData.leadConversion}%`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Business Reports</h1>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="leads">Lead Report</option>
            <option value="performance">Performance Report</option>
          </select>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <div className="flex gap-2 ml-auto">
            <button
              onClick={exportToCSV}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={exportToPDF}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={emailReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Report Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
            <p className="text-gray-600">{reportData.period}</p>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold">${reportData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{reportData.vehiclesSold}</p>
              <p className="text-sm text-gray-600">Vehicles Sold</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">${reportData.averagePrice.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Average Price</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{reportData.topSalesperson}</p>
              <p className="text-sm text-gray-600">Top Performer</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <PieChart className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold">{reportData.leadConversion}%</p>
              <p className="text-sm text-gray-600">Lead Conversion</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold">{reportData.inventoryTurnover}x</p>
              <p className="text-sm text-gray-600">Inventory Turnover</p>
            </div>
          </div>

          {/* Detailed Tables */}
          {reportType === 'sales' && reportData.vehicles.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Vehicle</th>
                      <th className="text-left py-2">Year</th>
                      <th className="text-left py-2">Price</th>
                      <th className="text-left py-2">Sold Date</th>
                      <th className="text-left py-2">Salesperson</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b">
                        <td className="py-2">{vehicle.make} {vehicle.model}</td>
                        <td className="py-2">{vehicle.year}</td>
                        <td className="py-2">${vehicle.price.toLocaleString()}</td>
                        <td className="py-2">{vehicle.soldDate || 'N/A'}</td>
                        <td className="py-2">{vehicle.salesperson || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Trends */}
          {reportData.monthlyMetrics.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Month</th>
                      <th className="text-left py-2">Revenue</th>
                      <th className="text-left py-2">Units Sold</th>
                      <th className="text-left py-2">Leads Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyMetrics.map((metric) => (
                      <tr key={metric.month} className="border-b">
                        <td className="py-2">{metric.month}</td>
                        <td className="py-2">${metric.revenue.toLocaleString()}</td>
                        <td className="py-2">{metric.unitsSold}</td>
                        <td className="py-2">{metric.leadsGenerated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
