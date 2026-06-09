import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Listings ────────────────────────────────────────────────────────────────
export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemNumber: text("item_number").notNull().unique(), // RF-001, RF-002, …
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  size: text("size").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(), // reFinds | kids | under10 | styled | sold
  condition: text("condition").notNull(),
  description: text("description").notNull(),
  photos: text("photos").notNull().default("[]"), // JSON array of photo URLs
  status: text("status").notNull().default("available"), // available | sold
  badges: text("badges").notNull().default("[]"), // JSON: ["newThisWeek","jenellsPick","vintage","under10"]
  isJenellsPick: integer("is_jenells_pick", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  itemNumber: true,
  createdAt: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// ─── Treasure Hunt Requests ──────────────────────────────────────────────────
export const treasureRequests = sqliteTable("treasure_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contact: text("contact").notNull(), // email or phone
  size: text("size").notNull(),
  brand: text("brand"),
  itemType: text("item_type").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("new"), // new | seen | fulfilled
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertTreasureRequestSchema = createInsertSchema(treasureRequests).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertTreasureRequest = z.infer<typeof insertTreasureRequestSchema>;
export type TreasureRequest = typeof treasureRequests.$inferSelect;
