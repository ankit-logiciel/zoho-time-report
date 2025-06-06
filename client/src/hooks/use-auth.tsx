import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ZohoCredentials } from "@/components/connect-modal";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<any, Error, void>;
  changePasswordMutation: UseMutationResult<any, Error, ChangePasswordData>;
  connectZohoMutation: UseMutationResult<any, Error, ZohoCredentials>;
  disconnectZohoMutation: UseMutationResult<any, Error, void>;
  isZohoConnected: boolean;
  zohoConnectionLoading: boolean;
};

type LoginData = {
  username: string;
  password: string;
};

type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Get current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<any | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Get Zoho connection status
  const {
    data: zohoStatus,
    isLoading: zohoConnectionLoading,
  } = useQuery<{ connected: boolean, expiresAt: number | null } | undefined, Error>({
    queryKey: ["/api/zoho/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Only fetch if user is logged in
    enabled: !!user,
  });

  // Handle login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || "Login failed");
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Login failed");
        }
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(["/api/user"], data.user);
        // Invalidate Zoho status when user logs in
        queryClient.invalidateQueries({ queryKey: ["/api/zoho/status"] });
        
        toast({
          title: "Logged in successfully",
          description: `Welcome back, ${data.user.displayName || data.user.username}!`,
        });
      } else {
        throw new Error(data.message || "Login failed");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle password change
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: ChangePasswordData) => {
      const res = await apiRequest("POST", "/api/change-password", passwordData);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });
      } else {
        throw new Error(data.message || "Failed to change password");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Try to use the API first
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include"
        });
      } catch (err) {
        console.error("Logout API call failed:", err);
      }
      
      // Regardless of API success/failure, clear local data
      return { success: true };
    },
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear localStorage if we're using that for fallback
      if (localStorage.getItem("currentUser")) {
        localStorage.removeItem("currentUser");
      }
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect to Zoho
  const connectZohoMutation = useMutation({
    mutationFn: async (credentials: ZohoCredentials) => {
      const res = await apiRequest("POST", "/api/zoho/connect", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate Zoho status to refresh
        queryClient.invalidateQueries({ queryKey: ["/api/zoho/status"] });
        
        toast({
          title: "Zoho connected",
          description: "Successfully connected to Zoho People.",
        });
      } else {
        throw new Error(data.message || "Failed to connect to Zoho");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Zoho connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect from Zoho
  const disconnectZohoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zoho/disconnect");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate Zoho status and timesheet data
        queryClient.invalidateQueries({ queryKey: ["/api/zoho/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/zoho/timesheet"] });
        
        toast({
          title: "Zoho disconnected",
          description: "Successfully disconnected from Zoho People.",
        });
      } else {
        throw new Error(data.message || "Failed to disconnect from Zoho");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Zoho disconnection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        changePasswordMutation,
        connectZohoMutation,
        disconnectZohoMutation,
        isZohoConnected: !!zohoStatus?.connected,
        zohoConnectionLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}