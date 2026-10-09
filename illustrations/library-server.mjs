#!/usr/bin/env node
/*
 * The Winsome Illustration Library — V1.
 *
 * Run:  node illustrations/library-server.mjs   →  http://localhost:4600
 *
 * A repository of every illustration we've generated. Reads generated/library.json
 * (the single source of truth, written by make.py / backfill.py). You can:
 *   • see every illustration in one grid
 *   • search by name and filter by category / style / published state
 *   • toggle "Show on website" per illustration (persists to library.json)
 *
 * The storefront will later read published:true rows from this same file.
 */
import {createServer} from 'node:http';
import {readFileSync, writeFileSync, existsSync, unlinkSync} from 'node:fs';
import {join, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
// LIB_DIR lets a host point all state (images + json) at a persistent disk so
// publish toggles / deletes survive redeploys. Defaults to the local folder.
const GEN = process.env.LIB_DIR || join(__dirname, 'generated');
const LIB = join(GEN, 'library.json');
const TRASH = join(GEN, 'library.trash.json');
const PORT = process.env.PORT || 4600;
const MIME = {'.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg'};

const readLib = () =>
  existsSync(LIB) ? JSON.parse(readFileSync(LIB, 'utf8')) : {version: 1, items: []};
const writeLib = (lib) => writeFileSync(LIB, JSON.stringify(lib, null, 2));
// Trash = soft-deleted records (most-recent last), so delete is always undoable.
const readTrash = () =>
  existsSync(TRASH) ? JSON.parse(readFileSync(TRASH, 'utf8')) : {items: []};
const writeTrash = (t) => writeFileSync(TRASH, JSON.stringify(t, null, 2));

// Optional HTTP Basic Auth — active only when LIB_PASS is set (i.e. when hosted).
// Locally (no env) the gallery stays open. Set LIB_USER/LIB_PASS on the host.
const AUTH_USER = process.env.LIB_USER || 'winsome';
const AUTH_PASS = process.env.LIB_PASS || '';
function authed(req) {
  if (!AUTH_PASS) return true; // no password configured → open (local dev)
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const [u, p] = Buffer.from(h.slice(6), 'base64').toString().split(':');
  return u === AUTH_USER && p === AUTH_PASS;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (!authed(req)) {
    res.writeHead(401, {'WWW-Authenticate': 'Basic realm="Winsome Illustration Library"'});
    return res.end('Authentication required');
  }

  if (url.pathname === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end(PAGE);
  }
  if (url.pathname === '/api/library') {
    const lib = readLib();
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({...lib, trashCount: readTrash().items.length}));
  }
  if (url.pathname === '/api/publish' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const {id, published} = JSON.parse(body);
      const lib = readLib();
      const item = lib.items.find((i) => i.id === id);
      if (item) item.published = published;
      writeLib(lib);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ok: !!item}));
    });
    return;
  }
  if (url.pathname === '/api/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const {id} = JSON.parse(body);
      const lib = readLib();
      const idx = lib.items.findIndex((i) => i.id === id);
      let item = null;
      if (idx !== -1) {
        [item] = lib.items.splice(idx, 1);
        writeLib(lib);
        const t = readTrash();
        t.items = t.items.filter((i) => i.id !== id); // no dup in trash
        t.items.push(item);                            // most-recent last
        writeTrash(t);
      }
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ok: !!item, item, trashCount: readTrash().items.length}));
    });
    return;
  }
  if (url.pathname === '/api/undo' && req.method === 'POST') {
    const t = readTrash();
    const item = t.items.pop() || null; // restore most-recent deletion
    if (item) {
      writeTrash(t);
      const lib = readLib();
      if (!lib.items.some((i) => i.id === item.id)) lib.items.push(item);
      lib.items.sort((a, b) =>
        (a.category + a.subject + a.style).localeCompare(b.category + b.subject + b.style));
      writeLib(lib);
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ok: !!item, item, trashCount: t.items.length}));
    return;
  }
  if (url.pathname === '/api/modify' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400); return res.end('{"ok":false,"error":"bad json"}');
      }
      const {id, prompt, refImage} = payload;
      const args = [join(__dirname, 'modify.py'), String(id), String(prompt || '')];
      let tmp = null;
      if (refImage && /^data:image\//.test(refImage)) {
        tmp = join(GEN, `_ref-${Date.now()}.png`);
        writeFileSync(tmp, Buffer.from(refImage.split(',')[1], 'base64'));
        args.push(tmp);
      }
      // ~3 min budget: a gpt-image-1 edit + cutout takes ~15-40s
      execFile('python3', args, {cwd: __dirname, timeout: 200000, maxBuffer: 1 << 24},
        (err, stdout) => {
          if (tmp) try { unlinkSync(tmp); } catch {}
          const line = String(stdout || '').trim().split('\n').pop() || '';
          let out;
          try { out = JSON.parse(line); } catch {
            out = {ok: false, error: err ? String(err.message).slice(0, 160) : 'no output'};
          }
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(out));
        });
    });
    return;
  }
  if (url.pathname.startsWith('/generated/')) {
    const file = join(GEN, url.pathname.replace('/generated/', ''));
    if (existsSync(file)) {
      res.writeHead(200, {'Content-Type': MIME[extname(file)] ?? 'application/octet-stream'});
      return res.end(readFileSync(file));
    }
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, '0.0.0.0', () =>
  console.log(`\n  Winsome Illustration Library → http://localhost:${PORT}` +
    (AUTH_PASS ? '  (password protected)' : '') + '\n'),
);

const PAGE = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Winsome Illustration Library</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  :root{--gold:#C9A96E;--char:#2D2D2D;--cream:#FAF8F5;--green:#7A9E7A;}
  *{box-sizing:border-box;margin:0;}
  body{background:var(--cream);font-family:'Source Sans 3',system-ui,sans-serif;color:var(--char);padding:0 0 80px;}
  header{background:#fff;border-bottom:1px solid rgba(201,169,110,.3);padding:20px 32px;position:sticky;top:0;z-index:20;}
  h1{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:24px;}
  h1 span{color:var(--gold);}
  .sub{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:rgba(45,45,45,.5);margin-top:2px;}
  .controls{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:16px;}
  input[type=search],select{padding:9px 12px;border:1px solid rgba(201,169,110,.45);background:#fff;font-size:13px;font-family:inherit;color:var(--char);}
  input[type=search]{min-width:240px;flex:1;max-width:360px;}
  .stats{margin-left:auto;font-size:13px;color:rgba(45,45,45,.6);display:flex;gap:18px;}
  .stats b{color:var(--char);}
  .stats .live b{color:var(--green);}
  main{padding:26px 32px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px;}
  .card{background:#fff;border:1px solid rgba(201,169,110,.22);display:flex;flex-direction:column;transition:box-shadow .2s;}
  .card:hover{box-shadow:0 6px 20px rgba(45,45,45,.08);}
  .card.live{outline:2px solid var(--green);}
  .imgwrap{aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:16px;
    background-image:linear-gradient(45deg,#f0ece5 25%,transparent 25%),linear-gradient(-45deg,#f0ece5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0ece5 75%),linear-gradient(-45deg,transparent 75%,#f0ece5 75%);
    background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0;}
  .imgwrap img{max-width:100%;max-height:100%;object-fit:contain;}
  .info{padding:11px 13px;border-top:1px solid rgba(201,169,110,.15);}
  .name{font-family:'Playfair Display',serif;font-size:15px;font-weight:500;}
  .tags{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px;}
  .tag{font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border:1px solid rgba(201,169,110,.35);color:rgba(45,45,45,.6);}
  .tag.style{background:var(--gold);color:#fff;border-color:var(--gold);}
  .pub{display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .pub label{font-size:12px;color:rgba(45,45,45,.7);}
  .sw{position:relative;width:42px;height:23px;flex:none;}
  .sw input{opacity:0;width:0;height:0;}
  .track{position:absolute;inset:0;background:#d9d2c6;border-radius:99px;cursor:pointer;transition:.2s;}
  .track:before{content:"";position:absolute;height:17px;width:17px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s;}
  .sw input:checked + .track{background:var(--green);}
  .sw input:checked + .track:before{transform:translateX(19px);}
  .empty{text-align:center;color:rgba(45,45,45,.45);padding:60px;font-size:15px;}
  .card{position:relative;}
  .del{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;border:1px solid rgba(45,45,45,.12);
    background:rgba(255,255,255,.92);color:#b0553f;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;
    opacity:0;transition:opacity .15s,background .15s;z-index:3;}
  .card:hover .del{opacity:1;}
  .del:hover{background:#C9765E;color:#fff;border-color:#C9765E;}
  #undo{padding:8px 14px;border:1px solid var(--gold);background:#fff;color:var(--char);font-size:13px;font-family:inherit;cursor:pointer;display:none;align-items:center;gap:6px;}
  #undo:hover{background:var(--gold);color:#fff;}
  #undo.show{display:inline-flex;}
  .toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);opacity:0;pointer-events:none;
    background:var(--char);color:#fff;padding:12px 18px;border-radius:6px;font-size:13px;display:flex;align-items:center;gap:16px;
    box-shadow:0 8px 28px rgba(0,0,0,.22);transition:opacity .2s,transform .2s;z-index:50;}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto;}
  .toast button{background:none;border:none;color:var(--gold);font-weight:600;font-size:13px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}
  .code{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11px;color:rgba(45,45,45,.45);margin-top:3px;letter-spacing:.02em;}
  .imgwrap{cursor:zoom-in;}
  .name{cursor:pointer;}
  .name:hover{color:var(--gold);}
  .tag.cx{background:#f3eee5;}
  .tag.qa{border:none;color:#fff;}
  .qa-notreviewed{background:#C9A96E;}
  .qa-approved{background:#7A9E7A;}
  .qa-inreview{background:#6A86A8;}
  .qa-rejected,.qa-needswork{background:#C9765E;}
  /* detail modal */
  .modal{position:fixed;inset:0;background:rgba(38,34,28,.55);display:none;align-items:center;justify-content:center;z-index:100;padding:24px;}
  .modal.show{display:flex;}
  .sheet{background:#fff;max-width:900px;width:100%;max-height:90vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;position:relative;}
  @media(max-width:720px){.sheet{grid-template-columns:1fr;}}
  .sheet .close{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(45,45,45,.15);background:#fff;cursor:pointer;font-size:15px;z-index:2;}
  .modal-img{display:flex;align-items:center;justify-content:center;padding:28px;
    background-image:linear-gradient(45deg,#f0ece5 25%,transparent 25%),linear-gradient(-45deg,#f0ece5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0ece5 75%),linear-gradient(-45deg,transparent 75%,#f0ece5 75%);
    background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0;}
  .modal-img img{max-width:100%;max-height:70vh;object-fit:contain;}
  .modal-meta{padding:30px 28px;}
  .modal-meta h2{font-family:'Playfair Display',serif;font-weight:500;font-size:22px;margin-bottom:4px;}
  .modal-meta .code{margin:0 0 16px;display:flex;align-items:center;gap:8px;font-size:12px;}
  .modal-meta .code button{border:1px solid rgba(201,169,110,.4);background:#fff;font-size:10px;padding:3px 7px;cursor:pointer;text-transform:uppercase;letter-spacing:.05em;color:var(--char);}
  dl.meta{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13px;margin-bottom:16px;}
  dl.meta dt{color:rgba(45,45,45,.5);text-transform:uppercase;font-size:10px;letter-spacing:.08em;align-self:center;}
  dl.meta dd{color:var(--char);}
  .promptbox{background:var(--cream);border:1px solid rgba(201,169,110,.2);padding:12px;font-size:12px;line-height:1.5;color:rgba(45,45,45,.75);max-height:140px;overflow:auto;margin-bottom:16px;}
  .promptlbl{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(45,45,45,.5);margin-bottom:5px;}
  .modal-actions{display:flex;gap:10px;flex-wrap:wrap;}
  .modal-actions a{font-family:inherit;font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding:9px 16px;border:1px solid var(--gold);background:#fff;color:var(--char);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;}
  .modal-actions a.primary{background:var(--gold);color:#fff;}
  .modal-actions a:hover{background:var(--gold);color:#fff;}
  /* modify with AI */
  .modbtn{margin-top:9px;width:100%;background:transparent;border:1px solid rgba(201,169,110,.4);
    color:var(--char);padding:7px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;
    font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
  .modbtn:hover{border-color:var(--gold);color:var(--gold)}
  .mmodal{position:fixed;inset:0;background:rgba(45,45,45,.55);display:none;align-items:center;justify-content:center;z-index:120;padding:24px}
  .mmodal.show{display:flex}
  .msheet{background:#fff;max-width:660px;width:100%;display:grid;grid-template-columns:210px 1fr;position:relative}
  @media(max-width:640px){.msheet{grid-template-columns:1fr}}
  .msheet .close{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;
    border:1px solid rgba(45,45,45,.15);background:#fff;cursor:pointer;font-size:15px;z-index:2}
  .mprev{display:flex;align-items:center;justify-content:center;padding:18px;
    background-image:linear-gradient(45deg,#f0ece5 25%,transparent 25%),linear-gradient(-45deg,#f0ece5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0ece5 75%),linear-gradient(-45deg,transparent 75%,#f0ece5 75%);
    background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0}
  .mprev img{max-width:100%;max-height:230px;object-fit:contain}
  .mbody{padding:24px}
  .mbody h3{font-family:'Playfair Display',serif;font-weight:500;font-size:18px;margin:0 0 4px}
  .mbody .hint{font-size:12px;color:rgba(45,45,45,.55);margin:0 0 14px;line-height:1.5}
  .mbody textarea{width:100%;min-height:78px;border:1px solid rgba(201,169,110,.4);background:#fff;
    padding:11px;font-family:inherit;font-size:14px;color:var(--char);resize:vertical}
  .mbody textarea:focus{outline:2px solid var(--gold);border-color:var(--gold)}
  .attach{display:flex;align-items:center;gap:10px;margin:12px 0}
  .attach label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;border:1px dashed rgba(201,169,110,.6);
    padding:8px 12px;cursor:pointer;color:rgba(45,45,45,.7)}
  .attach label:hover{border-color:var(--gold);color:var(--gold)}
  .attach .refthumb{width:40px;height:40px;object-fit:cover;border:1px solid rgba(201,169,110,.3);display:none}
  .attach .refname{font-size:12px;color:rgba(45,45,45,.6)}
  .mstatus{font-size:12px;color:rgba(45,45,45,.6);min-height:18px;margin:10px 0}
  .mstatus.err{color:#C9765E}
  .mgo{width:100%;background:var(--char);color:#fff;border:none;padding:13px;font-size:12px;
    letter-spacing:.12em;text-transform:uppercase;font-family:inherit;cursor:pointer}
  .mgo:hover{background:var(--gold)}
  .mgo:disabled{opacity:.5;cursor:wait}
</style></head><body>
<header>
  <div style="display:flex;align-items:baseline;gap:18px;flex-wrap:wrap">
    <h1>Winsome Illustration <span>Library</span></h1>
    <nav style="display:inline-flex;border:1px solid rgba(201,169,110,.3);background:#fff">
      <a href="/" style="padding:7px 16px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;background:#2D2D2D;color:#fff">&#127912; Illustration Library</a>
      <a href="/marketing/" style="padding:7px 16px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:rgba(45,45,45,.6)">&#128227; Marketing Manager</a>
    </nav>
  </div>
  <div class="sub">Every illustration we've created · toggle what goes live</div>
  <div class="controls">
    <input type="search" id="q" placeholder="Search name, subject, keyword, ID…"/>
    <select id="cat"><option value="">All categories</option></select>
    <select id="style">
      <option value="">All styles</option>
      <option value="watercolor">Watercolor</option>
      <option value="heritage-sketch">Heritage Sketch</option>
      <option value="modern-graphic">Modern Graphic</option>
    </select>
    <select id="qa">
      <option value="">All QA</option>
      <option value="Not Reviewed">Not Reviewed</option>
      <option value="In Review">In Review</option>
      <option value="Approved">Approved</option>
      <option value="Needs Work">Needs Work</option>
    </select>
    <select id="pub">
      <option value="">Live &amp; hidden</option>
      <option value="live">Live only</option>
      <option value="hidden">Hidden only</option>
    </select>
    <button id="undo" title="Restore the last deleted illustration">↩ Undo <span id="undoct"></span></button>
    <div class="stats">
      <span>Showing <b id="shown">0</b></span>
      <span class="live">Live <b id="live">0</b></span>
      <span>Total <b id="total">0</b></span>
    </div>
  </div>
</header>
<main><div class="grid" id="grid"></div><div class="empty" id="empty" style="display:none">No illustrations match your filters.</div></main>
<div class="toast" id="toast"><span id="toastmsg"></span><button id="toastundo">Undo</button></div>
<div class="modal" id="modal"><div class="sheet">
  <button class="close" id="mclose" title="Close">✕</button>
  <div class="modal-img"><img id="mimg" src="" alt=""/></div>
  <div class="modal-meta">
    <h2 id="mname"></h2>
    <div class="code"><span id="mid"></span><button id="mcopy">Copy ID</button></div>
    <dl class="meta" id="mdl"></dl>
    <div class="promptlbl">AI prompt</div>
    <div class="promptbox" id="mprompt"></div>
    <div class="modal-actions"><a id="mdownload" class="primary" download>⬇ Download</a><a id="mopen" target="_blank" rel="noopener">Open full size ↗</a></div>
  </div>
</div></div>
<div class="mmodal" id="mmodal"><div class="msheet">
  <button class="close" id="mm-close" title="Close">&times;</button>
  <div class="mprev"><img id="mm-img" src="" alt=""/></div>
  <div class="mbody">
    <h3 id="mm-name">Modify illustration</h3>
    <p class="hint">Describe how to change it. A new variation is created &mdash; the original is kept. You can also attach a reference image to match its style.</p>
    <textarea id="mm-prompt" placeholder="e.g. make the roses deep red &middot; add a gold ribbon &middot; soften the palette"></textarea>
    <div class="attach">
      <label for="mm-file">&#128206; Attach reference</label>
      <input type="file" id="mm-file" accept="image/*" style="display:none"/>
      <img class="refthumb" id="mm-refthumb" alt=""/>
      <span class="refname" id="mm-refname"></span>
    </div>
    <div class="mstatus" id="mm-status"></div>
    <button class="mgo" id="mm-go">Generate variation</button>
  </div>
</div></div>
<script>
let items=[],trashCount=0,toastTimer=null,mmId=null,mmRef=null;
async function load(){const l=await (await fetch('/api/library')).json();items=l.items||[];trashCount=l.trashCount||0;
  const cats=[...new Set(items.map(i=>i.category))].sort();
  const sel=document.getElementById('cat');const cur=sel.value;
  sel.innerHTML='<option value="">All categories</option>'+cats.map(c=>'<option'+(c===cur?' selected':'')+'>'+c+'</option>').join('');
  updateUndo();render();}
async function publish(id,on){await fetch('/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,published:on})});
  const it=items.find(i=>i.id===id);it.published=on;render();}
function updateUndo(){const b=document.getElementById('undo');b.classList.toggle('show',trashCount>0);
  document.getElementById('undoct').textContent=trashCount>1?'('+trashCount+')':'';}
function showToast(msg){const t=document.getElementById('toast');document.getElementById('toastmsg').textContent=msg;
  t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),6000);}
async function del(id){const it=items.find(i=>i.id===id);if(!it)return;
  if(!confirm('Delete "'+(it.name||it.subject)+'"?\\n\\nIt moves to the trash and can be undone.'))return;
  const r=await (await fetch('/api/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}).catch(()=>null)).json();
  if(!r||!r.ok)return;
  items=items.filter(i=>i.id!==id);trashCount=r.trashCount;updateUndo();render();
  showToast('Deleted '+(it.name||it.subject)+'.');}
async function doUndo(){if(trashCount<1)return;
  const r=await (await fetch('/api/undo',{method:'POST',headers:{'Content-Type':'application/json'}})).json();
  document.getElementById('toast').classList.remove('show');
  if(r&&r.ok)await load();}
document.getElementById('undo').onclick=doUndo;
document.getElementById('toastundo').onclick=doUndo;
function qaClass(s){return 'qa-'+String(s||'Not Reviewed').toLowerCase().replace(/[^a-z]/g,'');}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function mrow(k,v){return '<dt>'+k+'</dt><dd>'+esc(v)+'</dd>';}
function openModal(id){const i=items.find(x=>x.id===id);if(!i)return;
  document.getElementById('mimg').src='/generated/'+i.file;
  document.getElementById('mname').textContent=i.name||i.subject;
  document.getElementById('mid').textContent=i.id;
  const created=i.createdAt?new Date(i.createdAt).toLocaleDateString():'—';
  document.getElementById('mdl').innerHTML=
    mrow('Category',i.category)+mrow('Style',i.styleName)+mrow('Complexity',i.complexity||'—')+
    mrow('QA status',i.qaStatus||'Not Reviewed')+mrow('Format',(i.format||'').toUpperCase())+
    mrow('On website',i.published?'Yes':'No')+mrow('Keywords',(i.keywords||[]).join(', '))+mrow('Created',created);
  document.getElementById('mprompt').textContent=i.prompt||'(no prompt recorded)';
  const dl=document.getElementById('mdownload');dl.href='/generated/'+i.file;dl.setAttribute('download',i.id+'.'+(i.format||'png'));
  document.getElementById('mopen').href='/generated/'+i.file;
  document.getElementById('modal').classList.add('show');}
function closeModal(){document.getElementById('modal').classList.remove('show');}
document.getElementById('mclose').onclick=closeModal;
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
document.getElementById('mcopy').onclick=()=>{const b=document.getElementById('mcopy');navigator.clipboard.writeText(document.getElementById('mid').textContent);b.textContent='Copied!';setTimeout(()=>b.textContent='Copy ID',1200);};
function render(){
  const q=document.getElementById('q').value.trim().toLowerCase();
  const cat=document.getElementById('cat').value,style=document.getElementById('style').value,pub=document.getElementById('pub').value,qa=document.getElementById('qa').value;
  const vis=items.filter(i=>{
    if(cat&&i.category!==cat)return false;
    if(style&&i.style!==style)return false;
    if(qa&&(i.qaStatus||'Not Reviewed')!==qa)return false;
    if(pub==='live'&&!i.published)return false;
    if(pub==='hidden'&&i.published)return false;
    if(q&&!((i.name+' '+i.subject+' '+i.category+' '+i.styleName+' '+i.id+' '+(i.keywords||[]).join(' ')).toLowerCase().includes(q)))return false;
    return true;});
  document.getElementById('shown').textContent=vis.length;
  document.getElementById('live').textContent=items.filter(i=>i.published).length;
  document.getElementById('total').textContent=items.length;
  const grid=document.getElementById('grid');grid.innerHTML='';
  document.getElementById('empty').style.display=vis.length?'none':'block';
  for(const i of vis){
    const c=document.createElement('div');c.className='card'+(i.published?' live':'');
    c.innerHTML='<button class="del" data-del="'+i.id+'" title="Delete">✕</button>'+
      '<div class="imgwrap" data-open="'+i.id+'"><img loading="lazy" src="/generated/'+i.file+'" alt="'+esc(i.name)+'"/></div>'+
      '<div class="info"><div class="name" data-open="'+i.id+'">'+esc(i.name||i.subject)+'</div>'+
      '<div class="code">'+i.id+'</div>'+
      '<div class="tags"><span class="tag">'+esc(i.category)+'</span>'+
        '<span class="tag style">'+esc(i.styleName)+'</span>'+
        (i.complexity?'<span class="tag cx">'+esc(i.complexity)+'</span>':'')+
        '<span class="tag qa '+qaClass(i.qaStatus)+'">'+esc(i.qaStatus||'Not Reviewed')+'</span></div>'+
      '<div class="pub"><label>Show on website</label>'+
      '<span class="sw"><input type="checkbox" '+(i.published?'checked':'')+' data-id="'+i.id+'"/><span class="track"></span></span></div>'+
      '<button class="modbtn" data-mod="'+i.id+'">&#10000; Modify with AI</button></div>';
    grid.appendChild(c);
  }
  grid.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.onchange=()=>publish(cb.dataset.id,cb.checked));
  grid.querySelectorAll('.del').forEach(b=>b.onclick=()=>del(b.dataset.del));
  grid.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>openModal(el.dataset.open));
  grid.querySelectorAll('.modbtn').forEach(b=>b.onclick=(e)=>{e.stopPropagation();openModify(b.dataset.mod);});
}
['q','cat','style','qa','pub'].forEach(id=>document.getElementById(id).addEventListener('input',render));
// ── Modify with AI ──
function openModify(id){var it=items.find(x=>x.id===id);if(!it)return;mmId=id;mmRef=null;
  document.getElementById('mm-img').src='/generated/'+it.file;
  document.getElementById('mm-name').textContent='Modify — '+(it.name||it.subject);
  document.getElementById('mm-prompt').value='';
  var st=document.getElementById('mm-status');st.textContent='';st.className='mstatus';
  document.getElementById('mm-refthumb').style.display='none';document.getElementById('mm-refname').textContent='';
  document.getElementById('mm-file').value='';
  document.getElementById('mmodal').classList.add('show');}
function closeModify(){document.getElementById('mmodal').classList.remove('show');}
document.getElementById('mm-close').onclick=closeModify;
document.getElementById('mmodal').onclick=function(e){if(e.target.id==='mmodal')closeModify();};
document.getElementById('mm-file').onchange=function(){var f=this.files[0];if(!f)return;
  var r=new FileReader();r.onload=function(){mmRef=r.result;
    var t=document.getElementById('mm-refthumb');t.src=r.result;t.style.display='block';
    document.getElementById('mm-refname').textContent=f.name;};r.readAsDataURL(f);};
async function _asDataURL(url){const b=await (await fetch(url)).blob();return await new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(fr.result)};fr.readAsDataURL(b)});}
document.getElementById('mm-go').onclick=async function(){
  var prompt=document.getElementById('mm-prompt').value.trim(),st=document.getElementById('mm-status'),go=this;
  if(!prompt&&!mmRef){st.className='mstatus err';st.textContent='Enter a prompt or attach a reference image.';return;}
  go.disabled=true;go.textContent='Generating…';st.className='mstatus';st.textContent='Editing with AI — this takes ~20–40 seconds…';
  try{
    if(window.__WORKER_URL__){
      // hosted: browser → worker (direct, avoids the serverless timeout) → save
      var it=items.find(function(x){return x.id===mmId})||{};
      var f=it.master||it.file||'';
      var srcUrl=f.indexOf('/api/')===0?f:'/generated/'+f;
      var src=await _asDataURL(srcUrl);
      var body={image:src,prompt:prompt,style:it.style};
      if(mmRef)body.ref=mmRef;
      var wr=await (await fetch(window.__WORKER_URL__.replace(/\\/$/,'')+'/modify',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(window.__WORKER_TOKEN__||'')},body:JSON.stringify(body)})).json();
      if(!wr||!wr.ok)throw new Error((wr&&wr.error)||'worker failed');
      var nid=mmId+'-v'+Date.now().toString(36);
      var rec={id:nid,name:(it.subject||'Design')+' · '+(it.styleName||'')+' — Variation',subject:it.subject,category:it.category,style:it.style,styleName:it.styleName,complexity:it.complexity,keywords:it.keywords,parentId:mmId,modifyPrompt:prompt+(mmRef?' (+ reference image)':''),image:wr.image};
      var sv=await (await fetch('/api/save-variation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rec)})).json();
      if(!sv||!sv.ok)throw new Error((sv&&sv.error)||'save failed');
      closeModify();await load();showToast('Variation created: '+rec.name);
    } else {
      // local: the node server spawns the Python pipeline
      var r=await (await fetch('/api/modify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:mmId,prompt:prompt,refImage:mmRef})})).json();
      if(r.ok){closeModify();await load();showToast('Variation created: '+r.name);}
      else{st.className='mstatus err';st.textContent=r.error||'Generation failed.';}
    }
  }catch(e){st.className='mstatus err';st.textContent='Failed: '+e.message;}
  go.disabled=false;go.textContent='Generate variation';
};
// On the hosted site this returns the worker URL/token (behind the password);
// locally it 404s and Modify uses the built-in /api/modify path.
fetch('/api/modify-config').then(function(r){return r.ok?r.json():null;}).then(function(c){if(c&&c.workerUrl){window.__WORKER_URL__=c.workerUrl;window.__WORKER_TOKEN__=c.token;}}).catch(function(){});
load();
</script></body></html>`;
