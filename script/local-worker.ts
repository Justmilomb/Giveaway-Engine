import "dotenv/config";
import fs from "fs";
import path from "path";
import WebSocket from "ws";
import { InstagramScraper } from "../server/scraper/instagram-scraper";
import { countMentions, extractPostId } from "../server/instagram";

const RELAY_SECRET = process.env.SCRAPER_RELAY_SECRET || "";
const RESULT_SECRET = process.env.SCRAPER_RESULT_SECRET || RELAY_SECRET;
const SERVER_URL = process.env.SCRAPER_SERVER_URL || "wss://pickusawinner.com";
const RECONNECT_DELAY_MS = 5000;
const PREPARE_LEAD_MS = 3 * 60 * 1000;
const CHECK_INTERVAL_MS = 5000;
const JOBS_FILE = path.resolve(process.env.SCRAPER_JOBS_FILE || "worker-jobs.json");

type WorkerJobStatus = "queued" | "prepared" | "completed" | "failed";

interface WorkerScheduleJob {
  giveawayId: string;
  scheduledFor: string;
  config: any;
  action?: "upsert" | "cancel";
}

interface WorkerStoredJob {
  giveawayId: string;
  scheduledFor: string;
  config: any;
  status: WorkerJobStatus;
  queuedAt: string;
  warmupAt?: string;
  warmupCount?: number;
  preparedAt?: string;
  preparedWinners?: any[];
  preparedEntryCount?: number;
  lastError?: string;
}

if (!RELAY_SECRET) {
  console.error("SCRAPER_RELAY_SECRET is not set in .env");
  process.exit(1);
}

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isShuttingDown = false;
let processingLoop = false;
const scheduledJobs = new Map<string, WorkerStoredJob>();

function loadJobs() {
  if (!fs.existsSync(JOBS_FILE)) return;
  try {
    const raw = fs.readFileSync(JOBS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      for (const j of data) {
        if (j?.giveawayId && j?.scheduledFor && j?.config) {
          scheduledJobs.set(j.giveawayId, j);
        }
      }
      console.log(`Loaded ${scheduledJobs.size} scheduled jobs from ${JOBS_FILE}`);
    }
  } catch (e) {
    console.error(`Failed to load jobs file ${JOBS_FILE}:`, e);
  }
}

function saveJobs() {
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(Array.from(scheduledJobs.values()), null, 2));
  } catch (e) {
    console.error(`Failed to save jobs file ${JOBS_FILE}:`, e);
  }
}

function connect() {
  const wsUrl = `${SERVER_URL}/ws/scraper?secret=${encodeURIComponent(RELAY_SECRET)}`;
  console.log(`Connecting to ${SERVER_URL}/ws/scraper ...`);
  ws = new WebSocket(wsUrl);

  ws.on("open", () => {
    console.log("Connected to server worker relay.");
  });

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === "connected" || message.type === "heartbeat_ack") return;

      if (message.type === "scrape_request") {
        await handleLiveScrape(message);
        return;
      }

      if (message.type === "schedule_job") {
        await handleScheduleMessage(message);
      }
    } catch (e) {
      console.error("Failed to handle WS message:", e);
    }
  });

  ws.on("close", (code, reason) => {
    console.log(`Disconnected from server (code: ${code}, reason: ${reason})`);
    ws = null;
    scheduleReconnect();
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error: ${err.message}`);
  });
}

function scheduleReconnect() {
  if (isShuttingDown || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY_MS);
}

function sendWs(message: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(message));
}

function sendScheduleAck(requestId: string, error?: string) {
  sendWs({
    type: "schedule_ack",
    requestId,
    error: error || null,
  });
}

async function handleScheduleMessage(message: { requestId: string; job: WorkerScheduleJob }) {
  try {
    const { requestId, job } = message;
    if (!job || !job.giveawayId) {
      sendScheduleAck(requestId, "Invalid job payload");
      return;
    }

    if (job.action === "cancel") {
      scheduledJobs.delete(job.giveawayId);
      saveJobs();
      sendScheduleAck(requestId);
      return;
    }

    const stored: WorkerStoredJob = {
      giveawayId: job.giveawayId,
      scheduledFor: job.scheduledFor,
      config: job.config,
      status: "queued",
      queuedAt: new Date().toISOString(),
    };
    scheduledJobs.set(job.giveawayId, stored);
    saveJobs();
    sendScheduleAck(requestId);

    // Immediate warmup scrape right after queueing for early readiness.
    void runWarmup(stored);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    sendScheduleAck(message.requestId, err);
  }
}

async function handleLiveScrape(message: { requestId: string; postUrl: string }) {
  const { requestId, postUrl } = message;
  try {
    const result = await scrapeComments(postUrl);
    sendWs({
      type: "scrape_result",
      requestId,
      result,
      error: null,
    });
  } catch (e) {
    sendWs({
      type: "scrape_result",
      requestId,
      result: null,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

async function scrapeComments(postUrlOrCode: string): Promise<{ comments: any[]; total: number }> {
  const postCode = postUrlOrCode.startsWith("http") ? extractPostId(postUrlOrCode) : postUrlOrCode;
  const postUrl = postCode ? `https://www.instagram.com/p/${postCode}/` : postUrlOrCode;
  const scraper = new InstagramScraper();
  try {
    return await scraper.fetchComments(postUrl);
  } finally {
    await scraper.close();
  }
}

function computeWinners(config: any, pool: any[]): { winners: any[]; validCandidates: any[] } {
  const seenUsers = new Set<string>();
  const validCandidates: any[] = [];
  const blockedUsernames = new Set(
    (config.blockList || "")
      .split("\n")
      .map((line: string) => line.trim().toLowerCase().replace(/^@/, ""))
      .filter((username: string) => username.length > 0),
  );

  for (const entry of pool) {
    if (blockedUsernames.has(entry.username.toLowerCase())) continue;

    if (config.keyword) {
      if (!entry.text || !entry.text.toLowerCase().includes(config.keyword.toLowerCase())) continue;
    }

    if (config.requireMention && config.minMentions > 0) {
      const mentionCount = countMentions(entry.text);
      if (mentionCount < config.minMentions) continue;
    }

    if (config.duplicateCheck) {
      if (seenUsers.has(entry.username)) continue;
      seenUsers.add(entry.username);
    }

    validCandidates.push(entry);
  }

  const winnerCount = Math.min(config.winnerCount || 1, validCandidates.length);
  let winners: any[] = [];

  if (config.bonusChances) {
    const weightedPool: any[] = [];
    for (const entry of validCandidates) {
      const mentionCount = countMentions(entry.text);
      const minMentions = config.requireMention ? (config.minMentions || 0) : 0;
      const entries = 1 + Math.max(0, mentionCount - minMentions);
      for (let i = 0; i < entries; i++) weightedPool.push(entry);
    }

    const shuffled = [...weightedPool].sort(() => 0.5 - Math.random());
    const seen = new Set<string>();
    for (const entry of shuffled) {
      if (!seen.has(entry.username) && winners.length < winnerCount) {
        seen.add(entry.username);
        winners.push(entry);
      }
    }
  } else {
    const shuffled = [...validCandidates].sort(() => 0.5 - Math.random());
    winners = shuffled.slice(0, winnerCount);
  }

  return { winners, validCandidates };
}

async function runWarmup(job: WorkerStoredJob) {
  if (job.warmupAt) return;
  try {
    const res = await scrapeComments(job.config.url);
    const current = scheduledJobs.get(job.giveawayId);
    if (!current) return;
    current.warmupAt = new Date().toISOString();
    current.warmupCount = res.comments.length;
    scheduledJobs.set(job.giveawayId, current);
    saveJobs();
  } catch (e) {
    const current = scheduledJobs.get(job.giveawayId);
    if (!current) return;
    current.lastError = e instanceof Error ? e.message : String(e);
    scheduledJobs.set(job.giveawayId, current);
    saveJobs();
  }
}

function toApiBase(wsBase: string): string {
  if (wsBase.startsWith("wss://")) return wsBase.replace("wss://", "https://");
  if (wsBase.startsWith("ws://")) return wsBase.replace("ws://", "http://");
  return wsBase;
}

async function postScheduledResult(payload: any): Promise<void> {
  const apiBase = toApiBase(SERVER_URL).replace(/\/+$/, "");
  const response = await fetch(`${apiBase}/api/internal/scheduled-result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-scraper-secret": RESULT_SECRET,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Result callback failed (${response.status}): ${body}`);
  }
}

async function processScheduledJobs() {
  if (processingLoop) return;
  processingLoop = true;
  try {
    const now = Date.now();
    const jobs = Array.from(scheduledJobs.values());

    for (const job of jobs) {
      const scheduledAt = new Date(job.scheduledFor).getTime();
      const prepareAt = scheduledAt - PREPARE_LEAD_MS;

      if (job.status === "queued" && now >= prepareAt) {
        try {
          const res = await scrapeComments(job.config.url);
          const computed = computeWinners(job.config, res.comments || []);
          const current = scheduledJobs.get(job.giveawayId);
          if (!current) continue;
          current.status = "prepared";
          current.preparedAt = new Date().toISOString();
          current.preparedWinners = computed.winners;
          current.preparedEntryCount = computed.validCandidates.length;
          scheduledJobs.set(job.giveawayId, current);
          saveJobs();
        } catch (e) {
          const current = scheduledJobs.get(job.giveawayId);
          if (!current) continue;
          current.lastError = e instanceof Error ? e.message : String(e);
          scheduledJobs.set(job.giveawayId, current);
          saveJobs();
        }
      }

      const latest = scheduledJobs.get(job.giveawayId);
      if (!latest) continue;

      if ((latest.status === "queued" || latest.status === "prepared") && now >= scheduledAt) {
        try {
          let winners = latest.preparedWinners;
          let totalEntries = latest.preparedEntryCount;
          if (!winners) {
            const res = await scrapeComments(latest.config.url);
            const computed = computeWinners(latest.config, res.comments || []);
            winners = computed.winners;
            totalEntries = computed.validCandidates.length;
          }

          await postScheduledResult({
            giveawayId: latest.giveawayId,
            status: "completed",
            winners: winners || [],
            totalEntries: Number(totalEntries || 0),
          });

          latest.status = "completed";
          scheduledJobs.set(latest.giveawayId, latest);
          saveJobs();
          scheduledJobs.delete(latest.giveawayId);
          saveJobs();
        } catch (e) {
          latest.lastError = e instanceof Error ? e.message : String(e);
          scheduledJobs.set(latest.giveawayId, latest);
          saveJobs();
        }
      }
    }
  } finally {
    processingLoop = false;
  }
}

setInterval(() => {
  void processScheduledJobs();
}, CHECK_INTERVAL_MS);

setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "heartbeat" }));
  }
}, 30000);

process.on("SIGINT", () => {
  isShuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close(1000, "Worker shutting down");
  process.exit(0);
});

console.log("═══════════════════════════════════════════════");
console.log("  Instagram Scraper Worker");
console.log("═══════════════════════════════════════════════");
console.log(`  Server: ${SERVER_URL}`);
console.log(`  Jobs File: ${JOBS_FILE}`);
console.log("═══════════════════════════════════════════════");

loadJobs();
connect();
