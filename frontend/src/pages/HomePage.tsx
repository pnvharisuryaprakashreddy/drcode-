import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";

export default function HomePage() {
  const navigate = useNavigate();

  const terminalLines = useMemo(
    () => ["SCANNING...", "READING DOCUMENTS...", "EXTRACTING KEYWORDS...", "COMPUTING ATS SCORE...", "READY."],
    []
  );

  return (
    <PageShell>
      <div className="min-h-[calc(100vh-32px)] grid lg:grid-cols-12 gap-10 items-start pt-10">
        <div className="lg:col-span-7">
          <div
            className="flex items-start gap-5"
            style={{ ["--d" as any]: "0s" }}
          >
            <div className="w-[2px] bg-amber h-[120px] mt-2" />
            <div className="font-display text-paper text-[120px] leading-[0.86] tracking-wider reveal" style={{ ["--d" as any]: "0.1s" }}>
              ATS SCORE
            </div>
          </div>

          <div className="mt-6 font-mono text-sm tracking-wide reveal" style={{ ["--d" as any]: "0.2s" }}>
            Know exactly why your resume gets rejected - and fix it.
          </div>

          <div className="mt-8 reveal" style={{ ["--d" as any]: "0.3s" }}>
            <Button variant="primary" onClick={() => navigate("/analyze")} className="px-6 py-4 border-2 text-sm">
              ANALYZE YOUR RESUME →
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="border border-border no-round p-5 bg-surface reveal" style={{ ["--d" as any]: "0.4s" }}>
            <div className="font-mono uppercase tracking-wider text-xs text-slate">Terminal</div>
            <div className="mt-4 font-mono text-sm leading-7 text-paper">
              {terminalLines.map((line, i) => (
                <div key={line} className="terminalLine" style={{ ["--d" as any]: `${0.15 + i * 0.12}s` }}>
                  {line}
                </div>
              ))}
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-amber" />
                <span className="font-mono text-xs text-slate uppercase tracking-wider">status: live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

