import type { AtsScoreResult } from "../services/atsEngine";

export type AiDetailedAnalysis = {
  detailedSuggestions: string[];
  strengthsFound: string[];
  quickWins: string[];
  revisedSummary: string;
};

export type AiResumeJson = {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: { company: string; role: string; duration: string; bullets: string[] }[];
  education: { degree: string; school: string; year: string }[];
  projects: { name: string; description: string; tech: string[]; bullets: string[] }[];
};

export type AnalyzeResultRecord = {
  analysisId: string;
  createdAt: string;
  ats: AtsScoreResult;
  ai: AiDetailedAnalysis;
  optimizedResume: AiResumeJson;
  meta: {
    resume: { fileName?: string; wordCount: number; pageCount: number };
    jobDescription: { wordCount: number; pageCount: number; fileName?: string };
    roleTitle?: string;
    industryKeywords: string[];
  };
};

