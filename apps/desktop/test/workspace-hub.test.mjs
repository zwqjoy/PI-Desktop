import assert from "node:assert/strict";
import test from "node:test";
import { projectSummary, searchLibrary, bytesToBase64 } from "../src/features/workspace-hub/model.ts";

const project = { id: "project", roots: [{ path: "/work" }, { path: "/extra" }] };
const document = { id: "doc", name: "Requirements.md", folder: "Reviews", projectId: "project", updatedAt: 2, revisions: [{ text: "Acceptance criteria" }] };
test("dashboard derives real progress and owners, excludes cancelled items and counts every group root", () => {
  const snapshot = { documents: [document], workItems: [
    { projectId: "project", status: "todo", assignee: "" },
    { projectId: "project", status: "done", assignee: "Lee" },
    { projectId: "project", status: "cancelled", assignee: "Other" },
    { projectId: "elsewhere", status: "done", assignee: "Other" },
  ] };
  assert.deepEqual(projectSummary(snapshot, project, [{projectPath:"/work"},{projectPath:"/extra"},{projectPath:"/other"}]), {
    total: 2, done: 1, pending: [snapshot.workItems[0]], assignees: ["Lee"], documents: 1, sessions: 2,
  });
});
test("library searches published text and scopes results to project and folder", () => {
  assert.deepEqual(searchLibrary([document], "acceptance", "project", "Reviews"), [document]);
  assert.deepEqual(searchLibrary([document], "REQUIREMENTS", "", ""), [document]);
  assert.deepEqual(searchLibrary([document], "", "other", ""), []);
  assert.deepEqual(searchLibrary([document], "", "", "other"), []);
});
test("imports preserve arbitrary binary bytes across base64 encoding", () => {
  const bytes = Uint8Array.from({length:20000}, (_, index) => index % 256);
  assert.deepEqual(Buffer.from(bytesToBase64(bytes), "base64"), Buffer.from(bytes));
});
