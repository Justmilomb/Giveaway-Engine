import type { Express } from "express";
import { storage } from "../storage";

interface PublicRouteDeps {
  emailRateLimiter: any;
}

export function registerPublicRoutes(app: Express, deps: PublicRouteDeps): void {
  const { emailRateLimiter } = deps;

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

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /schedule/
Disallow: /analytics

Sitemap: https://pickusawinner.com/sitemap.xml
`);
  });

  app.get("/sitemap.xml", (_req, res) => {
    const baseUrl = "https://pickusawinner.com";
    const currentDate = new Date().toISOString().split("T")[0];

    const urls = [
      { loc: "/giveaway-generator", changefreq: "weekly", priority: "1.0" },
      { loc: "/tool", changefreq: "weekly", priority: "0.9" },
      { loc: "/wheel", changefreq: "weekly", priority: "0.85" },
      { loc: "/picker", changefreq: "weekly", priority: "0.85" },
      { loc: "/youtube", changefreq: "weekly", priority: "0.8" },
      { loc: "/tiktok", changefreq: "weekly", priority: "0.8" },
      { loc: "/facebook-picker", changefreq: "weekly", priority: "0.8" },
      { loc: "/twitter-picker", changefreq: "weekly", priority: "0.8" },
      { loc: "/coming-soon", changefreq: "monthly", priority: "0.4" },
      { loc: "/press", changefreq: "monthly", priority: "0.5" },
      { loc: "/contact", changefreq: "monthly", priority: "0.5" },
      { loc: "/faq", changefreq: "monthly", priority: "0.6" },
      { loc: "/privacy", changefreq: "monthly", priority: "0.5" },
      { loc: "/terms", changefreq: "monthly", priority: "0.5" },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.type("application/xml");
    res.send(sitemap);
  });
}
