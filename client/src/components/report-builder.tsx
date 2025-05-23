import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  FilterIcon,
  Columns,
  ArrowUpDown,
  Calculator,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface ReportBuilderProps {
  data: any[];
  isLoading: boolean;
}

export default function ReportBuilder({ data, isLoading }: ReportBuilderProps) {
  const [timeDimension, setTimeDimension] = useState("Day");
  const [projectDimension, setProjectDimension] = useState("All Projects");
  const [employeeDimension, setEmployeeDimension] = useState("All Employees");
  const [jobDimension, setJobDimension] = useState("No Job Filter");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Prepare data with sorting
  const getSortedData = () => {
    if (!data || data.length === 0) return [];
    
    return [...data].sort((a, b) => {
      if (sortDirection === "asc") {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });
  };

  const sortedData = getSortedData();
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const displayData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const totals = sortedData.reduce(
    (acc, item) => {
      acc.billableHours += Number(item.billableHours || 0);
      acc.nonBillableHours += Number(item.nonBillableHours || 0);
      acc.totalHours += Number(item.totalHours || 0);
      return acc;
    },
    { billableHours: 0, nonBillableHours: 0, totalHours: 0 }
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowDown className="ml-1 h-4 w-4" />
    ) : (
      <ArrowUp className="ml-1 h-4 w-4" />
    );
  };

  return (
    <Card className="mt-8">
      <CardHeader className="px-6 py-4 flex flex-row items-center justify-between flex-wrap">
        <CardTitle className="text-lg">Custom Report Builder</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <FilterIcon className="mr-1 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Columns className="mr-1 h-4 w-4" /> Columns
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-1 h-4 w-4" /> Sort
          </Button>
          <Button variant="outline" size="sm">
            <Calculator className="mr-1 h-4 w-4" /> Aggregate
          </Button>
        </div>
      </CardHeader>
      
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label htmlFor="timeDimension">Time Dimension</Label>
            <Select value={timeDimension} onValueChange={setTimeDimension}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select time dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Week">Week</SelectItem>
                <SelectItem value="Month">Month</SelectItem>
                <SelectItem value="Quarter">Quarter</SelectItem>
                <SelectItem value="Year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="projectDimension">Project</Label>
            <Select value={projectDimension} onValueChange={setProjectDimension}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select project dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Projects">All Projects</SelectItem>
                <SelectItem value="Group by Project">Group by Project</SelectItem>
                <SelectItem value="Select Specific...">Select Specific...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="employeeDimension">Employee</Label>
            <Select value={employeeDimension} onValueChange={setEmployeeDimension}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select employee dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Employees">All Employees</SelectItem>
                <SelectItem value="Group by Employee">Group by Employee</SelectItem>
                <SelectItem value="Select Specific...">Select Specific...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="jobDimension">Job (Optional)</Label>
            <Select value={jobDimension} onValueChange={setJobDimension}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select job dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No Job Filter">No Job Filter</SelectItem>
                <SelectItem value="Group by Job">Group by Job</SelectItem>
                <SelectItem value="Select Specific...">Select Specific...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  Date
                  {getSortIcon("date")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("project")}>
                <div className="flex items-center">
                  Project
                  {getSortIcon("project")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("employee")}>
                <div className="flex items-center">
                  Employee
                  {getSortIcon("employee")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("job")}>
                <div className="flex items-center">
                  Job
                  {getSortIcon("job")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("billableHours")}>
                <div className="flex items-center">
                  Billable Hours
                  {getSortIcon("billableHours")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("nonBillableHours")}>
                <div className="flex items-center">
                  Non-Billable Hours
                  {getSortIcon("nonBillableHours")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("totalHours")}>
                <div className="flex items-center">
                  Total Hours
                  {getSortIcon("totalHours")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  {Array(7).fill(0).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : displayData.length > 0 ? (
              displayData.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.project}</TableCell>
                  <TableCell>{entry.employee}</TableCell>
                  <TableCell>{entry.job || '-'}</TableCell>
                  <TableCell>{entry.billableHours}</TableCell>
                  <TableCell>{entry.nonBillableHours}</TableCell>
                  <TableCell className="font-medium">{entry.totalHours}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No data available. Connect to Zoho People to view timesheet data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter className="bg-gray-50 dark:bg-gray-800/50">
            <TableRow>
              <TableCell colSpan={4} className="font-medium">Totals</TableCell>
              <TableCell className="font-medium">{totals.billableHours.toFixed(1)}</TableCell>
              <TableCell className="font-medium">{totals.nonBillableHours.toFixed(1)}</TableCell>
              <TableCell className="font-medium">{totals.totalHours.toFixed(1)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      
      {displayData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, sortedData.length)}
                </span>{" "}
                of <span className="font-medium">{sortedData.length}</span> results
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  if (pageNum === 1 || pageNum === totalPages || 
                     (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={currentPage === pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (pageNum === 2 || pageNum === totalPages - 1) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </Card>
  );
}
