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
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
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
      const res = await apiRequest("POST", "/api/logout");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      
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