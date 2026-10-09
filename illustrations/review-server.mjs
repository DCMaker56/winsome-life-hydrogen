#!/usr/bin/env node
/*
 * Curation review server for the illustration library.
 *
 * Run:  node illustrations/review-server.mjs   →  open http://localhost:4599
 *
 * Sydney reviews each generated illustration and clicks Approve / Reject.
 * Decisions persist straight into generated/manifest.json (approved: true|false|null),
 * so the ingest step only pulls approved assets into the studio. Illustrations
 * are grouped by subject so all three styles sit side by side.
 */
import {createServer} from 'node:http';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEN = join(__dirname, 'generated');
const MANIFEST = join(GEN, 'manifest.json');
const PORT = 4599;

const MIME = {'.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg'};

function readManifest() {
  return existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
    : {items: []};
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end(PAGE);
  }
  if (url.pathname === '/api/manifest') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify(readManifest()));
  }
  if (url.pathname === '/api/decision' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const {file, approved} = JSON.parse(body);
      const m = readManifest();
      const item = m.items.find((i) => i.file === file);
      if (item) item.approved = approved;
      writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ok: true}));
    });
    return;
  }
  // Serve generated images
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

server.listen(PORT, () => {
  console.log(`\n  Winsome illustration curation → http://localhost:${PORT}\n`);
});

const PAGE = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Winsome Illustration Curation</title>
<style>
  :root{--gold:#C9A96E;--char:#2D2D2D;--cream:#FAF8F5;}
  *{box-sizing:border-box;margin:0;}
  body{background:var(--cream);font-family:'Source Sans 3',system-ui,sans-serif;color:var(--char);padding:24px 32px 80px;}
  h1{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:26px;}
  .bar{position:sticky;top:0;background:var(--cream);padding:14px 0 18px;z-index:10;border-bottom:1px solid rgba(201,169,110,.25);margin-bottom:24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;}
  .stat{font-size:14px;color:rgba(45,45,45,.6);}
  .stat b{color:var(--char);font-weight:600;}
  select{padding:7px 12px;border:1px solid rgba(201,169,110,.4);background:#fff;font-size:13px;}
  .subject{margin-bottom:30px;}
  .subject h3{font-family:'Playfair Display',serif;font-weight:500;font-size:16px;margin-bottom:2px;text-transform:capitalize;}
  .subject .n{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;}
  .row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .card{background:#fff;border:1px solid rgba(201,169,110,.2);}
  .card.approved{outline:3px solid #7A9E7A;}
  .card.rejected{opacity:.4;outline:3px solid #C9765E;}
  .imgwrap{aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#fff;padding:10px;}
  .imgwrap img{max-width:100%;max-height:100%;object-fit:contain;}
  .meta{padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(201,169,110,.15);}
  .stylename{font-size:12px;font-weight:600;letter-spacing:.05em;}
  .btns{display:flex;gap:6px;}
  .btns button{border:1px solid rgba(45,45,45,.2);background:#fff;width:30px;height:26px;cursor:pointer;font-size:13px;line-height:1;}
  .btns button.yes.on{background:#7A9E7A;color:#fff;border-color:#7A9E7A;}
  .btns button.no.on{background:#C9765E;color:#fff;border-color:#C9765E;}
</style></head><body>
<h1>Illustration Curation</h1>
<div class="bar">
  <span class="stat"><b id="app">0</b> approved</span>
  <span class="stat"><b id="rej">0</b> rejected</span>
  <span class="stat"><b id="pend">0</b> pending</span>
  <span class="stat"><b id="tot">0</b> total</span>
  <select id="filter">
    <option value="all">All</option>
    <option value="pending">Pending only</option>
    <option value="approved">Approved only</option>
  </select>
</div>
<div id="app-root"></div>
<script>
const STYLE_NAMES={watercolor:'Watercolor','heritage-sketch':'Heritage Sketch','modern-graphic':'Modern Graphic'};
let items=[];
async function load(){const m=await (await fetch('/api/manifest')).json();items=m.items||[];render();}
async function decide(file,approved){await fetch('/api/decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file,approved})});const it=items.find(i=>i.file===file);it.approved=approved;render();}
function render(){
  const filter=document.getElementById('filter').value;
  const app=items.filter(i=>i.approved===true).length,rej=items.filter(i=>i.approved===false).length,pend=items.filter(i=>i.approved==null).length;
  document.getElementById('app').textContent=app;document.getElementById('rej').textContent=rej;document.getElementById('pend').textContent=pend;document.getElementById('tot').textContent=items.length;
  const subjects={};
  for(const it of items){const key=it.niche+'|'+it.subject;(subjects[key]??=[]).push(it);}
  const root=document.getElementById('app-root');root.innerHTML='';
  for(const [key,group] of Object.entries(subjects)){
    const visible=group.filter(it=>filter==='all'||(filter==='pending'&&it.approved==null)||(filter==='approved'&&it.approved===true));
    if(!visible.length)continue;
    const [niche,subject]=key.split('|');
    const sec=document.createElement('div');sec.className='subject';
    sec.innerHTML='<div class="n">'+niche+'</div><h3>'+subject+'</h3>';
    const row=document.createElement('div');row.className='row';
    for(const it of ['watercolor','heritage-sketch','modern-graphic'].map(s=>group.find(g=>g.style===s)).filter(Boolean)){
      const card=document.createElement('div');
      card.className='card'+(it.approved===true?' approved':it.approved===false?' rejected':'');
      card.innerHTML='<div class="imgwrap"><img src="/'+it.file+'"/></div>'+
        '<div class="meta"><span class="stylename">'+(STYLE_NAMES[it.style]||it.style)+'</span>'+
        '<span class="btns"><button class="yes'+(it.approved===true?' on':'')+'" data-f="'+it.file+'" data-a="1">✓</button>'+
        '<button class="no'+(it.approved===false?' on':'')+'" data-f="'+it.file+'" data-a="0">✕</button></span></div>';
      row.appendChild(card);
    }
    sec.appendChild(row);root.appendChild(sec);
  }
  root.querySelectorAll('button').forEach(b=>b.onclick=()=>decide(b.dataset.f,b.dataset.a==='1'));
}
document.getElementById('filter').onchange=render;
load();setInterval(load,15000);
</script></body></html>`;
