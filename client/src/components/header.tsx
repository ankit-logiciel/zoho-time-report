import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import SyncButton from "@/components/sync-button";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  isConnected: boolean;
  timesheetData: any;
  onDataRefresh?: () => void;
}

export default function Header({ 
  dateRange, 
  onDateRangeChange,
  isConnected,
  timesheetData,
  onDataRefresh
}: HeaderProps) {
  const { isZohoConnected } = useAuth();
  
  const handleExport = () => {
    if (!timesheetData || !timesheetData.timeEntries) return;
    
    // Create CSV content
    const headers = [
      "Date", 
      "Project", 
      "Employee", 
      "Job", 
      "Billable Hours", 
      "Non-Billable Hours", 
      "Total Hours"
    ];

    const csvContent = [
      headers.join(','),
      ...timesheetData.timeEntries.map((entry: any) => [
        entry.date,
        `"${entry.project}"`,
        `"${entry.employee}"`,
        `"${entry.job || ''}"`,
        entry.billableHours,
        entry.nonBillableHours,
        entry.totalHours
      ].join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zoho-timesheet-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center flex-wrap sm:flex-nowrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of your timesheet data from Zoho People
          </p>
        </div>
        <div className="flex items-center mt-4 sm:mt-0 space-x-3">
          <div>
            <Select 
              value={dateRange} 
              onValueChange={onDateRangeChange}
              disabled={!isZohoConnected}
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
          <SyncButton 
            dateRange={dateRange} 
            onSyncComplete={onDataRefresh} 
          />
          <Button 
            onClick={handleExport}
            disabled={!isConnected || !timesheetData}
          >
            <DownloadIcon className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>
    </div>
  );
}
