import { Request, Response } from "express";
import { storage } from "./storage";

// Get Zoho connection status - no authentication required
export async function getZohoStatus(req: Request, res: Response) {
  try {
    // For demo purposes, we'll use a fixed user ID (admin user is 1)
    const userId = 1;
    const credentials = await storage.getZohoCredentials(userId);
    
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
}

// Connect to Zoho - no authentication required
export async function connectZoho(req: Request, res: Response) {
  try {
    const { clientId, clientSecret, organization } = req.body;
    
    if (!clientId || !clientSecret || !organization) {
      return res.status(400).json({
        success: false,
        message: "Client ID, Client Secret, and Organization are required"
      });
    }
    
    // For demo purposes, we'll use a fixed user ID (admin user is 1)
    const userId = 1;
    console.log("Connecting to Zoho with credentials for user:", userId);
    
    // For self client method, we'll use these credentials to make API calls
    const accessToken = "self_client_token";
    const refreshToken = "refresh_token";
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    
    // Save the credentials
    const existingCredentials = await storage.getZohoCredentials(userId);
    
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
        userId,
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
}

// Disconnect from Zoho - no authentication required
export async function disconnectZoho(req: Request, res: Response) {
  try {
    // For demo purposes, we'll use a fixed user ID (admin user is 1)
    const userId = 1;
    const credentials = await storage.getZohoCredentials(userId);
    
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
}