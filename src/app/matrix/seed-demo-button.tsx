"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SeedDemoButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function seed() {
    setSubmitting(true);
    await fetch("/api/dev/seed-history", { method: "POST" });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-2xl border border-dashed border-line bg-surface p-4">
      <p className="text-sm text-ink">
        Not enough history yet for an adaptive-planning insight — that needs weeks of real use.
      </p>
      <p className="mt-1 text-xs text-muted">
        To test the feature now, seed 5 weeks of synthetic demo history (two demo tasks, clearly
        labeled — delete them from the Matrix any time to remove it).
      </p>
      <button
        onClick={seed}
        disabled={submitting}
        className="mt-3 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {submitting ? "Seeding…" : "Seed demo history"}
      </button>
    </div>
  );
}
