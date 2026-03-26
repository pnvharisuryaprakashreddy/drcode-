import { create } from "zustand";
import type { AnalyzeResponse } from "../types";

type State = {
  analysis: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
  lastTemplate: "minimal" | "modern" | "executive";
  setAnalysis: (analysis: AnalyzeResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setLastTemplate: (t: State["lastTemplate"]) => void;
};

export const useAnalysisStore = create<State>((set) => ({
  analysis: null,
  loading: false,
  error: null,
  lastTemplate: "minimal",
  setAnalysis: (analysis) => set({ analysis, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastTemplate: (t) => set({ lastTemplate: t }),
  reset: () => set({ analysis: null, loading: false, error: null, lastTemplate: "minimal" }),
}));

