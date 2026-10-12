import { useAppStore } from "../../stores/app-store";
import {
  draftKeyForSession,
  readComposerDraft,
  writeComposerDraft,
} from "../../lib/composer-draft-cache";

/** Prepare a task for review in the existing Composer, without sending a model request. */
export async function prepareWorkspaceTask(
  projectPath: string | null,
  text: string,
): Promise<void> {
  const state = useAppStore.getState();
  const selectedId = await state.newSession({ projectPath });
  const next = useAppStore.getState();
  const session = next.sessions.find(
    (entry) => entry.id === next.activeSessionId,
  );
  if (
    !selectedId ||
    next.activeSessionId !== selectedId ||
    next.page !== "chat" ||
    !session ||
    (session.projectPath ?? null) !== projectPath ||
    next.messages.length > 0 ||
    next.isRunning
  )
    return;
  const key = draftKeyForSession(next.activeSessionId);
  const previous = readComposerDraft(key);
  const snapshot = {
    text: previous?.text && text ? `${previous.text}\n\n${text}` : previous?.text || text,
    fileReferences: previous?.fileReferences ?? [],
  };
  writeComposerDraft(key, snapshot, projectPath ?? undefined);
  useAppStore.setState({
    composerPrefill: {
      sessionId: next.activeSessionId ?? "",
      ...snapshot,
    },
  });
}
