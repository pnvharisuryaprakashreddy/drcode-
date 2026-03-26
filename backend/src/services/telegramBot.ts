import fs from "fs";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
import type { CallbackQuery, Message } from "node-telegram-bot-api";
import { v4 as uuidv4 } from "uuid";
import type { Env } from "../utils/validators";
import { parseDocument } from "./fileParser";
import { computeAtsScore } from "./atsEngine";
import { extractJobInfoFromJd } from "./atsEngine";
import { AiService } from "./aiService";
import { generateResumePdf, type ResumeTemplate } from "./resumeGenerator";
import type { AiResumeJson, AiDetailedAnalysis } from "../types";
import { JobQueue } from "../utils/jobQueue";
import type { AnalyzeResponse } from "../schemas/api";
import { AnalyzeResponseSchema } from "../schemas/api";

type TelegramSession = {
  resume?: { parsedText: string; wordCount: number; pageCount: number; fileName?: string };
  jd?: { rawText: string; wordCount: number; pageCount: number; fileName?: string };
  analysis?: AnalyzeResponse;
  lastTemplate?: ResumeTemplate;
  createdAt: number;
  updatedAt: number;
  busy?: boolean;
};

function getTelegramFileUrl(token: string, filePath: string): string {
  return `https://api.telegram.org/file/bot${token}/${filePath}`;
}

async function downloadTelegramDocument(token: string, fileId: string): Promise<Buffer> {
  const bot = new TelegramBot(token, { polling: false });
  const file = await bot.getFile(fileId);
  const url = getTelegramFileUrl(token, file.file_path);
  const response = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

export async function createTelegramBot(input: {
  token: string;
  uploadDir: string;
  env: Env;
  jobQueue: JobQueue;
  generatedDir: string;
}): Promise<{ username: string | null; bot: TelegramBot }> {
  const { token, env, generatedDir, jobQueue } = input;
  const bot = new TelegramBot(token, { polling: true });

  const sessions = new Map<number, TelegramSession>();
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [chatId, s] of sessions.entries()) {
      // Keep sessions alive for ~1 hour.
      if (now - s.updatedAt > 60 * 60 * 1000) sessions.delete(chatId);
    }
  }, 10 * 60 * 1000);
  cleanupInterval.unref();

  const username = (() => {
    // node-telegram-bot-api doesn't expose username immediately, but we can fetch it after getMe.
    return null;
  })();

  bot.onText(/\/start/, (msg: Message) => {
    const chatId = msg.chat.id;
    const text = [
      "ATS Resume Analyzer (Telegram)",
      "",
      "1) Send your resume as a PDF/DOCX/TXT",
      "2) Then send your Job Description as text (or upload the file)",
      "",
      "Use /templates to preview resume templates after analysis.",
    ].join("\n");
    void bot.sendMessage(chatId, text);
  });

  bot.onText(/\/help/, (msg: Message) => {
    const chatId = msg.chat.id;
    const text = ["Send a resume, then send a Job Description. To regenerate PDFs, use /templates."].join("\n");
    void bot.sendMessage(chatId, text);
  });

  bot.onText(/\/analyze/, (msg: Message) => {
    const chatId = msg.chat.id;
    const s = sessions.get(chatId) ?? {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    s.resume = undefined;
    s.jd = undefined;
    s.analysis = undefined;
    s.lastTemplate = undefined;
    sessions.set(chatId, s);
    void bot.sendMessage(chatId, "Send your resume file (PDF/DOCX/TXT). Then send your Job Description as text or file.");
  });

  bot.onText(/\/templates/, (msg: Message) => {
    const chatId = msg.chat.id;
    const s = sessions.get(chatId);
    if (!s?.analysis) {
      void bot.sendMessage(chatId, "No analysis yet. Send /analyze and provide resume + Job Description first.");
      return;
    }
    void bot.sendMessage(chatId, "Choose a template to generate your optimized resume PDF:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Minimal", callback_data: "template:minimal" },
            { text: "Modern", callback_data: "template:modern" },
            { text: "Executive", callback_data: "template:executive" },
          ],
        ],
      },
    });
  });

  bot.on("document", async (msg: Message) => {
    const chatId = msg.chat.id;
    if (!msg.document) return;

    const session = sessions.get(chatId) ?? { createdAt: Date.now(), updatedAt: Date.now() };
    if (session.busy) {
      void bot.sendMessage(chatId, "Still working on your previous request. Try again in a moment.");
      return;
    }

    try {
      session.updatedAt = Date.now();
      session.busy = true;
      sessions.set(chatId, session);

      const fileId = msg.document.file_id;
      const fileBuffer = await downloadTelegramDocument(token, fileId);

      const parsed = await parseDocument({
        buffer: fileBuffer,
        mimeType: msg.document.mime_type ?? undefined,
        fileName: msg.document.file_name ?? undefined,
      });

      if (!parsed.rawText) {
        session.resume = undefined;
        session.busy = false;
        sessions.set(chatId, session);
        void bot.sendMessage(chatId, "I couldn't extract text from that document. Please upload a resume with selectable text.");
        return;
      }

      session.resume = {
        parsedText: parsed.rawText,
        wordCount: parsed.wordCount,
        pageCount: parsed.pageCount,
        fileName: msg.document.file_name ?? undefined,
      };
      session.jd = undefined;
      session.analysis = undefined;
      session.lastTemplate = undefined;
      session.busy = false;
      session.updatedAt = Date.now();
      sessions.set(chatId, session);

      void bot.sendMessage(
        chatId,
        "Resume received. Now send your Job Description as text (recommended) or upload it as a file."
      );
    } catch (err) {
      session.busy = false;
      sessions.set(chatId, session);
      void bot.sendMessage(chatId, `Resume upload failed. ${err instanceof Error ? err.message : "Try again."}`);
    }
  });

  bot.on("message", async (msg: Message) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;
    if (msg.text.startsWith("/")) return;

    const session = sessions.get(chatId);
    if (!session?.resume) {
      void bot.sendMessage(chatId, "Please send your resume file first, then send the Job Description text.");
      return;
    }

    if (session.jd) {
      void bot.sendMessage(chatId, "Job Description already received for this session. Use /templates to generate PDFs.");
      return;
    }

    try {
      const jdText = msg.text.trim();
      if (!jdText) {
        void bot.sendMessage(chatId, "Job Description is empty. Please resend.");
        return;
      }

      const jdParsed = await parseDocument({
        buffer: Buffer.from(jdText, "utf8"),
        mimeType: "text/plain",
        fileName: "job-description.txt",
      });

      session.jd = { rawText: jdParsed.rawText, wordCount: jdParsed.wordCount, pageCount: jdParsed.pageCount };
      session.busy = true;
      session.updatedAt = Date.now();
      sessions.set(chatId, session);

      const openaiKey = env.OPENAI_API_KEY;
      if (!openaiKey) {
        session.busy = false;
        sessions.set(chatId, session);
        void bot.sendMessage(chatId, "Server missing OPENAI_API_KEY, so AI analysis can't run.");
        return;
      }

      const analysis = await jobQueue.enqueue(async () => {
        const ats = computeAtsScore(session.resume!.parsedText, jdParsed.rawText);
        const jobInfo = extractJobInfoFromJd(jdParsed.rawText);
        const ai = new AiService(openaiKey);

        const aiDetailed: AiDetailedAnalysis = await ai.analyzeDetailed({
          resumeText: session.resume!.parsedText,
          jdText: jdParsed.rawText,
          ats,
        });

        const optimizedResume: AiResumeJson = await ai.generateOptimizedResume({
          originalResumeText: session.resume!.parsedText,
          jdText: jdParsed.rawText,
          ats,
        });

        return { ats, jobInfo, aiDetailed, optimizedResume };
      });

      const analysisId = uuidv4();
      const createdAt = new Date().toISOString();

      const analysisResponse: AnalyzeResponse = AnalyzeResponseSchema.parse({
        analysisId,
        createdAt,
        ats: analysis.ats,
        ai: analysis.aiDetailed,
        optimizedResume: analysis.optimizedResume,
        meta: {
          resume: {
            fileName: session.resume.fileName,
            wordCount: session.resume.wordCount,
            pageCount: session.resume.pageCount,
          },
          jobDescription: {
            wordCount: jdParsed.wordCount,
            pageCount: jdParsed.pageCount,
            fileName: undefined,
          },
          roleTitle: analysis.jobInfo.roleTitle,
          industryKeywords: analysis.jobInfo.industryKeywords,
        },
      });

      session.analysis = analysisResponse;
      session.lastTemplate = "minimal";
      session.busy = false;
      session.updatedAt = Date.now();
      sessions.set(chatId, session);

      const scoreLine = `ATS Score: ${analysis.ats.score.toFixed(2)}/10 (${analysis.ats.verdict})`;
      const topSuggestions = analysis.aiDetailed.detailedSuggestions
        .slice(0, 5)
        .map((s, idx) => `${idx + 1}. ${s}`)
        .join("\n");
      const missingSkills = analysis.ats.skillsMissing.slice(0, 8);
      const missingLine = missingSkills.length ? `Missing skills: ${missingSkills.join(", ")}` : "Missing skills: none detected";

      void bot.sendMessage(chatId, `${scoreLine}\n\n${missingLine}\n\nTop recommendations:\n${topSuggestions}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Download PDF", callback_data: "download:minimal" },
              { text: "Try Another", callback_data: "download:modern" },
            ],
            [{ text: "Templates", callback_data: "templates:show" }],
          ],
        },
      });
    } catch (err) {
      session.busy = false;
      session.updatedAt = Date.now();
      sessions.set(chatId, session);
      void bot.sendMessage(chatId, `Analysis failed. ${err instanceof Error ? err.message : "Try again."}`);
    }
  });

  bot.on("callback_query", async (q: CallbackQuery) => {
    const chatId = q.message?.chat.id;
    if (!chatId) return;

    const session = sessions.get(chatId);
    if (!session?.analysis) {
      void bot.answerCallbackQuery(q.id, { text: "No analysis found yet. Send /analyze first." });
      return;
    }

    const data = q.data ?? "";

    try {
      if (data === "templates:show") {
        void bot.answerCallbackQuery(q.id);
        void bot.sendMessage(chatId, "Choose a template:", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Minimal", callback_data: "download:minimal" },
                { text: "Modern", callback_data: "download:modern" },
                { text: "Executive", callback_data: "download:executive" },
              ],
            ],
          },
        });
        return;
      }

      if (data.startsWith("download:")) {
        void bot.answerCallbackQuery(q.id);
        const template = data.slice("download:".length) as ResumeTemplate;
        session.lastTemplate = template;
        session.updatedAt = Date.now();
        sessions.set(chatId, session);

        const { filePath } = await jobQueue.enqueue(async () => {
          return generateResumePdf({
            resumeJson: session.analysis!.optimizedResume,
            template,
            generatedDir,
          });
        });

        const readStream = fs.createReadStream(filePath);
        await bot.sendDocument(chatId, readStream, { filename: `resume-${template}.pdf` });
        return;
      }

      if (data.startsWith("template:")) {
        void bot.answerCallbackQuery(q.id);
        const template = data.slice("template:".length) as ResumeTemplate;
        session.lastTemplate = template;
        sessions.set(chatId, session);
        const { filePath } = await jobQueue.enqueue(async () => {
          return generateResumePdf({
            resumeJson: session.analysis!.optimizedResume,
            template,
            generatedDir,
          });
        });
        const readStream = fs.createReadStream(filePath);
        await bot.sendDocument(chatId, readStream, { filename: `resume-${template}.pdf` });
        return;
      }

      void bot.answerCallbackQuery(q.id);
    } catch (err) {
      void bot.answerCallbackQuery(q.id, {
        text: `PDF generation failed. ${err instanceof Error ? err.message : "Try again."}`,
      });
    }
  });

  const me = await bot.getMe().catch(() => null);
  return { username: me?.username ?? username, bot };
}

