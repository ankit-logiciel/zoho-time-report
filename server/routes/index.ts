import { Router } from "express";
import zohoRoutes from "./zoho";

const router = Router();

// Mount Zoho routes
router.use("/zoho", zohoRoutes);

export default router;