import React, { useEffect, useMemo, useState } from "react";
import type { AtsScoreResult } from "../../types";
import { Badge } from "../ui/Badge";

type Props = {
  ats: AtsScoreResult;
};

function formatScore(score: number) {
  return score.toFixed(1);
}

export default function ATSScorePanel({ ats }: Props) {
  const target = ats.score;
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1);
      // Ease-out for a terminal-like "snap"
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const breakdownItems = useMemo(
    () => [
      { key: "skills", label: "SKILLS MATCH", pct: ats.breakdown.skillsMatchPercentage },
      { key: "keywords", label: "KEYWORD MATCH", pct: ats.breakdown.keywordMatchPercentage },
      { key: "experience", label: "EXPERIENCE MATCH", pct: ats.breakdown.experienceMatchPercentage },
      { key: "projects", label: "PROJECT RELEVANCE", pct: ats.breakdown.projectRelevancePercentage },
    ],
    [ats.breakdown]
  );

  const badgeVariant = ats.verdict === "Strong Match" ? "amber" : ats.verdict === "Moderate Match" ? "white" : "red";

  return (
    <div className="border border-border no-round bg-surface p-6">
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <div className="flex items-end gap-6">
            <div className="font-display text-amber text-[160px] leading-none tracking-widest reveal" style={{ ["--d" as any]: "0.05s" }}>
              {formatScore(value)}
            </div>
            <div className="font-display text-slate text-[80px] leading-none mb-6 reveal" style={{ ["--d" as any]: "0.15s" }}>
              /10
            </div>
          </div>
          <div className="mt-6">
            <Badge label={ats.verdict.toUpperCase()} variant={badgeVariant as any} />
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="space-y-4">
            {breakdownItems.map((it, i) => (
              <div key={it.key} className="space-y-2">
                <div className="flex items-center justify-between font-mono uppercase text-xs tracking-wider text-slate">
                  <div>{it.label}</div>
                  <div className="text-paper">{Math.round(it.pct)}%</div>
                </div>
                <div className="h-3 border border-border no-round overflow-hidden">
                  <div
                    className="h-full barFill"
                    style={{
                      ["--w" as any]: `${Math.round(it.pct)}%`,
                      ["--d" as any]: `${0.1 + i * 0.1}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

