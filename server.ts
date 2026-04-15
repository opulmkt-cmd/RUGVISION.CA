import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import apiRouter, { stripeWebhookHandler } from "./server/api.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Applet Config if exists
let firebaseAppletConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json");
}

async function startServer() {
  console.log(">>> SERVER STARTING ON PORT 3000...");
  const app = express();
  const PORT = 3000;

  // ✅ Trust proxy (important for Cloud Run)
  app.enable("trust proxy");

  // ✅ Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ============================================================
  // 🚨 STRIPE WEBHOOK (MUST BE FIRST, BEFORE ANY BODY PARSER)
  // ============================================================
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhookHandler
  );

  // ============================================================
  // ✅ NORMAL BODY PARSER (for all other routes)
  // ============================================================
  app.use(express.json({ limit: "50mb" }));

  // ============================================================
  // ✅ API ROUTES
  // ============================================================
  app.use("/api", apiRouter);

  // ============================================================
  // ✅ Firebase Config Endpoint
  // ============================================================
  app.get("/api/config/firebase", (req, res) => {
    const config = {
      apiKey: process.env.FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
      projectId: process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
      messagingSenderId:
        process.env.FIREBASE_MESSAGING_SENDER_ID ||
        firebaseAppletConfig.messagingSenderId,
      appId: process.env.FIREBASE_APP_ID || firebaseAppletConfig.appId,
      firestoreDatabaseId:
        process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
        firebaseAppletConfig.firestoreDatabaseId,
    };

    res.json(config);
  });

  // ============================================================
  // ❌ Prevent API falling into frontend (IMPORTANT)
  // ============================================================
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.url}`,
    });
  });

  // ============================================================
  // 🧪 DEV: VITE SERVER
  // ============================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // ============================================================
    // 🚀 PROD: STATIC FILES
    // ============================================================
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    // ⚠️ SPA fallback (ONLY for non-API routes)
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ============================================================
  // 🚀 START SERVER
  // ============================================================
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();