import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function Taxes() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-quarter");

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Calculate GST breakdown
  const gstCollected = invoices?.filter((invoice: any) => invoice.status === 'paid')
    .reduce((sum: number, invoice: any) => sum + parseFloat(invoice.gstAmount), 0) || 0;

  const gstPaid = expenses?.reduce((sum: number, expense: any) => 
    sum + parseFloat(expense.gstAmount || '0'), 0) || 0;

  const netGst = gstCollected - gstPaid;

  // Get current quarter data
  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    return `Q${quarter} ${year}`;
  };

  // Calculate quarterly breakdown
  const getQuarterlyData = () => {
    const quarters = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - i * 3, 1);
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
      
      const quarterExpenses = expenses?.filter((expense: any) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= quarterStart && expenseDate <= quarterEnd;
      }) || [];

      const quarterInvoices = invoices?.filter((invoice: any) => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= quarterStart && invoiceDate <= quarterEnd;
      }) || [];

      const gstPaidQuarter = quarterExpenses.reduce((sum: number, expense: any) => 
        sum + parseFloat(expense.gstAmount || '0'), 0);

      const gstCollectedQuarter = quarterInvoices
        .filter((invoice: any) => invoice.status === 'paid')
        .reduce((sum: number, invoice: any) => sum + parseFloat(invoice.gstAmount), 0);

      quarters.push({
        period: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`,
        gstCollected: gstCollectedQuarter,
        gstPaid: gstPaidQuarter,
        netGst: gstCollectedQuarter - gstPaidQuarter,
        dueDate: new Date(quarterEnd.getFullYear(), quarterEnd.getMonth() + 1, 28),
      });
    }
    
    return quarters;
  };

  const quarterlyData = getQuarterlyData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tax & GST Management</h1>
          <p className="text-gray-600">Track GST collections, payments, and generate tax reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Taxes
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Tax Period:</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-quarter">Current Quarter</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
                <SelectItem value="current-year">Current Year</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              GST Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${gstCollected.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">From sales invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
              GST Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${gstPaid.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">On business expenses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net GST Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netGst >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ${Math.abs(netGst).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">
              {netGst >= 0 ? 'Amount owed' : 'Refund due'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Next Filing Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 28)
                .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <p className="text-sm text-gray-500">
              {getCurrentQuarter()} filing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Calculation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>GST Breakdown - {getCurrentQuarter()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">GST on Sales</p>
                  <p className="text-sm text-green-600">18% on taxable sales</p>
                </div>
                <span className="font-bold text-green-700">${gstCollected.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">GST on Purchases</p>
                  <p className="text-sm text-red-600">18% on business expenses</p>
                </div>
                <span className="font-bold text-red-700">-${gstPaid.toFixed(2)}</span>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Net GST {netGst >= 0 ? 'Payable' : 'Refundable'}</p>
                  <p className="text-sm text-gray-600">
                    {netGst >= 0 ? 'Amount to pay to government' : 'Amount claimable as refund'}
                  </p>
                </div>
                <span className={`font-bold ${netGst >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  ${Math.abs(netGst).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Documents & Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">GST Return - {getCurrentQuarter()}</p>
                    <p className="text-sm text-gray-500">Quarterly GST filing</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Purchase Register</p>
                    <p className="text-sm text-gray-500">Detailed expense report</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Sales Register</p>
                    <p className="text-sm text-gray-500">Invoice summary report</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calculator className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Tax Calculation Worksheet</p>
                    <p className="text-sm text-gray-500">Detailed tax breakdown</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly GST History */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly GST History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>GST Collected</TableHead>
                  <TableHead>GST Paid</TableHead>
                  <TableHead>Net GST</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarterlyData.map((quarter, index) => (
                  <TableRow key={quarter.period}>
                    <TableCell className="font-medium">{quarter.period}</TableCell>
                    <TableCell className="text-green-600">
                      ${quarter.gstCollected.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      ${quarter.gstPaid.toFixed(2)}
                    </TableCell>
                    <TableCell className={quarter.netGst >= 0 ? 'text-orange-600' : 'text-green-600'}>
                      ${Math.abs(quarter.netGst).toFixed(2)}
                      {quarter.netGst < 0 && ' (Refund)'}
                    </TableCell>
                    <TableCell>
                      {quarter.dueDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={index === 0 ? "default" : "secondary"}
                        className={index === 0 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}
                      >
                        {index === 0 ? "Pending" : "Filed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
