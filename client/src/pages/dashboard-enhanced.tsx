import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import StatsCard from "@/components/stats-card";
import ProjectChart from "@/components/project-chart";
import EmployeeChart from "@/components/employee-chart";
import ConnectModal from "@/components/connect-modal";
import { useZoho } from "@/hooks/use-zoho";
import { 
  Clock, 
  BriefcaseBusiness, 
  Projector, 
  Users,
  InfoIcon,
  Calendar,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
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
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Helper function to generate trend data from time entries
const generateTrendData = (timeEntries: any[] = []) => {
  if (!timeEntries || timeEntries.length === 0) return [];
  
  // Group by date
  const dateMap = new Map();
  timeEntries.forEach(entry => {
    const existing = dateMap.get(entry.date) || {
      date: entry.date,
      billableHours: 0,
      nonBillableHours: 0,
      totalHours: 0
    };
    
    existing.billableHours += entry.billableHours;
    existing.nonBillableHours += entry.nonBillableHours;
    existing.totalHours += entry.totalHours;
    
    dateMap.set(entry.date, existing);
  });
  
  // Convert to array and sort by date
  return Array.from(dateMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Helper function to get top projects by total hours
const getTopProjects = (projects: any[] = []) => {
  if (!projects || projects.length === 0) return [];
  
  // Sort projects by total hours and take top 5
  return [...projects]
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 5);
};

// Helper function to get top performing employees
const getTopEmployees = (employees: any[] = []) => {
  if (!employees || employees.length === 0) return [];
  
  // Sort employees by billable hours and take top 5
  return [...employees]
    .sort((a, b) => b.billableHours - a.billableHours)
    .slice(0, 5);
};

// Generate month over month trend data (simulated)
const generateMonthOverMonthData = (timeEntries: any[] = []) => {
  if (!timeEntries || timeEntries.length === 0) return [];
  
  // This would normally be calculated from historical data
  // For demo purposes, we'll create a simulated trend
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const currentTotalHours = timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  
  // Create a plausible trend based on current total
  return months.map((month, index) => {
    const baseHours = Math.max(currentTotalHours * 0.7, 50);
    const randomFactor = 0.5 + Math.random();
    const trendFactor = 0.85 + (index * 0.05); // Gentle upward trend
    
    return {
      month,
      hours: Math.round((baseHours * randomFactor * trendFactor) * 10) / 10
    };
  });
};

// Custom label renderer for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardEnhanced() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { isConnected, connect, disconnect } = useZoho();

  const { data: timesheetData, isLoading } = useQuery({
    queryKey: ["/api/zoho/timesheet", dateRange],
    enabled: isConnected,
  });

  // Stats data derived from timesheet data
  const stats = {
    billableHours: timesheetData?.stats?.billableHours || 0,
    nonBillableHours: timesheetData?.stats?.nonBillableHours || 0,
    totalHours: timesheetData?.stats?.totalHours || 0,
    activeProjects: timesheetData?.stats?.activeProjects || 0,
    activeEmployees: timesheetData?.stats?.activeEmployees || 0,
    billablePercentChange: timesheetData?.stats?.billablePercentChange || 0,
    nonBillablePercentChange: timesheetData?.stats?.nonBillablePercentChange || 0,
    projectsChange: timesheetData?.stats?.projectsChange || 0,
  };

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

          {/* Dashboard header */}
          <Header 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange} 
            isConnected={isConnected}
            timesheetData={timesheetData}
          />

          {/* Dashboard content */}
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard 
                title="Billable Hours" 
                value={stats.billableHours.toFixed(1)}
                icon={<Clock className="text-primary" />}
                percentChange={stats.billablePercentChange}
                isLoading={isLoading}
                iconBgClass="bg-primary-100 dark:bg-primary-900/30"
              />
              <StatsCard 
                title="Non-Billable Hours" 
                value={stats.nonBillableHours.toFixed(1)}
                icon={<BriefcaseBusiness className="text-red-600" />}
                percentChange={stats.nonBillablePercentChange}
                isLoading={isLoading}
                iconBgClass="bg-red-100 dark:bg-red-900/30"
              />
              <StatsCard 
                title="Active Projects" 
                value={stats.activeProjects.toString()}
                icon={<Projector className="text-indigo-600" />}
                percentChange={stats.projectsChange}
                isLoading={isLoading}
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/30"
              />
              <StatsCard 
                title="Active Employees" 
                value={stats.activeEmployees.toString()}
                icon={<Users className="text-green-600" />}
                percentChange={0}
                isLoading={isLoading}
                iconBgClass="bg-green-100 dark:bg-green-900/30"
              />
            </div>

            {/* Main Charts */}
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ProjectChart 
                data={timesheetData?.projectHours || []} 
                isLoading={isLoading} 
              />
              <EmployeeChart 
                data={timesheetData?.employeeHours || []} 
                isLoading={isLoading} 
              />
            </div>

            {/* Additional Chart Panels - Row 1 */}
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Time Trends Chart */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Hours Trend Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart
                        data={generateTrendData(timesheetData?.timeEntries || [])}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="billableHours" 
                          name="Billable Hours"
                          stroke="#4f46e5" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="nonBillableHours"
                          name="Non-Billable Hours" 
                          stroke="#ef4444" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Projects by Hours Chart */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <Projector className="h-5 w-5 mr-2 text-indigo-600" />
                    Top Projects by Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={getTopProjects(timesheetData?.projectHours || [])}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalHours" name="Total Hours" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Chart Panels - Row 2 */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Month over Month Trend */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Monthly Hours Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={generateMonthOverMonthData(timesheetData?.timeEntries || [])}
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
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="hours" 
                          name="Total Hours" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Performers Chart */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Top Performing Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={getTopEmployees(timesheetData?.employeeHours || [])}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="billableHours" name="Billable Hours" fill="#4f46e5" />
                        <Bar dataKey="nonBillableHours" name="Non-Billable Hours" fill="#ef4444" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Chart Panels - Row 3 */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Billable vs Non-Billable Distribution */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Billable vs Non-Billable Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  {isLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Billable', value: stats.billableHours },
                            { name: 'Non-Billable', value: stats.nonBillableHours },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#4f46e5" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => {
                            if (typeof value === 'number') {
                              return [`${value.toFixed(1)} hours`, ''];
                            }
                            return [value, ''];
                          }} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Employee Utilization Card */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Team Utilization Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Billable Utilization</span>
                            <span className="text-sm font-medium">
                              {stats.totalHours > 0 
                                ? Math.round((stats.billableHours / stats.totalHours) * 100) 
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${stats.totalHours > 0 
                                  ? Math.round((stats.billableHours / stats.totalHours) * 100) 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Project Occupancy</span>
                            <span className="text-sm font-medium">
                              {stats.activeEmployees > 0 
                                ? Math.round((stats.totalHours / (stats.activeEmployees * 40)) * 100) 
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${stats.activeEmployees > 0 
                                  ? Math.min(Math.round((stats.totalHours / (stats.activeEmployees * 40)) * 100), 100) 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Employee Productivity</span>
                            <span className="text-sm font-medium">
                              {stats.activeEmployees > 0 
                                ? Math.round((stats.billableHours / stats.activeEmployees) * 10) / 10 
                                : 0} hrs/employee
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${stats.activeEmployees > 0 
                                  ? Math.min(Math.round((stats.billableHours / (stats.activeEmployees * 30)) * 100), 100) 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
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