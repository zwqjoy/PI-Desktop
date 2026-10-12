# Project Dashboard and Document Library

The sidebar exposes Project dashboard and Document library. These are native
renderer pages over existing Host-owned logical projects, not a second project
registry. Settings → Project archive retains its existing management behavior.

## Project dashboard

- Active project cards show names, roots, session counts across every root,
  linked-document counts, planning progress, and actually assigned owners.
- Progress counts completed work items and excludes cancelled items. No owner
  or progress is inferred from chat text. Unassigned owners are explicit.
- Users create projects through the existing project dialog, activate projects,
  add work items, change status and assignee, and open an existing task workflow.
- The pending list excludes archived projects and completed/cancelled items.
  Selecting a project exposes all of its work items for status changes.
- Six business templates prepare editable prompts in the existing Composer:
  requirements review, delivery, meeting notes, research, knowledge organization,
  and test acceptance. Preparing a task makes no model request and preserves
  existing unsent text and attachments when an empty session is reused.
- Recent documents link to the document-library destination.

## Document library

- Import one user-selected original file or create an empty Markdown document.
  The first iteration limits individual files to 1 MiB, active records to
  16 MiB serialized, documents to 100, and revisions to 20 per document.
- The file list shows name, extension, original bytes, updated time, project
  association, and folder/category. Associations use existing group identifiers;
  archived projects remain available. Missing/deleted projects appear unassigned.
- Filter by project/category and search names, categories, and latest published
  text. Unsaved drafts and superseded revisions do not change search results.
- UTF-8 Markdown, text, CSV, JSON and HTML are editable. Binary originals are
  preserved and downloadable; PDF/Office text extraction and in-app Office
  preview are outside this initial implementation.
- Save draft preserves unpublished content. Publish requires a saved draft and
  appends an immutable revision without replacing the original bytes. Older
  revisions are read-only. HTML/SVG content is never executed in the renderer.
- Use in new task copies the selected published text plus document name and
  revision into a Composer draft. This is an explicit content snapshot, not a
  dynamic library tool or an automatic model invocation.
- Removing a document removes the active index entry after confirmation. Its
  immutable payload files remain profile-local for recovery; no automatic purge
  is performed. The active library limit does not cap retained recovery bytes.

## Persistence and concurrency

Rust owns the `workspaceHub/v1` index in the existing SQLite kv extension and
`<profile>/library/<document UUID>/` payloads. No schema migration is required.
The index has an explicit version and monotonically increasing revision. Every
mutation supplies `expectedRevision`; stale writes fail without mutation and
require a reload. The Host validates commands, limits, UTF-8 and project IDs.
Files are flushed and atomically published before the single index replacement;
failed commits can leave unreferenced files but never index a partial payload.
Profile backup/storage migration carries both index and relative payload files.

Renderer async loads use generations and an unmount guard; mutation admission
prevents duplicate local submissions. Imported associations are captured before
file reads. Navigation, sessions, permissions, models, skills and MCP continue to
use existing PI-Desktop authorities. The renderer New Task workflow returns
the selected session ID or null for superseded admission; draft preparation
checks that receipt before touching any Composer state. Existing callers may
continue to ignore the return value. EN and zh-CN labels are provided; remaining
product locales initially inherit the English workspace catalog.

## Acceptance

`apps/desktop/test/workspace-hub-user-path.test.mjs` renders the production
components in a hidden, sandboxed Electron window with real preload, IPC adapter,
and isolated Rust Host. It covers progress, file import, draft/publication,
original revision, association, search and remount. Host regression tests cover
restart, stale writes, malformed import, unknown projects and file limits.
See [E2E workspace scenario](../06-delivery/04-e2e-test-plan.md#e2e-workspace-hub).
