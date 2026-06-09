import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, like, or, desc, and } from "drizzle-orm";
import { listings, treasureRequests } from "@shared/schema";
import type { InsertListing, Listing, InsertTreasureRequest, TreasureRequest } from "@shared/schema";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite);

// ─── Auto-migrate ────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    brand TEXT NOT NULL,
    size TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    description TEXT NOT NULL,
    photos TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'available',
    badges TEXT NOT NULL DEFAULT '[]',
    is_jenells_pick INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS treasure_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    size TEXT NOT NULL,
    brand TEXT,
    item_type TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Item number generator ───────────────────────────────────────────────────
function generateItemNumber(): string {
  const rows = db.select({ n: listings.itemNumber }).from(listings).all();
  let max = 0;
  for (const r of rows) {
    const num = parseInt(r.n.replace("RF-", ""), 10);
    if (!isNaN(num) && num > max) max = num;
  }
  return `RF-${String(max + 1).padStart(3, "0")}`;
}

// ─── Storage interface ───────────────────────────────────────────────────────
export interface IStorage {
  // Listings
  getAllListings(opts?: { category?: string; status?: string; search?: string }): Listing[];
  getListingById(id: number): Listing | undefined;
  getListingByItemNumber(itemNumber: string): Listing | undefined;
  createListing(data: InsertListing): Listing;
  updateListing(id: number, data: Partial<InsertListing>): Listing | undefined;
  markSold(id: number): Listing | undefined;
  deleteListing(id: number): void;

  // Treasure Requests
  getAllRequests(): TreasureRequest[];
  createRequest(data: InsertTreasureRequest): TreasureRequest;
  updateRequestStatus(id: number, status: string): TreasureRequest | undefined;
}

export const storage: IStorage = {
  getAllListings({ category, status, search } = {}) {
    let q = db.select().from(listings).$dynamic();
    const conditions = [];
    if (category) conditions.push(eq(listings.category, category));
    if (status) conditions.push(eq(listings.status, status));
    if (search) {
      conditions.push(
        or(
          like(listings.title, `%${search}%`),
          like(listings.brand, `%${search}%`),
          like(listings.itemNumber, `%${search}%`)
        )!
      );
    }
    if (conditions.length > 0) q = q.where(and(...conditions) as any);
    return q.orderBy(desc(listings.id)).all();
  },

  getListingById(id) {
    return db.select().from(listings).where(eq(listings.id, id)).get();
  },

  getListingByItemNumber(itemNumber) {
    return db.select().from(listings).where(eq(listings.itemNumber, itemNumber)).get();
  },

  createListing(data) {
    const itemNumber = generateItemNumber();
    return db
      .insert(listings)
      .values({
        ...data,
        itemNumber,
        photos: typeof data.photos === "string" ? data.photos : JSON.stringify(data.photos ?? []),
        badges: typeof data.badges === "string" ? data.badges : JSON.stringify(data.badges ?? []),
      })
      .returning()
      .get();
  },

  updateListing(id, data) {
    const payload: any = { ...data };
    if (data.photos && typeof data.photos !== "string") {
      payload.photos = JSON.stringify(data.photos);
    }
    if (data.badges && typeof data.badges !== "string") {
      payload.badges = JSON.stringify(data.badges);
    }
    return db.update(listings).set(payload).where(eq(listings.id, id)).returning().get();
  },

  markSold(id) {
    return db.update(listings).set({ status: "sold" }).where(eq(listings.id, id)).returning().get();
  },

  deleteListing(id) {
    db.delete(listings).where(eq(listings.id, id)).run();
  },

  getAllRequests() {
    return db.select().from(treasureRequests).orderBy(desc(treasureRequests.id)).all();
  },

  createRequest(data) {
    return db.insert(treasureRequests).values(data).returning().get();
  },

  updateRequestStatus(id, status) {
    return db
      .update(treasureRequests)
      .set({ status })
      .where(eq(treasureRequests.id, id))
      .returning()
      .get();
  },
};
