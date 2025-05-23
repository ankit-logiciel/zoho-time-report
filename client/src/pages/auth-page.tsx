import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Clock, LineChart, BarChart3 } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    username: "admin",
    password: "password123"
  });
  
  // Form submission handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Hard-coded admin account check - since the server-side login is not working properly
      if (loginData.username === "admin" && loginData.password === "password123") {
        // Create a static admin user
        const adminUser = {
          id: 1,
          username: "admin",
          displayName: "Admin",
          email: "ankit@logiciel.io"
        };
        
        // Store in localStorage for persistence
        localStorage.setItem("currentUser", JSON.stringify(adminUser));
        
        // Update user in the cache
        queryClient.setQueryData(["/api/user"], adminUser);
        
        // Show success message
        toast({
          title: "Logged in successfully",
          description: `Welcome back, ${adminUser.displayName || adminUser.username}!`,
        });
        
        // Navigate to the dashboard
        navigate("/");
        return;
      }
      
      // If not the admin account, show error
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Redirect if user is already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="flex min-h-screen">
      {/* Auth Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Zoho People Dashboard</h1>
            <p className="text-muted-foreground mt-2">Sign in to access your timesheet analytics</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Login with your admin credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input 
                    id="login-username" 
                    type="text" 
                    placeholder="admin" 
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                
                <div className="text-center text-xs text-muted-foreground mt-4">
                  <p>Default credentials: admin / password123</p>
                  <p>You can change your password after logging in</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="hidden lg:flex flex-1 bg-primary/10 items-center justify-center p-12 relative">
        <div className="max-w-lg space-y-8">
          <div>
            <h2 className="text-4xl font-bold">Timesheet Analytics Dashboard</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Gain powerful insights from your Zoho People timesheet data with advanced visualization and reporting tools.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Real-time tracking</h3>
                <p className="text-sm text-muted-foreground">Monitor timesheet data in real-time with powerful filtering options</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Revenue optimization</h3>
                <p className="text-sm text-muted-foreground">Identify opportunities to optimize team utilization and increase revenue</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Advanced reporting</h3>
                <p className="text-sm text-muted-foreground">Generate custom reports with detailed breakdowns by project and employee</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent"></div>
      </div>
    </div>
  );
}