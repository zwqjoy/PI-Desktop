#!/usr/bin/env node
/** Load the real GenUI bundle in isolated Electron; no Desktop profile or provider. */
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtime = join(root, "plugins/genui/runtime");
const scratch = await mkdtemp(join(tmpdir(), "pi-genui-renderer-"));
const require = createRequire(join(root, "package.json"));
let server;
try {
  const graph = await build({ entryPoints: [join(runtime, "renderer.mjs")], bundle: true, write: false, format: "esm", platform: "browser", metafile: true, external: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"] });
  const externals = Object.values(graph.metafile.outputs).flatMap(output => output.imports).filter(item => item.external).map(item => item.path);
  assert.ok(externals.includes("react/jsx-runtime"), "exercise the dependency that previously blocked activation");
  await build({ stdin: { contents: 'export {installRendererImportMap, REACT_IMPORT_MAP} from "./apps/desktop/src/plugins/renderer-host/import-map.ts"; export * as React from "react"; export {createRoot} from "react-dom/client";', resolveDir: root, loader: "ts" }, outfile: join(scratch, "host.mjs"), bundle: true, format: "esm", platform: "browser", define: { "process.env.NODE_ENV": '"production"' } });
  const page = `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script type="module">
import {installRendererImportMap, REACT_IMPORT_MAP, React, createRoot} from '/host.mjs';
try {
  installRendererImportMap();
  const plugin = await import('/genui/renderer.mjs');
  const slots = [];
  const actions = [];
  await plugin.onLoad({plugin:{id:'local.pi-genui'}, ui:{injectStyle(css){const tag=document.createElement('style');tag.textContent=css;document.head.appendChild(tag);}},slots:{register(entry){slots.push(entry);}},dispatch:async (word,input)=>{if(input.method==='locale')return {locale:'en'};actions.push(input.args);return {accepted:true};}});
  const entry = slots.find(slot=>slot.slot==='blockRenderer');
  if (!entry || !entry.streaming) throw new Error('GenUI streaming slot not registered');
  const spec={items:[{type:'stat',label:'Revenue',value:'42'},{type:'chart',kind:'bars',data:[{label:'A',value:10},{label:'B',value:20}]},{type:'mermaid',code:'graph TD; A-->B'},{type:'echart',preset:'bar',data:[{label:'A',value:10}]},{type:'button',label:'Refresh',action:'refresh'}]};
  createRoot(document.querySelector('#root')).render(React.createElement(entry.component,{source:JSON.stringify(spec),sessionId:'original-session',messageId:'reply-1',fenceId:'0',closed:true,streaming:false}));
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{observer.disconnect();reject(new Error('chart engines did not render: '+document.body.textContent));},15000);
    const observer=new MutationObserver(check);
    function check(){if(document.querySelector('svg[id]') && document.querySelector('[_echarts_instance_] canvas, [_echarts_instance_] svg')){clearTimeout(timer);observer.disconnect();resolve();}}
    observer.observe(document.body,{childList:true,subtree:true});check();
  });
  const button=[...document.querySelectorAll('button')].find(item=>item.textContent==='Refresh');
  if(!button)throw new Error('action control missing');
  button.click();
  await Promise.resolve();
  if(actions.length!==1 || actions[0].sessionId!=='original-session')throw new Error('action was not delivered to the original session');
  window.__genuiSmoke={ok:true,slots:slots.map(item=>item.slot),svgCount:document.querySelectorAll('svg').length,canvasCount:document.querySelectorAll('canvas').length,actions:actions.length,imports:Object.keys(REACT_IMPORT_MAP)};
}catch(error){window.__genuiSmoke={ok:false,error:error.stack};}
</script></body></html>`;
  server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    const asset = /^\/genui\/assets\/([a-z-]+\.js)$/.exec(path);
    try {
      const bytes = path === "/" ? page : path === "/host.mjs" ? await readFile(join(scratch, "host.mjs")) : path === "/genui/renderer.mjs" ? await readFile(join(runtime, "renderer.mjs")) : asset ? await readFile(join(runtime, "assets", asset[1])) : null;
      if (bytes === null) { res.writeHead(404); res.end(); return; }
      res.setHeader("content-type", path === "/" ? "text/html" : "text/javascript"); res.end(bytes);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  await writeFile(join(scratch, "main.cjs"), `const {app,BrowserWindow}=require('electron');app.setPath('userData',${JSON.stringify(join(scratch, "profile"))});app.whenReady().then(async()=>{try{const win=new BrowserWindow({show:false,webPreferences:{sandbox:true}});await win.loadURL(${JSON.stringify(`http://127.0.0.1:${server.address().port}/`)});const result=await win.webContents.executeJavaScript('new Promise(resolve=>{function check(){if(window.__genuiSmoke)resolve(window.__genuiSmoke);else requestAnimationFrame(check);}check();})');console.log('GENUI_SMOKE '+JSON.stringify(result));app.exit(result.ok?0:1);}catch(error){console.error(error);app.exit(1);}});`);
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(require("electron"), [join(scratch, "main.cjs")], { env, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });
  const timer = setTimeout(() => child.kill(), 30000);
  const code = await new Promise((done, reject) => { child.on("error", reject); child.on("exit", done); });
  clearTimeout(timer);
  assert.equal(code, 0, output);
  const result = JSON.parse(output.split("\n").find(line => line.startsWith("GENUI_SMOKE ")).slice(12));
  assert.equal(result.ok, true);
  console.log("PASS real GenUI activation, inline SVG/Mermaid/ECharts and original-session action", JSON.stringify(result));
} finally {
  if (server) await new Promise(done => server.close(done));
  await rm(scratch, { recursive: true, force: true });
}
