import React from "react";
import type { AiResumeJson } from "../../types";

type Template = "minimal" | "modern" | "executive";

type Props = {
  selected: Template;
  onSelect: (t: Template) => void;
};

function Thumb({ template }: { template: Template }) {
  return (
    <div className="border border-border no-round bg-surface p-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <div className="w-2 h-6 bg-amber" />
        <div className="font-mono text-amber text-xs uppercase tracking-wider">{template}</div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-2 bg-border" />
        <div className="h-2 bg-border" />
        <div className="h-2 bg-border/80" />
        <div className="h-2 bg-border/70" />
      </div>
    </div>
  );
}

export default function TemplatePicker({ selected, onSelect }: Props) {
  const templates: Template[] = ["minimal", "modern", "executive"];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {templates.map((t, idx) => {
        const isSelected = selected === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
            className={[
              "no-round text-left border border-border p-0 bg-transparent transition-colors",
              isSelected ? "border-amber" : "hover:border-amber",
            ].join(" ")}
            style={{ borderLeftWidth: isSelected ? 2 : 1, borderLeftColor: isSelected ? "#F5A623" : "#2A2A2A" }}
            aria-pressed={isSelected}
          >
            <div className="pl-3 pr-3 py-3">
              <Thumb template={t} />
              <div className="mt-2 font-display uppercase tracking-wider text-amber" style={{ fontSize: 20 }}>
                {t}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

