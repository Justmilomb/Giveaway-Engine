/**
 * Update lastmod timestamps in sitemap to signal fresh content to Google
 * Run this script after making content changes to force Google to re-crawl
 */

import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const LASTMOD_FILE = resolve(
  process.cwd(),
  "server",
  "lastmod-timestamps.json"
);

// Pages that were recently updated
const UPDATED_PAGES = [
  "/tool",
  "/giveaway-generator",
  "/spin-the-wheel",
  "/random-name-picker",
  "/how-it-works",
  "/instagram-giveaway-guide",
  "/faq",
  "/sitemap",
  "/article/best-instagram-comment-picker-tools-2026",
  "/article/how-to-pick-instagram-winner",
  "/article/what-is-random-name-picker",
];

function updateTimestamps() {
  const now = new Date().toISOString();
  const timestamps: Record<string, string> = {};

  // Load existing timestamps if they exist
  try {
    const existing = JSON.parse(readFileSync(LASTMOD_FILE, "utf-8"));
    Object.assign(timestamps, existing);
  } catch {
    // File doesn't exist yet, that's ok
  }

  // Update timestamps for specified pages
  UPDATED_PAGES.forEach((page) => {
    timestamps[page] = now;
  });

  // Save updated timestamps
  writeFileSync(LASTMOD_FILE, JSON.stringify(timestamps, null, 2));

  console.log("✅ Updated lastmod timestamps for", UPDATED_PAGES.length, "pages");
  console.log("Timestamp:", now);
  console.log(
    "\nNext steps:\n" +
      "1. Deploy the updated sitemap\n" +
      "2. Run: npm run index-now\n" +
      "3. Submit to Google Search Console\n"
  );
}

updateTimestamps();
