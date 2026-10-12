"use strict";

const MAX_SOURCE_BYTES = 512 * 1024;
const MAX_ACTION_BYTES = 16 * 1024;

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Refuse secret-collection controls before either render channel is entered. */
function assertNoSecrets(spec) {
  const pending = [spec];
  let visited = 0;
  while (pending.length) {
    if (++visited > 10000) throw new Error("GenUI input exceeds the traversal budget");
    const value = pending.pop();
    if (Array.isArray(value)) pending.push(...value);
    else if (record(value)) {
      if (value.type === "input" && (value.inputType === "password" || value.kind === "password")) {
        throw new Error("GenUI must not collect passwords or other secrets");
      }
      pending.push(...Object.values(value));
    }
  }
}

/** An action carries its message's original session, never the selected session. */
function actionRequest(input) {
  if (!record(input) || typeof input.sessionId !== "string" || !input.sessionId.trim()
    || typeof input.messageId !== "string" || !input.messageId
    || typeof input.action !== "string" || !input.action.trim() || input.action.length > 120
    || !record(input.payload)) throw new Error("Invalid GenUI action");
  const encoded = JSON.stringify(input.payload);
  if (Buffer.byteLength(encoded, "utf8") > MAX_ACTION_BYTES) throw new Error("GenUI action is too large");
  return {
    sessionId: input.sessionId,
    content: `[genui-action] ${JSON.stringify({ action: input.action, messageId: input.messageId, fenceId: input.fenceId, payload: input.payload })}`,
  };
}

module.exports = { MAX_SOURCE_BYTES, assertNoSecrets, actionRequest };
