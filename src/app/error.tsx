"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-mono text-sm font-semibold tracking-tight text-ink">
        planner<span className="text-accent">.</span>ai
      </p>
      <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="text-sm text-muted">
        An unexpected error occurred. You can try again, or head back to the Matrix.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <a
          href="/matrix"
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-accent"
        >
          Back to Matrix
        </a>
      </div>
    </main>
  );
}
