import type { Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";

interface PublicRouteDeps {
  emailRateLimiter: any;
}

export function registerPublicRoutes(app: Express, deps: PublicRouteDeps): void {
  const { emailRateLimiter } = deps;

  const resolveExistingAsset = (candidates: string[]): string | null => {
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  };

  const distPublic = (...parts: string[]) => path.resolve(__dirname, "..", "public", ...parts);
  const sourcePublic = (...parts: string[]) =>
    path.resolve(process.cwd(), "client", "public", ...parts);

  const sendLogo = (req: any, res: any) => {
    const filePath = resolveExistingAsset([
      distPublic("filelogo.png"),
      sourcePublic("filelogo.png"),
      distPublic("favicon.png"),
      sourcePublic("favicon.png"),
      distPublic("pickusawinner-logo.png"),
      sourcePublic("pickusawinner-logo.png"),
    ]);

    if (!filePath) {
      return res.status(404).json({ error: "Logo asset not found" });
    }

    res.type("image/png");
    if (req.query.download === "1") {
      res.setHeader("Content-Disposition", 'attachment; filename="pickusawinner-logo.png"');
    }
    return res.sendFile(filePath);
  };

  const sendSocialImage = (req: any, res: any) => {
    const filePath = resolveExistingAsset([
      distPublic("filesocialimage.jpg"),
      sourcePublic("filesocialimage.jpg"),
      distPublic("social-image.jpg"),
      sourcePublic("social-image.jpg"),
      path.resolve(process.cwd(), "Screenshot_14-2-2026_104233_pickusawinner.com.jpeg"),
      distPublic("opengraph.jpg"),
      sourcePublic("opengraph.jpg"),
    ]);

    if (!filePath) {
      return res.status(404).json({ error: "Social image asset not found" });
    }

    res.type("image/jpeg");
    if (req.query.download === "1") {
      res.setHeader("Content-Disposition", 'attachment; filename="pickusawinner-social-image.jpg"');
    }
    return res.sendFile(filePath);
  };

  // Canonical and legacy logo URLs (old bundles still request /filelogo.png).
  app.get("/favicon.png", sendLogo);
  app.get("/media/logo.png", sendLogo);
  app.get("/filelogo.png", sendLogo);

  // Canonical and legacy social image URLs.
  app.get("/social-image.jpg", sendSocialImage);
  app.get("/media/social-image.jpg", sendSocialImage);
  app.get("/filesocialimage.jpg", sendSocialImage);

  app.get("/api/check-username", async (req, res) => {
    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Invalid username" });
    }
    const user = await storage.getUserByUsername(username);
    return res.json({ available: !user });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      security: "enabled",
    });
  });

  app.post("/api/contact", emailRateLimiter, async (_req, res) => {
    return res.status(503).json({
      error: "Contact form is temporarily unavailable. Please email support@pickusawinner.com directly.",
    });
  });

  app.get("/", (_req, res) => {
    res.redirect(301, "/giveaway-generator");
  });

  app.get("/instagram-comment-scraper", (_req, res) => {
    res.redirect(301, "/tool");
  });

  // /robots.txt and /sitemap.xml are centralized in server/routes.ts
  // to avoid duplicate, drifting SEO configurations.
}
