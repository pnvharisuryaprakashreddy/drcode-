import React, { useMemo, useState } from "react";
import type { AnalyzeResponse } from "../../types";
import { Button } from "../ui/Button";
import { generateResumePdf } from "../../services/api";
import { Modal } from "../ui/Modal";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString();

type Template = "minimal" | "modern" | "executive";

function QrPlaceholder() {
  // Static SVG placeholder per spec.
  return (
    <svg width="120" height="120" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="border border-border no-round">
      <rect x="0.5" y="0.5" width="20" height="20" fill="#1A1A1A" />
      {[
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
        [0, 2],
        [18, 0],
        [19, 0],
        [18, 1],
        [18, 2],
        [0, 18],
        [1, 18],
        [2, 18],
        [2, 17],
        [2, 19],
        [10, 10],
        [11, 10],
        [10, 11],
        [12, 12],
        [13, 12],
        [12, 13],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" fill="#F5A623" />
      ))}
    </svg>
  );
}

export default function ImprovedResume({
  analysis,
  telegramBotUsername,
  defaultTemplate,
}: {
  analysis: AnalyzeResponse;
  telegramBotUsername: string | null;
  defaultTemplate: Template;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyTemplate, setBusyTemplate] = useState<Template | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const resume = analysis.optimizedResume;

  const skillsHtml = useMemo(() => resume.skills ?? [], [resume.skills]);

  async function onDownload(template: Template, openPreview: boolean) {
    setDownloadError(null);
    setBusyTemplate(template);
    try {
      const result = await generateResumePdf({ analysisId: analysis.analysisId, template });
      if (openPreview) {
        setPreviewUrl(result.downloadUrl);
        setPreviewOpen(true);
      }
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setBusyTemplate(null);
    }
  }

  return (
    <div className="border border-border no-round bg-surface p-6">
      <div className="font-display uppercase tracking-wider text-lg">YOUR OPTIMIZED RESUME</div>

      <div className="mt-5 border border-border no-round p-4">
        <div className="font-mono uppercase text-xs tracking-wider text-slate">Preview (ATS-ready JSON)</div>
        <div className="mt-3 space-y-4">
          <div className="border-b border-border pb-3">
            <div className="font-display text-paper text-[34px] leading-none">{resume.name ?? ""}</div>
            <div className="mt-2 font-mono text-sm text-slate">
              {[resume.email, resume.phone, resume.linkedin, resume.github].filter(Boolean).join(" | ")}
            </div>
            <div className="mt-3 font-body text-sm text-paper/90">{resume.summary}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-border no-round p-3">
              <div className="font-mono uppercase tracking-wider text-xs text-amber">Skills</div>
              <div className="mt-3 space-y-3">
                {skillsHtml.map((s) => (
                  <div key={`${s.category}`} className="space-y-2">
                    <div className="font-mono text-xs text-slate uppercase tracking-wider">{s.category}</div>
                    <div className="font-mono text-sm text-paper/90">{s.items.join(", ")}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-border no-round p-3">
              <div className="font-mono uppercase tracking-wider text-xs text-amber">Education</div>
              <div className="mt-3 space-y-2">
                {resume.education.map((e) => (
                  <div key={`${e.school}-${e.year}`} className="font-body text-sm text-paper/90">
                    <span className="font-mono text-xs text-slate uppercase tracking-wider">{e.year}</span> - {e.degree} ({e.school})
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-border no-round p-3">
            <div className="font-mono uppercase tracking-wider text-xs text-amber">Experience</div>
            <div className="mt-3 space-y-4">
              {resume.experience.map((ex) => (
                <div key={`${ex.company}-${ex.role}`} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-display text-paper text-lg leading-none">{ex.role}</div>
                    <div className="font-mono text-xs text-slate uppercase tracking-wider">{ex.company} | {ex.duration}</div>
                  </div>
                  <ul className="list-disc ml-5">
                    {ex.bullets.map((b, idx) => (
                      <li key={`${ex.company}-${idx}`} className="font-body text-sm text-paper/90">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border no-round p-3">
            <div className="font-mono uppercase tracking-wider text-xs text-amber">Projects</div>
            <div className="mt-3 space-y-4">
              {resume.projects.map((p) => (
                <div key={p.name} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-display text-paper text-lg leading-none">{p.name}</div>
                    <div className="font-mono text-xs text-slate uppercase tracking-wider">{p.tech.join(" · ")}</div>
                  </div>
                  <div className="font-body text-sm text-paper/90">{p.description}</div>
                  <ul className="list-disc ml-5">
                    {p.bullets.map((b, idx) => (
                      <li key={`${p.name}-${idx}`} className="font-body text-sm text-paper/90">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="font-display uppercase tracking-wider text-lg">DOWNLOADS</div>
        <div className="mt-3 grid md:grid-cols-3 gap-3">
          <DownloadButton
            template="minimal"
            label="DOWNLOAD MINIMAL PDF"
            disabled={busyTemplate !== null}
            onClick={() => void onDownload("minimal", defaultTemplate === "minimal")}
          />
          <DownloadButton
            template="modern"
            label="DOWNLOAD MODERN PDF"
            disabled={busyTemplate !== null}
            onClick={() => void onDownload("modern", defaultTemplate === "modern")}
          />
          <DownloadButton
            template="executive"
            label="DOWNLOAD EXECUTIVE PDF"
            disabled={busyTemplate !== null}
            onClick={() => void onDownload("executive", defaultTemplate === "executive")}
          />
        </div>
        {downloadError ? (
          <div className="mt-3 border border-danger no-round p-3 font-mono text-xs text-paper bg-ink">{downloadError}</div>
        ) : null}
      </div>

      <div className="mt-8 border border-border no-round p-4">
        <div className="font-display uppercase tracking-wider text-lg">ANALYZE VIA TELEGRAM</div>
        <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="font-mono text-sm text-paper/90">
            Bot:{" "}
            <span className="text-amber">{telegramBotUsername ?? "Telegram bot"}</span>
            <div className="mt-2 text-slate">Send /analyze, then upload your resume.</div>
          </div>
          <QrPlaceholder />
        </div>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Generated PDF Preview">
        {previewUrl ? (
          <div className="space-y-3">
            <div className="font-mono text-xs uppercase tracking-wider text-slate">Rendering first page</div>
            <Document file={previewUrl}>
              <Page pageNumber={1} width={560} />
            </Document>
          </div>
        ) : (
          <div className="font-mono text-sm">No preview available.</div>
        )}
      </Modal>
    </div>
  );
}

function DownloadButton({
  label,
  disabled,
  onClick,
}: {
  template: Template;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" disabled={disabled} onClick={onClick} className="px-4 py-4 border-2 text-sm">
      {label}
    </Button>
  );
}

