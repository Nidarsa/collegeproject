import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  FileText, 
  Calculator, 
  BarChart3, 
  Calendar, 
  Settings, 
  LogOut,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Tax & GST", href: "/taxes", icon: Calculator },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-16 left-0 w-64 h-screen bg-white border-r border-gray-200 transform transition-transform duration-300 z-40",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex justify-end p-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => onClose()}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
          
          <hr className="my-4 border-gray-200" />
          
          <Link href="/settings">
            <a
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                location === "/settings"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => onClose()}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </a>
          </Link>
          
          <button className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 w-full">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
