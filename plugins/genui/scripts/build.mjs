import { createRequire } from "node:module";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { transform } from "lightningcss";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const upstream = dirname(require.resolve("@changfenhuang/dsh-genui/package.json"));
const client = resolve(upstream, "src/client");
const runtime = resolve(root, "runtime");
await mkdir(resolve(runtime, "assets"), { recursive: true });

const cssModules = {
  name: "genui-scoped-css",
  setup(builder) {
    builder.onResolve({ filter: /primitive-adapter\.ts$/ }, ({ path, importer }) => {
      if (resolve(dirname(importer), path) === resolve(client, "primitive-adapter.ts")) {
        return { path: resolve(client, "standalone/primitive-adapter.tsx") };
      }
    });
    builder.onLoad({ filter: /\.module\.css$/ }, async ({ path }) => {
      const source = (await readFile(path, "utf8")).replaceAll("body[data-ds-dark-theme]", ':root[data-theme="dark"]');
      const out = transform({ filename: basename(path), code: Buffer.from(source), cssModules: { pattern: "pi-genui_[name]_[local]" }, minify: true });
      const names = Object.fromEntries(Object.entries(out.exports ?? {}).map(([key, value]) => [key, value.name]));
      return { contents: `import {registerStyle} from ${JSON.stringify(resolve(root, "src/styles.js"))}; registerStyle(${JSON.stringify(out.code.toString())}); export default ${JSON.stringify(names)};`, loader: "js" };
    });
    builder.onLoad({ filter: /\.tsx?$/ }, async ({ path }) => {
      if (!path.startsWith(client)) return;
      const source = (await readFile(path, "utf8")).replaceAll("document.body.hasAttribute('data-ds-dark-theme')", "(document.documentElement.dataset.theme === 'dark')");
      return { contents: source, loader: path.endsWith("tsx") ? "tsx" : "ts" };
    });
  },
};

await build({
  absWorkingDir: root, entryPoints: ["src/renderer.jsx"], outfile: resolve(runtime, "renderer.mjs"),
  bundle: true, platform: "browser", format: "esm", jsx: "automatic", minify: true,
  external: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
  alias: { "@upstream": client },
  define: { "process.env.NODE_ENV": '"production"' }, plugins: [cssModules],
});
await build({ entryPoints: [resolve(client, "guard.ts")], outfile: resolve(runtime, "guard.cjs"), bundle: true, platform: "node", format: "cjs", minify: true });
for (const name of ["mermaid", "three", "echarts-core", "echarts-full", "standalone-runtime"]) {
  await cp(resolve(upstream, "lib/assets", `${name}.js`), resolve(runtime, "assets", `${name}.js`));
}
await mkdir(resolve(root, "skills"), { recursive: true });
await build({ entryPoints: [resolve(root, "src/schema.mjs")], outfile: resolve(runtime, "schema.cjs"), bundle: true, platform: "node", format: "cjs", alias: { "@upstream": client } });
const { COMPONENT_SCHEMAS, GENUI_SPEC_SCHEMA, GENUI_LIMITS } = require(resolve(runtime, "schema.cjs"));
const skill = `---
name: genui
description: Render charts, dashboards, forms, quizzes and interactive comparisons inside PI-Desktop conversations when the user requests them.
---

# GenUI for PI-Desktop

Preserve the conversation language in visible labels and surrounding prose.
Use normal Markdown for simple answers. Use GenUI for requested visualization
or interactions. Output JSON in a \`local.pi-genui:dsh-ui\` fenced block,
with ordinary answer text before or after it. Do not output a bare dsh-ui
fence. The interface is rendered inline as completed components arrive.

Root example: {"title":"Orders","items":[{"type":"stat","label":"Total","value":"42"}]}.
Use the native schema below. Do not invent HTML, JavaScript or callback code.
Call validate_dsh_ui when unsure of a field. render_ui is an optional inline
TOOL channel; a fence is the main response channel.

Local controls sort, filter, expand, adjust plots and grade quizzes without a
model round trip. A component carrying action sends its event to the original
session only after the response settles. On a [genui-action] message, use the
provided action and payload to answer and emit a new fence if appropriate.
Never request passwords, API keys, tokens or recovery codes.

Use actual columns and rows when a record list is requested. Provide actions
only for work that needs the model; buttons without actions are disabled.
Radio groups use group, answer and explanation. Submit groups name required
radio, checkbox and field IDs; collected fields come from IDs across the block.
Math uses KaTeX delimiters; JSON backslashes must be doubled. Plot expressions
use the upstream bounded parser, never JavaScript. Media URLs use HTTPS.

Persistent dock/append and automatic same-turn repair are not implemented in
this development stage; deliver self-contained inline specs instead.

## Resource limits

${JSON.stringify(GENUI_LIMITS, null, 2)}

## Root fields

${JSON.stringify(GENUI_SPEC_SCHEMA, null, 2)}

## Native components

${Object.entries(COMPONENT_SCHEMAS).map(([name, schema]) => "### " + name + "\n\n" + "\`\`\`json\n" + JSON.stringify(schema, null, 2) + "\n\`\`\`\n").join("\n")}
`;
await writeFile(resolve(root, "skills/genui.md"), skill.trimEnd() + "\n");
console.log("Built PI-Desktop GenUI with upstream 0.11.4 components and local lazy engines.");
