import { listings, treasureRequests } from "@shared/schema";
import type { InsertListing, Listing, InsertTreasureRequest, TreasureRequest } from "@shared/schema";

// ─── Database setup — Postgres (Neon/Supabase) in production, SQLite locally ──
let db: any;

if (process.env.DATABASE_URL) {
  // Production: use Neon serverless Postgres
  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql);

  // Auto-migrate tables
  sql(`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
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
      created_at TEXT NOT NULL DEFAULT NOW()::text
    );
    CREATE TABLE IF NOT EXISTS treasure_requests (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      size TEXT NOT NULL,
      brand TEXT,
      item_type TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT NOW()::text
    );
  `).catch(console.error);
} else {
  // Local development: use SQLite
  const Database = require("better-sqlite3");
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  const { eq, like, or, desc, and } = require("drizzle-orm");

  const DB_PATH = process.env.DB_PATH ?? "data.db";
  const sqlite = new Database(DB_PATH);
  db = drizzle(sqlite);

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
}

export { db };

// ─── Item number generator ───────────────────────────────────────────────────
async function generateItemNumber(): Promise<string> {
  if (process.env.DATABASE_URL) {
    const { neon } = require("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT item_number FROM listings`;
    let max = 0;
    for (const r of rows) {
      const num = parseInt(r.item_number.replace("RF-", ""), 10);
      if (!isNaN(num) && num > max) max = num;
    }
    return `RF-${String(max + 1).padStart(3, "0")}`;
  } else {
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const rows = db.select({ n: listings.itemNumber }).from(listings).all();
    let max = 0;
    for (const r of rows) {
      const num = parseInt(r.n.replace("RF-", ""), 10);
      if (!isNaN(num) && num > max) max = num;
    }
    return `RF-${String(max + 1).padStart(3, "0")}`;
  }
}

// ─── Storage interface ───────────────────────────────────────────────────────
export interface IStorage {
  getAllListings(opts?: { category?: string; status?: string; search?: string }): Promise<Listing[]>;
  getListingById(id: number): Promise<Listing | undefined>;
  getListingByItemNumber(itemNumber: string): Promise<Listing | undefined>;
  createListing(data: InsertListing): Promise<Listing>;
  updateListing(id: number, data: Partial<InsertListing>): Promise<Listing | undefined>;
  markSold(id: number): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<void>;
  getAllRequests(): Promise<TreasureRequest[]>;
  createRequest(data: InsertTreasureRequest): Promise<TreasureRequest>;
  updateRequestStatus(id: number, status: string): Promise<TreasureRequest | undefined>;
}

// ─── Postgres storage (Neon) ─────────────────────────────────────────────────
class PgStorage implements IStorage {
  private sql: any;
  constructor() {
    const { neon } = require("@neondatabase/serverless");
    this.sql = neon(process.env.DATABASE_URL!);
  }

  private mapListing(r: any): Listing {
    return {
      id: r.id,
      itemNumber: r.item_number,
      title: r.title,
      brand: r.brand,
      size: r.size,
      price: parseFloat(r.price),
      category: r.category,
      condition: r.condition,
      description: r.description,
      photos: r.photos ?? "[]",
      status: r.status,
      badges: r.badges ?? "[]",
      isJenellsPick: r.is_jenells_pick === true || r.is_jenells_pick === 1,
      createdAt: r.created_at,
    };
  }

  private mapRequest(r: any): TreasureRequest {
    return {
      id: r.id,
      name: r.name,
      contact: r.contact,
      size: r.size,
      brand: r.brand ?? null,
      itemType: r.item_type,
      notes: r.notes ?? null,
      status: r.status,
      createdAt: r.created_at,
    };
  }

  async getAllListings({ category, status, search } = {} as any) {
    let rows: any[];
    if (category && status && search) {
      rows = await this.sql`SELECT * FROM listings WHERE category=${category} AND status=${status} AND (title ILIKE ${`%${search}%`} OR brand ILIKE ${`%${search}%`} OR item_number ILIKE ${`%${search}%`}) ORDER BY id DESC`;
    } else if (category && status) {
      rows = await this.sql`SELECT * FROM listings WHERE category=${category} AND status=${status} ORDER BY id DESC`;
    } else if (category) {
      rows = await this.sql`SELECT * FROM listings WHERE category=${category} ORDER BY id DESC`;
    } else if (status) {
      rows = await this.sql`SELECT * FROM listings WHERE status=${status} ORDER BY id DESC`;
    } else if (search) {
      rows = await this.sql`SELECT * FROM listings WHERE title ILIKE ${`%${search}%`} OR brand ILIKE ${`%${search}%`} OR item_number ILIKE ${`%${search}%`} ORDER BY id DESC`;
    } else {
      rows = await this.sql`SELECT * FROM listings ORDER BY id DESC`;
    }
    return rows.map(this.mapListing);
  }

  async getListingById(id: number) {
    const rows = await this.sql`SELECT * FROM listings WHERE id=${id}`;
    return rows[0] ? this.mapListing(rows[0]) : undefined;
  }

  async getListingByItemNumber(itemNumber: string) {
    const rows = await this.sql`SELECT * FROM listings WHERE item_number=${itemNumber}`;
    return rows[0] ? this.mapListing(rows[0]) : undefined;
  }

  async createListing(data: InsertListing) {
    const itemNumber = await generateItemNumber();
    const photos = typeof data.photos === "string" ? data.photos : JSON.stringify(data.photos ?? []);
    const badges = typeof data.badges === "string" ? data.badges : JSON.stringify(data.badges ?? []);
    const rows = await this.sql`
      INSERT INTO listings (item_number, title, brand, size, price, category, condition, description, photos, status, badges, is_jenells_pick)
      VALUES (${itemNumber}, ${data.title}, ${data.brand}, ${data.size}, ${data.price}, ${data.category}, ${data.condition}, ${data.description}, ${photos}, ${data.status ?? "available"}, ${badges}, ${data.isJenellsPick ? 1 : 0})
      RETURNING *`;
    return this.mapListing(rows[0]);
  }

  async updateListing(id: number, data: any) {
    const photos = data.photos !== undefined ? (typeof data.photos === "string" ? data.photos : JSON.stringify(data.photos)) : undefined;
    const badges = data.badges !== undefined ? (typeof data.badges === "string" ? data.badges : JSON.stringify(data.badges)) : undefined;
    const rows = await this.sql`
      UPDATE listings SET
        title = COALESCE(${data.title ?? null}, title),
        brand = COALESCE(${data.brand ?? null}, brand),
        size = COALESCE(${data.size ?? null}, size),
        price = COALESCE(${data.price ?? null}, price),
        category = COALESCE(${data.category ?? null}, category),
        condition = COALESCE(${data.condition ?? null}, condition),
        description = COALESCE(${data.description ?? null}, description),
        photos = COALESCE(${photos ?? null}, photos),
        status = COALESCE(${data.status ?? null}, status),
        badges = COALESCE(${badges ?? null}, badges),
        is_jenells_pick = COALESCE(${data.isJenellsPick !== undefined ? (data.isJenellsPick ? 1 : 0) : null}, is_jenells_pick)
      WHERE id = ${id}
      RETURNING *`;
    return rows[0] ? this.mapListing(rows[0]) : undefined;
  }

  async markSold(id: number) {
    const rows = await this.sql`UPDATE listings SET status='sold' WHERE id=${id} RETURNING *`;
    return rows[0] ? this.mapListing(rows[0]) : undefined;
  }

  async deleteListing(id: number) {
    await this.sql`DELETE FROM listings WHERE id=${id}`;
  }

  async getAllRequests() {
    const rows = await this.sql`SELECT * FROM treasure_requests ORDER BY id DESC`;
    return rows.map(this.mapRequest);
  }

  async createRequest(data: InsertTreasureRequest) {
    const rows = await this.sql`
      INSERT INTO treasure_requests (name, contact, size, brand, item_type, notes)
      VALUES (${data.name}, ${data.contact}, ${data.size}, ${data.brand ?? null}, ${data.itemType}, ${data.notes ?? null})
      RETURNING *`;
    return this.mapRequest(rows[0]);
  }

  async updateRequestStatus(id: number, status: string) {
    const rows = await this.sql`UPDATE treasure_requests SET status=${status} WHERE id=${id} RETURNING *`;
    return rows[0] ? this.mapRequest(rows[0]) : undefined;
  }
}

// ─── SQLite storage (local dev) ──────────────────────────────────────────────
class SqliteStorage implements IStorage {
  private db: any;

  constructor() {
    const Database = require("better-sqlite3");
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const DB_PATH = process.env.DB_PATH ?? "data.db";
    const sqlite = new Database(DB_PATH);
    this.db = drizzle(sqlite);

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

    this._sqlite = sqlite;
  }

  private _sqlite: any;

  private genItemNumber(): string {
    const rows: any[] = this._sqlite.prepare("SELECT item_number FROM listings").all();
    let max = 0;
    for (const r of rows) {
      const num = parseInt(r.item_number.replace("RF-", ""), 10);
      if (!isNaN(num) && num > max) max = num;
    }
    return `RF-${String(max + 1).padStart(3, "0")}`;
  }

  async getAllListings({ category, status, search } = {} as any): Promise<Listing[]> {
    let q = "SELECT * FROM listings WHERE 1=1";
    const params: any[] = [];
    if (category) { q += " AND category=?"; params.push(category); }
    if (status) { q += " AND status=?"; params.push(status); }
    if (search) { q += " AND (title LIKE ? OR brand LIKE ? OR item_number LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += " ORDER BY id DESC";
    const rows: any[] = this._sqlite.prepare(q).all(...params);
    return rows.map(r => ({ ...r, itemNumber: r.item_number, isJenellsPick: !!r.is_jenells_pick, createdAt: r.created_at }));
  }

  async getListingById(id: number): Promise<Listing | undefined> {
    const r = this._sqlite.prepare("SELECT * FROM listings WHERE id=?").get(id);
    if (!r) return undefined;
    return { ...r, itemNumber: r.item_number, isJenellsPick: !!r.is_jenells_pick, createdAt: r.created_at };
  }

  async getListingByItemNumber(itemNumber: string): Promise<Listing | undefined> {
    const r = this._sqlite.prepare("SELECT * FROM listings WHERE item_number=?").get(itemNumber);
    if (!r) return undefined;
    return { ...r, itemNumber: r.item_number, isJenellsPick: !!r.is_jenells_pick, createdAt: r.created_at };
  }

  async createListing(data: InsertListing): Promise<Listing> {
    const itemNumber = this.genItemNumber();
    const photos = typeof data.photos === "string" ? data.photos : JSON.stringify(data.photos ?? []);
    const badges = typeof data.badges === "string" ? data.badges : JSON.stringify(data.badges ?? []);
    const result = this._sqlite.prepare(`
      INSERT INTO listings (item_number, title, brand, size, price, category, condition, description, photos, status, badges, is_jenells_pick)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(itemNumber, data.title, data.brand, data.size, data.price, data.category, data.condition, data.description, photos, data.status ?? "available", badges, data.isJenellsPick ? 1 : 0);
    return this.getListingById(result.lastInsertRowid as number) as any;
  }

  async updateListing(id: number, data: any): Promise<Listing | undefined> {
    const curr: any = this._sqlite.prepare("SELECT * FROM listings WHERE id=?").get(id);
    if (!curr) return undefined;
    const photos = data.photos !== undefined ? (typeof data.photos === "string" ? data.photos : JSON.stringify(data.photos)) : curr.photos;
    const badges = data.badges !== undefined ? (typeof data.badges === "string" ? data.badges : JSON.stringify(data.badges)) : curr.badges;
    this._sqlite.prepare(`
      UPDATE listings SET title=?, brand=?, size=?, price=?, category=?, condition=?, description=?, photos=?, status=?, badges=?, is_jenells_pick=? WHERE id=?
    `).run(data.title ?? curr.title, data.brand ?? curr.brand, data.size ?? curr.size, data.price ?? curr.price, data.category ?? curr.category, data.condition ?? curr.condition, data.description ?? curr.description, photos, data.status ?? curr.status, badges, data.isJenellsPick !== undefined ? (data.isJenellsPick ? 1 : 0) : curr.is_jenells_pick, id);
    return this.getListingById(id);
  }

  async markSold(id: number): Promise<Listing | undefined> {
    this._sqlite.prepare("UPDATE listings SET status='sold' WHERE id=?").run(id);
    return this.getListingById(id);
  }

  async deleteListing(id: number): Promise<void> {
    this._sqlite.prepare("DELETE FROM listings WHERE id=?").run(id);
  }

  async getAllRequests(): Promise<TreasureRequest[]> {
    const rows: any[] = this._sqlite.prepare("SELECT * FROM treasure_requests ORDER BY id DESC").all();
    return rows.map(r => ({ ...r, itemType: r.item_type, createdAt: r.created_at }));
  }

  async createRequest(data: InsertTreasureRequest): Promise<TreasureRequest> {
    const result = this._sqlite.prepare(`
      INSERT INTO treasure_requests (name, contact, size, brand, item_type, notes) VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.name, data.contact, data.size, data.brand ?? null, data.itemType, data.notes ?? null);
    const r: any = this._sqlite.prepare("SELECT * FROM treasure_requests WHERE id=?").get(result.lastInsertRowid);
    return { ...r, itemType: r.item_type, createdAt: r.created_at };
  }

  async updateRequestStatus(id: number, status: string): Promise<TreasureRequest | undefined> {
    this._sqlite.prepare("UPDATE treasure_requests SET status=? WHERE id=?").run(status, id);
    const r: any = this._sqlite.prepare("SELECT * FROM treasure_requests WHERE id=?").get(id);
    if (!r) return undefined;
    return { ...r, itemType: r.item_type, createdAt: r.created_at };
  }
}

export const storage: IStorage = process.env.DATABASE_URL
  ? new PgStorage()
  : new SqliteStorage();
