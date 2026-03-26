import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  return (
    <header className="border-b border-border no-round bg-ink">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="font-display uppercase tracking-widest text-amber text-lg no-round border-0 bg-transparent p-0 cursor-pointer"
        >
          ATS SCORE
        </button>
        <div className="font-mono uppercase tracking-wider text-xs text-slate">Editorial Dark Brutalism</div>
      </div>
    </header>
  );
}

