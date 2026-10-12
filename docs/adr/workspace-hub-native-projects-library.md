# ADR: Native Project Dashboard and Document Library

- Status: Accepted
- Date: 2026-10-12

## Context

T-Work's dashboard and library use a different plugin framework and persistence
model. Copying that runtime would create another project and session authority
inside PI-Desktop. The desktop already owns logical project groups in Rust.

## Decision

Implement native renderer destinations over existing project groups and session
flows. Add a bounded, versioned `workspaceHub` Host domain for planning items and
library metadata. Two typed allowlisted IPC operations read the snapshot and
apply a validated command with an expected revision. Electron only forwards;
Rust serializes changes through the existing state mutex and exclusively owns
SQLite and file payloads. No generic arbitrary-RPC channel is introduced.

Use the existing kv extension for metadata. Store immutable original/revision
bytes and saved drafts in a Host-owned relative `library` directory, publishing
flushed files before the index write. The schema and handshake versions remain
unchanged. Library content is never evaluated as code. Task references become
explicit, reviewable Composer text snapshots and do not widen tool access.

## Alternatives and consequences

- Port T-Work plugins verbatim: rejected because the DSH runtime and project
  identity do not match PI-Desktop's authorities and plugin contract.
- Create relational tables immediately: deferred; this bounded first iteration
  uses the existing versioned extension boundary, like logical project groups.
- Load Office previews in the renderer: deferred; originals download safely and
  no new execution or file-permission boundary is needed.

Existing projects/data remain untouched; new records are profile-local. A single
snapshot revision prevents lost updates across windows. Bounded snapshots make
reads predictable, but the first iteration deliberately has modest quotas and
no automatic garbage collection of recovery files. Future scaling needs indexed
metadata/paged reads and explicit payload retention, with compatibility handling
for the version-1 records.

The renderer New Task workflow additionally returns its admitted session ID (or
null when superseded). Existing consumers ignore that additive return value;
the new draft service uses it to avoid injecting content after navigation changes.
It appends to a reused unsent draft and preserves attachment references.
