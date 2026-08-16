"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader({
  active,
}: {
  active: "matrix" | "day" | "insights" | "focus" | "projects";
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line pb-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold tracking-tight text-ink">
          planner<span className="text-accent">.</span>ai
        </span>
        <button onClick={signOut} className="text-sm text-muted hover:text-ink">
          Sign out
        </button>
      </div>
      <nav className="mt-3 flex gap-1 overflow-x-auto whitespace-nowrap text-sm">
        <Link
          href="/matrix"
          className={`rounded-md px-3 py-1.5 transition-colors ${
            active === "matrix" ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"
          }`}
        >
          Matrix
        </Link>
        <Link
          href="/day"
          className={`rounded-md px-3 py-1.5 transition-colors ${
            active === "day" ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"
          }`}
        >
          Day
        </Link>
        <Link
          href="/insights"
          className={`rounded-md px-3 py-1.5 transition-colors ${
            active === "insights" ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"
          }`}
        >
          Insights
        </Link>
        <Link
          href="/focus"
          className={`rounded-md px-3 py-1.5 transition-colors ${
            active === "focus" ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"
          }`}
        >
          Focus
        </Link>
        <Link
          href="/projects"
          className={`rounded-md px-3 py-1.5 transition-colors ${
            active === "projects" ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"
          }`}
        >
          Projects
        </Link>
      </nav>
    </header>
  );
}
