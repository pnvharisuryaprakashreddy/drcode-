import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { loadEnv } from "./utils/validators";
import { startPeriodicCleanup } from "./utils/fileCleanup";
import { JobQueue } from "./utils/jobQueue";
import { createAnalyzeRouter } from "./routes/analyze";
import { createResumeRouter } from "./routes/resume";
import { createTelegramBot } from "./services/telegramBot";

dotenv.config();

export async function createServer() {
  const env = loadEnv();

  const uploadDir = path.resolve(env.UPLOAD_DIR);
  const generatedDir = path.resolve(env.GENERATED_DIR);

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(generatedDir, { recursive: true });

  startPeriodicCleanup(uploadDir, generatedDir, env.FILE_CLEANUP_HOURS * 60 * 60 * 1000);

  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL ?? "*",
    })
  );
  app.use(express.json({ limit: "2mb" }));

  // Simple in-memory rate limiting (v1, no redis).
  const rateWindowMs = env.RATE_LIMIT_WINDOW_MS;
  const rateMax = env.RATE_LIMIT_MAX_REQUESTS;
  const rateByIp = new Map<string, { count: number; resetAt: number }>();
  app.use((req, res, next) => {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.ip ??
      "unknown";
    const now = Date.now();
    const entry = rateByIp.get(ip);
    if (!entry || now > entry.resetAt) {
      rateByIp.set(ip, { count: 1, resetAt: now + rateWindowMs });
      return next();
    }
    if (entry.count >= rateMax) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }
    entry.count += 1;
    rateByIp.set(ip, entry);
    return next();
  });

  const jobQueue = new JobQueue(2);
  app.locals.jobQueue = jobQueue;

  let telegramBotUsername: string | null = null;
  try {
    if (env.TELEGRAM_BOT_TOKEN) {
      const bot = await createTelegramBot({
        token: env.TELEGRAM_BOT_TOKEN,
        uploadDir,
        env,
        jobQueue,
        generatedDir,
      });
      telegramBotUsername = bot?.username ?? null;
    }
  } catch {
    telegramBotUsername = null;
  }

  app.use(
    "/api",
    createAnalyzeRouter({
      env,
      uploadDir,
      generatedDir,
      jobQueue,
    })
  );

  app.use(
    "/api",
    createResumeRouter({
      env,
      generatedDir,
      jobQueue,
      telegramBotUsername,
    })
  );

  app.get("/", (_req, res) => {
    res.status(200).send("ATS Resume Analyzer API");
  });

  const port = env.PORT;
  app.listen(port, () => {
    // No console.log in production code; keep silent.
  });

  return app;
}

