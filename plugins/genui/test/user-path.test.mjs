import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { onLoad, resolveSource } from "../runtime/renderer.mjs";

const require = createRequire(import.meta.url);
const plugin = require("../main.js");

test("partial reply → complete table → local sort → action targets original session", async (t) => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "https://genui.test" });
  const originals = new Map();
  let root;
  for (const key of ["window", "document", "localStorage", "HTMLElement", "Node", "MouseEvent"]) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
    originals.set(key, original);
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  t.after(async () => {
    if (root) await act(() => root.unmount());
    await new Promise(resolve => setImmediate(resolve));
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
    for (const [key, original] of originals) {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    }
  });
  const calls = [];
  const tools = new Map();
  globalThis.pi = {
    app: { getLocale: async () => "en" },
    agent: { registerTool: async tool => tools.set(tool.name, tool) },
    desktop: { invoke: async input => { calls.push(input); return {}; } },
  };
  t.after(() => { delete globalThis.pi; });
  await plugin.onLoad();
  const entries = [];
  await onLoad({
    plugin: { id: "local.pi-genui" },
    ui: { injectStyle: css => { assert.match(css, /pi-genui/); } },
    slots: { register: entry => entries.push(entry) },
    dispatch: (_word, input) => plugin.onRendererCall(input.method, input.args),
  });
  const block = entries.find(entry => entry.slot === "blockRenderer");
  assert.equal(block.streaming, true);
  root = createRoot(document.querySelector("#root"));
  const identity = { sessionId: "session-original", messageId: "message-1", fenceId: "0" };
  const partial = '{"items":[{"type":"stat","label":"Revenue","value":"42"},';
  await act(() => root.render(React.createElement(block.component, { ...identity, source: partial, streaming: true, closed: false })));
  assert.match(document.body.textContent, /Revenue/);
  const spec = { items: [
    { type: "stat", label: "Revenue", value: "42" },
    { type: "table", columns: ["Name", "Value"], rows: [["A", 2], ["B", 1]], types: ["text", "num"] },
    { type: "button", label: "Refresh", action: "refresh" },
  ] };
  const tool = await tools.get("render_ui").execute({ spec });
  assert.equal(JSON.parse(tool.content[0].text).ok, true);
  // A links-only Sankey is schema-valid but cannot be repaired into a chart.
  spec.items.push({ type: "echart", preset: "sankey", links: [{ source: "A", target: "B", value: 1 }] });
  await act(() => root.render(React.createElement(block.component, { ...identity, source: JSON.stringify(spec), streaming: false, closed: true })));
  assert.match(document.body.textContent, /Revenue/);
  assert.match(document.body.textContent, /repair dropped 1/);
  assert.equal(document.querySelectorAll("tbody tr").length, 2);
  const numericHeader = [...document.querySelectorAll("th")].find(el => el.textContent.includes("Value"));
  await act(() => numericHeader.querySelector("button").click());
  assert.match(document.querySelector("tbody tr").textContent, /B/);
  const button = [...document.querySelectorAll("button")].find(el => el.textContent === "Refresh");
  await act(async () => { button.click(); });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, "agent/prompt");
  assert.equal(calls[0].args[0].sessionId, "session-original");
  assert.match(calls[0].args[0].content, /message-1/);
  assert.match(calls[0].args[0].content, /refresh/);
});

test("validation keeps all native families and rejects secret collection", () => {
  const samples = [
    { type: "mermaid", code: "graph TD; A-->B" },
    { type: "echart", preset: "bar", data: [{ label: "A", value: 1 }] },
    { type: "audio", src: "https://example.com/audio.mp3" },
    { type: "video", src: "https://example.com/video.mp4" },
  ];
  for (const item of samples) {
    const result = plugin.validate({ items: [item] });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(result.spec.items[0].type, item.type);
  }
  assert.throws(() => plugin.validate({ items: [{ type: "input", inputType: "password", placeholder: "Password" }] }), /must not collect/);
  assert.equal(resolveSource('{"items":[{"type":"input","inputType":"password"}]}').spec, undefined);
  const unusable = { type: "echart", preset: "sankey", links: [{ source: "A", target: "B", value: 1 }] };
  assert.equal(resolveSource(JSON.stringify({ items: [unusable] })).spec, null);
  const unsafe = resolveSource(JSON.stringify({ items: [
    { type: "stat", label: "Visible", value: "1" },
    { type: "input", inputType: "password" },
  ] }));
  assert.equal(unsafe.spec, undefined);
  assert.match(unsafe.error, /must not collect/);
});

test("bad or failed action admission stays observable and has no implicit retry", async (t) => {
  let calls = 0;
  globalThis.pi = { desktop: { invoke: async () => { calls++; throw new Error("AGENT_BUSY"); } } };
  t.after(() => { delete globalThis.pi; });
  await assert.rejects(plugin.onRendererCall("action", { action: "refresh", payload: {} }), /Invalid/);
  await assert.rejects(plugin.onRendererCall("action", { sessionId: "s", messageId: "m", action: "refresh", payload: {} }), /AGENT_BUSY/);
  assert.equal(calls, 1);
});

test("tool validation diagnoses malformed JSON and accepts a corrected object", async (t) => {
  const tools = new Map();
  globalThis.pi = { agent: { registerTool: async tool => tools.set(tool.name, tool) } };
  t.after(() => { delete globalThis.pi; });
  await plugin.onLoad();
  const validator = tools.get("validate_dsh_ui");
  assert.equal(validator.schema.properties.spec.type, "object");
  const decode = result => JSON.parse(result.content[0].text);
  const bad = decode(await validator.execute({ spec: '{"items":[{"type":"stat",}]}' }));
  assert.equal(bad.ok, false);
  assert.match(bad.errors.join(" "), /invalid JSON/);
  const spec = { items: [{ type: "stat", label: "Recovered", value: "42" }] };
  assert.equal(decode(await validator.execute({ spec })).ok, true);
  const rendered = decode(await tools.get("render_ui").execute({ spec }));
  assert.equal(rendered.spec.items[0].label, "Recovered");
  assert.equal(decode(await validator.execute({ spec: JSON.stringify(spec) })).ok, true);
  assert.throws(() => tools.get("render_ui").execute({ spec: '{"items":[' }), /invalid JSON/);
  assert.throws(() => validator.execute({ spec: JSON.stringify({ items: [
    { type: "input", inputType: "password" },
  ] }) }), /must not collect/);
});
