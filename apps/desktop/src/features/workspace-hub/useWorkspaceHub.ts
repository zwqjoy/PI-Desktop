import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ProjectGroupRecord,
  WorkspaceHubCommand,
  WorkspaceHubSnapshot,
} from "@pi-desktop/shared";
import { api } from "../../lib/api";

export function useWorkspaceHub() {
  const [snapshot, setSnapshot] = useState<WorkspaceHubSnapshot | null>(null);
  const [projects, setProjects] = useState<ProjectGroupRecord[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const alive = useRef(false);
  const generation = useRef(0);
  const writing = useRef(false);
  const current = useRef(snapshot);
  current.current = snapshot;
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setBusy(true);
    try {
      const [next, groups] = await Promise.all([
        api.readWorkspaceHub(),
        api.listProjectGroups(),
      ]);
      if (!alive.current || request !== generation.current) return;
      current.current = next;
      setSnapshot(next);
      setProjects(groups.groups);
      setError("");
    } catch (cause) {
      if (alive.current && request === generation.current)
        setError(String(cause));
    } finally {
      if (alive.current && request === generation.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void reload();
    return () => {
      alive.current = false;
      generation.current++;
    };
  }, [reload]);
  const change = async (command: WorkspaceHubCommand): Promise<boolean> => {
    if (!current.current || writing.current) return false;
    writing.current = true;
    const request = ++generation.current;
    setBusy(true);
    try {
      const next = await api.changeWorkspaceHub(
        current.current.revision,
        command,
      );
      if (!alive.current || request !== generation.current) return false;
      current.current = next;
      setSnapshot(next);
      setError("");
      return true;
    } catch (cause) {
      if (alive.current && request === generation.current)
        setError(String(cause));
      return false;
    } finally {
      writing.current = false;
      if (alive.current && request === generation.current) setBusy(false);
    }
  };
  return { snapshot, projects, busy, error, reload, change };
}
