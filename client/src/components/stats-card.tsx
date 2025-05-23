import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  percentChange: number;
  isLoading: boolean;
  iconBgClass: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  percentChange, 
  isLoading,
  iconBgClass
}: StatsCardProps) {
  
  const renderChangeIndicator = () => {
    if (percentChange > 0) {
      return (
        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-500">
          <TrendingUp className="h-3 w-3 mr-1" />
          {percentChange.toFixed(1)}%
        </div>
      );
    } else if (percentChange < 0) {
      return (
        <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600 dark:text-red-500">
          <TrendingDown className="h-3 w-3 mr-1" />
          {Math.abs(percentChange).toFixed(1)}%
        </div>
      );
    } else {
      return (
        <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600 dark:text-gray-400">
          <Minus className="h-3 w-3 mr-1" />
        </div>
      );
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgClass)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {value}
                  </div>
                  {renderChangeIndicator()}
                </>
              )}
            </dd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
