import type { LevelResult, RunState } from "../game/types";
import { requestJson } from "./client";

const post = (body?: unknown): RequestInit => ({
  method: "POST",
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** Client for the backend run API. All game rules are decided by the backend. */
export class GameApi {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  createRun(seed?: number): Promise<RunState> {
    return requestJson(this.baseUrl, "/game/runs", post(seed === undefined ? {} : { seed }), this.fetchFn);
  }

  collect(runId: string, itemId: number): Promise<{ value: number; money: number }> {
    return requestJson(this.baseUrl, `/game/runs/${runId}/collect`, post({ item_id: itemId }), this.fetchFn);
  }

  explode(runId: string, itemId: number): Promise<{ destroyed_ids: number[] }> {
    return requestJson(this.baseUrl, `/game/runs/${runId}/explode`, post({ item_id: itemId }), this.fetchFn);
  }

  finishLevel(runId: string): Promise<LevelResult> {
    return requestJson(this.baseUrl, `/game/runs/${runId}/finish-level`, post(), this.fetchFn);
  }
}
