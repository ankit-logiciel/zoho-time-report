import { ZohoTimesheetRecord, TimeEntry, ProjectHours, EmployeeHours, TimesheetStats } from './types';

export async function fetchFromZoho(endpoint: string, accessToken: string): Promise<any> {
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoho API Error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

export function processTimesheetData(data: ZohoTimesheetRecord[]): {
  timeEntries: TimeEntry[],
  projectHours: ProjectHours[],
  employeeHours: EmployeeHours[],
  stats: TimesheetStats
} {
  // Create time entries
  const timeEntries: TimeEntry[] = data.map(record => ({
    id: record.timesheet_id,
    date: record.workDate,
    project: record.projectName,
    employee: record.userName,
    job: record.jobName,
    billableHours: record.billableHours,
    nonBillableHours: record.nonBillableHours,
    totalHours: record.totalHours
  }));

  // Aggregate by project
  const projectMap = new Map<string, ProjectHours>();
  data.forEach(record => {
    const existing = projectMap.get(record.projectName) || {
      name: record.projectName,
      billableHours: 0,
      nonBillableHours: 0,
      totalHours: 0
    };
    
    existing.billableHours += record.billableHours;
    existing.nonBillableHours += record.nonBillableHours;
    existing.totalHours += record.totalHours;
    
    projectMap.set(record.projectName, existing);
  });
  const projectHours: ProjectHours[] = Array.from(projectMap.values());

  // Aggregate by employee
  const employeeMap = new Map<string, EmployeeHours>();
  data.forEach(record => {
    const existing = employeeMap.get(record.userName) || {
      name: record.userName,
      billableHours: 0,
      nonBillableHours: 0,
      totalHours: 0
    };
    
    existing.billableHours += record.billableHours;
    existing.nonBillableHours += record.nonBillableHours;
    existing.totalHours += record.totalHours;
    
    employeeMap.set(record.userName, existing);
  });
  const employeeHours: EmployeeHours[] = Array.from(employeeMap.values());

  // Calculate stats
  const totalBillableHours = timeEntries.reduce((sum, entry) => sum + entry.billableHours, 0);
  const totalNonBillableHours = timeEntries.reduce((sum, entry) => sum + entry.nonBillableHours, 0);
  
  // In a real app, we would calculate percent changes from previous period
  // Here we'll use static values for demonstration
  const stats: TimesheetStats = {
    billableHours: totalBillableHours,
    nonBillableHours: totalNonBillableHours,
    totalHours: totalBillableHours + totalNonBillableHours,
    activeProjects: projectHours.length,
    activeEmployees: employeeHours.length,
    billablePercentChange: 8.2,
    nonBillablePercentChange: 3.4,
    projectsChange: 1
  };

  return {
    timeEntries,
    projectHours,
    employeeHours,
    stats
  };
}
