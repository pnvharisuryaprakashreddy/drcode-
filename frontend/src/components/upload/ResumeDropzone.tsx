import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString();

type Props = {
  file: File | null;
  pageCount: number | null;
  onChange: (file: File | null, meta: { pageCount: number | null }) => void;
};

const acceptedMime = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
} as const;

export default function ResumeDropzone({ file, pageCount, onChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isPdf = useMemo(() => (file?.type ?? "").includes("pdf") || (file?.name ?? "").toLowerCase().endsWith(".pdf"), [file]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const next = acceptedFiles[0] ?? null;
      if (!next) {
        onChange(null, { pageCount: null });
        return;
      }
      if (next.name.toLowerCase().endsWith(".pdf") || next.type === "application/pdf") {
        onChange(next, { pageCount: null });
      } else {
        // DOCX page count is not available client-side with react-pdf; server returns 1.
        onChange(next, { pageCount: 1 });
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: acceptedMime,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        "border border-amber no-round p-4 border-dashed",
        "transition-colors",
        isDragActive ? "bg-amber/10 border-solid" : "bg-transparent",
      ].join(" ")}
      aria-label="Resume upload"
    >
      <input {...getInputProps()} />
      {!file ? (
        <div className="font-mono text-sm text-paper">
          Drag & drop your resume PDF/DOCX here.
          <div className="mt-2 text-slate">No images. ATS text extraction works best.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="font-mono text-sm">
            File: <span className="text-amber">{file.name}</span>
          </div>
          <div className="font-mono text-sm text-slate">
            Pages: {pageCount ?? (isPdf ? "Calculating..." : "1")}
          </div>
          {isPdf && previewUrl && pageCount == null ? (
            <div className="opacity-90">
              <Document
                file={previewUrl}
                onLoadSuccess={({ numPages }) => onChange(file, { pageCount: numPages })}
                onLoadError={() => onChange(file, { pageCount: 1 })}
              >
                <Page pageNumber={1} width={180} />
              </Document>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

