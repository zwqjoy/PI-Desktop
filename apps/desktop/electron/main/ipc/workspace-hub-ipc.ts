import { IPC } from "@pi-desktop/shared";
import type { HostProcess } from "../host-process";
import type { IpcRegistrar } from "./types";

/** Host validates every payload; main only forwards allowlisted operations. */
export function registerWorkspaceHubIpc(
  registrar: IpcRegistrar,
  getHost: () => HostProcess | null,
) {
  for (const [channel, method] of [
    [IPC.invoke.workspaceHubRead, "workspaceHub.read"],
    [IPC.invoke.workspaceHubChange, "workspaceHub.change"],
  ] as const) {
    registrar.handle(channel, async (input: unknown) => {
      const host = getHost();
      if (!host) throw new Error("Host unavailable");
      return host.call(method, input ?? {});
    });
  }
}
