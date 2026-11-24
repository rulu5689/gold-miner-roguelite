import type { Mineral } from "../game/types";
import { requestJson } from "./client";

export const fetchMinerals = (baseUrl: string, fetchFn?: typeof fetch) =>
  requestJson<Mineral[]>(baseUrl, "/config/minerals", {}, fetchFn);
