import type {
  LibraryDocument,
  ProjectGroupRecord,
  WorkspaceHubSnapshot,
} from "@pi-desktop/shared";

export const BUSINESS_TEMPLATES = [
  "requirements",
  "delivery",
  "meeting",
  "research",
  "knowledge",
  "acceptance",
] as const;
export type BusinessTemplate = (typeof BUSINESS_TEMPLATES)[number];

export function projectSummary(
  snapshot: WorkspaceHubSnapshot,
  project: ProjectGroupRecord,
  sessions: { projectPath?: string | null }[],
) {
  const items = snapshot.workItems.filter(
    (item) => item.projectId === project.id && item.status !== "cancelled",
  );
  return {
    total: items.length,
    done: items.filter((item) => item.status === "done").length,
    pending: items.filter((item) => item.status !== "done"),
    assignees: [...new Set(items.map((item) => item.assignee).filter(Boolean))],
    documents: snapshot.documents.filter((doc) => doc.projectId === project.id)
      .length,
    sessions: sessions.filter((session) =>
      project.roots.some((root) => root.path === session.projectPath),
    ).length,
  };
}
export function searchLibrary(
  documents: LibraryDocument[],
  query: string,
  projectId: string,
  folder: string,
) {
  const term = query.trim().toLocaleLowerCase();
  return documents
    .filter(
      (doc) =>
        (!projectId || doc.projectId === projectId) &&
        (!folder || doc.folder === folder) &&
        (!term ||
          `${doc.name}\n${doc.folder}\n${doc.revisions.at(-1)?.text ?? ""}`
            .toLocaleLowerCase()
            .includes(term)),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    result += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(result);
}
