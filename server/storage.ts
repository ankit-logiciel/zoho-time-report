import { users, type User, type InsertUser, zohoCredentials, type ZohoCredentials, 
  type InsertZohoCredentials, timeEntries, type TimeEntry, type InsertTimeEntry,
  projectHours, type ProjectHours, type InsertProjectHours,
  employeeHours, type EmployeeHours, type InsertEmployeeHours } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Zoho credentials methods
  getZohoCredentials(userId: number): Promise<ZohoCredentials | undefined>;
  saveZohoCredentials(credentials: InsertZohoCredentials): Promise<ZohoCredentials>;
  updateZohoCredentials(id: number, updates: Partial<InsertZohoCredentials>): Promise<ZohoCredentials | undefined>;
  
  // Timesheet data methods
  saveTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  getTimeEntriesByUser(userId: number): Promise<TimeEntry[]>;
  saveProjectHours(projectHour: InsertProjectHours): Promise<ProjectHours>;
  getProjectHoursByUser(userId: number): Promise<ProjectHours[]>;
  saveEmployeeHours(employeeHour: InsertEmployeeHours): Promise<EmployeeHours>;
  getEmployeeHoursByUser(userId: number): Promise<EmployeeHours[]>;
  
  // Delete old data for a new sync
  clearUserTimesheetData(userId: number): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Zoho credentials methods
  async getZohoCredentials(userId: number): Promise<ZohoCredentials | undefined> {
    const [credentials] = await db.select()
      .from(zohoCredentials)
      .where(eq(zohoCredentials.userId, userId));
    return credentials;
  }
  
  async saveZohoCredentials(credentials: InsertZohoCredentials): Promise<ZohoCredentials> {
    const [result] = await db
      .insert(zohoCredentials)
      .values(credentials)
      .returning();
    return result;
  }
  
  async updateZohoCredentials(id: number, updates: Partial<InsertZohoCredentials>): Promise<ZohoCredentials | undefined> {
    const [updated] = await db
      .update(zohoCredentials)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(zohoCredentials.id, id))
      .returning();
    return updated;
  }
  
  // Timesheet data methods
  async saveTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [result] = await db
      .insert(timeEntries)
      .values(entry)
      .returning();
    return result;
  }
  
  async getTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    return db.select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId));
  }
  
  async saveProjectHours(projectHour: InsertProjectHours): Promise<ProjectHours> {
    // Check if project hours already exist for this user and project
    const [existing] = await db.select()
      .from(projectHours)
      .where(
        and(
          eq(projectHours.userId, projectHour.userId),
          eq(projectHours.name, projectHour.name)
        )
      );
    
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(projectHours)
        .set(projectHour)
        .where(eq(projectHours.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new record
      const [result] = await db
        .insert(projectHours)
        .values(projectHour)
        .returning();
      return result;
    }
  }
  
  async getProjectHoursByUser(userId: number): Promise<ProjectHours[]> {
    return db.select()
      .from(projectHours)
      .where(eq(projectHours.userId, userId));
  }
  
  async saveEmployeeHours(employeeHour: InsertEmployeeHours): Promise<EmployeeHours> {
    // Check if employee hours already exist for this user and employee
    const [existing] = await db.select()
      .from(employeeHours)
      .where(
        and(
          eq(employeeHours.userId, employeeHour.userId),
          eq(employeeHours.name, employeeHour.name)
        )
      );
    
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(employeeHours)
        .set(employeeHour)
        .where(eq(employeeHours.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new record
      const [result] = await db
        .insert(employeeHours)
        .values(employeeHour)
        .returning();
      return result;
    }
  }
  
  async getEmployeeHoursByUser(userId: number): Promise<EmployeeHours[]> {
    return db.select()
      .from(employeeHours)
      .where(eq(employeeHours.userId, userId));
  }
  
  async clearUserTimesheetData(userId: number): Promise<void> {
    // Delete all timesheet data for this user
    await db.delete(timeEntries).where(eq(timeEntries.userId, userId));
    await db.delete(projectHours).where(eq(projectHours.userId, userId));
    await db.delete(employeeHours).where(eq(employeeHours.userId, userId));
  }
}

export const storage = new DatabaseStorage();
