import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { calculateDateRangeFromString } from "../client/src/lib/utils";

// Store Zoho auth state in memory
interface ZohoAuthState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clientId: string;
  clientSecret: string;
  organization: string;
}

let zohoAuth: ZohoAuthState | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // API status route
  app.get("/api/zoho/status", (req: Request, res: Response) => {
    res.json({
      connected: !!zohoAuth,
      expiresAt: zohoAuth?.expiresAt || null
    });
  });

  // Connect to Zoho People API
  app.post("/api/zoho/connect", async (req: Request, res: Response) => {
    try {
      const { clientId, clientSecret, organization } = req.body;
      
      if (!clientId || !clientSecret || !organization) {
        return res.status(400).json({
          success: false,
          message: "Client ID, Client Secret, and Organization are required"
        });
      }

      // In a real implementation, we would initiate OAuth flow here
      // For this demo, we'll simulate a successful authentication
      
      // In production, you would redirect to Zoho auth page:
      // const redirectUri = `${req.protocol}://${req.get('host')}/api/zoho/callback`;
      // const authUrl = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${clientId}&scope=ZohoPeople.forms.ALL,ZohoPeople.attendance.READ,ZohoPeople.timetracker.ALL&redirect_uri=${redirectUri}`;
      
      // Then after user authenticates, Zoho would redirect to your callback endpoint
      // with a code that you exchange for tokens:
      
      // Simulate token exchange
      const expiresAt = Date.now() + 3600 * 1000; // 1 hour from now
      
      zohoAuth = {
        accessToken: "simulated_access_token",
        refreshToken: "simulated_refresh_token",
        expiresAt,
        clientId,
        clientSecret,
        organization
      };
      
      res.json({
        success: true,
        message: "Successfully connected to Zoho People"
      });
    } catch (error) {
      console.error("Zoho connect error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect to Zoho"
      });
    }
  });

  // Disconnect from Zoho People API
  app.post("/api/zoho/disconnect", (req: Request, res: Response) => {
    zohoAuth = null;
    res.json({
      success: true,
      message: "Successfully disconnected from Zoho People"
    });
  });

  // Get timesheet data
  app.get("/api/zoho/timesheet", async (req: Request, res: Response) => {
    try {
      if (!zohoAuth) {
        return res.status(401).json({
          success: false,
          message: "Not connected to Zoho People API"
        });
      }

      const dateRange = req.query.range as string || "Last 7 days";
      const { startDate, endDate } = calculateDateRangeFromString(dateRange);
      
      // In a real implementation, we would fetch data from Zoho API
      // For this demo, we'll return mock data that matches our expected format
      
      // Simulated API call to Zoho People:
      // const response = await axios.get(
      //   `https://people.zoho.com/api/timetracker/getrecords?dateFrom=${startDate.toISOString().split('T')[0]}&dateTo=${endDate.toISOString().split('T')[0]}`,
      //   {
      //     headers: {
      //       'Authorization': `Zoho-oauthtoken ${zohoAuth.accessToken}`
      //     }
      //   }
      // );
      
      // In a real implementation, you'd parse the actual Zoho response
      // For demo purposes, let's create a simulated response
      
      // Create simulated timesheet data
      const simulatedData = generateSimulatedTimesheetData(startDate, endDate);
      
      res.json(simulatedData);
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
