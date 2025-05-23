import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Circle } from 'lucide-react';

interface EmployeeChartProps {
  data: any[];
  isLoading: boolean;
}

export default function EmployeeChart({ data, isLoading }: EmployeeChartProps) {
  return (
    <Card>
      <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Hours by Employee</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
            <Circle className="h-2 w-2 mr-1 fill-green-500 text-green-500" /> Billable
          </Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30">
            <Circle className="h-2 w-2 mr-1 fill-red-500 text-red-500" /> Non-Billable
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                scale="band" 
                padding={{ left: 10, right: 10 }}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} hours`, '']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderColor: 'rgba(204, 204, 204, 0.5)',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="billableHours" 
                name="Billable Hours" 
                stackId="a" 
                fill="rgba(72, 187, 120, 0.7)"
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="nonBillableHours" 
                name="Non-Billable Hours" 
                stackId="a" 
                fill="rgba(229, 62, 62, 0.7)"
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
