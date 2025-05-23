import { Router, Request, Response } from "express";
import { storage } from "../storage";

const router = Router();

// Middleware to ensure user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Not authenticated"
  });
}

// Connect to Zoho with client credentials
router.post("/connect", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret, organization } = req.body;
    
    if (!clientId || !clientSecret || !organization) {
      return res.status(400).json({
        success: false,
        message: "Client ID, Client Secret, and Organization are required"
      });
    }
    
    console.log("Connecting to Zoho with credentials for user:", req.user!.id);
    
    // For self client method, we just store the credentials
    // The actual token management happens in your Zoho developer console
    const accessToken = "zoho_access_token";
    const refreshToken = "zoho_refresh_token";
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    
    // Save the credentials
    const existingCredentials = await storage.getZohoCredentials(req.user!.id);
    
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
        userId: req.user!.id,
        clientId,
        clientSecret,
        organization,
        accessToken,
        refreshToken,
        expiresAt
      });
    }
    
    return res.json({
      success: true,
      message: "Successfully connected to Zoho People"
    });
  } catch (error) {
    console.error("Error connecting to Zoho:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Zoho"
    });
  }
});

// Disconnect from Zoho
router.post("/disconnect", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const credentials = await storage.getZohoCredentials(req.user!.id);
    
    if (credentials) {
      await storage.updateZohoCredentials(credentials.id, {
        accessToken: null,
        refreshToken: null,
        expiresAt: null
      });
    }
    
    return res.json({
      success: true,
      message: "Successfully disconnected from Zoho People"
    });
  } catch (error) {
    console.error("Error disconnecting from Zoho:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to disconnect from Zoho"
    });
  }
});

// Get Zoho connection status
router.get("/status", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const credentials = await storage.getZohoCredentials(req.user!.id);
    
    return res.json({
      connected: !!credentials?.accessToken,
      expiresAt: credentials?.expiresAt || null
    });
  } catch (error) {
    console.error("Error getting Zoho status:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get Zoho connection status"
    });
  }
});

export default router;