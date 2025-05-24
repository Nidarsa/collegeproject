import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-6-months");
  const [reportType, setReportType] = useState("overview");

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: revenueChartData } = useQuery({
    queryKey: ["/api/charts/revenue-expenses"],
  });

  const { data: expenseChartData } = useQuery({
    queryKey: ["/api/charts/expense-categories"],
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Calculate growth rates
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Get monthly data for trends
  const getMonthlyTrends = () => {
    const months = [];
    const profitData = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push(monthName);
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthExpenses = expenses?.filter((expense: any) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      }).reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0) || 0;
      
      const monthRevenue = invoices?.filter((invoice: any) => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status === 'paid';
      }).reduce((sum: number, invoice: any) => sum + parseFloat(invoice.totalAmount), 0) || 0;
      
      profitData.push(monthRevenue - monthExpenses);
    }
    
    return { months, profitData };
  };

  const monthlyTrends = getMonthlyTrends();

  const profitChartData = {
    labels: monthlyTrends.months,
    datasets: [
      {
        label: 'Monthly Profit',
        data: monthlyTrends.profitData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Top expense categories
  const getTopExpenseCategories = () => {
    if (!expenses) return [];
    
    const categoryTotals = expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount: amount as number }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const topCategories = getTopExpenseCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and financial reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Report Type:</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Financial Overview</SelectItem>
                <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                <SelectItem value="expense-analysis">Expense Analysis</SelectItem>
                <SelectItem value="revenue-analysis">Revenue Analysis</SelectItem>
                <SelectItem value="tax-summary">Tax Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              Revenue Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +12.5%
            </div>
            <p className="text-sm text-gray-500">vs previous period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
              Expense Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              +8.2%
            </div>
            <p className="text-sm text-gray-500">vs previous period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.totalRevenue > 0 
                ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1)
                : 0
              }%
            </div>
            <p className="text-sm text-gray-500">Net profit margin</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${invoices?.length > 0 
                ? (invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount), 0) / invoices.length).toFixed(2)
                : '0.00'
              }
            </div>
            <p className="text-sm text-gray-500">Average invoice value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Revenue vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData && (
              <div className="h-64">
                <Line 
                  data={revenueChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '$' + value.toLocaleString();
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Profit Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line 
                data={profitChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Expense Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData && (
              <div className="h-64">
                <Doughnut 
                  data={expenseChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${category.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {((category.amount / (metrics?.totalExpenses || 1)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Invoices</span>
                  <span className="font-medium">
                    ${invoices?.filter((inv: any) => inv.status === 'paid')
                      .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount), 0)
                      .toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Invoices</span>
                  <span className="font-medium">
                    ${invoices?.filter((inv: any) => inv.status !== 'paid')
                      .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount), 0)
                      .toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Expense Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-medium">${metrics?.totalExpenses?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST Paid</span>
                  <span className="font-medium">${metrics?.gstPaid?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Tax Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">GST Collected</span>
                  <span className="font-medium">${metrics?.gstCollected?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net GST</span>
                  <span className="font-medium">${metrics?.netGst?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
