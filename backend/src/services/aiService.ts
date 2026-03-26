import OpenAI from "openai";
import { z } from "zod";
import type { AtsScoreResult } from "./atsEngine";
import type { AiDetailedAnalysis, AiResumeJson } from "../types";

const detailedAnalysisSchema = z.object({
  detailedSuggestions: z.array(z.string().min(1)).min(1),
  strengthsFound: z.array(z.string().min(1)).min(1),
  quickWins: z.array(z.string().min(1)).min(1),
  revisedSummary: z.string().min(1),
}) satisfies z.ZodType<AiDetailedAnalysis>;

const resumeJsonSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  summary: z.string().min(1),
  skills: z
    .array(
      z.object({
        category: z.string().min(1),
        items: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
  experience: z
    .array(
      z.object({
        company: z.string().min(1),
        role: z.string().min(1),
        duration: z.string().min(1),
        bullets: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
  education: z
    .array(
      z.object({
        degree: z.string().min(1),
        school: z.string().min(1),
        year: z.string().min(1),
      })
    )
    .min(1),
  projects: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        tech: z.array(z.string().min(1)).min(1),
        bullets: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
}) satisfies z.ZodType<AiResumeJson>;

function buildPreliminaryScoresText(ats: AtsScoreResult): string {
  return [
    `ATS score: ${ats.score.toFixed(2)}/10`,
    `Verdict: ${ats.verdict}`,
    `Skills found/missing: ${ats.skillsFound.join(", ")} / ${ats.skillsMissing.join(", ")}`,
    `Keywords found/missing: ${ats.keywordsFound.slice(0, 20).join(", ")} / ${ats.keywordsMissing.slice(0, 20).join(", ")}`,
    `Experience match: ${ats.experienceMatch ? "Yes" : "No"}`,
  ].join("\n");
}

export class AiService {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyzeDetailed(input: {
    resumeText: string;
    jdText: string;
    ats: AtsScoreResult;
  }): Promise<AiDetailedAnalysis> {
    const system = "You are an expert ATS (Applicant Tracking System) specialist and technical recruiter with 15 years of experience. Analyze resume-JD matches precisely and provide actionable, specific feedback.";

    const user = `Analyze the following resume against the job description.

PRELIMINARY ATS SCORES:
${buildPreliminaryScoresText(input.ats)}

RESUME TEXT:
${input.resumeText}

JOB DESCRIPTION TEXT:
${input.jdText}

Return JSON only in the required schema.`;

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");
    const parsed = JSON.parse(content) as unknown;
    return detailedAnalysisSchema.parse(parsed);
  }

  async generateOptimizedResume(input: {
    originalResumeText: string;
    jdText: string;
    ats: AtsScoreResult;
  }): Promise<AiResumeJson> {
    const system =
      "You are an expert resume writer. Generate a complete, ATS-optimized resume in JSON format based on the original resume content and job description requirements.";

    const user = `Original resume content:
${input.originalResumeText}

Job description content:
${input.jdText}

Preliminary ATS scores (for guidance on what to emphasize):
${buildPreliminaryScoresText(input.ats)}

Return JSON only in the required schema.`;

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");
    const parsed = JSON.parse(content) as unknown;
    return resumeJsonSchema.parse(parsed);
  }
}

