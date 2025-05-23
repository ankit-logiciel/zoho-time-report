import { Router } from 'express';
import authRoutes from './auth';
import { isAuthenticated } from './auth';
import { storage } from '../storage';
import { calculateDateRangeFromString } from '../../client/src/lib/utils';
import { syncTimesheetData } from '../sync';
import { processTimesheetData } from '../../client/src/lib/api';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// API routes to get timesheet data from the database
router.get('/timesheet/data', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch time entries for this user
    const timeEntries = await storage.getTimeEntriesByUser(userId);
    const projectHours = await storage.getProjectHoursByUser(userId);
    const employeeHours = await storage.getEmployeeHoursByUser(userId);
    
    // Construct response data
    res.json({
      timeEntries,
      projectHours,
      employeeHours,
    });
  } catch (error) {
    console.error('Error fetching timesheet data:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch timesheet data'
    });
  }
});

// Zoho connection status
router.get('/zoho/status', isAuthenticated, async (req, res) => {
  try {
    const credentials = await storage.getZohoCredentials(req.user.id);
    
    res.json({
      connected: !!credentials?.accessToken,
      expiresAt: credentials?.expiresAt || null
    });
  } catch (error) {
    console.error('Zoho status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check Zoho connection status'
    });
  }
});

// Zoho connection
router.post('/zoho/connect', isAuthenticated, async (req, res) => {
  try {
    const { clientId, clientSecret, organization } = req.body;
    
    if (!clientId || !clientSecret || !organization) {
      return res.status(400).json({
        success: false,
        message: 'Client ID, Client Secret, and Organization are required'
      });
    }

    // Simulate token exchange
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    
    // Save/update Zoho credentials for this user
    const existingCredentials = await storage.getZohoCredentials(req.user.id);
    
    if (existingCredentials) {
      await storage.updateZohoCredentials(existingCredentials.id, {
        clientId,
        clientSecret,
        organization,
        accessToken: 'simulated_access_token',
        refreshToken: 'simulated_refresh_token',
        expiresAt
      });
    } else {
      await storage.saveZohoCredentials({
        userId: req.user.id,
        clientId,
        clientSecret,
        organization,
        accessToken: 'simulated_access_token',
        refreshToken: 'simulated_refresh_token',
        expiresAt
      });
    }
    
    res.json({
      success: true,
      message: 'Successfully connected to Zoho People'
    });
  } catch (error) {
    console.error('Zoho connect error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to Zoho'
    });
  }
});

// Zoho disconnect
router.post('/zoho/disconnect', isAuthenticated, async (req, res) => {
  try {
    // Get existing credentials
    const credentials = await storage.getZohoCredentials(req.user.id);
    
    if (credentials) {
      // Update to remove tokens
      await storage.updateZohoCredentials(credentials.id, {
        accessToken: null,
        refreshToken: null,
        expiresAt: null
      });
    }
    
    res.json({
      success: true,
      message: 'Successfully disconnected from Zoho People'
    });
  } catch (error) {
    console.error('Zoho disconnect error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to disconnect from Zoho'
    });
  }
});

// Sync timesheet data
router.post('/sync', isAuthenticated, syncTimesheetData);

// Get timesheet data from Zoho
router.get('/zoho/timesheet', isAuthenticated, async (req, res) => {
  try {
    // Check if user has connected to Zoho
    const credentials = await storage.getZohoCredentials(req.user.id);
    
    if (!credentials?.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'You must connect to Zoho first'
      });
    }
    
    // Get date range from query params
    const dateRange = req.query.dateRange as string || '30d';
    const { startDate, endDate } = calculateDateRangeFromString(dateRange);
    
    // Generate simulated data
    const sampleData = generateSimulatedZohoRecords(startDate, endDate);
    
    res.json({
      success: true,
      data: processTimesheetData(sampleData)
    });
  } catch (error) {
    console.error('Error fetching Zoho data:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch Zoho data'
    });
  }
});

// Helper function to generate simulated Zoho data
function generateSimulatedZohoRecords(startDate: Date, endDate: Date) {
  const records = [];
  const projects = ['Website Redesign', 'Mobile App Development', 'Marketing Campaign', 'CRM Integration'];
  const employees = ['John Smith', 'Jane Doe', 'Robert Johnson', 'Sarah Williams', 'Michael Brown'];
  const jobs = ['Design', 'Development', 'Testing', 'Project Management', null];
  
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Add 2-5 records per day
    const recordsPerDay = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < recordsPerDay; i++) {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      
      // Generate hours
      const billableHours = Math.random() < 0.8 ? parseFloat((Math.random() * 7).toFixed(1)) : 0;
      const nonBillableHours = Math.random() < 0.4 ? parseFloat((Math.random() * 3).toFixed(1)) : 0;
      
      records.push({
        jobId: job ? `job_${Math.floor(Math.random() * 100)}` : null,
        jobName: job,
        projectId: `project_${Math.floor(Math.random() * 100)}`,
        projectName: project,
        taskId: `task_${Math.floor(Math.random() * 100)}`,
        taskName: 'Task',
        clientId: `client_${Math.floor(Math.random() * 100)}`,
        clientName: 'Client',
        userId: `user_${Math.floor(Math.random() * 100)}`,
        userName: employee,
        billableHours,
        nonBillableHours,
        totalHours: billableHours + nonBillableHours,
        timesheet_id: `timesheet_${Math.floor(Math.random() * 1000)}`,
        work_date: currentDate.toISOString().split('T')[0],
        workDate: currentDate.toISOString().split('T')[0],
        workHours: Math.floor(billableHours + nonBillableHours),
        workMinutes: Math.round((billableHours + nonBillableHours) % 1 * 60),
        approvalStatus: 'Approved',
        notes: '',
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return records;
}

export default router;