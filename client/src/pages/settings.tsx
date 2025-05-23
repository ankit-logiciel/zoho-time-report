import { useAuth } from "@/hooks/use-auth";
import ChangePasswordForm from "@/components/change-password-form";
import ConnectModal, { ZohoCredentials } from "@/components/connect-modal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, UserCog, LockKeyhole } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, isZohoConnected, connectZohoMutation, disconnectZohoMutation } = useAuth();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const { toast } = useToast();
  
  const handleZohoConnect = async (credentials: ZohoCredentials) => {
    try {
      await connectZohoMutation.mutateAsync(credentials);
      setIsConnectModalOpen(false);
    } catch (error) {
      console.error("Failed to connect to Zoho:", error);
    }
  };
  
  const handleZohoDisconnect = async () => {
    try {
      await disconnectZohoMutation.mutateAsync();
      toast({
        title: "Zoho disconnected",
        description: "Successfully disconnected from Zoho People",
      });
    } catch (error) {
      console.error("Failed to disconnect from Zoho:", error);
    }
  };
  
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and application settings
        </p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">
            <UserCog className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Link2 className="h-4 w-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="security">
            <LockKeyhole className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>
        
        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                  <p className="text-base font-medium">{user?.username || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Display Name</h3>
                  <p className="text-base font-medium">{user?.displayName || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="text-base font-medium">{user?.email || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Account Type</h3>
                  <p className="text-base font-medium">Administrator</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Connections</CardTitle>
              <CardDescription>
                Manage connections to external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-100 dark:bg-primary-900/20 p-2 rounded-full">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Zoho People</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect to Zoho People for timesheet data
                    </p>
                  </div>
                </div>
                <div>
                  {isZohoConnected ? (
                    <Button 
                      variant="outline" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                      onClick={handleZohoDisconnect}
                      disabled={disconnectZohoMutation.isPending}
                    >
                      {disconnectZohoMutation.isPending ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => setIsConnectModalOpen(true)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                <p className="font-medium">Connection Status: {isZohoConnected ? (
                  <span className="text-green-500 font-semibold">Connected</span>
                ) : (
                  <span className="text-red-500 font-semibold">Disconnected</span>
                )}</p>
                <p className="mt-1">
                  To use the timesheet analytics features, you need to connect your Zoho People account. 
                  This allows the application to retrieve and analyze your timesheet data.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <ConnectModal 
            isOpen={isConnectModalOpen}
            onClose={() => setIsConnectModalOpen(false)}
            onConnect={handleZohoConnect}
          />
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}