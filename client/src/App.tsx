import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Expenses from "@/pages/expenses";
import Inventory from "@/pages/inventory";
import Invoices from "@/pages/invoices";
import Taxes from "@/pages/taxes";
import Reports from "@/pages/reports";
import Calendar from "@/pages/calendar";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/taxes" component={Taxes} />
      <Route path="/reports" component={Reports} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex pt-16">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 p-6 lg:ml-64">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
