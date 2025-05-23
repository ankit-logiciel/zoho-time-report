import { useState, useEffect } from "react";
import { ZohoCredentials } from "@/components/connect-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useZoho() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  // Check if we're already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/zoho/status");
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.connected);
        }
      } catch (error) {
        console.error("Failed to check Zoho connection status", error);
      }
    };

    checkConnection();
  }, []);

  const connect = async (credentials: ZohoCredentials) => {
    try {
      const response = await apiRequest("POST", "/api/zoho/connect", credentials);
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        // Invalidate any existing queries to fetch fresh data
        queryClient.invalidateQueries();
      } else {
        throw new Error(data.message || "Failed to connect to Zoho");
      }
    } catch (error) {
      console.error("Failed to connect to Zoho", error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      const response = await apiRequest("POST", "/api/zoho/disconnect");
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(false);
        // Clear any cached timesheet data
        queryClient.invalidateQueries();
      } else {
        throw new Error(data.message || "Failed to disconnect from Zoho");
      }
    } catch (error) {
      console.error("Failed to disconnect from Zoho", error);
      throw error;
    }
  };

  const fetchTimesheetData = async (dateRange: string) => {
    try {
      const response = await apiRequest("GET", `/api/zoho/timesheet?range=${dateRange}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch timesheet data", error);
      throw error;
    }
  };

  return {
    isConnected,
    connect,
    disconnect,
    fetchTimesheetData
  };
}
