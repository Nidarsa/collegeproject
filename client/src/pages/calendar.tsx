import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { ExpenseModal } from "@/components/expense-modal";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const events = [];
    
    // Add expenses
    const dayExpenses = expenses?.filter((expense: any) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === date.toDateString();
    }) || [];
    
    events.push(...dayExpenses.map((expense: any) => ({
      type: 'expense',
      title: expense.description,
      amount: parseFloat(expense.amount),
      category: expense.category,
      id: expense.id,
    })));
    
    // Add invoices
    const dayInvoices = invoices?.filter((invoice: any) => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate.toDateString() === date.toDateString();
    }) || [];
    
    events.push(...dayInvoices.map((invoice: any) => ({
      type: 'invoice',
      title: `Invoice ${invoice.invoiceNumber}`,
      amount: parseFloat(invoice.totalAmount),
      client: invoice.clientName,
      id: invoice.id,
    })));
    
    return events;
  };

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Calculate monthly totals
  const currentMonthExpenses = expenses?.filter((expense: any) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0) || 0;

  const currentMonthRevenue = invoices?.filter((invoice: any) => {
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate.getMonth() === currentDate.getMonth() && 
           invoiceDate.getFullYear() === currentDate.getFullYear() &&
           invoice.status === 'paid';
  }).reduce((sum: number, invoice: any) => sum + parseFloat(invoice.totalAmount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financial Calendar</h1>
          <p className="text-gray-600">Track expenses and invoices by date</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "month" ? "week" : "month")}>
            {viewMode === "month" ? "Week View" : "Month View"}
          </Button>
          <Button onClick={() => setExpenseModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {monthNames[currentDate.getMonth()]} Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${currentMonthExpenses.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Total expenses this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {monthNames[currentDate.getMonth()]} Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${currentMonthRevenue.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Total revenue this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonthRevenue - currentMonthExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(currentMonthRevenue - currentMonthExpenses).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Profit/loss this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-24 p-1"></div>;
                  }
                  
                  const events = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  
                  return (
                    <div
                      key={day.toDateString()}
                      className={`h-24 p-1 border rounded-lg cursor-pointer transition-colors ${
                        isToday ? 'bg-primary/10 border-primary' : 
                        isSelected ? 'bg-blue-50 border-blue-300' : 
                        'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-primary' : 'text-gray-900'
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`text-xs p-1 rounded truncate ${
                              event.type === 'expense' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}
                            title={event.title}
                          >
                            {event.type === 'expense' ? '-' : '+'}${event.amount.toFixed(0)}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{events.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {selectedDate 
                  ? selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'Select a date'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-3">
                  {selectedDateEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No events for this date
                    </p>
                  ) : (
                    selectedDateEvents.map((event, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={event.type === 'expense' ? 'destructive' : 'default'}>
                            {event.type}
                          </Badge>
                          <span className={`font-semibold ${
                            event.type === 'expense' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {event.type === 'expense' ? '-' : '+'}${event.amount.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        {event.category && (
                          <p className="text-xs text-gray-500">Category: {event.category}</p>
                        )}
                        {event.client && (
                          <p className="text-xs text-gray-500">Client: {event.client}</p>
                        )}
                      </div>
                    ))
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setExpenseModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Click on a date to view events
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ExpenseModal 
        isOpen={expenseModalOpen} 
        onClose={() => setExpenseModalOpen(false)} 
      />
    </div>
  );
}
