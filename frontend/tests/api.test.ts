import { describe, expect, it } from "vitest";
import { GameApi } from "../src/api/game";

describe("GameApi", () => {
  it("posts JSON to the run endpoints", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return { ok: true, json: async () => ({ value: 50, money: 50 }) } as Response;
    }) as typeof fetch;

    const res = await new GameApi("http://api.test", fakeFetch).collect("abc", 7);
    expect(res).toEqual({ value: 50, money: 50 });
    expect(calls[0].url).toBe("http://api.test/game/runs/abc/collect");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(calls[0].init?.body as string)).toEqual({ item_id: 7 });
  });

  it("throws on an error response", async () => {
    const fakeFetch = (async () => ({ ok: false, status: 400, json: async () => ({}) }) as Response) as typeof fetch;
    await expect(new GameApi("http://api.test", fakeFetch).finishLevel("abc")).rejects.toThrow("400");
  });
});
