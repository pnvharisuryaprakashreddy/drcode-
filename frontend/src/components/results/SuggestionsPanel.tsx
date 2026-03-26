import React, { useMemo } from "react";
import type { AnalyzeResponse } from "../../types";

type Props = {
  analysis: AnalyzeResponse;
};

function ImpactLabel({ impact }: { impact: "HIGH IMPACT" | "MEDIUM IMPACT" }) {
  return (
    <div className="font-mono uppercase text-xs tracking-wider">
      <span className="text-amber">{`[${impact}]`}</span>
    </div>
  );
}

export function QuickWinsPanel({ analysis }: Props) {
  const wins = analysis.ai.quickWins.slice(0, 3);
  return (
    <div className="border border-border no-round bg-surface p-6">
      <div className="font-display uppercase tracking-wider text-lg">QUICK WINS</div>
      <div className="mt-5 space-y-3">
        {wins.map((w, i) => {
          const impact = i < 2 ? "HIGH IMPACT" : "MEDIUM IMPACT";
          return (
            <div
              key={`${w}-${i}`}
              className="border border-border no-round p-4"
              style={{ borderLeft: "2px solid #F5A623" }}
            >
              <ImpactLabel impact={impact as any} />
              <div className="mt-2 font-body text-sm text-paper/90">{w}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RecommendationsPanel({ analysis }: Props) {
  const recs = useMemo(() => {
    const base = analysis.ai.detailedSuggestions;
    const extra = analysis.ats.suggestions;
    const combined = [...base, ...extra];
    return combined.slice(0, 10);
  }, [analysis.ai.detailedSuggestions, analysis.ats.suggestions]);

  return (
    <div className="border border-border no-round bg-surface p-6">
      <div className="font-display uppercase tracking-wider text-lg">RECOMMENDATIONS</div>
      <div className="mt-4 space-y-3">
        {recs.map((r, i) => (
          <div key={`${r}-${i}`} className="flex gap-3 items-start">
            <div className="font-display text-amber text-2xl leading-none pt-1">{String(i + 1).padStart(2, "0")}</div>
            <div className="pt-1 flex items-start gap-3 w-full">
              <div className="w-4 h-4 border border-amber no-round" aria-hidden />
              <div className="font-body text-sm text-paper/90 leading-relaxed">{r}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

