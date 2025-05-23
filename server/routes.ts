import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { calculateDateRangeFromString } from "../client/src/lib/utils";
import { setupAuth } from "./auth";
import { syncTimesheetData } from "./sync";
import { processTimesheetData } from "../client/src/lib/api";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // API routes to get timesheet data from the database
  app.get("/api/timesheet/data", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      const userId = req.user.id;
      
      // Fetch time entries for this user
      const timeEntries = await storage.getTimeEntriesByUser(userId);
      const projectHours = await storage.getProjectHoursByUser(userId);
      const employeeHours = await storage.getEmployeeHoursByUser(userId);
      
      // Check if we have any data
      if (timeEntries.length === 0) {
        // If no data in database, fetch and return simulated data
        const { range } = req.query;
        const dateRange = typeof range === 'string' ? range : 'this-month';
        const { startDate, endDate } = calculateDateRangeFromString(dateRange);
        
        const simulatedData = generateSimulatedTimesheetData(startDate, endDate);
        
        return res.json(simulatedData);
      }
      
      // Calculate stats
      const billableHours = timeEntries.reduce((sum, entry) => sum + entry.billableHours, 0);
      const nonBillableHours = timeEntries.reduce((sum, entry) => sum + entry.nonBillableHours, 0);
      const totalHours = billableHours + nonBillableHours;
      
      // Simulated changes for demo
      const billablePercentChange = Math.random() * 30 - 15; // -15% to +15%
      const nonBillablePercentChange = Math.random() * 20 - 10; // -10% to +10%
      const projectsChange = Math.random() * 4 - 2; // -2 to +2
      
      const stats = {
        billableHours,
        nonBillableHours,
        totalHours,
        activeProjects: projectHours.length,
        activeEmployees: employeeHours.length,
        billablePercentChange,
        nonBillablePercentChange,
        projectsChange
      };
      
      res.json({
        timeEntries,
        projectHours,
        employeeHours,
        stats
      });
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch timesheet data"
      });
    }
  });
  
  // Route to sync timesheet data from Zoho to database
  app.post("/api/timesheet/sync", syncTimesheetData);

  // Get Zoho connection status
  app.get("/api/zoho/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      const credentials = await storage.getZohoCredentials(req.user.id);
      
      res.json({
        connected: !!credentials?.accessToken,
        expiresAt: credentials?.expiresAt || null
      });
    } catch (error) {
      console.error("Error getting Zoho status:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get Zoho connection status"
      });
    }
  });
  
  // Connect to Zoho - Endpoint for adding Zoho credentials
  app.post("/api/zoho/connect", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      const { clientId, clientSecret, organization } = req.body;
      
      if (!clientId || !clientSecret || !organization) {
        return res.status(400).json({
          success: false,
          message: "Client ID, Client Secret, and Organization are required"
        });
      }
      
      console.log("Connecting to Zoho with credentials for user:", req.user.id);
      
      // For self client method, we'll use these credentials to make API calls
      // The actual token management is done externally
      const accessToken = "self_client_token"; // In a real app, this would come from the Zoho API
      const refreshToken = "refresh_token"; // In a real app, this would come from the Zoho API
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      
      // Save the credentials
      const existingCredentials = await storage.getZohoCredentials(req.user.id);
      
      if (existingCredentials) {
        await storage.updateZohoCredentials(existingCredentials.id, {
          clientId,
          clientSecret,
          organization,
          accessToken,
          refreshToken,
          expiresAt
        });
      } else {
        await storage.saveZohoCredentials({
          userId: req.user.id,
          clientId,
          clientSecret,
          organization,
          accessToken,
          refreshToken,
          expiresAt
        });
      }
      
      res.json({
        success: true,
        message: "Successfully connected to Zoho People"
      });
    } catch (error) {
      console.error("Error connecting to Zoho:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect to Zoho"
      });
    }
  });
  
  // Disconnect from Zoho
  app.post("/api/zoho/disconnect", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      const credentials = await storage.getZohoCredentials(req.user.id);
      
      if (credentials) {
        await storage.updateZohoCredentials(credentials.id, {
          accessToken: null,
          refreshToken: null,
          expiresAt: null
        });
      }
      
      res.json({
        success: true,
        message: "Successfully disconnected from Zoho People"
      });
    } catch (error) {
      console.error("Error disconnecting from Zoho:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to disconnect from Zoho"
      });
    }
  });
  
  // Get timesheet data directly from Zoho
  app.get("/api/zoho/timesheet", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
      // Check if Zoho is connected
      const credentials = await storage.getZohoCredentials(req.user.id);
      
      if (!credentials?.accessToken) {
        return res.status(401).json({
          success: false,
          message: "Not connected to Zoho People API"
        });
      }

      const dateRange = req.query.range as string || "Last 7 days";
      const { startDate, endDate } = calculateDateRangeFromString(dateRange);
      
      // In a real implementation, we would fetch data from Zoho API
      // For this demo, we'll return simulated data that matches our expected format
      
      // Simulated API call to Zoho People:
      // const response = await axios.get(
      //   `https://people.zoho.com/api/timetracker/getrecords?dateFrom=${startDate.toISOString().split('T')[0]}&dateTo=${endDate.toISOString().split('T')[0]}`,
      //   {
      //     headers: {
      //       'Authorization': `Zoho-oauthtoken ${credentials.accessToken}`
      //     }
      //   }
      // );
      
      // In a real implementation, you'd parse the actual Zoho response
      // For this demo, let's generate simulated records and process them
      const zohoRecords = generateSimulatedZohoRecords(startDate, endDate);
      const processedData = processTimesheetData(zohoRecords);
      
      res.json(processedData);
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch timesheet data"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate simulated timesheet data for demonstration
function generateSimulatedTimesheetData(startDate: Date, endDate: Date) {
  const projects = ["Website Redesign", "Mobile App", "CRM Integration", "Content Migration", "SEO Optimization"];
  const employees = ["John Smith", "Emily Johnson", "Sarah Wilson", "Michael Brown", "Alex Lee"];
  const jobs = ["Frontend Dev", "Backend Dev", "UI Design", "QA Testing", "Project Management"];
  
  // Generate time entries
  const timeEntries = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Generate 3-5 entries per day
    const entriesPerDay = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < entriesPerDay; i++) {
      const projectIndex = Math.floor(Math.random() * projects.length);
      const employeeIndex = Math.floor(Math.random() * employees.length);
      const jobIndex = Math.floor(Math.random() * jobs.length);
      
      const billableHours = Math.round((Math.random() * 6 + 1) * 10) / 10; // 1.0 to 7.0 hours
      const nonBillableHours = Math.round((Math.random() * 2) * 10) / 10; // 0.0 to 2.0 hours
      
      timeEntries.push({
        id: `TS${Date.now() + i}`,
        date: currentDate.toISOString().split('T')[0],
        project: projects[projectIndex],
        employee: employees[employeeIndex],
        job: jobs[jobIndex],
        billableHours,
        nonBillableHours,
        totalHours: billableHours + nonBillableHours
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Aggregate by project
  const projectMap = new Map();
  timeEntries.forEach(entry => {
    const existing = projectMap.get(entry.project) || {
      name: entry.project,
      billableHours: 0,
      nonBillableHours: 0,
      totalHours: 0
    };
    
    existing.billableHours += entry.billableHours;
    existing.nonBillableHours += entry.nonBillableHours;
    existing.totalHours += entry.totalHours;
    
    projectMap.set(entry.project, existing);
  });
  const projectHours = Array.from(projectMap.values());
  
  // Aggregate by employee
  const employeeMap = new Map();
  timeEntries.forEach(entry => {
    const existing = employeeMap.get(entry.employee) || {
      name: entry.employee,
      billableHours: 0,
      nonBillableHours: 0,
      totalHours: 0
    };
    
    existing.billableHours += entry.billableHours;
    existing.nonBillableHours += entry.nonBillableHours;
    existing.totalHours += entry.totalHours;
    
    employeeMap.set(entry.employee, existing);
  });
  const employeeHours = Array.from(employeeMap.values());
  
  // Calculate stats
  const totalBillableHours = timeEntries.reduce((sum, entry) => sum + entry.billableHours, 0);
  const totalNonBillableHours = timeEntries.reduce((sum, entry) => sum + entry.nonBillableHours, 0);
  
  const stats = {
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

// Helper function to generate simulated Zoho records (raw format)
function generateSimulatedZohoRecords(startDate: Date, endDate: Date) {
  const records = [];
  const projects = ["Website Redesign", "Mobile App", "CRM Integration", "Content Migration", "SEO Optimization"];
  const employees = ["John Smith", "Emily Johnson", "Sarah Wilson", "Michael Brown", "Alex Lee"];
  const jobs = ["Frontend Dev", "Backend Dev", "UI Design", "QA Testing", "Project Management"];
  
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
