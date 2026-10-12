# GenUI for PI-Desktop

This development plugin reuses the pinned `@changfenhuang/dsh-genui` 0.11.4
renderer instead of the incomplete panel-only port. The plugin is maintained
alongside the opt-in streaming fence contract on `dev/myupdate`.

Inline fences retain validated siblings when upstream repair drops an
unusable component (for example, a Sankey with links but no node data).
The surviving tree is revalidated; original diagnostics remain visible in
the code details. Entirely unusable or secret-collecting specs still fail.
Tool validation remains strict so agents can correct incomplete charts.
Tool schemas request a spec object. Legacy JSON strings are parsed at entry;
malformed strings return a syntax diagnostic rather than a root-type error.

## Develop and install

From this directory:

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm run build
npm test
```

From the repository root, run `node scripts/e2e-genui-renderer.mjs` for a
hidden Electron renderer smoke using the real plugin bundle, shared React
import map and local chart engines. It uses a temporary profile and no model
credentials.

Dependencies are needed to build this new plugin; they are not an Electron
test environment. React is external in the distribution renderer: the host
supplies its own React through its import map. Chart engines are copied from
the locked upstream package and load from the plugin's own generation URL.
No CDN or DSH server is required.

Build and run the PI-Desktop code from this request worktree. Open Extensions,
choose **Load local plugin** in the header menu and select this directory.
Review `renderer.extension` and `desktop.control` along with the tool and
skill permissions. The old marketplace plugin has a different ID and does not
provide this integration. A stock 0.18.0-beta.6 binary does not include the new
streaming contract yet, even though the development manifest's engine range
starts there.

From the PI-Desktop repository root:

```sh
pnpm pi-plugin check plugins/genui
pnpm pi-plugin pack plugins/genui
```

Load the built directory during development. Install the resulting `.piplug`
through **Install plugin package** when testing the distribution artifact.

## Current implementation

- Assistant fences tagged `local.pi-genui:dsh-ui` render at their original
  position in the reply. Surrounding text remains ordinary Markdown.
- The parser exposes completed nodes while JSON is still arriving. Closed
  fences support the upstream component families, including real Mermaid,
  ECharts, 3D, diagram, media, plots, forms, quizzes and math rendering.
- `render_ui` renders through an inline tool card. `validate_dsh_ui` uses the
  same pinned guard as the renderer.
- Interaction state uses the original session, message, fence and settled
  content. Controls and grading run locally. Model actions reach that
  original session through host prompt admission; admission failures are
  visible and are not retried implicitly.
- Settled blocks expose upstream JSON and standalone HTML export. Bundled
  engines accompany the exported HTML; external media still needs a network.
- Explicit password controls are refused. The model must never solicit
  passwords, tokens or recovery codes through GenUI.

## Remaining parity and acceptance work

This is the first implementation stage, not a completed parity claim.

| Area | Status |
| --- | --- |
| Inline placement and streaming contract | Implemented; host integration tests pass |
| Native renderer and bundled chart engines | Isolated Electron activation/Mermaid/ECharts fixture passes; full Desktop acceptance pending |
| Table sort and original-session action path | Component user-path test passes |
| Reopen state, native downloads, disable/reload and overflow | Desktop acceptance pending |
| Persistent session dock and append/replace workflow | Pending PI-Desktop adaptation |
| Same-turn bounded fence correction | Pending runtime adaptation |
| DSH host custom components and file opener | Pending native adapters |
| Rich code/diff/JSON primitives | Upstream standalone fallback; native adapter pending |

MIT upstream notices are retained in `LICENSE`. The npm lockfile records the
exact source and asset integrity; generated runtime files stay outside Git.
