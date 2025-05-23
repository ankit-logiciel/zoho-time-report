import { useState, useEffect } from "react";
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
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

// Custom label renderer for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
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

export default function Dashboard() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { isConnected, connect, disconnect, fetchTimesheetData } = useZoho();

  const { data: timesheetData, isLoading } = useQuery({
    queryKey: ["/api/zoho/timesheet", dateRange],
    enabled: isConnected,
  });

  // Stats data derived from timesheet data
  const stats = {
    billableHours: timesheetData?.stats?.billableHours || 0,
    nonBillableHours: timesheetData?.stats?.nonBillableHours || 0,
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

            {/* Additional Chart Panels */}
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
                        data={generateTrendData(timesheetData?.timeEntries)}
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
                        <Tooltip formatter={(value) => [`${value.toFixed(1)} hours`, '']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
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
