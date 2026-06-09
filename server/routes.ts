import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertListingSchema, insertTreasureRequestSchema } from "@shared/schema";

// ─── File upload setup ───────────────────────────────────────────────────────
const uploadsDir = process.env.VERCEL
  ? "/tmp/uploads"
  : path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Images only"));
  },
});

export function registerRoutes(httpServer: Server, app: Express) {
  // Serve uploaded images
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else next();
  });

  // ── Listings ──────────────────────────────────────────────────────────────
  app.get("/api/listings", async (req, res) => {
    try {
      const { category, status, search } = req.query as Record<string, string>;
      const results = await storage.getAllListings({ category, status, search });
      res.json(results);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/listings/by-number/:itemNumber", async (req, res) => {
    try {
      const listing = await storage.getListingByItemNumber(req.params.itemNumber.toUpperCase());
      if (!listing) return res.status(404).json({ error: "Not found" });
      res.json(listing);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      const listing = await storage.getListingById(id);
      if (!listing) return res.status(404).json({ error: "Not found" });
      res.json(listing);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/listings", upload.array("photos", 10), async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const photoUrls = files.map((f) => `/uploads/${f.filename}`);
      let existingPhotos: string[] = [];
      if (req.body.existingPhotos) {
        try { existingPhotos = JSON.parse(req.body.existingPhotos); } catch {}
      }
      const badges: string[] = [];
      if (req.body.isJenellsPick === "true") badges.push("jenellsPick");
      if (parseFloat(req.body.price) < 10) badges.push("under10");
      if (req.body.newThisWeek === "true") badges.push("newThisWeek");
      if (req.body.vintage === "true") badges.push("vintage");

      const data = insertListingSchema.parse({
        title: req.body.title,
        brand: req.body.brand,
        size: req.body.size,
        price: parseFloat(req.body.price),
        category: req.body.category,
        condition: req.body.condition,
        description: req.body.description,
        photos: JSON.stringify([...existingPhotos, ...photoUrls]),
        status: req.body.status ?? "available",
        badges: JSON.stringify(badges),
        isJenellsPick: req.body.isJenellsPick === "true",
      });
      const listing = await storage.createListing(data);
      res.json(listing);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.patch("/api/listings/:id", upload.array("photos", 10), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      const files = (req.files as Express.Multer.File[]) ?? [];
      const newPhotoUrls = files.map((f) => `/uploads/${f.filename}`);
      let existingPhotos: string[] = [];
      if (req.body.existingPhotos) {
        try { existingPhotos = JSON.parse(req.body.existingPhotos); } catch {}
      }
      const allPhotos = [...existingPhotos, ...newPhotoUrls];
      const badges: string[] = [];
      if (req.body.isJenellsPick === "true") badges.push("jenellsPick");
      const price = req.body.price ? parseFloat(req.body.price) : undefined;
      if (price !== undefined && price < 10) badges.push("under10");
      if (req.body.newThisWeek === "true") badges.push("newThisWeek");
      if (req.body.vintage === "true") badges.push("vintage");

      const update: any = {};
      if (req.body.title) update.title = req.body.title;
      if (req.body.brand) update.brand = req.body.brand;
      if (req.body.size) update.size = req.body.size;
      if (price !== undefined) update.price = price;
      if (req.body.category) update.category = req.body.category;
      if (req.body.condition) update.condition = req.body.condition;
      if (req.body.description) update.description = req.body.description;
      if (req.body.status) update.status = req.body.status;
      if (req.body.isJenellsPick !== undefined) update.isJenellsPick = req.body.isJenellsPick === "true";
      update.photos = JSON.stringify(allPhotos);
      update.badges = JSON.stringify(badges);

      const listing = await storage.updateListing(id, update);
      if (!listing) return res.status(404).json({ error: "Not found" });
      res.json(listing);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.post("/api/listings/:id/sold", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const listing = await storage.markSold(id);
      if (!listing) return res.status(404).json({ error: "Not found" });
      res.json(listing);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteListing(id);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Treasure Hunt Requests ────────────────────────────────────────────────
  app.get("/api/requests", async (_req, res) => {
    try {
      res.json(await storage.getAllRequests());
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const data = insertTreasureRequestSchema.parse(req.body);
      const request = await storage.createRequest(data);
      res.json(request);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.patch("/api/requests/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const request = await storage.updateRequestStatus(id, status);
      if (!request) return res.status(404).json({ error: "Not found" });
      res.json(request);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
}
