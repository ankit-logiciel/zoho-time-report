import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export const insertZohoCredentialsSchema = createInsertSchema(zohoCredentials).pick({
  userId: true,
  clientId: true,
  clientSecret: true,
  organization: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertZohoCredentials = z.infer<typeof insertZohoCredentialsSchema>;
export type ZohoCredentials = typeof zohoCredentials.$inferSelect;
