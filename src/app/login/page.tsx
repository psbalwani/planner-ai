"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-card">
        <span className="font-mono text-sm font-semibold tracking-tight text-ink">
          planner<span className="text-accent">.</span>ai
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Sign in</h1>
        {status === "sent" ? (
          <p className="mt-3 text-sm text-muted">Check {email} for a sign-in link.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              Send magic link
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">Something went wrong. Try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
