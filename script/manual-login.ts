/**
 * Manual Instagram Login Script
 * 
 * This script launches a visible browser window where you can log in to Instagram manually.
 * Once you're logged in, press Enter in the terminal to save the session cookies.
 * The scraper will then use these saved cookies for future requests.
 */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

puppeteer.use(StealthPlugin());

const SESSION_FILE = path.join(process.cwd(), ".instagram-session.json");

async function waitForEnter(message: string): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(message, () => {
            rl.close();
            resolve();
        });
    });
}

async function manualLogin() {
    console.log("🚀 Launching browser for manual Instagram login...\n");
    
    const browser = await puppeteer.launch({
        headless: false, // VISIBLE browser
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--window-size=1366,768",
        ],
        userDataDir: "./.puppeteer-login-profile", // Create a temporary profile for login
        defaultViewport: null,
    });

    const page = await browser.newPage();
    
    // Set user agent to Chrome 122 Windows (recent)
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    // Try to load existing session if present (to avoid fresh login if possible)
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const data = fs.readFileSync(SESSION_FILE, "utf-8");
            const session = JSON.parse(data);
            if (session.cookies && session.cookies.length > 0) {
                await page.setCookie(...session.cookies);
                console.log("Found existing cookies, trying to restore session...");
            }
        }
    } catch (e) {
        console.log("Error loading existing session, starting fresh.");
    }

    console.log("📱 Navigating to Instagram...\n");
    await page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
    });

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    MANUAL LOGIN REQUIRED");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");
    console.log("  1. Log in to Instagram in the browser window that just opened");
    console.log("  2. Complete any verification challenges if prompted");
    console.log("  3. Once you see your Instagram feed, come back here");
    console.log("  4. Press ENTER to save your session");
    console.log("");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");

    // Wait for login to complete (check every 2 seconds)
    console.log("Waiting for login to complete...");
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const currentUrl = page.url();
            // If we're on instagram.com and NOT on login/accounts/challenge pages
            if (currentUrl.includes("instagram.com") && 
                !currentUrl.includes("/accounts/login") && 
                !currentUrl.includes("/challenge") &&
                !currentUrl.includes("/accounts/onetap")) {
                
                // Double check for logged-in indicators
                const isLoggedIn = await page.evaluate(() => {
                    // Look for profile icon, home icon, or specific logged-in elements
                    return !!document.querySelector('a[href*="/direct/inbox/"]') || 
                           !!document.querySelector('a[href*="/explore/"]') ||
                           !!document.querySelector('svg[aria-label="Home"]');
                });

                if (isLoggedIn) {
                    console.log(`\n📍 Logged in! Current URL: ${currentUrl}`);
                    break;
                }
            }
        } catch (e) {
            // Ignore errors during check (page might be navigating)
        }
    }

    // Give it a moment to settle cookies
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get all cookies
    const cookies = await page.cookies();
    console.log(`\n🍪 Found ${cookies.length} cookies`);

    // Save session
    const session = {
        cookies,
        username: process.env.INSTAGRAM_USERNAME || "manual_login",
        savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
    console.log(`\n✅ Session saved to ${SESSION_FILE}`);
    
    console.log("\n🎉 Success! The scraper will now use your saved session.");
    console.log("   You can close this window and restart your server.\n");

    await browser.close();
    process.exit(0);
}

manualLogin().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
