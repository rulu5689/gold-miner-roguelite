import { describe, expect, it } from "vitest";
import { checkBackendHealth } from "../src/api/health";
import { backendStatusLabel } from "../src/ui/statusText";

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as Response;

describe("frontend smoke", () => {
  it("reports connected when /health returns ok", async () => {
    let calledUrl = "";
    const fakeFetch = (async (url: string) => {
      calledUrl = url;
      return jsonResponse({ status: "ok" });
    }) as typeof fetch;

    const status = await checkBackendHealth("http://api.test", fakeFetch);
    expect(calledUrl).toBe("http://api.test/health");
    expect(status).toBe("connected");
    expect(backendStatusLabel(status)).toBe("Backend connected");
  });

  it("reports disconnected when the backend is unreachable", async () => {
    const failingFetch = (async () => {
      throw new TypeError("network error");
    }) as typeof fetch;
    expect(await checkBackendHealth("http://api.test", failingFetch)).toBe("disconnected");
  });
});
