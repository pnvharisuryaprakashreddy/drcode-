import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/layout/PageShell";
import ResumeDropzone from "../components/upload/ResumeDropzone";
import JDInput from "../components/upload/JDInput";
import TemplatePicker from "../components/upload/TemplatePicker";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { analyzeResume } from "../services/api";

type Template = "minimal" | "modern" | "executive";

const loadingMessages = ["PARSING DOCUMENTS...", "EXTRACTING KEYWORDS...", "COMPUTING ATS SCORE...", "GENERATING RECOMMENDATIONS..."];

export default function AnalyzePage() {
  const navigate = useNavigate();
  const setAnalysis = useAnalysisStore((s) => s.setAnalysis);
  const setError = useAnalysisStore((s) => s.setError);
  const setLoading = useAnalysisStore((s) => s.setLoading);
  const loading = useAnalysisStore((s) => s.loading);
  const error = useAnalysisStore((s) => s.error);
  const setLastTemplate = useAnalysisStore((s) => s.setLastTemplate);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePageCount, setResumePageCount] = useState<number | null>(null);

  const [jdMode, setJdMode] = useState<"text" | "file">("text");
  const [jdText, setJdText] = useState<string>("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdPageCount, setJdPageCount] = useState<number | null>(null);

  const [template, setTemplate] = useState<Template>("minimal");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState<number>(0);

  const canRun = useMemo(() => {
    const hasResume = !!resumeFile;
    const hasJd = jdMode === "text" ? jdText.trim().length > 0 : !!jdFile;
    return hasResume && hasJd;
  }, [resumeFile, jdFile, jdMode, jdText]);

  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIndex(0);
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % loadingMessages.length;
      setLoadingMsgIndex(i);
    }, 900);
    return () => window.clearInterval(t);
  }, [loading]);

  async function runAnalysis() {
    if (!canRun || !resumeFile) return;
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeResume({
        resumeFile,
        jobDescriptionText: jdMode === "text" ? jdText : undefined,
        jobDescriptionFile: jdMode === "file" ? jdFile ?? undefined : undefined,
      });
      setAnalysis(result);
      setLastTemplate(template);
      navigate("/results");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="pt-10 pb-12">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8">
            <SectionLabel index="01" label="RESUME" />
            <ResumeDropzone
              file={resumeFile}
              pageCount={resumePageCount}
              onChange={(f, meta) => {
                setResumeFile(f);
                setResumePageCount(meta.pageCount);
              }}
            />

            <SectionLabel index="02" label="JOB DESCRIPTION" />
            <div className="border border-border no-round p-4 bg-surface">
              <JDInput
                mode={jdMode}
                setMode={setJdMode}
                jdText={jdText}
                setJdText={setJdText}
                jdFile={jdFile}
                setJdFile={setJdFile}
                pageCount={jdPageCount}
                setPageCount={setJdPageCount}
              />
            </div>

            <SectionLabel index="03" label="TEMPLATE" />
            <div className="bg-surface border border-border no-round p-4">
              <TemplatePicker selected={template} onSelect={setTemplate} />
            </div>

            <div className="pt-2">
              {!loading ? (
                <Button
                  variant="primary"
                  disabled={!canRun}
                  onClick={runAnalysis}
                  className="w-full px-6 py-5 border-2 text-sm"
                >
                  RUN ANALYSIS
                </Button>
              ) : (
                <div className="w-full border border-amber no-round p-4 bg-ink">
                  <div className="font-mono text-xs uppercase tracking-wider text-slate">status</div>
                  <div className="mt-2 font-mono text-paper text-sm">{loadingMessages[loadingMsgIndex]}</div>
                  <div className="mt-3 h-[2px] bg-border overflow-hidden">
                    <div className="barFill" style={{ ["--w" as any]: "100%", ["--d" as any]: "0s" }} />
                  </div>
                </div>
              )}
              <div className="mt-3">
                {error ? (
                  <div className="border border-danger no-round p-3 font-mono text-xs text-paper bg-ink">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-border no-round p-5 bg-surface">
              <div className="font-mono uppercase text-xs tracking-wider text-paper">HOW IT WORKS</div>
              <div className="mt-4 space-y-5">
                <HowStep n={1} title="Upload resume and JD" text="We extract clean text from PDF/DOCX/TXT and normalize it for scanning." />
                <HowStep n={2} title="Detect ATS keywords" text="Regex + a hardcoded tech list identify required skills and job keywords." />
                <HowStep n={3} title="Compute score & gaps" text="We compute category matches and generate 5-10 actionable recommendations." />
                <HowStep n={4} title="Generate ATS-ready PDF" text="Puppeteer renders a template-driven resume PDF, ready for download." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="font-mono uppercase text-xs tracking-wider text-slate">
      {index} / {label}
    </div>
  );
}

function HowStep({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="border-t border-amber pt-4 first:border-t-0">
      <div className="flex items-baseline gap-3">
        <div className="font-display text-amber text-2xl leading-none">{String(n).padStart(2, "0")}</div>
        <div className="font-display uppercase tracking-wider text-paper text-sm">{title}</div>
      </div>
      <div className="mt-3 font-body text-sm text-paper/90">{text}</div>
    </div>
  );
}

