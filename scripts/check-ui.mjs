// Built-site layout sweep using the same agent-browser workflow as ai-jail-web.
// Run after build, with npm run preview on :4388. Optional locale arguments narrow the sweep.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
const run = promisify(execFile);
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:4388';
const session = 'memory-ui-check';
const ab = async (...args) => (await run('mise', ['exec','agent-browser@0.38.2','--','agent-browser','--session',session,...args], {maxBuffer: 8*1024*1024})).stdout.trim();
const decode = s => { const v = JSON.parse(s); return typeof v === 'string' ? JSON.parse(v) : v; };
const only = process.argv.slice(2);
const routes = readdirSync('dist', {recursive:true}).filter(p=>p.endsWith('.html')).map(p=>'/'+p.replace(/index.html$/,''));
const locale = p => ['pt-br','es','he','ja','ko'].find(l=>p.startsWith('/'+l+'/')) || 'en';
const results = [];
mkdirSync('node_modules/.cache/signal-review', {recursive:true});
const probe = String.raw`async () => {
  await document.fonts.ready;
  const visible = e => e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  const text = [...document.querySelectorAll('main *, header *, footer *')]
    .filter(e=>visible(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
  const small = text.filter(e=>parseFloat(getComputedStyle(e).fontSize)<13.99)
    .map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60),size:getComputedStyle(e).fontSize}));
  return {
    width:innerWidth, scroll:document.documentElement.scrollWidth,
    broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),
    diagrams:[...document.querySelectorAll('[data-diagram]')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.dataset.diagram),
    overlaps:[...document.querySelectorAll('.memory-diagram')].flatMap(d=>{
      const labels=[...d.querySelectorAll('.node-label,.node-note')];
      return [...d.querySelectorAll('.circuit-connector')].filter(c=>labels.some(l=>{
        const a=c.getBoundingClientRect(),b=l.getBoundingClientRect();
        return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      })).map(()=>d.dataset.diagram);
    }), small, title:document.title, heading:document.querySelectorAll('h1').length,
    fonts:document.fonts.status
  };
}`;
let failures = 0;
try {
  for (const path of routes.filter(p=>!only.length || only.includes(locale(p)))) {
    await ab('open', base+path);
    for (const width of [1440,360]) {
      await ab('set','viewport',String(width),'1000');
      for (const theme of ['light','dark']) {
        await ab('eval',`document.documentElement.dataset.theme='${theme}';'ok'`);
        const result = decode(await ab('eval',`(${probe})().then(JSON.stringify)`));
        const ok = result.scroll===width && !result.broken.length && !result.diagrams.length && !result.small.length && !result.overlaps.length && result.heading===1;
        if (!ok) { failures++; console.log('FAIL',path,width,theme,JSON.stringify(result)); }
        results.push({path,width,theme,ok,...result});
      }
    }
    console.log('checked',path);
  }
} finally {
  await ab('close');
  writeFileSync('node_modules/.cache/signal-review/checks.json',JSON.stringify(results,null,2));
}
console.log(`${results.length} page/viewport/theme checks, ${failures} failures.`);
process.exitCode = failures ? 1 : 0;
