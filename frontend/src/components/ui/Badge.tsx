import React from "react";

type Props = {
  label: string;
  variant: "amber" | "white" | "red";
};

export function Badge({ label, variant }: Props) {
  const color =
    variant === "amber"
      ? "border-amber text-amber"
      : variant === "red"
        ? "border-danger text-danger"
        : "border-paper text-paper";

  return (
    <div className={`inline-flex items-center justify-center border ${color} px-3 py-2 no-round`}>
      <div className="font-mono uppercase text-xs tracking-wider">{label}</div>
    </div>
  );
}

