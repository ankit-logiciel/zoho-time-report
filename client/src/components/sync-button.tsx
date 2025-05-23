import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SyncIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface SyncButtonProps {
  dateRange: string;
  onSyncComplete?: () => void;
}

export default function SyncButton({ dateRange, onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { isZohoConnected } = useAuth();
  
  const handleSync = async () => {
    if (!isZohoConnected) {
      toast({
        title: "Zoho not connected",
        description: "Please connect to Zoho first to sync timesheet data.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSyncing(true);
      
      const response = await apiRequest("POST", `/api/timesheet/sync?dateRange=${dateRange}`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sync successful",
          description: `Synchronized ${data.stats.timeEntries} time entries, ${data.stats.projectHours} projects, and ${data.stats.employeeHours} employees.`,
        });
        
        // Notify parent component that sync is complete
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        throw new Error(data.message || "Failed to sync timesheet data");
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "An error occurred while syncing data",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing || !isZohoConnected}
      className="gap-2"
    >
      <SyncIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? "Syncing..." : "Sync Timesheet Data"}
    </Button>
  );
}