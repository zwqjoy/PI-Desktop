import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Field,
  Input,
  Panel,
  Select,
  Textarea,
} from "../../components/ui";
import { bytesToBase64, searchLibrary } from "./model";
import { prepareWorkspaceTask } from "./task-draft";
import { useWorkspaceHub } from "./useWorkspaceHub";
import type { LibraryDocument, LibraryRevision } from "@pi-desktop/shared";
import "./workspace-hub.css";

function downloadOriginal(doc: LibraryDocument, revision: LibraryRevision) {
  const bytes = Uint8Array.from(atob(revision.originalBase64), (value) =>
    value.charCodeAt(0),
  );
  // Always download; imported HTML and SVG never execute in the renderer.
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/octet-stream" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = doc.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DocumentEditor({
  doc,
  hub,
}: {
  doc: LibraryDocument;
  hub: ReturnType<typeof useWorkspaceHub>;
}) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState(
    doc.draft ?? doc.revisions.at(-1)?.text ?? "",
  );
  const [folder, setFolder] = useState(doc.folder);
  const [projectId, setProjectId] = useState(doc.projectId ?? "");
  const [revisionNumber, setRevisionNumber] = useState(doc.revision);
  const [error, setError] = useState("");
  const revision =
    doc.revisions.find((entry) => entry.number === revisionNumber) ??
    doc.revisions[doc.revisions.length - 1];
  const editable = revision.text !== null;
  const task = async () => {
    try {
      setError("");
      const project = hub.projects.find((entry) => entry.id === doc.projectId);
      await prepareWorkspaceTask(
        project?.primaryPath ?? null,
        `${t("workspaceHub.referencePrompt", { name: doc.name, revision: revision.number })}\n\n${revision.text ?? ""}`,
      );
    } catch (cause) {
      setError(String(cause));
    }
  };
  return (
    <Panel className="hub-editor">
      <h2 className="selectable">{doc.name}</h2>
      {error ? <p role="alert">{error}</p> : null}
      <div className="hub-actions">
        <Field label={t("workspaceHub.project")}>
          <Select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">{t("workspaceHub.noProject")}</option>
            {hub.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("workspaceHub.folder")}>
          <Input
            value={folder}
            maxLength={255}
            onChange={(event) => setFolder(event.target.value)}
          />
        </Field>
        <Button
          disabled={hub.busy}
          onClick={() =>
            void hub.change({
              kind: "associate",
              id: doc.id,
              projectId: projectId || null,
              folder,
            })
          }
        >
          {t("workspaceHub.saveAssociation")}
        </Button>
      </div>
      <Field label={t("workspaceHub.revision")}>
        <Select
          value={revisionNumber}
          onChange={(event) => setRevisionNumber(Number(event.target.value))}
        >
          {doc.revisions
            .slice()
            .reverse()
            .map((entry) => (
              <option key={entry.number} value={entry.number}>
                {t("workspaceHub.revisionNumber", { number: entry.number })} ·{" "}
                {new Date(entry.createdAt).toLocaleString(i18n.language)}
              </option>
            ))}
        </Select>
      </Field>
      {editable ? (
        <>
          <Field
            label={
              revisionNumber === doc.revision
                ? t("workspaceHub.draft")
                : t("workspaceHub.publishedText")
            }
          >
            <Textarea
              className="hub-document-text selectable"
              value={
                revisionNumber === doc.revision ? text : (revision.text ?? "")
              }
              readOnly={revisionNumber !== doc.revision}
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
          <div className="hub-actions">
            <Button
              disabled={hub.busy || revisionNumber !== doc.revision}
              onClick={() =>
                void hub.change({ kind: "draft", id: doc.id, text })
              }
            >
              {t("workspaceHub.saveDraft")}
            </Button>
            <Button
              variant="primary"
              disabled={
                hub.busy ||
                doc.draft === null ||
                text !== doc.draft ||
                revisionNumber !== doc.revision
              }
              onClick={() => void hub.change({ kind: "publish", id: doc.id })}
            >
              {t("workspaceHub.publish")}
            </Button>
            <Button disabled={hub.busy} onClick={() => void task()}>
              {t("workspaceHub.useInTask")}
            </Button>
          </div>
        </>
      ) : (
        <p>{t("workspaceHub.binaryDescription")}</p>
      )}
      <div className="hub-actions">
        <Button onClick={() => downloadOriginal(doc, revision)}>
          {t("workspaceHub.downloadOriginal")}
        </Button>
        <Button
          disabled={hub.busy}
          onClick={() => {
            if (
              window.confirm(
                t("workspaceHub.removeConfirm", { name: doc.name }),
              )
            )
              void hub.change({ kind: "remove", id: doc.id });
          }}
        >
          {t("workspaceHub.remove")}
        </Button>
      </div>
    </Panel>
  );
}

export function DocumentLibrary() {
  const { t, i18n } = useTranslation();
  const hub = useWorkspaceHub();
  const picker = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [folder, setFolder] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const lifetime = useRef(0);
  useEffect(
    () => () => {
      lifetime.current++;
    },
    [],
  );
  // A file-read continuation is cancelled when this page unmounts.
  const importFile = async (file: File) => {
    if (file.size > 1024 * 1024) {
      setError(t("workspaceHub.fileLimit"));
      return;
    }
    const request = ++lifetime.current;
    const association = { projectId: projectId || null, folder };
    setImporting(true);
    setError("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (request !== lifetime.current) return;
      await hub.change({
        kind: "import",
        name: file.name,
        ...association,
        mediaType: file.type || "application/octet-stream",
        originalBase64: bytesToBase64(bytes),
      });
    } catch (cause) {
      if (request === lifetime.current) setError(String(cause));
    } finally {
      if (request === lifetime.current) setImporting(false);
    }
  };
  const documents = hub.snapshot?.documents ?? [];
  const visible = searchLibrary(documents, query, projectId, folder);
  const selected = documents.find((doc) => doc.id === selectedId);
  return (
    <div className="route-scroll">
      <main className="page-frame hub-frame">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("workspaceHub.library")}</h1>
            <p className="dest-row-meta">
              {t("workspaceHub.libraryDescription")}
            </p>
          </div>
          <div className="hub-actions">
            <Button
              disabled={hub.busy || importing || !hub.snapshot}
              onClick={() => picker.current?.click()}
            >
              {t("workspaceHub.import")}
            </Button>
            <Button
              disabled={hub.busy || !hub.snapshot}
              onClick={() =>
                void hub.change({
                  kind: "import",
                  name: t("workspaceHub.newDocumentName"),
                  folder,
                  projectId: projectId || null,
                  mediaType: "text/markdown",
                  originalBase64: "",
                })
              }
            >
              {t("workspaceHub.newDocument")}
            </Button>
          </div>
        </header>
        <Input
          ref={picker}
          type="file"
          className="hub-file-picker"
          aria-label={t("workspaceHub.import")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void importFile(file);
          }}
        />
        {hub.error || error ? <p role="alert">{hub.error || error}</p> : null}
        <div className="hub-toolbar">
          <Input
            aria-label={t("workspaceHub.searchDocuments")}
            placeholder={t("workspaceHub.searchDocuments")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            aria-label={t("workspaceHub.project")}
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">{t("workspaceHub.allProjects")}</option>
            {hub.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label={t("workspaceHub.folder")}
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
          >
            <option value="">{t("workspaceHub.allFolders")}</option>
            {[
              ...new Set(documents.map((doc) => doc.folder).filter(Boolean)),
            ].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </Select>
          <Button
            disabled={hub.busy || importing}
            onClick={() => void hub.reload()}
          >
            {t("workspaceHub.reload")}
          </Button>
        </div>
        {hub.busy || importing ? (
          <p role="status">{t("app.loadingView")}</p>
        ) : null}
        <Panel className="hub-file-list">
          <table>
            <thead>
              <tr>
                {["name", "type", "size", "updated", "project", "folder"].map(
                  (key) => (
                    <th key={key} scope="col">
                      {t(`workspaceHub.${key}`)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((doc) => (
                <tr
                  key={doc.id}
                  className={selectedId === doc.id ? "active" : ""}
                >
                  <td>
                    <Button
                      variant="ghost"
                      aria-pressed={selectedId === doc.id}
                      onClick={() => setSelectedId(doc.id)}
                    >
                      {doc.name}
                    </Button>
                  </td>
                  <td>{doc.name.split(".").pop()?.toUpperCase()}</td>
                  <td>
                    {new Intl.NumberFormat(i18n.language, {
                      style: "unit",
                      unit: "byte",
                      unitDisplay: "short",
                    }).format(doc.revisions.at(-1)?.byteLength ?? 0)}
                  </td>
                  <td>
                    {new Date(doc.updatedAt).toLocaleString(i18n.language)}
                  </td>
                  <td>
                    {hub.projects.find(
                      (project) => project.id === doc.projectId,
                    )?.name || t("workspaceHub.noProject")}
                  </td>
                  <td>{doc.folder || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && hub.snapshot ? (
            <p>{t("workspaceHub.noDocuments")}</p>
          ) : null}
        </Panel>
        {selected ? (
          <DocumentEditor
            key={`${selected.id}-${selected.revision}`}
            doc={selected}
            hub={hub}
          />
        ) : null}
      </main>
    </div>
  );
}
