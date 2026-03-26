export type AtsVerdict = "Strong Match" | "Moderate Match" | "Weak Match";

export type AtsScoreResult = {
  score: number;
  percentage: number;
  verdict: AtsVerdict;
  breakdown: {
    skillsMatchPercentage: number;
    keywordMatchPercentage: number;
    experienceMatchPercentage: number;
    projectRelevancePercentage: number;
  };
  skillsFound: string[];
  skillsMissing: string[];
  keywordsFound: string[];
  keywordsMissing: string[];
  experienceMatch: boolean;
  suggestions: string[];
};

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

export type AnalyzeResponse = {
  analysisId: string;
  createdAt: string;
  ats: AtsScoreResult;
  ai: AiDetailedAnalysis;
  optimizedResume: AiResumeJson;
  meta: {
    resume: { fileName?: string; wordCount: number; pageCount: number };
    jobDescription: { fileName?: string; wordCount: number; pageCount: number };
    roleTitle?: string;
    industryKeywords: string[];
  };
};

