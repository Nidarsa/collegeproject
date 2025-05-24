import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white"
                fill="currentColor"
              >
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">BizTracker Pro</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              className="bg-transparent border-none shadow-none text-sm w-48 h-auto p-0 focus-visible:ring-0"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-900">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40"
              alt="User profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="hidden md:block text-sm font-medium text-gray-700">John Smith</span>
          </div>
        </div>
      </div>
    </header>
  );
}
