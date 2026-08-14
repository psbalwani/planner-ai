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
    <header className="flex items-center justify-between border-b border-neutral-200 pb-3">
      <nav className="flex gap-4 text-sm">
        <Link href="/matrix" className={active === "matrix" ? "font-semibold" : "text-neutral-500"}>
          Matrix
        </Link>
        <Link href="/day" className={active === "day" ? "font-semibold" : "text-neutral-500"}>
          Day
        </Link>
      </nav>
      <button onClick={signOut} className="text-sm text-neutral-500 hover:text-neutral-900">
        Sign out
      </button>
    </header>
  );
}
