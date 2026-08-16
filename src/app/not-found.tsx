import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-mono text-sm font-semibold tracking-tight text-ink">
        planner<span className="text-accent">.</span>ai
      </p>
      <h1 className="text-xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-muted">That page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link
        href="/matrix"
        className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Back to Matrix
      </Link>
    </main>
  );
}
