# Projects and Documents

Open **Project dashboard** in the sidebar to see active projects, pending work,
progress, and associated documents. Create projects with the existing folder
selection dialog. Select **Manage work** to add items, assign an owner, and change
status. Cancelled items do not count towards progress.

Choose a project beside **Business templates**, then choose a template to prepare
a task in the normal chat Composer. Review and complete the prompt before sending.
Existing model, skill and connector choices remain in the usual task controls.

Open **Document library** to import an original (up to 1 MiB) or create Markdown.
Select a row, enter a project and category, then save its association. Search
matches names and latest published text. Save text as a draft before publishing a
new revision. The revision selector lets you read/download previous originals.
**Use in new task** copies published text and its revision into an editable prompt.
Binary files are downloaded for their associated application; Office/PDF parsing
and embedded Office previews are not included.

Conflicting edits are rejected. Reload the library before retrying. Active
records are capped at 16 MiB serialized, 100 documents and 20 revisions each.
Removing a document hides its index record while its payloads remain in the local
profile for recovery. Back up the complete profile; do not copy only `pi.sqlite`.
