import type { Express } from "express";
import {
  getAllArticles,
  getArticleBySlug,
  getArticlesByCategory,
  getRelatedArticles,
} from "../markdown";
import { log } from "../log";

export function registerArticleRoutes(app: Express) {
  /**
   * GET /api/articles
   * List all articles with metadata (paginated)
   */
  app.get("/api/articles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string | undefined;

      let articles = category
        ? await getArticlesByCategory(category)
        : await getAllArticles();

      // Paginate
      const total = articles.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedArticles = articles.slice(start, end);

      return res.json({
        articles: paginatedArticles,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      log(`[ARTICLES] Error listing articles: ${error}`);
      return res.status(500).json({ error: "Failed to load articles" });
    }
  });

  /**
   * GET /api/articles/:slug
   * Get single article with HTML content and metadata
   */
  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const article = await getArticleBySlug(slug);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Get related articles
      const related = await getRelatedArticles(slug, 5);

      return res.json({
        article,
        related,
      });
    } catch (error) {
      log(`[ARTICLES] Error loading article ${req.params.slug}: ${error}`);
      return res.status(500).json({ error: "Failed to load article" });
    }
  });

  /**
   * GET /api/articles/category/:category
   * Get articles filtered by category
   */
  app.get("/api/articles/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const articles = await getArticlesByCategory(category);

      return res.json({
        category,
        articles,
        count: articles.length,
      });
    } catch (error) {
      log(
        `[ARTICLES] Error loading category ${req.params.category}: ${error}`
      );
      return res.status(500).json({ error: "Failed to load category" });
    }
  });

  log("[ARTICLES] Article routes registered");
}
