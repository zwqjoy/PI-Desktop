import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Field, Input, Panel, Select } from "../../components/ui";
import { useAppStore } from "../../stores/app-store";
import { projectIsArchived } from "../../lib/sidebar-preferences";
import { BUSINESS_TEMPLATES, projectSummary } from "./model";
import { prepareWorkspaceTask } from "./task-draft";
import { useWorkspaceHub } from "./useWorkspaceHub";
import "./workspace-hub.css";

export function ProjectDashboard() {
  const { t } = useTranslation();
  const hub = useWorkspaceHub();
  const sessions = useAppStore((state) => state.sessions);
  const metadata = useAppStore((state) => state.projectMeta);
  const store = useAppStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [title, setTitle] = useState("");
  const [actionError, setActionError] = useState("");
  const projects = hub.projects.filter(
    (project) => !projectIsArchived(project.primaryPath, metadata),
  );
  const chosen = projects.find((project) => project.id === selected);
  const execute = async (task: () => Promise<unknown>) => {
    try {
      setActionError("");
      await task();
    } catch (cause) {
      setActionError(String(cause));
    }
  };
  if (!hub.snapshot)
    return (
      <div className="route-scroll page-frame">
        {hub.error ? (
          <p role="alert">{hub.error}</p>
        ) : (
          <p role="status">{t("app.loadingView")}</p>
        )}
        <Button onClick={() => void hub.reload()}>
          {t("workspaceHub.reload")}
        </Button>
      </div>
    );
  const snapshot = hub.snapshot;
  const pending = snapshot.workItems.filter(
    (item) =>
      item.status !== "done" &&
      item.status !== "cancelled" &&
      projects.some((project) => project.id === item.projectId),
  );
  return (
    <div className="route-scroll">
      <main className="page-frame hub-frame">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("workspaceHub.dashboard")}</h1>
            <p className="dest-row-meta">
              {t("workspaceHub.dashboardDescription")}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() =>
              useAppStore.setState({ createProjectDialogOpen: true })
            }
          >
            {t("workspaceHub.createProject")}
          </Button>
        </header>
        {hub.error || actionError ? (
          <p role="alert">
            {hub.error || actionError}
            <Button disabled={hub.busy} onClick={() => void hub.reload()}>
              {t("workspaceHub.reload")}
            </Button>
          </p>
        ) : null}
        <div className="hub-stats">
          <Panel>
            <strong>{projects.length}</strong>
            <span>{t("workspaceHub.projects")}</span>
          </Panel>
          <Panel>
            <strong>{pending.length}</strong>
            <span>{t("workspaceHub.pending")}</span>
          </Panel>
          <Panel>
            <strong>{snapshot.documents.length}</strong>
            <span>{t("workspaceHub.documents")}</span>
          </Panel>
        </div>
        <section aria-labelledby="hub-projects">
          <div className="hub-section-heading">
            <h2 id="hub-projects">{t("workspaceHub.recentProjects")}</h2>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t("workspaceHub.searchProjects")}
              placeholder={t("workspaceHub.searchProjects")}
            />
          </div>
          <div className="hub-project-grid">
            {projects
              .filter((project) =>
                project.name
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase()),
              )
              .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
              .map((project) => {
                const summary = projectSummary(snapshot, project, sessions);
                return (
                  <Panel key={project.id}>
                    <h3>{project.name}</h3>
                    <p className="hub-path selectable">{project.primaryPath}</p>
                    <p>
                      {t("workspaceHub.progress", {
                        done: summary.done,
                        total: summary.total,
                      })}
                    </p>
                    {summary.total > 0 ? (
                      <progress
                        value={summary.done}
                        max={summary.total}
                        aria-label={t("workspaceHub.progress", {
                          done: summary.done,
                          total: summary.total,
                        })}
                      />
                    ) : null}
                    <p>
                      {t("workspaceHub.projectCounts", {
                        sessions: summary.sessions,
                        documents: summary.documents,
                      })}
                    </p>
                    <p>
                      {t("workspaceHub.owner")}:{" "}
                      {summary.assignees.join(", ") ||
                        t("workspaceHub.unassigned")}
                    </p>
                    <div className="hub-actions">
                      <Button
                        onClick={() =>
                          void execute(async () => {
                            const workspace = await store.activateProject(project.primaryPath);
                            if (workspace) store.setPage("chat");
                          })
                        }
                      >
                        {t("workspaceHub.openProject")}
                      </Button>
                      <Button onClick={() => setSelected(project.id)}>
                        {t("workspaceHub.manageWork")}
                      </Button>
                      <Button
                        onClick={() =>
                          void execute(() =>
                            prepareWorkspaceTask(project.primaryPath, ""),
                          )
                        }
                      >
                        {t("nav.newTask")}
                      </Button>
                    </div>
                  </Panel>
                );
              })}
          </div>
          {projects.length === 0 ? <p>{t("workspaceHub.noProjects")}</p> : null}
        </section>
        <section aria-labelledby="hub-work">
          <h2 id="hub-work">{t("workspaceHub.pending")}</h2>
          <form
            className="hub-actions"
            onSubmit={(event) => {
              event.preventDefault();
              if (selected && title.trim())
                void hub
                  .change({ kind: "addWorkItem", projectId: selected, title })
                  .then((ok) => {
                    if (ok) setTitle("");
                  });
            }}
          >
            <Select
              value={selected}
              aria-label={t("workspaceHub.project")}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">{t("workspaceHub.chooseProject")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Input
              value={title}
              aria-label={t("workspaceHub.workTitle")}
              placeholder={t("workspaceHub.workTitle")}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={hub.busy || !selected || !title.trim()}
            >
              {t("workspaceHub.addWork")}
            </Button>
          </form>
          {snapshot.workItems
            .filter((item) =>
              selected
                ? item.projectId === selected
                : pending.some((entry) => entry.id === item.id),
            )
            .map((item) => (
              <Panel key={item.id} className="hub-work-row">
                <span className="selectable">{item.title}</span>
                <span className="dest-row-meta">
                  {
                    projects.find((project) => project.id === item.projectId)
                      ?.name
                  }
                </span>
                <Select
                  aria-label={t("workspaceHub.status")}
                  value={item.status}
                  disabled={hub.busy}
                  onChange={(event) => {
                    const status = event.target.value;
                    if (
                      status === "todo" ||
                      status === "doing" ||
                      status === "review" ||
                      status === "done" ||
                      status === "cancelled"
                    )
                      void hub.change({
                        kind: "updateWorkItem",
                        id: item.id,
                        status,
                        assignee: item.assignee,
                      });
                  }}
                >
                  {["todo", "doing", "review", "done", "cancelled"].map(
                    (status) => (
                      <option key={status} value={status}>
                        {t(`workspaceHub.${status}`)}
                      </option>
                    ),
                  )}
                </Select>
                <Input
                  key={`${item.id}-${item.revision}`}
                  defaultValue={item.assignee}
                  maxLength={255}
                  aria-label={t("workspaceHub.owner")}
                  placeholder={t("workspaceHub.unassigned")}
                  disabled={hub.busy}
                  onBlur={(event) => {
                    if (event.target.value !== item.assignee)
                      void hub.change({
                        kind: "updateWorkItem",
                        id: item.id,
                        status: item.status,
                        assignee: event.target.value,
                      });
                  }}
                />
                <Button
                  onClick={() =>
                    void execute(() =>
                      prepareWorkspaceTask(
                        projects.find(
                          (project) => project.id === item.projectId,
                        )?.primaryPath ?? null,
                        item.title,
                      ),
                    )
                  }
                >
                  {t("nav.newTask")}
                </Button>
              </Panel>
            ))}
          {pending.length === 0 && !selected ? (
            <p className="dest-row-meta">{t("workspaceHub.noPending")}</p>
          ) : null}
        </section>
        <section aria-labelledby="hub-templates">
          <h2 id="hub-templates">{t("workspaceHub.templates")}</h2>
          <Field label={t("workspaceHub.templateProject")}>
            <Select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">{t("workspaceHub.chooseProject")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="hub-actions">
            {BUSINESS_TEMPLATES.map((template) => (
              <Button
                disabled={!chosen}
                key={template}
                onClick={() =>
                  void execute(() =>
                    prepareWorkspaceTask(
                      chosen?.primaryPath ?? null,
                      t(`workspaceHub.templatePrompts.${template}`),
                    ),
                  )
                }
              >
                {t(`workspaceHub.templateNames.${template}`)}
              </Button>
            ))}
          </div>
        </section>
        <section aria-labelledby="hub-documents">
          <div className="hub-section-heading">
            <h2 id="hub-documents">{t("workspaceHub.recentDocuments")}</h2>
            <Button onClick={() => store.setPage("library")}>
              {t("workspaceHub.library")}
            </Button>
          </div>
          {snapshot.documents
            .slice()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 6)
            .map((doc) => (
              <p key={doc.id}>
                {doc.name}{" "}
                <span className="dest-row-meta">
                  {hub.projects.find((project) => project.id === doc.projectId)
                    ?.name || t("workspaceHub.noProject")}
                </span>
              </p>
            ))}
        </section>
      </main>
    </div>
  );
}
