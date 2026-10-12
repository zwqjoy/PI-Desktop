import React, { useEffect, useMemo, useState } from "react";
import { GenuiActionContext, ErrorBoundary, setGenuiAssetBase } from "@changfenhuang/dsh-genui/embed";
import { ExportableGenuiBlock } from "@upstream/artifact/ExportableGenuiBlock.tsx";
import { parsePartialGenuiSpec } from "@upstream/parse-partial.ts";
import { processGenuiSpec, partialRepairGenuiSpec } from "@upstream/guard.ts";
import { fenceStateKey } from "@upstream/interaction-store.ts";
import { setLocale, t } from "@upstream/i18n/runtime.ts";
import { assertNoSecrets } from "./policy.js";
import { sheets, hostTheme } from "./styles.js";
import { copy } from "./i18n.js";

let host;

function resolveSource(source) {
  if (source.length > 512 * 1024) return { error: "GenUI source is too large" };
  try {
    const parsed = parsePartialGenuiSpec(source);
    if (!parsed) return { spec: null };
    assertNoSecrets(parsed);
    const processed = processGenuiSpec(parsed);
    return { spec: partialRepairGenuiSpec(processed), errors: processed.errors };
  } catch (error) {
    return { error: error.message };
  }
}

/** A stable mount survives source growth; settled state is scoped to the original message. */
function Block({ source, sessionId, messageId, fenceId, closed = true, streaming = false }) {
  const result = useMemo(() => resolveSource(source), [source]);
  const [deliveryError, setDeliveryError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const mounted = React.useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const stateKey = closed && sessionId && messageId
    ? fenceStateKey(sessionId, `${messageId}:${fenceId}`, source) : undefined;
  const onAction = !streaming && closed && sessionId && messageId ? async (action, payload) => {
    setPendingCount(count => count + 1); setAccepted(false); setDeliveryError("");
    try {
      await host.dispatch("plugin.call", { method: "action", args: { sessionId, messageId, fenceId, action, payload } });
      if (mounted.current) setAccepted(true);
    } catch (error) {
      if (mounted.current) setDeliveryError(error.message);
    } finally {
      if (mounted.current) setPendingCount(count => count - 1);
    }
  } : undefined;
  return <div className="pi-genui" data-genui>
    <ErrorBoundary label="GenUI">
      {result.spec ? <GenuiActionContext.Provider value={onAction}>
        <ExportableGenuiBlock spec={result.spec} stateKey={stateKey} animateEntrance={streaming} exportEnabled={closed && !streaming} />
      </GenuiActionContext.Provider> : <>
        {closed && <div role="alert">{result.error || copy("error")}</div>}
        {closed && <pre>{source}</pre>}
      </>}
      {closed && result.spec && result.errors?.length > 0 && <details><summary>{t("label.code")}</summary><pre>{result.errors.join("\n")}\n{source}</pre></details>}
      {deliveryError && <div role="alert">{deliveryError}</div>}
      {pendingCount > 0 && <div role="status">{copy("sending")}</div>}
      {accepted && <div role="status">{copy("accepted")}</div>}
    </ErrorBoundary>
  </div>;
}

function ToolCard(props) {
  let result = props.toolResult;
  if (typeof result === "string") { try { result = JSON.parse(result); } catch { result = null; } }
  if (result?.content) {
    try { result = JSON.parse(result.content.filter(part => part.type === "text").map(part => part.text).join("\n")); }
    catch { result = null; }
  }
  if (props.toolStatus !== "success") return <div className="pi-genui" role="status">{props.toolStatus === "error" ? String(props.toolError ?? copy("error")) : copy("loading")}</div>;
  const spec = result?.spec ?? props.toolArgs?.spec;
  return <Block source={JSON.stringify(spec)} sessionId={props.sessionId} messageId={props.messageId} fenceId={props.toolCallId} />;
}

export async function onLoad(pi) {
  host = pi;
  setGenuiAssetBase(new URL("./assets/", import.meta.url).href);
  pi.ui.injectStyle([...sheets, hostTheme].join("\n"));
  const { locale } = await pi.dispatch("plugin.call", { method: "locale" });
  setLocale(locale);
  pi.slots.register({ slot: "blockRenderer", language: `${pi.plugin.id}:dsh-ui`, streaming: true, component: Block });
  pi.slots.register({ slot: "toolCard", toolName: "render_ui", component: ToolCard });
}

export { resolveSource };
