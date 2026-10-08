import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import alumniRoutes from "./routes/alumniRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import databaseRoutes from "./routes/databaseRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(
  cors({
    origin: config.clientOrigin || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(requestLogger);

// Serve uploaded media files statically
const uploadsDir = path.resolve(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

// Health check root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "VSITR Alumni Portal API",
    status: "online",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        verify: "POST /api/auth/verify",
      },
      jobs: "/api/jobs",
      events: "/api/events",
      alumni: "/api/alumni",
      users: "/api/users",
      database: "/api/database/status",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/users", userRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/upload", uploadRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
