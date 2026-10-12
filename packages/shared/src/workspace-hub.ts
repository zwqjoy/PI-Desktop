/** Host-owned workspace planning and document records. */
export type WorkspaceWorkItem = {
  id: string;
  projectId: string;
  title: string;
  status: "todo" | "doing" | "review" | "done" | "cancelled";
  assignee: string;
  revision: number;
  updatedAt: number;
};
export type LibraryRevision = {
  number: number;
  payloadId: string;
  text: string | null;
  originalBase64: string;
  byteLength: number;
  createdAt: number;
};
export type LibraryDocument = {
  id: string;
  name: string;
  folder: string;
  projectId: string | null;
  mediaType: string;
  revision: number;
  updatedAt: number;
  revisions: LibraryRevision[];
  draft: string | null;
};
export type WorkspaceHubSnapshot = {
  version: 1;
  revision: number;
  documents: LibraryDocument[];
  workItems: WorkspaceWorkItem[];
};
export type WorkspaceHubCommand =
  | {
      kind: "import";
      name: string;
      folder: string;
      projectId: string | null;
      mediaType: string;
      originalBase64: string;
    }
  | { kind: "draft"; id: string; text: string }
  | { kind: "publish"; id: string }
  | { kind: "associate"; id: string; projectId: string | null; folder: string }
  | { kind: "remove"; id: string }
  | { kind: "addWorkItem"; projectId: string; title: string }
  | {
      kind: "updateWorkItem";
      id: string;
      status: WorkspaceWorkItem["status"];
      assignee: string;
    };
