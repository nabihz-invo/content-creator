// Bundle a post into ONE self-contained HTML file (fonts, logo, images inlined as data URIs)
// with an "Edit text" toggle and a "Save PNG" button.
// Usage (from content/): node studio/post/bundle.mjs posts/<month>/<ID>_<slug>/source/<ID>.html [more ...] [--out DIR]
// Default --out: the post's html/ folder. Root paths (/assets/...) resolve from the content/ folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const files = []; let out = null;
for (let i = 0; i < args.length; i++) { if (args[i] === '--out') out = args[++i]; else files.push(args[i]); }
const resolveRef = (dir, ref) => ref.startsWith('/') ? path.join(ROOT, ref) : path.resolve(dir, ref);

const MIME = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css' };
const dataUri = (p) => `data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}`;

function inlineCss(cssPath, isArabic) {
  let css = fs.readFileSync(cssPath, 'utf8');
  if (!isArabic) css = css.replace(/@font-face\{[^}]*arabic[^}]*\}\n?/gi, '');
  return css.replace(/url\(([^)]+)\)/g, (m, u) => {
    if (u.startsWith('data:') || u.startsWith('http')) return m;
    return `url(${dataUri(path.resolve(path.dirname(cssPath), u.replace(/['"]/g, '')))})`;
  });
}

const TOOLS = `
<style>
#tools{position:fixed;top:12px;right:12px;z-index:99;display:flex;gap:8px;font-family:'Readex Pro',sans-serif}
#tools button{border:0;border-radius:10px;padding:10px 16px;font:600 15px 'Readex Pro',sans-serif;cursor:pointer;background:#2F86B8;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.3)}
#tools button.alt{background:#fff;color:#0E2440}
body.editing [data-edit]{outline:1px dashed rgba(46,242,238,.7);outline-offset:4px}
html.render #tools{display:none}
</style>
<div id="tools"><button class="alt" id="ed">Edit text</button><button id="dl">Save PNG</button></div>
<script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
<script>
if(location.hash==='#render')document.documentElement.classList.add('render');
const sel='h1,h2,h3,h4,p,b,small,.chip,.sub,.kick,.st,.pin,.tag,.lbl,.q,.m,.u,.r,.foot>div,li,span:not(:empty)';
document.querySelectorAll('.post '+sel.split(',').join(',.post ')).forEach(e=>{if(!e.querySelector('img,svg'))e.setAttribute('data-edit','')});
document.getElementById('ed').onclick=function(){const on=document.body.classList.toggle('editing');
  document.querySelectorAll('[data-edit]').forEach(e=>e.contentEditable=on);this.textContent=on?'Done editing':'Edit text'};
document.getElementById('dl').onclick=async function(){
  if(document.body.classList.contains('editing'))document.getElementById('ed').click();
  const n=document.querySelector('.post');
  try{const url=await htmlToImage.toPng(n,{width:1080,height:1350,pixelRatio:1,cacheBust:true});
    const a=document.createElement('a');a.href=url;a.download=document.title.split(' ')[0]+'.png';a.click();}
  catch(e){alert('PNG export needs an internet connection the first time. You can also take a 1080x1350 screenshot.')}
};
</script>`;

for (const f of files) {
  const dir = path.dirname(path.resolve(f));
  let html = fs.readFileSync(f, 'utf8');
  const isArabic = /<html[^>]*lang="ar"/.test(html);
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => `<style>${inlineCss(resolveRef(dir, href), isArabic)}</style>`);
  html = html.replace(/src="([^"]+)"/g, (m, src) => (src.startsWith('data:') || src.startsWith('http')) ? m : `src="${dataUri(resolveRef(dir, src))}"`);
  html = html.replace('</body>', TOOLS + '\n</body>');
  const postDir = path.basename(dir) === 'source' ? path.dirname(dir) : dir;
  const outDir = out ? path.resolve(out) : path.join(postDir, 'html');
  fs.mkdirSync(outDir, { recursive: true });
  const target = path.join(outDir, path.basename(f));
  fs.writeFileSync(target, html);
  console.log('bundled', target, Math.round(fs.statSync(target).size / 1024) + ' KB');
}
