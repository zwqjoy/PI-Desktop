//! Bounded, profile-local planning and library extension records.
//! All changes are serialized by the existing Host state mutex.
use crate::db::Database;
use anyhow::{bail, Context, Result};
use base64::{engine::general_purpose::STANDARD, Engine};
use serde::{Deserialize, Serialize};
#[cfg(test)]
use serde_json::json;
use serde_json::Value;

const MAX_FILE: usize = 1024 * 1024;
const MAX_RECORD: usize = 16 * 1024 * 1024;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Revision {
    number: u64,
    payload_id: String,
    text: Option<String>,
    original_base64: String,
    byte_length: usize,
    created_at: i64,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Document {
    id: String,
    name: String,
    folder: String,
    project_id: Option<String>,
    media_type: String,
    revision: u64,
    updated_at: i64,
    revisions: Vec<Revision>,
    draft: Option<String>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkItem {
    id: String,
    project_id: String,
    title: String,
    status: String,
    assignee: String,
    revision: u64,
    updated_at: i64,
}
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Snapshot {
    version: u64,
    revision: u64,
    documents: Vec<Document>,
    work_items: Vec<WorkItem>,
}
#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
enum Command {
    #[serde(rename_all = "camelCase")]
    Import {
        name: String,
        folder: String,
        project_id: Option<String>,
        media_type: String,
        original_base64: String,
    },
    Draft {
        id: String,
        text: String,
    },
    Publish {
        id: String,
    },
    #[serde(rename_all = "camelCase")]
    Associate {
        id: String,
        project_id: Option<String>,
        folder: String,
    },
    Remove {
        id: String,
    },
    #[serde(rename_all = "camelCase")]
    AddWorkItem {
        project_id: String,
        title: String,
    },
    UpdateWorkItem {
        id: String,
        status: String,
        assignee: String,
    },
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Change {
    expected_revision: u64,
    command: Command,
}

fn label(value: &str, limit: usize) -> Result<String> {
    let value = value.trim();
    if value.is_empty() || value.len() > limit || value.chars().any(char::is_control) {
        bail!("INVALID_PARAMS: invalid label");
    }
    Ok(value.to_owned())
}
fn project(db: &Database, id: &Option<String>) -> Result<()> {
    if let Some(id) = id {
        if !db
            .list_project_groups()?
            .iter()
            .any(|group| &group.id == id)
        {
            bail!("INVALID_PARAMS: project does not exist");
        }
    }
    Ok(())
}
fn document<'a>(snapshot: &'a mut Snapshot, id: &str) -> Result<&'a mut Document> {
    snapshot
        .documents
        .iter_mut()
        .find(|doc| doc.id == id)
        .context("INVALID_PARAMS: document does not exist")
}
fn load(db: &Database) -> Result<Snapshot> {
    let mut snapshot: Snapshot = match db.kv_get("workspaceHub", "v1")? {
        Some(value) => serde_json::from_value(value)?,
        None => Snapshot {
            version: 1,
            revision: 0,
            documents: vec![],
            work_items: vec![],
        },
    };
    if snapshot.version != 1 {
        bail!("Unsupported workspace hub version");
    }
    for doc in &mut snapshot.documents {
        uuid::Uuid::parse_str(&doc.id).context("Invalid library document id")?;
        let directory = payload_directory(db, &doc.id, false)?;
        for revision in &mut doc.revisions {
            uuid::Uuid::parse_str(&revision.payload_id).context("Invalid library payload id")?;
            let bytes = read_payload(&directory.join(format!("{}.bin", revision.payload_id)))?;
            revision.original_base64 = STANDARD.encode(&bytes);
            if revision.text.is_some() {
                revision.text = Some(String::from_utf8(bytes)?);
            }
        }
        if doc.draft.is_some() {
            doc.draft = Some(String::from_utf8(read_payload(
                &directory.join(format!("draft-{}.txt", snapshot.revision)),
            )?)?);
        }
    }
    Ok(snapshot)
}

fn payload_directory(db: &Database, id: &str, create: bool) -> Result<std::path::PathBuf> {
    let root = db.data_dir.join("library");
    let directory = root.join(id);
    for path in [&root, &directory] {
        if create && !path.exists() {
            let mut builder = std::fs::DirBuilder::new();
            #[cfg(unix)]
            {
                use std::os::unix::fs::DirBuilderExt;
                builder.mode(0o700);
            }
            builder.create(path)?;
        }
        let metadata = std::fs::symlink_metadata(path)?;
        if !metadata.is_dir() || metadata.file_type().is_symlink() {
            bail!("Library payload directory must be a real directory");
        }
    }
    Ok(directory)
}
fn read_payload(path: &std::path::Path) -> Result<Vec<u8>> {
    let metadata = std::fs::symlink_metadata(path)?;
    if !metadata.is_file() || metadata.file_type().is_symlink() || metadata.len() > MAX_FILE as u64
    {
        bail!("Invalid library payload file");
    }
    Ok(std::fs::read(path)?)
}

fn write_payload(path: &std::path::Path, bytes: &[u8]) -> Result<()> {
    use std::io::Write;
    let temp = path.with_extension(format!("{}.tmp", uuid::Uuid::new_v4()));
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(&temp)?;
    file.write_all(bytes)?;
    file.sync_all()?;
    std::fs::rename(temp, path)?;
    Ok(())
}

pub fn handle(db: &Database, method: &str, params: Value) -> Result<Value> {
    let mut snapshot = load(db)?;
    if method == "workspaceHub.read" {
        return Ok(serde_json::to_value(snapshot)?);
    }
    if method != "workspaceHub.change" {
        bail!("INVALID_PARAMS: unknown workspace hub method");
    }
    let input: Change =
        serde_json::from_value(params).context("INVALID_PARAMS: invalid workspace hub command")?;
    if input.expected_revision != snapshot.revision {
        bail!("CONFLICT: workspace changed; reload before saving");
    }
    let now = crate::db::now_ms();
    match input.command {
        Command::Import {
            name,
            folder,
            project_id,
            media_type,
            original_base64,
        } => {
            if snapshot.documents.len() >= 100 {
                bail!("LIMIT_EXCEEDED: library document limit");
            }
            let name = label(&name, 255)?;
            let folder = if folder.trim().is_empty() {
                String::new()
            } else {
                label(&folder, 255)?
            };
            let media_type = label(&media_type, 100)?;
            project(db, &project_id)?;
            if original_base64.len() > MAX_FILE * 4 / 3 + 4 {
                bail!("LIMIT_EXCEEDED: file exceeds 1 MiB");
            }
            let bytes = STANDARD
                .decode(&original_base64)
                .context("INVALID_PARAMS: invalid file encoding")?;
            if bytes.len() > MAX_FILE {
                bail!("LIMIT_EXCEEDED: file exceeds 1 MiB");
            }
            let extension = name.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
            let editable = matches!(
                extension.as_str(),
                "md" | "txt" | "csv" | "json" | "html" | "htm"
            );
            let text = if editable {
                Some(
                    String::from_utf8(bytes.clone())
                        .context("INVALID_PARAMS: text must be UTF-8")?,
                )
            } else {
                None
            };
            snapshot.documents.push(Document {
                id: uuid::Uuid::new_v4().to_string(),
                name,
                folder,
                project_id,
                media_type,
                revision: 1,
                updated_at: now,
                draft: None,
                revisions: vec![Revision {
                    number: 1,
                    payload_id: uuid::Uuid::new_v4().to_string(),
                    text,
                    original_base64: STANDARD.encode(&bytes),
                    byte_length: bytes.len(),
                    created_at: now,
                }],
            });
        }
        Command::Draft { id, text } => {
            if text.len() > MAX_FILE {
                bail!("LIMIT_EXCEEDED: draft exceeds 1 MiB");
            }
            let doc = document(&mut snapshot, &id)?;
            if doc
                .revisions
                .last()
                .and_then(|rev| rev.text.as_ref())
                .is_none()
            {
                bail!("INVALID_PARAMS: binary documents cannot be edited");
            }
            doc.draft = Some(text);
            doc.updated_at = now;
        }
        Command::Publish { id } => {
            let doc = document(&mut snapshot, &id)?;
            if doc.revisions.len() >= 20 {
                bail!("LIMIT_EXCEEDED: revision limit");
            }
            let text = doc.draft.take().context("INVALID_PARAMS: no saved draft")?;
            doc.revision += 1;
            doc.updated_at = now;
            doc.revisions.push(Revision {
                number: doc.revision,
                payload_id: uuid::Uuid::new_v4().to_string(),
                original_base64: STANDARD.encode(text.as_bytes()),
                byte_length: text.len(),
                text: Some(text),
                created_at: now,
            });
        }
        Command::Associate {
            id,
            project_id,
            folder,
        } => {
            project(db, &project_id)?;
            let folder = if folder.trim().is_empty() {
                String::new()
            } else {
                label(&folder, 255)?
            };
            let doc = document(&mut snapshot, &id)?;
            doc.project_id = project_id;
            doc.folder = folder;
            doc.updated_at = now;
        }
        Command::Remove { id } => {
            document(&mut snapshot, &id)?;
            snapshot.documents.retain(|doc| doc.id != id);
        }
        Command::AddWorkItem { project_id, title } => {
            project(db, &Some(project_id.clone()))?;
            if snapshot.work_items.len() >= 1000 {
                bail!("LIMIT_EXCEEDED: work item limit");
            }
            snapshot.work_items.push(WorkItem {
                id: uuid::Uuid::new_v4().to_string(),
                project_id,
                title: label(&title, 500)?,
                status: "todo".to_owned(),
                assignee: String::new(),
                revision: 1,
                updated_at: now,
            });
        }
        Command::UpdateWorkItem {
            id,
            status,
            assignee,
        } => {
            if !matches!(
                status.as_str(),
                "todo" | "doing" | "review" | "done" | "cancelled"
            ) {
                bail!("INVALID_PARAMS: invalid work status");
            }
            let assignee = if assignee.trim().is_empty() {
                String::new()
            } else {
                label(&assignee, 255)?
            };
            let item = snapshot
                .work_items
                .iter_mut()
                .find(|item| item.id == id)
                .context("INVALID_PARAMS: work item does not exist")?;
            item.status = status;
            item.assignee = assignee;
            item.revision += 1;
            item.updated_at = now;
        }
    }
    snapshot.revision += 1;
    let value = serde_json::to_value(snapshot)?;
    if value.to_string().len() > MAX_RECORD {
        bail!("LIMIT_EXCEEDED: library storage exceeds 16 MiB");
    }
    // Publish immutable payloads before atomically replacing the SQLite index.
    // A failed index commit leaves only unreferenced files, never broken records.
    let mut index = serde_json::from_value::<Snapshot>(value.clone())?;
    for doc in &mut index.documents {
        let directory = payload_directory(db, &doc.id, true)?;
        for revision in &mut doc.revisions {
            let path = directory.join(format!("{}.bin", revision.payload_id));
            if !path.exists() {
                let bytes = STANDARD.decode(&revision.original_base64)?;
                write_payload(&path, &bytes)?;
            }
            revision.original_base64.clear();
            if revision.text.is_some() {
                revision.text = Some(String::new());
            }
        }
        if let Some(draft) = &mut doc.draft {
            write_payload(
                &directory.join(format!("draft-{}.txt", index.revision)),
                draft.as_bytes(),
            )?;
            draft.clear();
        }
    }
    db.kv_set("workspaceHub", "v1", &serde_json::to_value(index)?)?;
    Ok(value)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn library_user_path_survives_restart_and_preserves_original_revisions() -> Result<()> {
        let dir = tempfile::tempdir()?;
        let db = Database::open_in_dir(dir.path())?;
        let state = handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":0,"command":{"kind":"import","name":"note.md","folder":"Notes","projectId":null,"mediaType":"text/markdown","originalBase64":STANDARD.encode("original")}}),
        )?;
        let id = state["documents"][0]["id"].as_str().context("id")?;
        let draft =
            json!({"expectedRevision":1,"command":{"kind":"draft","id":id,"text":"revised"}});
        handle(&db, "workspaceHub.change", draft.clone())?;
        assert!(handle(&db, "workspaceHub.change", draft).is_err());
        let state = handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":2,"command":{"kind":"publish","id":id}}),
        )?;
        assert_eq!(state["documents"][0]["revisions"][0]["text"], "original");
        assert_eq!(state["documents"][0]["revisions"][1]["text"], "revised");
        drop(db);
        let db = Database::open_in_dir(dir.path())?;
        assert_eq!(handle(&db, "workspaceHub.read", json!({}))?, state);
        let removed = handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":3,"command":{"kind":"remove","id":id}}),
        )?;
        assert_eq!(removed["documents"], json!([]));
        Ok(())
    }
    #[test]
    fn rejects_invalid_imports_and_unknown_project_without_mutation() -> Result<()> {
        let dir = tempfile::tempdir()?;
        let db = Database::open_in_dir(dir.path())?;
        for command in [
            json!({"kind":"import","name":"note.md","folder":"","projectId":null,"mediaType":"text/plain","originalBase64":"bad!"}),
            json!({"kind":"addWorkItem","projectId":"missing","title":"Task"}),
            json!({"kind":"import","name":"note.md","folder":"","projectId":null,"mediaType":"text/plain","originalBase64":STANDARD.encode(vec![0;MAX_FILE+1])}),
        ] {
            assert!(handle(
                &db,
                "workspaceHub.change",
                json!({"expectedRevision":0,"command":command})
            )
            .is_err());
        }
        assert_eq!(handle(&db, "workspaceHub.read", json!({}))?["revision"], 0);
        Ok(())
    }
    #[test]
    fn failed_publication_cannot_reuse_an_orphan_as_a_different_revision() -> Result<()> {
        let dir = tempfile::tempdir()?;
        let db = Database::open_in_dir(dir.path())?;
        let imported = handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":0,"command":{"kind":"import","name":"note.md","folder":"","projectId":null,"mediaType":"text/plain","originalBase64":STANDARD.encode("original")}}),
        )?;
        let id = imported["documents"][0]["id"].as_str().context("id")?;
        handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":1,"command":{"kind":"draft","id":id,"text":"failed publish"}}),
        )?;
        db.conn.execute_batch("CREATE TEMP TRIGGER reject_hub_update BEFORE UPDATE ON kv WHEN NEW.ns = 'workspaceHub' BEGIN SELECT RAISE(FAIL, 'simulated index failure'); END;")?;
        assert!(handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":2,"command":{"kind":"publish","id":id}})
        )
        .is_err());
        db.conn.execute_batch("DROP TRIGGER reject_hub_update;")?;
        handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":2,"command":{"kind":"draft","id":id,"text":"successful publish"}}),
        )?;
        handle(
            &db,
            "workspaceHub.change",
            json!({"expectedRevision":3,"command":{"kind":"publish","id":id}}),
        )?;
        let recovered = handle(&db, "workspaceHub.read", json!({}))?;
        assert_eq!(
            recovered["documents"][0]["revisions"][1]["text"],
            "successful publish"
        );
        let index = db.kv_get("workspaceHub", "v1")?.context("index")?;
        assert_eq!(index["documents"][0]["revisions"][0]["originalBase64"], "");
        assert_eq!(index["documents"][0]["revisions"][1]["text"], "");
        Ok(())
    }

    #[cfg(unix)]
    #[test]
    fn library_symlink_cannot_redirect_import_outside_the_profile() -> Result<()> {
        let dir = tempfile::tempdir()?;
        let outside = tempfile::tempdir()?;
        let db = Database::open_in_dir(dir.path())?;
        std::os::unix::fs::symlink(outside.path(), dir.path().join("library"))?;
        assert!(handle(&db,"workspaceHub.change",json!({"expectedRevision":0,"command":{"kind":"import","name":"note.md","folder":"","projectId":null,"mediaType":"text/plain","originalBase64":STANDARD.encode("private")}})).is_err());
        assert_eq!(std::fs::read_dir(outside.path())?.count(), 0);
        assert_eq!(handle(&db, "workspaceHub.read", json!({}))?["revision"], 0);
        Ok(())
    }
}
