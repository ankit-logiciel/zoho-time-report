import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import ConnectModal from "@/components/connect-modal";
import { useZoho } from "@/hooks/use-zoho";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  ArrowUpRight,
  BarChart3,
  InfoIcon,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

// Types for revenue opportunity calculations
interface RevenueOpportunity {
  name: string;
  potentialRevenue: number;
  currentUtilization: number;
  optimalUtilization: number;
  gap: number;
}

interface BillableRateOpportunity {
  service: string;
  currentRate: number;
  marketRate: number;
  difference: number;
  potentialIncrease: number;
}

// Helper functions for revenue opportunity analysis
const calculateRevenueOpportunities = (data: any) => {
  if (!data || !data.employeeHours || !data.stats) return [];

  const employees = data.employeeHours;
  
  // For each employee, calculate potential revenue opportunity
  return employees.map((employee: any) => {
    // Optimal utilization is considered 80% of a 40-hour work week
    const optimalUtilization = 0.8; // 80%
    const totalCapacity = 40; // 40 hours per week
    
    // Calculate current utilization
    const currentUtilization = employee.totalHours > 0 ? 
      employee.billableHours / totalCapacity : 0;
    
    // Calculate utilization gap
    const gap = Math.max(0, optimalUtilization - currentUtilization);
    
    // Assuming an average hourly rate of $150 for billable work
    const hourlyRate = 150;
    const weeklyGapHours = gap * totalCapacity;
    const potentialRevenue = weeklyGapHours * hourlyRate;
    
    return {
      name: employee.name,
      potentialRevenue: Math.round(potentialRevenue),
      currentUtilization: Math.round(currentUtilization * 100),
      optimalUtilization: Math.round(optimalUtilization * 100),
      gap: Math.round(gap * 100)
    };
  }).sort((a: RevenueOpportunity, b: RevenueOpportunity) => 
    b.potentialRevenue - a.potentialRevenue);
};

const calculateBillableRates = () => {
  // In a real scenario, these would be calculated based on actual data
  // and market research. For this demo, we'll use simulated data.
  return [
    {
      service: "Web Development",
      currentRate: 120,
      marketRate: 150,
      difference: 30,
      potentialIncrease: 25
    },
    {
      service: "UI/UX Design",
      currentRate: 110,
      marketRate: 140,
      difference: 30,
      potentialIncrease: 27
    },
    {
      service: "Mobile Development",
      currentRate: 130,
      marketRate: 160,
      difference: 30,
      potentialIncrease: 23
    },
    {
      service: "Project Management",
      currentRate: 100,
      marketRate: 125,
      difference: 25,
      potentialIncrease: 25
    },
    {
      service: "QA Testing",
      currentRate: 90,
      marketRate: 115,
      difference: 25,
      potentialIncrease: 28
    }
  ];
};

// Generate projected revenue data based on improving billable utilization
const generateProjectedRevenue = (currentUtilization: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const baseRevenue = 50000; // Baseline monthly revenue
  const projectedData = [];
  
  // Current trajectory - modest growth
  const currentTrajectory = months.map((month, index) => {
    const growthFactor = 1 + (index * 0.02); // 2% growth per month
    return {
      month,
      current: Math.round(baseRevenue * growthFactor),
      projected: 0
    };
  });
  
  // Projected trajectory - increasing utilization gradually
  return months.map((month, index) => {
    const currentGrowthFactor = 1 + (index * 0.02); // 2% growth per month
    const currentRev = Math.round(baseRevenue * currentGrowthFactor);
    
    // Improve utilization by 5% per month from current
    const utilizationImprovement = Math.min(currentUtilization + (index * 5), 80);
    const improvementFactor = utilizationImprovement / currentUtilization;
    const projectedRev = Math.round(currentRev * improvementFactor);
    
    return {
      month,
      current: currentRev,
      projected: projectedRev
    };
  });
};

export default function RevenueOpportunities() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { isConnected, connect, disconnect } = useZoho();

  const { data: timesheetData, isLoading } = useQuery({
    queryKey: ["/api/zoho/timesheet", dateRange],
    enabled: isConnected,
  });

  // Calculate revenue opportunities
  const revenueOpportunities = useMemo(() => {
    return calculateRevenueOpportunities(timesheetData);
  }, [timesheetData]);

  // Calculate billable rate opportunities
  const billableRateOpportunities = useMemo(() => {
    return calculateBillableRates();
  }, []);
  
  // Calculate total revenue opportunity
  const totalOpportunity = useMemo(() => {
    if (!revenueOpportunities || revenueOpportunities.length === 0) return 0;
    return revenueOpportunities.reduce((sum, item) => sum + item.potentialRevenue, 0);
  }, [revenueOpportunities]);

  // Calculate current utilization rate
  const currentUtilization = useMemo(() => {
    if (!timesheetData?.stats) return 0;
    const { billableHours, totalHours } = timesheetData.stats;
    return totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
  }, [timesheetData?.stats]);

  // Calculate projected revenue
  const projectedRevenue = useMemo(() => {
    return generateProjectedRevenue(currentUtilization);
  }, [currentUtilization]);

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

          {/* Page header with title */}
          <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center flex-wrap sm:flex-nowrap">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 mr-3 text-green-600" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Revenue Opportunities</h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Analyze potential revenue growth based on timesheet data
                  </p>
                </div>
              </div>
              <div className="flex items-center mt-4 sm:mt-0 space-x-3">
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
                
                <Button 
                  onClick={() => {
                    // Export action here
                  }}
                  disabled={!isConnected || !timesheetData}
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Revenue Opportunity
                      </span>
                      {isLoading ? (
                        <Skeleton className="h-10 w-24 mt-1" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          ${totalOpportunity.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="rounded-full p-3 bg-green-100 dark:bg-green-900/30">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium flex items-center text-green-600 dark:text-green-400">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Additional potential weekly revenue
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Current Utilization
                      </span>
                      {isLoading ? (
                        <Skeleton className="h-10 w-24 mt-1" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {currentUtilization}%
                        </span>
                      )}
                    </div>
                    <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900/30">
                      <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium flex items-center text-blue-600 dark:text-blue-400">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Increase to 80% for optimal revenue
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Average Billable Rate
                      </span>
                      {isLoading ? (
                        <Skeleton className="h-10 w-24 mt-1" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          $125/hr
                        </span>
                      )}
                    </div>
                    <div className="rounded-full p-3 bg-indigo-100 dark:bg-indigo-900/30">
                      <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium flex items-center text-indigo-600 dark:text-indigo-400">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      25.6% below market rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue opportunity charts */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Projected Revenue Growth */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Projected Revenue Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={projectedRevenue}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="current" 
                          name="Current Trajectory"
                          stroke="#9CA3AF" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="projected" 
                          name="With 80% Utilization"
                          stroke="#10B981" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Employee Revenue Opportunities */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Top Employee Revenue Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={revenueOpportunities.slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip formatter={(value) => [`$${value}`, 'Potential Weekly Revenue']} />
                        <Bar 
                          dataKey="potentialRevenue" 
                          name="Potential Weekly Revenue" 
                          fill="#3B82F6"
                          radius={[0, 4, 4, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue opportunity details */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Service Rate Opportunities */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Service Rate Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={billableRateOpportunities}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="service" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip formatter={(value) => [`$${value}`, '']} />
                        <Legend />
                        <Bar 
                          dataKey="currentRate" 
                          name="Current Rate" 
                          fill="#9CA3AF"
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="marketRate" 
                          name="Market Rate" 
                          fill="#10B981"
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Utilization Improvement Potential */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Utilization Improvement Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4 space-y-6">
                  {isLoading ? (
                    <div className="space-y-6">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    revenueOpportunities.slice(0, 5).map((opportunity, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{opportunity.name}</span>
                          <span className="text-sm font-medium">{opportunity.currentUtilization}% → 80%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${opportunity.currentUtilization}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                          <span>Current Utilization</span>
                          <span>Potential: ${opportunity.potentialRevenue}/week</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
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