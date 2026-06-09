import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertListingSchema, insertTreasureRequestSchema } from "@shared/schema";

// ─── File upload setup ───────────────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
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
  app.get("/api/listings", (req, res) => {
    const { category, status, search } = req.query as Record<string, string>;
    const results = storage.getAllListings({ category, status, search });
    res.json(results);
  });

  app.get("/api/listings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const listing = storage.getListingById(id);
    if (!listing) return res.status(404).json({ error: "Not found" });
    res.json(listing);
  });

  app.get("/api/listings/by-number/:itemNumber", (req, res) => {
    const listing = storage.getListingByItemNumber(req.params.itemNumber.toUpperCase());
    if (!listing) return res.status(404).json({ error: "Not found" });
    res.json(listing);
  });

  app.post("/api/listings", upload.array("photos", 10), (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const photoUrls = files.map((f) => `/uploads/${f.filename}`);

      // Merge existing photos (passed as JSON string) with new uploads
      let existingPhotos: string[] = [];
      if (req.body.existingPhotos) {
        try { existingPhotos = JSON.parse(req.body.existingPhotos); } catch {}
      }

      const badges: string[] = [];
      if (req.body.isJenellsPick === "true" || req.body.isJenellsPick === true) badges.push("jenellsPick");
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

      const listing = storage.createListing(data);
      res.json(listing);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/listings/:id", upload.array("photos", 10), (req, res) => {
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

      const listing = storage.updateListing(id, update);
      if (!listing) return res.status(404).json({ error: "Not found" });
      res.json(listing);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/listings/:id/sold", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const listing = storage.markSold(id);
    if (!listing) return res.status(404).json({ error: "Not found" });
    res.json(listing);
  });

  app.delete("/api/listings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    storage.deleteListing(id);
    res.json({ ok: true });
  });

  // ── Treasure Hunt Requests ────────────────────────────────────────────────
  app.get("/api/requests", (_req, res) => {
    res.json(storage.getAllRequests());
  });

  app.post("/api/requests", (req, res) => {
    try {
      const data = insertTreasureRequestSchema.parse(req.body);
      const request = storage.createRequest(data);
      res.json(request);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/requests/:id/status", (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const request = storage.updateRequestStatus(id, status);
    if (!request) return res.status(404).json({ error: "Not found" });
    res.json(request);
  });
}
