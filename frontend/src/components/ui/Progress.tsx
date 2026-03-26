import React from "react";

type Props = {
  value: number; // 0-100
  label?: string;
  animationDelaySeconds?: number;
};

export function Progress({ value, label, animationDelaySeconds = 0 }: Props) {
  const pct = Math.round(value);
  return (
    <div className="space-y-2">
      {label ? <div className="font-mono text-xs uppercase tracking-wider text-slate">{label}</div> : null}
      <div className="h-3 border border-border no-round overflow-hidden">
        <div
          className="h-full barFill"
          style={{ ["--w" as any]: `${pct}%`, ["--d" as any]: `${animationDelaySeconds}s` }}
        />
      </div>
    </div>
  );
}

