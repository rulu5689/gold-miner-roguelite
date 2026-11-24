import type { Mineral } from "../game/types";

export async function fetchMinerals(baseUrl: string, fetchFn: typeof fetch = fetch): Promise<Mineral[]> {
  const res = await fetchFn(`${baseUrl}/config/minerals`);
  if (!res.ok) throw new Error(`GET /config/minerals failed: ${res.status}`);
  return (await res.json()) as Mineral[];
}
