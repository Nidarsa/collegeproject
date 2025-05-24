import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Upload, DollarSign, CreditCard, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { ExpenseModal } from "@/components/expense-modal";
import { InvoiceModal } from "@/components/invoice-modal";
import { UploadModal } from "@/components/upload-modal";
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { API_BASE_URL } from "../api";
import { Receipt } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

type Metrics = {
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  pendingInvoices?: number;
  gstCollected?: number;
  gstPaid?: number;
  netGst?: number;
};

type Transaction = {
  description: string;
  category: string;
  amount: string;
  date: string;
};

type InventoryItem = {
  id: string;
  itemName: string;
  quantity: number;
};

export default function Dashboard() {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/dashboard/metrics`);
      return res.json();
    },
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/dashboard/recent-transactions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/dashboard/recent-transactions`);
      return res.json();
    },
  });

  const { data: lowStockItems } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/inventory/low-stock`);
      return res.json();
    },
  });

  const { data: revenueChartData } = useQuery({
    queryKey: ["/api/charts/revenue-expenses"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/charts/revenue-expenses`);
      return res.json();
    },
  });

  const { data: expenseChartData } = useQuery({
    queryKey: ["/api/charts/expense-categories"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/charts/expense-categories`);
      return res.json();
    },
  });

  if (metricsLoading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm text-green-600 font-medium">+12.5%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
            <p className="text-2xl font-semibold text-gray-900">
              ${metrics?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-red-500" />
              </div>
              <span className="text-sm text-red-500 font-medium">+8.2%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Expenses</h3>
            <p className="text-2xl font-semibold text-gray-900">
              ${metrics?.totalExpenses?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-sm text-green-600 font-medium">+15.3%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Net Profit</h3>
            <p className="text-2xl font-semibold text-gray-900">
              ${metrics?.netProfit?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+5.7%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Invoices</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {metrics?.pendingInvoices || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue vs Expenses</CardTitle>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                <option>Last 6 Months</option>
                <option>Last Year</option>
                <option>Last 2 Years</option>
              </select>
            </div>
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

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expense Categories</CardTitle>
              <Button variant="link" className="text-sm text-primary hover:text-blue-700">
                View Details
              </Button>
            </div>
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
      </div>

      {/* Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="link" className="text-sm text-primary hover:text-blue-700">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading transactions...</div>
              ) : recentTransactions && recentTransactions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No transactions found</div>
              ) : (
                <div className="space-y-0">
                  {recentTransactions && recentTransactions.map((transaction: Transaction, index: number) => (
                    <div key={index} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-500">{transaction.amount}</p>
                          <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Inventory Alert */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start space-x-3" 
                onClick={() => setExpenseModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
              
              <Button 
                className="w-full justify-start space-x-3 bg-green-600 hover:bg-green-700" 
                onClick={() => setInvoiceModalOpen(true)}
              >
                <FileText className="h-4 w-4" />
                <span>Create Invoice</span>
              </Button>
              
              <Button 
                className="w-full justify-start space-x-3 bg-yellow-600 hover:bg-yellow-700" 
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="h-4 w-4" />
                <span>Upload Receipt</span>
              </Button>
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems?.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  All inventory levels are good!
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems && lowStockItems.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity <= 0 ? 'Out of stock' : `Low Stock: ${item.quantity} units left`}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Sample alerts if no data */}
                  {!lowStockItems && (
                    <>
                      <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">No inventory items found</p>
                          <p className="text-xs text-gray-600">Add inventory items to track stock levels</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GST Collected</span>
                <span className="font-semibold text-gray-900">
                  ${metrics?.gstCollected?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GST Paid</span>
                <span className="font-semibold text-gray-900">
                  ${metrics?.gstPaid?.toFixed(2) || '0.00'}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Net GST</span>
                <span className="font-semibold text-green-600">
                  ${metrics?.netGst?.toFixed(2) || '0.00'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ExpenseModal 
        isOpen={expenseModalOpen} 
        onClose={() => setExpenseModalOpen(false)} 
      />
      <InvoiceModal 
        isOpen={invoiceModalOpen} 
        onClose={() => setInvoiceModalOpen(false)} 
      />
      <UploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
      />
    </div>
  );
}
