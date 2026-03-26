import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString();

type Props = {
  mode: "text" | "file";
  setMode: (m: "text" | "file") => void;
  jdText: string;
  setJdText: (t: string) => void;
  jdFile: File | null;
  setJdFile: (f: File | null) => void;
  pageCount: number | null;
  setPageCount: (n: number | null) => void;
};

export default function JDInput({
  mode,
  setMode,
  jdText,
  setJdText,
  jdFile,
  setJdFile,
  pageCount,
  setPageCount,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isPdf = useMemo(
    () => (jdFile?.type ?? "").includes("pdf") || (jdFile?.name ?? "").toLowerCase().endsWith(".pdf"),
    [jdFile]
  );

  const onDrop = (acceptedFiles: File[]) => {
    const next = acceptedFiles[0] ?? null;
    setJdFile(next);
    setPageCount(next ? (isPdf ? null : 1) : null);
    if (next && isPdf) setPreviewUrl(URL.createObjectURL(next));
    else setPreviewUrl(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-3 no-round">
        <button
          type="button"
          className={`no-round px-3 py-2 border border-amber font-mono text-xs uppercase tracking-wider ${
            mode === "text" ? "bg-amber text-ink" : "bg-transparent text-paper hover:bg-amber hover:text-ink"
          }`}
          onClick={() => setMode("text")}
        >
          Text
        </button>
        <button
          type="button"
          className={`no-round px-3 py-2 border border-amber font-mono text-xs uppercase tracking-wider ${
            mode === "file" ? "bg-amber text-ink" : "bg-transparent text-paper hover:bg-amber hover:text-ink"
          }`}
          onClick={() => setMode("file")}
        >
          File
        </button>
      </div>

      {mode === "text" ? (
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          className="w-full bg-surface border border-border no-round px-3 py-3 text-paper font-body"
          placeholder="Paste the job description text here..."
          rows={10}
        />
      ) : (
        <div className="space-y-3">
          <div
            {...getRootProps()}
            className={[
              "border border-amber no-round p-4 border-dashed",
              "transition-colors",
              isDragActive ? "bg-amber/10 border-solid" : "bg-transparent",
            ].join(" ")}
          >
            <input {...getInputProps()} />
            {!jdFile ? (
              <div className="font-mono text-sm">
                Drag & drop JD PDF/DOCX/TXT here.
                <div className="mt-2 text-slate">ATS matching works best with plain text.</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-mono text-sm">
                  File: <span className="text-amber">{jdFile.name}</span>
                </div>
                <div className="font-mono text-sm text-slate">
                  Pages: {pageCount ?? (isPdf ? "Calculating..." : 1)}
                </div>
                {isPdf && previewUrl && pageCount == null ? (
                  <Document
                    file={previewUrl}
                    onLoadSuccess={({ numPages }) => setPageCount(numPages)}
                    onLoadError={() => setPageCount(1)}
                  >
                    <Page pageNumber={1} width={140} />
                  </Document>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

