import type { Express } from "express";
import type { Server } from "http";
import Stripe from "stripe";
import { setupAuth } from "./auth";
import { log } from "./log";
import { fetchInstagramComments, extractPostId } from "./instagram";
import {
  globalRateLimiter,
  instagramRateLimiter,
  giveawayRateLimiter,
  emailRateLimiter,
  validateRequest,
  validateInstagramRequest,
  validateGiveawayRequest,
  adminAuthMiddleware,
  generatePurchaseToken,
  redeemPurchaseToken,
  consumeCredit,
  getSecurityStats,
  getClientIP,
} from "./security";
import { registerPaymentRoutes } from "./routes/payment";
import { registerInstagramRoutes } from "./routes/instagram";
import { registerGiveawayRoutes } from "./routes/giveaways";
import { registerAdminRoutes } from "./routes/admin";
import { registerAdRoutes } from "./routes/ads";
import { registerPublicRoutes } from "./routes/public";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Track payment intent IDs to prevent double-redemption.
const redeemedPaymentIntents = new Set<string>();

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  app.use("/api", globalRateLimiter);
  app.use("/api", validateRequest);

  app.use("/api/instagram", (req, _res, next) => {
    if (req.method === "POST") {
      log(`API Request Body: ${JSON.stringify(req.body)}`, "debug");
    }
    next();
  });

  registerPaymentRoutes(app, {
    stripe,
    redeemedPaymentIntents,
    generatePurchaseToken,
    getClientIP,
  });

  registerInstagramRoutes(app, {
    validateInstagramRequest,
    instagramRateLimiter,
    fetchInstagramComments,
    extractPostId,
    redeemPurchaseToken,
    consumeCredit,
    getClientIP,
  });

  registerGiveawayRoutes(app, {
    giveawayRateLimiter,
    validateGiveawayRequest,
    redeemPurchaseToken,
    getClientIP,
  });

  registerAdminRoutes(app, {
    adminAuthMiddleware,
    generatePurchaseToken,
    getSecurityStats,
  });

  registerAdRoutes(app, {
    adminAuthMiddleware,
  });

  registerPublicRoutes(app, {
    emailRateLimiter,
  });

  return httpServer;
}
