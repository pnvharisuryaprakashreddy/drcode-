import React from "react";

type Variant = "primary" | "outline";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
};

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
}: Props) {
  const base =
    "no-round uppercase font-display tracking-wider text-xs border transition-colors focus:outline-none focus:ring-0";
  const styles =
    variant === "primary"
      ? "bg-amber text-ink border-amber hover:bg-paper hover:text-ink"
      : "bg-transparent text-paper border-amber hover:bg-amber hover:text-ink";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`${base} ${styles} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

