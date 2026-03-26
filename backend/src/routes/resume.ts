import express from "express";
import fs from "fs";
import path from "path";
import type { Env } from "../utils/validators";
import { JobQueue } from "../utils/jobQueue";
import { GenerateResumeRequestSchema, GenerateResumeResponseSchema, HealthResponseSchema } from "../schemas/api";
import type { GenerateResumeResponse, HealthResponse } from "../schemas/api";
import { generateResumePdf, type ResumeTemplate } from "../services/resumeGenerator";
import { AnalyzeResponseSchema } from "../schemas/api";
import type { AnalyzeResponse } from "../schemas/api";

export function createResumeRouter(deps: {
  env: Env;
  generatedDir: string;
  jobQueue: JobQueue;
  telegramBotUsername?: string | null;
}) {
  const { env, generatedDir, jobQueue, telegramBotUsername } = deps;
  const router = express.Router();

  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }

  router.get("/health", async (_req, res) => {
    const response: HealthResponse = HealthResponseSchema.parse({
      status: "ok",
      telegramBot: telegramBotUsername ? { username: telegramBotUsername } : { username: null },
    });
    res.json(response);
  });

  router.post("/generate-resume", async (req, res) => {
    const runJob = async (): Promise<GenerateResumeResponse> => {
      const body = GenerateResumeRequestSchema.parse(req.body);
      const analysisPath = path.join(generatedDir, `${body.analysisId}.json`);
      const exists = fs.existsSync(analysisPath);
      if (!exists) throw new HttpError(404, "analysisId not found or expired");

      const raw = await fs.promises.readFile(analysisPath, "utf8");
      const analysis: AnalyzeResponse = AnalyzeResponseSchema.parse(JSON.parse(raw));

      const template = body.template as ResumeTemplate;
      const { fileId } = await generateResumePdf({
        resumeJson: analysis.optimizedResume,
        template,
        generatedDir,
      });

      const fileName = fileId;
      const downloadUrl = `/api/download/${fileId}`;

      return GenerateResumeResponseSchema.parse({
        downloadUrl,
        fileName,
        fileId,
      });
    };

    try {
      const result = await jobQueue.enqueue(runJob);
      res.json(result);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && typeof (err as any).status === "number") {
        const e = err as any;
        res.status(e.status).json({ error: e.message ?? "Request failed" });
        return;
      }
      const message = err instanceof Error ? err.message : "Resume generation failed";
      res.status(500).json({ error: message });
    }
  });

  router.get("/download/:fileId", async (req, res) => {
    const fileId = req.params.fileId;
    if (!fileId || !fileId.endsWith(".pdf")) {
      res.status(400).json({ error: "fileId must be a .pdf" });
      return;
    }

    const resolvedBase = path.resolve(generatedDir);
    const resolvedPath = path.resolve(path.join(generatedDir, fileId));
    if (!resolvedPath.startsWith(resolvedBase)) {
      res.status(400).json({ error: "Invalid fileId" });
      return;
    }

    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: "File not found or expired" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileId}"`);
    const stream = fs.createReadStream(resolvedPath);
    stream.on("error", () => {
      res.status(500).end();
    });
    stream.pipe(res);
  });

  return router;
}

