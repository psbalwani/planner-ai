"use client";

import { useRouter } from "next/navigation";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

export default function DeleteEntityButton({
  endpoint,
  confirmMessage,
}: {
  endpoint: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const showError = useToast();

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    try {
      await apiFetch(endpoint, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      showError(toErrorMessage(err));
    }
  }

  return (
    <button
      onClick={handleDelete}
      title="Delete"
      className="shrink-0 text-muted transition-colors hover:text-red-600"
    >
      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
        <path
          d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.5 8.5h6l.5-8.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
