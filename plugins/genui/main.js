"use strict";

const { processGenuiSpec, isRenderableProcess } = require("./runtime/guard.cjs");
const { MAX_SOURCE_BYTES, assertNoSecrets, actionRequest } = require("./src/policy.js");

function validate(input) {
  const text = JSON.stringify(input);
  if (typeof text !== "string" || Buffer.byteLength(text, "utf8") > MAX_SOURCE_BYTES) {
    throw new Error("GenUI spec is missing or too large");
  }
  assertNoSecrets(input);
  const result = processGenuiSpec(input);
  assertNoSecrets(result.spec);
  return { ok: isRenderableProcess(result), spec: result.spec, errors: result.errors, warnings: result.warnings, renderedCount: result.renderedCount };
}

function textResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

async function onLoad() {
  for (const name of ["render_ui", "validate_dsh_ui"]) {
    await pi.agent.registerTool({
      name,
      description: name === "render_ui" ? "Render a validated GenUI spec inline." : "Validate a GenUI spec.",
      risk: "low",
      schema: { type: "object", properties: { spec: {} }, required: ["spec"] },
      execute(args) {
        const result = validate(args?.spec);
        if (name === "render_ui" && !result.ok) throw new Error(result.errors.join("; "));
        return textResult(result);
      },
    });
  }
}

async function onRendererCall(method, args) {
  if (method === "locale") return { locale: await pi.app.getLocale() };
  if (method !== "action") throw new Error("Unknown GenUI renderer method");
  const request = actionRequest(args);
  // Use the existing permission-gated admission path. Errors reach the block.
  // No file outbox, sidecar polling, implicit retries or cross-session globals.
  await pi.desktop.invoke({ operation: "agent/prompt", args: [request] });
  return { accepted: true };
}

module.exports = { onLoad, onRendererCall, validate };
