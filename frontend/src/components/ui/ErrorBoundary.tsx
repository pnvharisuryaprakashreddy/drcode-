import React from "react";
import { useNavigate } from "react-router-dom";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; errorMessage: string | null };

class Boundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    };
  }

  componentDidCatch() {
    // Intentionally no logging in production code per requirement.
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-start justify-center bg-ink px-4 pt-16 text-paper">
        <div className="w-full max-w-2xl border border-border p-6 no-round">
          <div className="font-mono text-amber uppercase text-sm tracking-wider">
            Runtime error
          </div>
          <div className="mt-3 font-body text-paper" style={{ fontFamily: "Literata, serif" }}>
            {this.state.errorMessage}
          </div>
          <div className="mt-6 flex gap-3">
            <HomeButton />
          </div>
        </div>
      </div>
    );
  }
}

function HomeButton() {
  const navigate = useNavigate();
  return (
    <button
      className="no-round border border-amber px-4 py-2 text-ink bg-paper font-mono uppercase text-xs tracking-wider hover:bg-amber hover:text-ink transition-colors"
      onClick={() => navigate("/")}
    >
      Back to ATS SCORE
    </button>
  );
}

export function ErrorBoundary({ children }: Props) {
  // Wrapper keeps hook usage inside a function component.
  return <Boundary>{children}</Boundary>;
}

