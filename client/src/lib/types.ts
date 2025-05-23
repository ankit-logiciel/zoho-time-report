export interface TimeEntry {
  id: string;
  date: string;
  project: string;
  employee: string;
  job?: string;
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
}

export interface ProjectHours {
  name: string;
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
}

export interface EmployeeHours {
  name: string;
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
}

export interface TimesheetStats {
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  activeProjects: number;
  activeEmployees: number;
  billablePercentChange: number;
  nonBillablePercentChange: number;
  projectsChange: number;
}

export interface TimesheetData {
  timeEntries: TimeEntry[];
  projectHours: ProjectHours[];
  employeeHours: EmployeeHours[];
  stats: TimesheetStats;
}

export interface ZohoAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  api_domain: string;
  token_type: string;
}

export interface ZohoTimesheetRecord {
  jobId: string;
  jobName: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  clientId: string;
  clientName: string;
  userId: string;
  userName: string;
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  timesheet_id: string;
  work_date: string;
  workDate: string;
  workHours: number;
  workMinutes: number;
  approvalStatus: string;
  notes: string;
}
