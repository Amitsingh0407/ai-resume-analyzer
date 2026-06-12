import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment configurations
dotenv.config();

import authRoutes from "./server/routes/authRoutes.js";
import resumeRoutes from "./server/routes/resumeRoutes.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global parse middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API endpoint routing declarations
  app.use("/api/auth", authRoutes);
  app.use("/api/resume", resumeRoutes);

  // Status check ping
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date() });
  });

  // Client SPA bundle server/Vite proxy
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development backend server with Vite middleware integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production backend server serving compiled dist/ static bundles...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // In Express v4, use get("*", ...) to route all remaining requests to standard client index
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running inside workspace environment at http://localhost:${PORT}`);
  });
}

startServer();
