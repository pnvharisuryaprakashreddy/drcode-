import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { parseDocument } from "../services/fileParser";
import { computeAtsScore, extractJobInfoFromJd } from "../services/atsEngine";
import { AiService } from "../services/aiService";
import type { Env } from "../utils/validators";
import { scheduleFileDeletion } from "../utils/fileCleanup";
import { JobQueue } from "../utils/jobQueue";
import { AnalyzeResponseSchema } from "../schemas/api";
import type { AnalyzeResponse } from "../schemas/api";

export function createAnalyzeRouter(deps: {
  env: Env;
  uploadDir: string;
  generatedDir: string;
  jobQueue: JobQueue;
}) {
  const { env, uploadDir, generatedDir, jobQueue } = deps;

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const original = file.originalname;
      const ext = original.includes(".") ? original.slice(original.lastIndexOf(".")) : "";
      cb(null, `${uuidv4()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  });

  const fields = upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jobDescription", maxCount: 1 },
  ]);

  const textSchema = z.string().min(10);

  const router = express.Router();

  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }

  router.post("/analyze", fields, async (req, res) => {
    const runJob = async (): Promise<AnalyzeResponse> => {
      const files = req.files as
        | Partial<Record<"resume" | "jobDescription", Express.Multer.File[]>>
        | undefined;
      const resumeFile = files?.resume?.[0] ?? null;
      const jdFile = files?.jobDescription?.[0] ?? null;

      if (!resumeFile) {
        throw new HttpError(400, "Missing required field: resume");
      }

      const openaiKey = env.OPENAI_API_KEY;
      if (!openaiKey) {
        throw new HttpError(500, "OPENAI_API_KEY is not set on the server");
      }

      const resumeBuffer = await fs.promises.readFile(resumeFile.path);
      const resumeParsed = await parseDocument({
        buffer: resumeBuffer,
        mimeType: resumeFile.mimetype,
        fileName: resumeFile.originalname,
      });

      // Cleanup uploaded resume file quickly (in addition to periodic cleanup).
      void fs.promises.unlink(resumeFile.path).catch(() => undefined);

      const jdTextRaw = typeof req.body?.jobDescription === "string" ? req.body.jobDescription : undefined;

      let jdParsed;
      if (jdFile) {
        const jdBuffer = await fs.promises.readFile(jdFile.path);
        jdParsed = await parseDocument({ buffer: jdBuffer, mimeType: jdFile.mimetype, fileName: jdFile.originalname });
        void fs.promises.unlink(jdFile.path).catch(() => undefined);
      } else if (jdTextRaw) {
        textSchema.parse(jdTextRaw);
        jdParsed = await parseDocument({
          buffer: Buffer.from(jdTextRaw, "utf8"),
          mimeType: "text/plain",
          fileName: "job-description.txt",
        });
      } else {
        throw new HttpError(400, "Provide jobDescription as text or upload it as a file.");
      }

      const ats = computeAtsScore(resumeParsed.rawText, jdParsed.rawText);
      const jobInfo = extractJobInfoFromJd(jdParsed.rawText);

      const ai = new AiService(openaiKey);
      const aiDetailed = await ai.analyzeDetailed({
        resumeText: resumeParsed.rawText,
        jdText: jdParsed.rawText,
        ats,
      });
      const optimizedResume = await ai.generateOptimizedResume({
        originalResumeText: resumeParsed.rawText,
        jdText: jdParsed.rawText,
        ats,
      });

      const analysisId = uuidv4();
      const createdAt = new Date().toISOString();

      const analysisResponse: AnalyzeResponse = AnalyzeResponseSchema.parse({
        analysisId,
        createdAt,
        ats,
        ai: {
          detailedSuggestions: aiDetailed.detailedSuggestions,
          strengthsFound: aiDetailed.strengthsFound,
          quickWins: aiDetailed.quickWins,
          revisedSummary: aiDetailed.revisedSummary,
        },
        optimizedResume,
        meta: {
          resume: {
            fileName: resumeFile.originalname,
            wordCount: resumeParsed.wordCount,
            pageCount: resumeParsed.pageCount,
          },
          jobDescription: {
            fileName: jdFile?.originalname,
            wordCount: jdParsed.wordCount,
            pageCount: jdParsed.pageCount,
          },
          roleTitle: jobInfo.roleTitle,
          industryKeywords: jobInfo.industryKeywords,
        },
      });

      fs.mkdirSync(generatedDir, { recursive: true });
      const analysisPath = path.join(generatedDir, `${analysisId}.json`);
      await fs.promises.writeFile(analysisPath, JSON.stringify(analysisResponse, null, 2), "utf8");
      scheduleFileDeletion(analysisPath, env.FILE_CLEANUP_HOURS * 60 * 60 * 1000);

      return analysisResponse;
    };

    try {
      const result = await jobQueue.enqueue(runJob);
      res.json(result);
    } catch (err) {
      if (!res.headersSent) {
        if (err && typeof err === "object" && "status" in err && typeof (err as any).status === "number") {
          const e = err as any;
          res.status(e.status).json({ error: e.message ?? "Request failed" });
          return;
        }
        const message = err instanceof Error ? err.message : "Analysis failed";
        res.status(500).json({ error: message });
      }
    }
  });

  return router;
}

