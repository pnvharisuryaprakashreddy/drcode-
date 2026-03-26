import axios from "axios";
import { z } from "zod";
import type { AnalyzeResponse, AtsVerdict, AiResumeJson, AiDetailedAnalysis, AtsScoreResult } from "../types";

const VerdictSchema = z.enum(["Strong Match", "Moderate Match", "Weak Match"]);

const AtsScoreSchema: z.ZodType<AtsScoreResult> = z.object({
  score: z.number(),
  percentage: z.number(),
  verdict: VerdictSchema,
  breakdown: z.object({
    skillsMatchPercentage: z.number(),
    keywordMatchPercentage: z.number(),
    experienceMatchPercentage: z.number(),
    projectRelevancePercentage: z.number(),
  }),
  skillsFound: z.array(z.string()),
  skillsMissing: z.array(z.string()),
  keywordsFound: z.array(z.string()),
  keywordsMissing: z.array(z.string()),
  experienceMatch: z.boolean(),
  suggestions: z.array(z.string()),
});

const AiDetailedAnalysisSchema: z.ZodType<AiDetailedAnalysis> = z.object({
  detailedSuggestions: z.array(z.string()),
  strengthsFound: z.array(z.string()),
  quickWins: z.array(z.string()),
  revisedSummary: z.string(),
});

const AiResumeJsonSchema: z.ZodType<AiResumeJson> = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  summary: z.string(),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      duration: z.string(),
      bullets: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      year: z.string(),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      tech: z.array(z.string()),
      bullets: z.array(z.string()),
    })
  ),
});

const AnalyzeResponseSchema: z.ZodType<AnalyzeResponse> = z.object({
  analysisId: z.string(),
  createdAt: z.string(),
  ats: AtsScoreSchema,
  ai: AiDetailedAnalysisSchema,
  optimizedResume: AiResumeJsonSchema,
  meta: z.object({
    resume: z.object({
      fileName: z.string().optional(),
      wordCount: z.number(),
      pageCount: z.number(),
    }),
    jobDescription: z.object({
      fileName: z.string().optional(),
      wordCount: z.number(),
      pageCount: z.number(),
    }),
    roleTitle: z.string().optional(),
    industryKeywords: z.array(z.string()),
  }),
});

const GenerateResumeResponseSchema = z.object({
  downloadUrl: z.string(),
  fileName: z.string(),
  fileId: z.string(),
});

const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  telegramBot: z
    .object({
      username: z.string().nullable(),
    })
    .optional(),
});

const http = axios.create({
  baseURL: "",
});

export async function analyzeResume(input: {
  resumeFile: File;
  jobDescriptionText?: string;
  jobDescriptionFile?: File;
}): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("resume", input.resumeFile);
  if (input.jobDescriptionFile) {
    form.append("jobDescription", input.jobDescriptionFile);
  } else {
    form.append("jobDescription", input.jobDescriptionText ?? "");
  }

  const response = await http.post("/api/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return AnalyzeResponseSchema.parse(response.data);
}

export async function generateResumePdf(input: { analysisId: string; template: "minimal" | "modern" | "executive" }): Promise<z.infer<typeof GenerateResumeResponseSchema>> {
  const response = await http.post("/api/generate-resume", input);
  return GenerateResumeResponseSchema.parse(response.data);
}

export async function health(): Promise<z.infer<typeof HealthResponseSchema>> {
  const response = await http.get("/api/health");
  return HealthResponseSchema.parse(response.data);
}

