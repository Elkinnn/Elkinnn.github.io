import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {icon,svgGlyphs} from './icons.mjs';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('content/translations/es.json',root),'utf8'));
const invariants=new Set(JSON.parse(await readFile(new URL('content/translations/invariants.json',root),'utf8')));
const ui=JSON.parse(await readFile(new URL('content/ui.json',root),'utf8'));
const missing=new Set();
const decode=s=>s.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",apos:"'",nbsp:' '}[k]));
const escape=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
export function translate(s){
 const key=decode(String(s)).replace(/\s+/g,' ').trim();
 if(!key||!/[a-zA-ZÀ-ž]/.test(key)||invariants.has(key))return key;
 if(Object.hasOwn(catalog,key))return catalog[key];
 missing.add(key);return key;
}
export function localizedProjects(projects){return Object.fromEntries(Object.entries(projects).map(([key,p])=>[key,{...p,...Object.fromEntries(['title','shortTitle','category','summary','context','contribution','architecture','scope','role'].map(k=>[k,translate(p[k])])),tags:p.tags.map(translate),url:'/es'+p.url}]));}
const boot=`(()=>{let theme;try{theme=localStorage.getItem('elkin-portfolio-theme')}catch{}theme=theme==='light'||theme==='dark'?theme:matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#0b1021':'#f7f8fc';try{const language=localStorage.getItem('elkin-portfolio-language')||((navigator.language||'en').startsWith('es')?'es':'en');if(language!==document.documentElement.lang){location.replace((language==='es'?'/es':'')+__PAGE_ROUTE__+location.search+location.hash)}}catch{}})();`;
export function decorate(html,lang,path){
 const blocks=[];
 html=html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi,s=>`<!--BLOCK${blocks.push(s)-1}-->`);
 html=html.replace(/<(a|span)\b([^>]*?)data-icon="([a-z]+)"([^>]*)><\/\1>/g,(_,tag,before,name,after)=>`<${tag}${before}${after}>${icon(name)}</${tag}>`);
 html=svgGlyphs(html);
 if(lang==='es'){
  html=html.replace(/(>)([^<]+)(?=<)/g,(_,gt,text)=>{if(!text.trim())return gt+text;return gt+text.match(/^\s*/)[0]+escape(translate(text))+text.match(/\s*$/)[0];});
  html=html.replace(/\b(aria-label|alt|placeholder|title)="([^"]*)"/g,(_,attr,value)=>`${attr}="${escape(translate(value))}"`);
  html=html.replace(/<meta\b[^>]*>/g,tag=>/\b(name="description"|property="og:(title|description)")/.test(tag)?tag.replace(/content="([^"]*)"/,(_,v)=>`content="${escape(translate(v))}"`):tag);
  html=html.replace(/<html lang="en"/,'<html lang="es"').replace(/(href|data-page)="(\/(?!assets\/|styles\/|scripts\/|lab\/|es\/)[^"]*)"/g,'$1="/es$2"');
  html=html.replace(/(<link rel="canonical" href="|<meta property="og:url" content=")https:\/\/elkinnn.github.io[^"]*/g,(_,prefix)=>prefix+'https://elkinnn.github.io/es'+path);
 }
 html=html.replace(/<!--BLOCK(\d+)-->/g,(_,i)=>blocks[Number(i)]);
 if(lang==='es'){
  html=html.replace(/src="\/scripts\/project-data.js"/g,'src="/scripts/project-data.es.js"');
  html=html.replace(/<script type="application\/ld\+json">([^<]+)<\/script>/g,(_,raw)=>{const data=JSON.parse(raw);if(data.jobTitle)data.jobTitle=translate(data.jobTitle);return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;});
 }
 html=html.replace(/<a class="language-link" data-language="(en|es)"[^>]*>.*?<\/a>/g,(_,l)=>`<a class="language-link" data-language="${l}" href="${l==='es'?'/es'+path:path}" lang="${l}" hreflang="${l}"${lang===l?' aria-current="true"':''}>${l.toUpperCase()}</a>`);
 html=html.replace('</head>',`<link rel="alternate" hreflang="en" href="https://elkinnn.github.io${path}"><link rel="alternate" hreflang="es" href="https://elkinnn.github.io/es${path}"><script>window.portfolioUI=${JSON.stringify(ui[lang]).replace(/</g,'\\u003c')};</script></head>`);
 html=html.replace('<link rel="stylesheet"',`<script>${boot.replace('__PAGE_ROUTE__',JSON.stringify(path))}</script><link rel="stylesheet"`);
 html=html.replace(/assets\/profile\/og-portfolio-en.jpg/g,`assets/profile/og-portfolio-${lang}.jpg`);
 return html;
}
export async function finishTranslations(){
 await mkdir(new URL('../outputs/portfolio-v3/',root),{recursive:true});
 await writeFile(new URL('../outputs/portfolio-v3/missing-translations.json',root),JSON.stringify([...missing].sort(),null,2));
 for(const key of Object.keys(ui.en)){if(!ui.es[key])throw new Error('Missing Spanish UI translation: '+key);}
 if(missing.size&&!process.argv.includes('--collect-i18n'))throw new Error(`${missing.size} missing Spanish translations. See outputs/portfolio-v3/missing-translations.json`);
}
