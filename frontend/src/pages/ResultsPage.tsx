import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/layout/PageShell";
import { useAnalysisStore } from "../store/useAnalysisStore";
import ATSScorePanel from "../components/results/ATSScorePanel";
import SkillsGapChart from "../components/results/SkillsGapChart";
import { QuickWinsPanel, RecommendationsPanel } from "../components/results/SuggestionsPanel";
import ImprovedResume from "../components/results/ImprovedResume";
import { health } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import type { AnalyzeResponse } from "../types";

export default function ResultsPage() {
  const navigate = useNavigate();
  const analysis = useAnalysisStore((s) => s.analysis);
  const error = useAnalysisStore((s) => s.error);
  const reset = useAnalysisStore((s) => s.reset);
  const lastTemplate = useAnalysisStore((s) => s.lastTemplate);

  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHealthLoading(true);
    setHealthError(null);
    void health()
      .then((h) => {
        if (cancelled) return;
        setTelegramUsername(h.telegramBot?.username ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setHealthError(e instanceof Error ? e.message : "Failed to load health");
      })
      .finally(() => {
        if (cancelled) return;
        setHealthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const page = useMemo(() => {
    if (!analysis) return null;
    return (
      <div className="space-y-8 pt-10 pb-12">
        <ATSScorePanel ats={analysis.ats} />

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6">
            <SkillsGapChart ats={analysis.ats} />
          </div>
          <div className="lg:col-span-6">
            <QuickWinsPanel analysis={analysis} />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <RecommendationsPanel analysis={analysis} />
          </div>
          <div className="lg:col-span-7">
            <ImprovedResume analysis={analysis} telegramBotUsername={telegramUsername} defaultTemplate={lastTemplate} />
          </div>
        </div>
      </div>
    );
  }, [analysis, telegramUsername, lastTemplate]);

  if (!analysis) {
    return (
      <PageShell>
        <div className="pt-10 pb-12">
          <div className="border border-border no-round bg-surface p-6 max-w-3xl">
            <div className="font-display text-2xl uppercase tracking-wider">No analysis loaded</div>
            <div className="mt-3 font-body text-sm text-paper/90">
              Run analysis first from the ATS SCORE home page.
            </div>
            <div className="mt-5">
              <Button variant="primary" onClick={() => navigate("/analyze")} className="px-6 py-4 border-2">
                START ANALYSIS
              </Button>
              {error ? <div className="mt-4 border border-danger no-round p-3 font-mono text-xs">{error}</div> : null}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {healthLoading && !page ? null : null}
      {healthError ? (
        <div className="pt-6">
          <div className="border border-danger no-round p-3 font-mono text-xs max-w-3xl mx-auto">{healthError}</div>
        </div>
      ) : null}
      {page}
    </PageShell>
  );
}

