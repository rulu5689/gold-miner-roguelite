import type { Mineral, Upgrade } from "../game/types";
import { requestJson } from "./client";

export const fetchMinerals = (baseUrl: string, fetchFn?: typeof fetch) =>
  requestJson<Mineral[]>(baseUrl, "/config/minerals", {}, fetchFn);

export const fetchUpgrades = (baseUrl: string, fetchFn?: typeof fetch) =>
  requestJson<Upgrade[]>(baseUrl, "/config/upgrades", {}, fetchFn);
