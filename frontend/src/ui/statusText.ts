import type { BackendStatus } from "../api/health";

export function backendStatusLabel(status: BackendStatus | "checking"): string {
  switch (status) {
    case "connected":
      return "Backend connected";
    case "disconnected":
      return "Backend not connected";
    default:
      return "Checking backend...";
  }
}
