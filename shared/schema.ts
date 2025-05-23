import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  profilePicture: text("profile_picture"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  zohoCredentials: many(zohoCredentials),
  timeEntries: many(timeEntries),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
  profilePicture: true,
  googleId: true,
});

// Zoho credentials model
export const zohoCredentials = pgTable("zoho_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),
  organization: text("organization").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const zohoCredentialsRelations = relations(zohoCredentials, ({ one }) => ({
  user: one(users, {
    fields: [zohoCredentials.userId],
    references: [users.id],
  }),
}));

export const insertZohoCredentialsSchema = createInsertSchema(zohoCredentials).pick({
  userId: true,
  clientId: true,
  clientSecret: true,
  organization: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

// Timesheet data models
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  zohoTimesheetId: text("zoho_timesheet_id").notNull(),
  date: text("date").notNull(), // formatted as YYYY-MM-DD
  project: text("project").notNull(),
  employee: text("employee").notNull(),
  job: text("job"),
  billableHours: doublePrecision("billable_hours").notNull(),
  nonBillableHours: doublePrecision("non_billable_hours").notNull(),
  totalHours: doublePrecision("total_hours").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const insertTimeEntrySchema = createInsertSchema(timeEntries).pick({
  userId: true,
  zohoTimesheetId: true,
  date: true,
  project: true,
  employee: true,
  job: true,
  billableHours: true,
  nonBillableHours: true,
  totalHours: true,
});

// Project hours summary
export const projectHours = pgTable("project_hours", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  billableHours: doublePrecision("billable_hours").notNull(),
  nonBillableHours: doublePrecision("non_billable_hours").notNull(),
  totalHours: doublePrecision("total_hours").notNull(),
  lastSyncDate: timestamp("last_sync_date").notNull(),
});

export const projectHoursRelations = relations(projectHours, ({ one }) => ({
  user: one(users, {
    fields: [projectHours.userId],
    references: [users.id],
  }),
}));

export const insertProjectHoursSchema = createInsertSchema(projectHours).pick({
  userId: true,
  name: true,
  billableHours: true,
  nonBillableHours: true,
  totalHours: true,
  lastSyncDate: true,
});

// Employee hours summary
export const employeeHours = pgTable("employee_hours", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  billableHours: doublePrecision("billable_hours").notNull(),
  nonBillableHours: doublePrecision("non_billable_hours").notNull(),
  totalHours: doublePrecision("total_hours").notNull(),
  lastSyncDate: timestamp("last_sync_date").notNull(),
});

export const employeeHoursRelations = relations(employeeHours, ({ one }) => ({
  user: one(users, {
    fields: [employeeHours.userId],
    references: [users.id],
  }),
}));

export const insertEmployeeHoursSchema = createInsertSchema(employeeHours).pick({
  userId: true,
  name: true,
  billableHours: true,
  nonBillableHours: true,
  totalHours: true,
  lastSyncDate: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertZohoCredentials = z.infer<typeof insertZohoCredentialsSchema>;
export type ZohoCredentials = typeof zohoCredentials.$inferSelect;

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

export type InsertProjectHours = z.infer<typeof insertProjectHoursSchema>;
export type ProjectHours = typeof projectHours.$inferSelect;

export type InsertEmployeeHours = z.infer<typeof insertEmployeeHoursSchema>;
export type EmployeeHours = typeof employeeHours.$inferSelect;
