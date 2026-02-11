import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "scraper-debug.log");

export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    const line = `${formattedTime} [${source}] ${message}`;
    console.log(line);

    // Append to log file for external readers
    try {
        fs.appendFileSync(LOG_FILE, line + "\n");
    } catch {
        // ignore write errors
    }
}
