import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import ReportBuilder from "@/components/report-builder";
import ConnectModal from "@/components/connect-modal";
import { useZoho } from "@/hooks/use-zoho";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReportBuilderPage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { isConnected, connect, disconnect } = useZoho();

  const { data: timesheetData, isLoading } = useQuery({
    queryKey: ["/api/zoho/timesheet", dateRange],
    enabled: isConnected,
  });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar 
        isConnected={isConnected} 
        onDisconnect={disconnect}
        mobileMenuOpen={mobileMenuOpen}
        closeMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
          <button onClick={toggleMobileMenu} className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="px-4 sm:px-6">
            <h1 className="text-lg font-semibold text-primary">ZohoTime Insights</h1>
          </div>
          <div className="pr-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
              US
            </div>
          </div>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {/* Connection status banner */}
          {!isConnected && (
            <Alert className="bg-blue-50 dark:bg-blue-900/30 border-0">
              <InfoIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertDescription className="flex justify-between w-full items-center">
                <span className="text-sm text-blue-700 dark:text-blue-400">
                  Connect your Zoho People account to get started
                </span>
                <Button
                  variant="link"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="text-blue-700 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 p-0 font-medium"
                >
                  Connect <span className="ml-1">→</span>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Page header */}
          <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center flex-wrap sm:flex-nowrap">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Report Builder</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create custom reports with flexible dimensions and aggregations
                </p>
              </div>
              <div className="flex items-center mt-4 sm:mt-0 space-x-3">
                <div>
                  <Select 
                    value={dateRange} 
                    onValueChange={setDateRange}
                    disabled={!isConnected}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Last 7 days">Last 7 days</SelectItem>
                      <SelectItem value="This month">This month</SelectItem>
                      <SelectItem value="Last month">Last month</SelectItem>
                      <SelectItem value="Custom range">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Report Builder */}
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <ReportBuilder 
              data={timesheetData?.timeEntries || []} 
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>

      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
        onConnect={connect} 
      />
    </div>
  );
}

// Import Select components
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";