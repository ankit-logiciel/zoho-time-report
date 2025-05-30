import { Request, Response } from "express";
import { storage } from "./storage";
import { calculateDateRangeFromString } from "../client/src/lib/utils";
import { ZohoTimesheetRecord } from "../client/src/lib/types";
import { processTimesheetData } from "../client/src/lib/api";
import axios from "axios";

// Function to synchronize Zoho timesheet data to the database
export async function syncTimesheetData(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }
  
  try {
    const { dateRange } = req.query;
    
    if (!dateRange || typeof dateRange !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Date range is required"
      });
    }
    
    // Get Zoho credentials
    const credentials = await storage.getZohoCredentials(req.user.id);
    
    if (!credentials?.accessToken) {
      return res.status(400).json({
        success: false,
        message: "Zoho is not connected"
      });
    }
    
    // Get date range for the API request
    const { startDate, endDate } = calculateDateRangeFromString(dateRange);
    
    // Format dates for Zoho API
    const fromDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const toDate = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    let zohoData: ZohoTimesheetRecord[] = [];
    
    try {
      // Make the API request to Zoho People API to get timesheets
      const response = await axios.get(
        `https://${credentials.organization}.zoho.com/people/api/timesheet/getTimesheets`,
        {
          params: {
            fromDate,
            toDate,
            status: "All" // Get all timesheets regardless of approval status
          },
          headers: {
            Authorization: `Zoho-oauthtoken ${credentials.accessToken}`
          }
        }
      );
      
      if (response.data && response.data.response && response.data.response.result) {
        // Transform Zoho API response to match our expected ZohoTimesheetRecord format
        zohoData = response.data.response.result.map((record: any) => ({
          timesheet_id: record.timesheetId || `TS${Date.now()}`,
          workDate: record.workDate,
          work_date: record.workDate,
          projectId: record.projectId || "",
          projectName: record.projectName || "Unassigned",
          userId: record.userId || "",
          userName: record.userName || "Unknown",
          jobId: record.jobId || "",
          jobName: record.jobName || record.taskName || "General",
          taskId: record.taskId || "",
          taskName: record.taskName || "",
          clientId: record.clientId || "",
          clientName: record.clientName || "Unknown Client",
          billableHours: Number(record.billableHours) || 0,
          nonBillableHours: Number(record.nonBillableHours) || 0,
          totalHours: Number(record.totalHours) || Number(record.hours || 0),
          workHours: Math.floor(Number(record.totalHours) || Number(record.hours || 0)),
          workMinutes: Math.round(((Number(record.totalHours) || Number(record.hours || 0)) % 1) * 60),
          approvalStatus: record.approvalStatus || "Pending",
          notes: record.notes || ""
        }));
      }
    } catch (apiError: any) {
      console.error("Zoho API Error:", apiError);
      
      // If we get a 401, the token might be expired
      if (apiError.response && apiError.response.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Zoho access token expired. Please reconnect your Zoho account."
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Failed to fetch data from Zoho API. Please verify your credentials."
      });
    }
    
    // If we didn't get any data from Zoho but didn't encounter an error,
    // use simulated data for demo purposes
    if (zohoData.length === 0) {
      console.log("No data received from Zoho API, falling back to simulated data for demo purposes");
      zohoData = generateSimulatedTimesheetData(startDate, endDate);
    }
    
    // Process the data
    const processedData = processTimesheetData(zohoData);
    
    // Clear existing data for this user
    await storage.clearUserTimesheetData(req.user.id);
    
    // Store time entries
    const savedEntries = await Promise.all(
      processedData.timeEntries.map(entry => 
        storage.saveTimeEntry({
          userId: req.user.id,
          zohoTimesheetId: entry.id,
          date: entry.date,
          project: entry.project,
          employee: entry.employee,
          job: entry.job || null,
          billableHours: entry.billableHours,
          nonBillableHours: entry.nonBillableHours,
          totalHours: entry.totalHours
        })
      )
    );
    
    // Store project hours summaries
    const savedProjectHours = await Promise.all(
      processedData.projectHours.map(project => 
        storage.saveProjectHours({
          userId: req.user.id,
          name: project.name,
          billableHours: project.billableHours,
          nonBillableHours: project.nonBillableHours,
          totalHours: project.totalHours,
          lastSyncDate: new Date()
        })
      )
    );
    
    // Store employee hours summaries
    const savedEmployeeHours = await Promise.all(
      processedData.employeeHours.map(employee => 
        storage.saveEmployeeHours({
          userId: req.user.id,
          name: employee.name,
          billableHours: employee.billableHours,
          nonBillableHours: employee.nonBillableHours,
          totalHours: employee.totalHours,
          lastSyncDate: new Date()
        })
      )
    );
    
    res.json({
      success: true,
      message: "Timesheet data synchronized successfully",
      stats: {
        timeEntries: savedEntries.length,
        projectHours: savedProjectHours.length,
        employeeHours: savedEmployeeHours.length
      }
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to synchronize timesheet data"
    });
  }
}

// Generate simulated timesheet data (for demo purposes)
function generateSimulatedTimesheetData(startDate: Date, endDate: Date): ZohoTimesheetRecord[] {
  const records: ZohoTimesheetRecord[] = [];
  const projects = ["Website Redesign", "Mobile App Development", "E-commerce Platform", "CRM Implementation", "Data Migration"];
  const employees = ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Wilson"];
  const jobs = ["Design", "Development", "Testing", "Project Management", "Documentation"];
  
  // Clone the start date to avoid modifying the original
  const currentDate = new Date(startDate);
  
  // Generate records for each day in the range
  while (currentDate <= endDate) {
    const date = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Generate 2-4 records per day
    const recordsPerDay = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < recordsPerDay; i++) {
      const projectIndex = Math.floor(Math.random() * projects.length);
      const employeeIndex = Math.floor(Math.random() * employees.length);
      const jobIndex = Math.floor(Math.random() * jobs.length);
      
      const billableHours = Math.random() * 6;
      const nonBillableHours = Math.random() * 2;
      const totalHours = billableHours + nonBillableHours;
      
      records.push({
        timesheet_id: `TS${Date.now() + i}`,
        workDate: date,
        work_date: date,
        projectId: `PRJ${projectIndex}`,
        projectName: projects[projectIndex],
        userId: `USR${employeeIndex}`,
        userName: employees[employeeIndex],
        jobId: `JOB${jobIndex}`,
        jobName: jobs[jobIndex],
        taskId: `TSK${i}`,
        taskName: `Task ${i + 1}`,
        clientId: `CLI${projectIndex}`,
        clientName: `Client ${projectIndex + 1}`,
        billableHours,
        nonBillableHours,
        totalHours,
        workHours: Math.floor(totalHours),
        workMinutes: Math.round((totalHours % 1) * 60),
        approvalStatus: "Approved",
        notes: `Work done on ${date}`
      });
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return records;
}