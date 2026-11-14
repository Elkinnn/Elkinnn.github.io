// Static delivery audit: no browser dependency and no mutation of the game.
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const routes=['index.html','404.html','work/index.html','about/index.html','toolkit/index.html','contact/index.html','work/stayschool/index.html','work/hospital-platform/index.html','work/traffic-monitor/index.html'];
const errors=[];let assets=0;
for(const lang of ['en','es'])for(const route of routes){
 const file=lang==='es'?'es/'+route:route,html=await readFile(join(root,file),'utf8');
 if((html.match(/<h1\b/g)||[]).length!==1)errors.push(file+': expected one h1');
 if(!html.includes(`<html lang="${lang}"`))errors.push(file+': wrong language');
 if(/\{\{[A-Z_]+\}\}/.test(html))errors.push(file+': unresolved template');
 if(!html.includes('elkin-portfolio-theme')||!html.includes('elkin-portfolio-language'))errors.push(file+': missing preferences');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)errors.push(file+': duplicate IDs');
 if(file==='es/index.html'&&!html.includes('src="/scripts/project-data.es.js"'))errors.push(file+': project notes must use Spanish data');
 for(const image of html.matchAll(/<img\b[^>]*>/g))if(!/\balt=/.test(image[0]))errors.push(file+': image without alt');
 for(const match of html.matchAll(/\b(href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){
  let local=decodeURI(match[2].split('?')[0]);if(!local)continue;
  if(local.endsWith('/'))local+='index.html';
  try{await stat(join(root,local));assets++;}catch{errors.push(file+': missing '+local);}
 }
 for(const match of html.matchAll(/<meta property="og:image" content="https:\/\/elkinnn.github.io([^"]+)"/g))try{await stat(join(root,match[1]));}catch{errors.push(file+': missing Open Graph image');}
}
if(errors.length)throw new Error(errors.join('\n'));
console.log(`Verified ${routes.length*2} localized pages, ${assets} local links/assets, one h1 per page, image alternatives and preference bootstrap.`);
