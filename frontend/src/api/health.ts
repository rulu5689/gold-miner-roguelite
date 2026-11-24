export type BackendStatus = "connected" | "disconnected";

/** Calls GET /health on the backend. Never throws. */
export async function checkBackendHealth(
  baseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<BackendStatus> {
  try {
    const res = await fetchFn(`${baseUrl}/health`);
    if (!res.ok) return "disconnected";
    const body = (await res.json()) as { status?: string };
    return body.status === "ok" ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
}
