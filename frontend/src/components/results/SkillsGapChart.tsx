import React, { useMemo } from "react";
import type { AtsScoreResult } from "../../types";

type Props = {
  ats: AtsScoreResult;
};

export default function SkillsGapChart({ ats }: Props) {
  const totalRequired = ats.skillsFound.length + ats.skillsMissing.length;
  const matched = ats.skillsFound.length;
  const foundLine = useMemo(() => ats.skillsFound.join(", "), [ats.skillsFound]);

  return (
    <div className="border border-border no-round bg-surface p-6">
      <div className="font-display text-paper uppercase tracking-wider text-lg">SKILLS GAP ANALYSIS</div>
      <div className="mt-5 flex items-baseline gap-4 font-mono text-sm text-slate">
        <div>
          {matched} / {totalRequired} REQUIRED SKILLS MATCHED
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div className="font-mono text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-block w-3 h-3 bg-green no-round" aria-hidden />
            <div>
              <div className="text-paper">
                Found:{" "}
                <span className="text-paper">{foundLine || "None detected"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="font-mono text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-block w-3 h-3 bg-danger no-round" aria-hidden />
            <div className="w-full">
              <div className="text-paper">Missing:</div>
              <div className="mt-2 space-y-2">
                {ats.skillsMissing.length ? (
                  ats.skillsMissing.map((s) => (
                    <div key={s} className="text-paper/90">
                      {s}
                    </div>
                  ))
                ) : (
                  <div className="text-slate">None</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

