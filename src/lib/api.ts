export class ApiError extends Error {}

export function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

// Every API route in this app returns { error: string } on failure. Centralizing
// the check here means callers can just catch and show err.message, instead of
// each fetch call site silently ignoring a non-ok response.
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body: { error?: string } | null = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed (${res.status})`);
  }
  return res;
}
