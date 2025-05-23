import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Table, 
  User, 
  Settings, 
  LogOut, 
  RefreshCw, 
  X,
  DollarSign,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import ConnectModal, { ZohoCredentials } from "@/components/connect-modal";
import { useState } from "react";

interface SidebarProps {
  isConnected: boolean;
  onDisconnect: () => void;
  mobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

export default function Sidebar({ 
  isConnected, 
  onDisconnect,
  mobileMenuOpen,
  closeMobileMenu 
}: SidebarProps) {
  const { user, logoutMutation, isZohoConnected, connectZohoMutation, disconnectZohoMutation } = useAuth();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [location] = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      active: location === "/"
    },
    {
      name: "Report Builder",
      path: "/report-builder",
      icon: <Table className="mr-3 h-5 w-5" />,
      active: location === "/report-builder"
    },
    {
      name: "Revenue Opportunities",
      path: "/revenue-opportunities",
      icon: <DollarSign className="mr-3 h-5 w-5" />,
      active: location === "/revenue-opportunities"
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      active: location === "/settings"
    }
  ];

  const sidebarClasses = cn(
    "flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
    "transition-transform duration-300 ease-in-out z-40",
    "md:flex md:relative md:translate-x-0",
    {
      "absolute inset-y-0 left-0 transform translate-x-0": mobileMenuOpen,
      "absolute inset-y-0 left-0 transform -translate-x-full": !mobileMenuOpen
    }
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 px-4">
        <h1 className="text-xl font-semibold text-primary">ZohoTime Insights</h1>
        <button 
          onClick={closeMobileMenu}
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="h-0 flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                item.active 
                  ? "text-primary bg-primary-50 dark:bg-primary-900/20" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              )}>
                {item.icon}
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        <div className="pt-2 pb-4 px-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium text-primary">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.displayName || user?.username}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{user?.email || 'No email'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Zoho Connection:</span>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                isZohoConnected 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {isZohoConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              {isZohoConnected ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => disconnectZohoMutation.mutate()}
                  disabled={disconnectZohoMutation.isPending}
                  className="flex-1 text-xs"
                >
                  <LogOut className="mr-1 h-3 w-3" />
                  {disconnectZohoMutation.isPending ? "Disconnecting..." : "Disconnect Zoho"}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex-1 text-xs"
                >
                  <LinkIcon className="mr-1 h-3 w-3" />
                  Connect Zoho
                </Button>
              )}
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex-1 text-xs"
              >
                <LogOut className="mr-1 h-3 w-3" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
          
          <ConnectModal 
            isOpen={isConnectModalOpen}
            onClose={() => setIsConnectModalOpen(false)}
            onConnect={async (credentials: ZohoCredentials) => {
              await connectZohoMutation.mutateAsync(credentials);
              setIsConnectModalOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
