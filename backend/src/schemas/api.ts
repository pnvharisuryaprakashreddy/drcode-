import { z } from "zod";
import type { AtsScoreResult } from "../services/atsEngine";
import type { AiDetailedAnalysis, AiResumeJson, AnalyzeResultRecord } from "../types";

export const TemplateEnumSchema = z.enum(["minimal", "modern", "executive"]);

export const AnalyzeResponseSchema = z.object({
  analysisId: z.string().min(1),
  createdAt: z.string().min(1),
  ats: z.object({
    score: z.number(),
    percentage: z.number(),
    verdict: z.enum(["Strong Match", "Moderate Match", "Weak Match"]),
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
  }) satisfies z.ZodType<AtsScoreResult>,
  ai: z.object({
    detailedSuggestions: z.array(z.string()),
    strengthsFound: z.array(z.string()),
    quickWins: z.array(z.string()),
    revisedSummary: z.string(),
  }) satisfies z.ZodType<AiDetailedAnalysis>,
  optimizedResume: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    summary: z.string().min(1),
    skills: z.array(
      z.object({
        category: z.string().min(1),
        items: z.array(z.string().min(1)).min(1),
      })
    ),
    experience: z.array(
      z.object({
        company: z.string().min(1),
        role: z.string().min(1),
        duration: z.string().min(1),
        bullets: z.array(z.string().min(1)).min(1),
      })
    ),
    education: z.array(
      z.object({
        degree: z.string().min(1),
        school: z.string().min(1),
        year: z.string().min(1),
      })
    ),
    projects: z.array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        tech: z.array(z.string().min(1)).min(1),
        bullets: z.array(z.string().min(1)).min(1),
      })
    ),
  }) satisfies z.ZodType<AiResumeJson>,
  meta: z.object({
    resume: z.object({
      fileName: z.string().optional(),
      wordCount: z.number(),
      pageCount: z.number(),
    }),
    jobDescription: z.object({
      wordCount: z.number(),
      pageCount: z.number(),
      fileName: z.string().optional(),
    }),
    roleTitle: z.string().optional(),
    industryKeywords: z.array(z.string()),
  }),
});

export const GenerateResumeRequestSchema = z.object({
  analysisId: z.string().min(1),
  template: TemplateEnumSchema,
});

export const GenerateResumeResponseSchema = z.object({
  downloadUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileId: z.string().min(1),
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  telegramBot: z
    .object({
      username: z.string().nullable(),
    })
    .optional(),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type GenerateResumeRequest = z.infer<typeof GenerateResumeRequestSchema>;
export type GenerateResumeResponse = z.infer<typeof GenerateResumeResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

