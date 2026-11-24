export async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  fetchFn: typeof fetch = fetch,
): Promise<T> {
  const res = await fetchFn(`${baseUrl}${path}`, {
    ...init,
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
