"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader({ active }: { active: "matrix" | "day" }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-line pb-4">
      <div className="flex items-center gap-8">
        <span className="font-mono text-sm font-semibold tracking-tight text-ink">
          planner<span className="text-accent">.</span>ai
        </span>
        <nav className="flex gap-1 text-sm">
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
        </nav>
      </div>
      <button onClick={signOut} className="text-sm text-muted hover:text-ink">
        Sign out
      </button>
    </header>
  );
}
