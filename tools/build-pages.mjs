import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {portfolioSections} from './portfolio-sections.mjs';
import {icon} from './icons.mjs';
import {orbitalHead,orbitalHUD,orbitalSettings,orbitalTouch,orbitalEntryPreferences,validateOrbital} from './orbital-ui.mjs';
import {decorate,localizedProjects,finishTranslations} from './i18n.mjs';
const portfolioOnly=process.argv.includes('--portfolio-only');
if(!portfolioOnly){await import('./build-orbital-ui.mjs');await import('./build-lab.mjs');}

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFile(join(root, path), 'utf8');
const projects = JSON.parse(await read('content/projects.json'));
const collection = JSON.parse(await read('content/collection.json'));
const credentials = JSON.parse(await read('content/credentials.json'));
const toolkit = JSON.parse(await read('content/toolkit.json'));
const home = await read('templates/home.html');
const concepts = await read('templates/project-visuals.html');
const inspector = await read('templates/project-inspector.html');
const profile = JSON.parse(await read('content/profile.json'));
const projectList = Object.values(projects);
const email = 'elkinjoao2004@hotmail.com';
const linkedin = 'https://www.linkedin.com/in/elkin-joao-l%C3%B3pez-garc%C3%A9s-479037416/';
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external = url => /^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
const arrow = '<span aria-hidden="true">↗</span>';
const tags = items => `<ul class="tags" aria-label="Technologies">${items.map(item=>`<li>${e(item)}</li>`).join('')}</ul>`;
const date = value => new Intl.DateTimeFormat('en', {month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));

function header(current) {
 return `<header class="site-header" id="top"><div class="header-inner shell"><a class="brand" href="/" aria-label="Elkin López, home"><span class="brand-monogram">EL<span>.</span></span><span class="brand-caption">ELKIN LÓPEZ<span>SOFTWARE ENGINEERING</span></span></a><nav class="site-nav" id="site-nav" aria-label="Main navigation">${[['work','Work'],['about','About'],['toolkit','Toolkit'],['lab','Orbital'],['contact','Contact']].map(([key,label])=>`<a href="/${key}/"${current===key?' aria-current="page"':''}>${label}</a>`).join('')}</nav><div class="header-controls"><div class="language-switch" role="group" aria-label="Language"><a class="language-link" data-language="en" href="/">EN</a><span aria-hidden="true">/</span><a class="language-link" data-language="es" href="/es/">ES</a></div><button class="theme-toggle icon-button" aria-label="Switch to dark theme" hidden>${icon('sun','sun-icon')}${icon('moon','moon-icon')}</button><a class="header-cv" href="${profile.cv}" download>CV ${icon('download')}</a><button class="menu-toggle icon-button" aria-expanded="false" aria-controls="site-nav" hidden><span class="sr-only menu-label">Menu</span>${icon('menu')}</button></div></div></header>`;
}
function footer(){return `<footer class="portfolio-footer"><div class="shell"><div class="footer-invitation"><div><p class="eyebrow">LET’S CONNECT</p><h2>Good ideas deserve<br><em>a conversation.</em></h2><a class="footer-email" href="mailto:${email}">${email} ${icon('arrow')}</a></div><a class="footer-portrait" href="/contact/" aria-label="Contact Elkin López"><img src="/assets/profile/elkin-round-640.webp" alt="Elkin López wearing a tuxedo with a pink flower" width="640" height="640" loading="lazy"></a></div><div class="footer-directory"><a class="footer-signature" href="/">EL<span>.</span><small>Learning. Building. Connecting.</small></a><div class="footer-socials"><a href="${profile.github}" target="_blank" rel="noopener noreferrer">${icon('github')} GitHub</a><a href="${linkedin}" target="_blank" rel="noopener noreferrer">${icon('linkedin')} LinkedIn</a><a href="${profile.cv}" download>${icon('download')} Download CV</a></div></div><div class="footer-bottom"><span>© <span id="year">2026</span> Elkin López</span><span>Academic work. Professional practice. Continuous learning.</span><a href="#top">Back to top ${icon('up')}</a></div></div></footer>`;}

function portfolioMeta(path='/') {
  const url='https://elkinnn.github.io'+path;
  const person={"@context":"https://schema.org","@type":"Person",name:profile.name,url:'https://elkinnn.github.io/',image:'https://elkinnn.github.io'+profile.photo,jobTitle:profile.title,sameAs:[profile.github,profile.linkedin]};
  return `<link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://elkinnn.github.io/assets/profile/og-portfolio-en.jpg"><meta property="og:image:alt" content="Elkin Joao López Garcés"><meta name="twitter:card" content="summary_large_image"><meta name="author" content="Elkin Joao López Garcés">${path==='/'?`<script type="application/ld+json">${JSON.stringify(person)}</script>`:''}${path==='/404.html'?'<meta name="robots" content="noindex">':''}`;
}

function page({title,description,current,body,kind='',head='',path=''}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f5f1e8">${kind==='lab-page'?orbitalHead():''}<title>${e(title)} — Elkin López</title><meta name="description" content="${e(description)}"><meta property="og:title" content="${e(title)} — Elkin López"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><link rel="icon" href="/assets/portfolio-favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles/main.css"><link rel="stylesheet" href="/styles/pages.css"><link rel="stylesheet" href="/styles/design-tokens.css">${kind==='lab-page'?'':'<link rel="stylesheet" href="/styles/portfolio.css">'+portfolioMeta(path||'/'+(current?current+'/':'404.html'))}${kind==='lab-page'?'':'<script src="/scripts/main.js" defer></script>'}${head}</head>
<body${kind==='lab-page'?' class="game-body"':' class="portfolio"'}><a class="skip-link" href="#main">Skip to content</a>${kind==='lab-page'?'':header(current)}<main class="page-main ${kind}" id="main">${body}</main>${kind==='lab-page'?'':footer()}</body></html>\n`;
}

function masthead(index,title,copy,extra='') {
  return `<section class="page-masthead shell"><div><p class="eyebrow section-index">${index}</p><h1 class="page-title">${title}</h1></div><div class="masthead-aside"><p>${copy}</p>${extra}</div></section>`;
}

function visual(key) {
  const marker = `class="project-visual ${key}-visual"`;
  const position = concepts.indexOf(marker);
  if (position < 0) throw new Error(`Missing visual: ${key}`);
  const start = concepts.lastIndexOf('<div',position);
  const tokens = /<\/?div\b[^>]*>/g;
  tokens.lastIndex = start;
  let depth = 0;
  for (let token; (token=tokens.exec(concepts));) {
    depth += token[0].startsWith('</') ? -1 : 1;
    if (!depth) return concepts.slice(start,tokens.lastIndex);
  }
  throw new Error(`Unclosed visual: ${key}`);
}

const filterButtons = (name,items) => `<div class="filter-buttons" role="group" aria-label="${name}">${items.map(([id,label],i)=>`<button class="filter-button" data-filter="${id}" aria-pressed="${i===0}">${label}</button>`).join('')}</div>`;

function workPage() {
  const featured = projectList.map(p=>`<article class="archive-card archive-featured" data-work-area="${p.area}"><a class="archive-visual" href="${p.url}" aria-label="Read ${e(p.title)}">${visual(p.visual)}</a><div class="archive-copy"><p class="project-type">${p.number} / ${e(p.scope)}</p><h2><a href="${p.url}">${e(p.shortTitle)}</a></h2><p>${e(p.summary)}</p><p class="archive-contribution"><span>MY CONTRIBUTION</span>${e(p.contribution)}</p>${tags(p.tags)}<a class="project-link" href="${p.url}">Read the project ${arrow}</a></div></article>`).join('');
  const others = collection.map(p=>`<article class="archive-card archive-note" data-work-area="${p.area}"><p class="project-type">${e(p.kind)}</p><h2>${e(p.title)}</h2><p>${e(p.description)}</p>${p.contribution?`<p class="archive-contribution"><span>MY CONTRIBUTION</span>${e(p.contribution)}</p>`:''}${tags(p.tags)}<div class="archive-links"><a class="text-link" href="${e(p.url)}"${external(p.url)}>View repository ${arrow}</a>${p.history?`<a class="quiet-link" href="${e(p.history)}"${external(p.history)}>My contributions ↗</a>`:''}${p.secondaryUrl?`<a class="quiet-link" href="${e(p.secondaryUrl)}"${external(p.secondaryUrl)}>${p.secondaryLabel} ↗</a>`:''}</div></article>`).join('');
  return masthead('01 / THE WORK','Different problems.<br><em>Connected thinking.</em>','Academic projects and collaborative contributions across interfaces, services, data and applied AI.','<p class="aside-small">Each featured project explains its context and my individual contribution.</p>')+
    `<section class="shell archive-section" aria-label="Project collection"><div class="collection-controls">${filterButtons('Filter projects',[['all','All work'],['interfaces','Interfaces'],['systems','Systems & data'],['ai','Applied AI']])}<p class="result-count" id="work-count" aria-live="polite">${projectList.length+collection.length} projects &amp; experiments</p></div><div class="archive-grid">${featured}${others}</div><div class="collection-end"><p>More learning, experiments and code.</p><a class="text-link" href="https://github.com/Elkinnn?tab=repositories" target="_blank" rel="noopener noreferrer">Browse all repositories ${arrow}</a></div></section>`;
}

function credentialCard(c) {
  return `<article class="learning-card"><div class="learning-art">${c.image?`<img src="${c.image}" alt="${e(c.title)} badge, issued by ${e(c.issuer)}" width="104" height="104">`:'<span class="fcc-identity">freeCodeCamp<span aria-hidden="true">(f)</span></span>'}</div><div class="learning-copy"><p class="credential-issuer">${e(c.issuer)} · ${e(c.type)}</p><h3>${e(c.title)}</h3><p>${e(c.description)}</p><div class="learning-meta"><time datetime="${c.issuedOn}">${date(c.issuedOn)}</time>${c.duration?`<span>${c.duration.approximate?'Approx. ':''}${c.duration.hours} hours${c.duration.approximate?' · issuer estimate':''}</span>`:''}${c.academy&&c.academy!=='Networking Academy'?`<span>${e(c.academy)}</span>`:''}</div><a class="text-link" href="${e(c.url)}"${external(c.url)}>${c.issuer==='freeCodeCamp'?'View certificate':'View credential'} ${arrow}</a></div></article>`;
}

function toolkitPage() {
  const count = toolkit.groups.reduce((sum,g)=>sum+g.tools.length,0);
  return masthead('03 / THE TOOLKIT','Different tools.<br><em>Shared foundations.</em>','Tools I’ve used across projects and coursework, grouped by where they fit in an application.','<p class="aside-small">Explore the project links to see concrete examples of the work.</p>')+
    `<section class="shell toolkit-library" aria-label="Technology library"><div class="toolkit-controls"><div class="tool-search"><label for="tool-search">Find a tool</label><div><input id="tool-search" type="search" placeholder="Try Python, React or SQL…" autocomplete="off" aria-describedby="toolkit-count"><button id="clear-search" aria-label="Clear tool search" hidden>×</button></div></div>${filterButtons('Filter technology areas',[['all','All areas'],['interfaces','Frontend'],['backend','Backend'],['data','Data'],['ai','AI'],['quality','Quality']])}<p class="result-count" id="toolkit-count" aria-live="polite">${count} tools</p></div><p class="empty-search" id="empty-tools" hidden>No matching tools. <button class="quiet-link" id="reset-tools">Clear the filters</button></p>${toolkit.groups.map((g,i)=>`<section class="tool-library-group" data-tool-group="${g.id}" aria-labelledby="tools-${g.id}"><div class="tool-group-heading"><span class="eyebrow">0${i+1}</span><div><h2 id="tools-${g.id}">${e(g.title)}</h2><p>${e(g.intro)}</p></div><a class="quiet-link" href="${e(g.exampleUrl)}"${external(g.exampleUrl)}>${e(g.example)} ↗</a></div><div class="technology-grid">${g.tools.map(([name,icon])=>`<div class="technology-item" data-tool-name="${e(name.toLowerCase())}">${icon?`<img src="/assets/icons/${icon}.svg" alt="" width="32" height="32" loading="lazy">`:`<span class="tool-initial" aria-hidden="true">${e(name[0])}</span>`}<span>${e(name)}</span></div>`).join('')}</div></section>`).join('')}</section>
    <section class="concepts-band"><div class="shell"><p class="eyebrow section-index">ADDITIONAL TOOLS &amp; CONCEPTS</p><h2>Beyond the tool names.</h2><div class="concept-list">${toolkit.concepts.map(c=>`<span>${e(c)}</span>`).join('')}</div></div></section>`;
}

function systemStudy(p) {
  const row = (label,steps) => `<div class="system-lane"><span class="system-lane-label">${label}</span><div>${steps.map((s,i)=>`${i?'<span class="system-arrow" aria-hidden="true">→</span>':''}<span class="system-node">${s}</span>`).join('')}</div></div>`;
  if(p.id==='stayschool')return row('ACCESS',['Teacher / guardian','Role-specific views'])+row('APPLICATION',['Next.js + TypeScript','MongoDB + Mongoose']);
  if(p.id==='hospital')return row('REQUEST',['React frontend','API gateway'])+'<div class="system-lane"><span class="system-lane-label">SEPARATE SERVICES</span><div><span class="system-node">Administration</span><span class="system-node">Physicians</span></div></div>'+row('PERSISTENCE',['MySQL']);
  return row('RECOGNITION',['YOLO detection','OpenCV segmentation','Character CNN'])+`<div class="system-lane"><span class="system-lane-label">MONITORING COMPONENTS</span><div><span class="system-node">Speed estimation</span><span class="system-node">Mamdani inference</span><span class="system-node">Streamlit</span></div></div>`;
}

function projectPage(p,next) {
  return `<div class="shell breadcrumbs"><nav aria-label="Breadcrumb"><a href="/work/">Work</a><span aria-hidden="true">/</span><span>${e(p.shortTitle)}</span></nav></div><section class="shell case-hero"><div><p class="eyebrow section-index">${p.number} / ${e(p.category.split(' / ')[0])}</p><h1 class="page-title case-title">${e(p.title)}</h1><p class="case-summary">${e(p.summary)}</p><a class="text-link" href="${e(p.repo)}"${external(p.repo)}>Explore the repository ${arrow}</a></div><figure class="case-cover">${visual(p.visual)}<figcaption>Concept illustration · ${e(p.shortTitle)}</figcaption></figure></section><div class="shell case-meta"><div><span>CONTEXT</span><p>${e(p.scope)}</p></div><div><span>MY ROLE</span><p>${e(p.role)}</p></div><div><span>TECHNOLOGY</span><p>${e(p.tags.slice(0,3).join(' · '))}</p></div></div>
    <div class="shell case-layout"><aside class="case-index"><p class="eyebrow">IN THIS PROJECT</p><nav aria-label="Project sections"><a href="#context">01 / Context</a><a href="#contribution">02 / My contribution</a><a href="#system">03 / The system</a><a href="#source">04 / Code &amp; evidence</a></nav></aside><div class="case-content"><section id="context"><p class="eyebrow section-index">01 / CONTEXT</p><h2>The application<br><em>and its purpose.</em></h2><p>${e(p.context)}</p></section><section id="contribution" class="contribution-panel"><p class="eyebrow section-index">02 / MY CONTRIBUTION</p><h2>My part in<br><em>the work.</em></h2><p>${e(p.contribution)}</p><a class="text-link" href="${e(p.history)}"${external(p.history)}>View the contribution history ${arrow}</a></section><section id="system"><p class="eyebrow section-index">03 / HOW IT FITS TOGETHER</p><h2>The parts,<br><em>connected.</em></h2><p>${e(p.architecture)}</p><div class="system-study" role="group" aria-label="Conceptual overview of the project components">${systemStudy(p)}<p>Component overview · Simplified for this project study</p></div>${tags(p.tags)}</section><section id="source"><p class="eyebrow section-index">04 / CODE &amp; EVIDENCE</p><h2>Explore<br><em>the source.</em></h2><p>The repository shows the wider project. The contribution link identifies my work within it.</p><div class="source-links"><a class="button button-dark" href="${e(p.repo)}"${external(p.repo)}>Open repository ${arrow}</a><a class="text-link" href="${e(p.history)}"${external(p.history)}>My contribution ${arrow}</a></div></section></div></div><section class="next-case"><div class="shell"><div><p class="eyebrow">ANOTHER PERSPECTIVE</p><a href="${next.url}">${e(next.shortTitle)} ${arrow}</a></div><a class="text-link" href="/work/">All work ${arrow}</a></div></section>`;
}

async function labBody(){const html=orbitalTouch((await read('templates/lab.html')).replace('{{MISSION_DOSSIERS}}',missionDossiers()).replace('{{ORBITAL_HUD}}',orbitalHUD()).replace('{{ORBITAL_SETTINGS}}',orbitalSettings()).replace('{{ORBITAL_ENTRY_PREFERENCES}}',orbitalEntryPreferences()));await validateOrbital(html);return html;}

async function write(path,contents) {
  const file=join(root,path);
  await mkdir(dirname(file),{recursive:true});
  if(path.endsWith('.html')&&!path.startsWith('lab/')){
    const route=path==='index.html'?'/':path==='404.html'?'/404.html':'/'+path.replace(/index\.html$/,'');
    await writeFile(file,decorate(contents,'en',route));
    const spanish=join(root,'es',path);await mkdir(dirname(spanish),{recursive:true});await writeFile(spanish,decorate(contents,'es',route));
  }else await writeFile(file,contents);
}

function missionDossiers() {
  const missions = [
    ['interfaces',projects.stayschool,'Alert Courier','Guardian alert delivered.','Observation collected, review route confirmed and guardian uplink restored.',['Observe','Evaluate','Notify']],
    ['systems',projects.hospital,'Relay Breach','System connected.','Three relays activated, barriers released and Browser → API → Database connected.',['Relays','Barriers','Connection']],
    ['ai',projects.traffic,'Signal Hunt','Analysis synchronized.','Scanner calibrated, three samples acquired and the analysis uplink restored.',['Calibrate','Acquire','Synchronize']]
  ];
  return missions.map(([kind,p,name,success,summary,steps])=>`<template data-dossier="${kind}">
    <header class="dossier-heading"><p class="eyebrow">THE PROJECT BEHIND ${e(name.toUpperCase())}</p><h2 id="dossier-title">${e(p.title)}</h2><p>${e(p.summary)}</p></header>
    <div class="dossier-achievement"><span aria-hidden="true">✓</span><div><h3>${e(success)}</h3><p>${e(summary)}</p></div><ol aria-label="Completed mission steps">${steps.map(step=>`<li>${e(step)}</li>`).join('')}</ol></div>
    <div class="mission-layout dossier-layout"><div class="dossier-context">
      <section aria-label="Project context"><h3><span>01</span> Project context</h3><p>${e(p.context)}</p></section>
      <section aria-label="How it works"><h3><span>02</span> How it works</h3><p>${e(p.architecture)}</p></section>
      <p class="dossier-concept">An original game inspired by the project’s concepts. The interactive mission is a simplified demonstration.</p>
    </div><aside class="mission-project dossier-sidebar" aria-label="My contribution and technologies">
      <section><h3>My contribution</h3><p>${e(p.contribution)}</p></section>
      <section><h3>Technologies</h3>${tags(p.tags)}</section>
    </aside></div>
    <nav class="dossier-links" aria-label="Explore this project"><a class="button button-dark" href="${e(p.url)}">View project ${arrow}</a><a href="${e(p.repo)}"${external(p.repo)}>Open repository ${arrow}</a><a href="${e(p.history)}"${external(p.history)}>My contributions ${arrow}</a></nav>
  </template>`).join('');
}

const sections=portfolioSections({profile,projects,credentials,toolkit,e,tags,visual,arrow,credentialCard});
const substitutions={HEADER:header('home'),FOOTER:footer(),SITE_META:portfolioMeta('/'),PROJECT_DIALOG:inspector,SELECTED_WORK:sections.selectedWork(),EXPERIENCE:sections.experience(),TOOLKIT:sections.homeToolkit(),CREDENTIALS:sections.homeCredentials(),STATS:[[profile.experience.hours,'Internship hours'],[projectList.length,'Featured projects'],[collection.length,'More projects'],[credentials.length,'Credentials']].map(([n,label])=>`<div><strong data-counter="${n}">${n}</strong><span>${label}</span></div>`).join(''),MARQUEE:['angular','react','typescript','csharp','oracle','nodejs','python','docker','postgresql','git'].map(name=>`<span><img src="/assets/icons/${name}.svg" width="28" height="28" alt="" loading="lazy">${({nodejs:'Node.js',csharp:'C#',postgresql:'PostgreSQL',typescript:'TypeScript'})[name]||name[0].toUpperCase()+name.slice(1)}</span>`).join('')};
await write('index.html',home.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(!(key in substitutions))throw new Error('Missing home section: '+key);return substitutions[key];}));
await write('scripts/project-data.es.js',`// Generated Spanish project notes.\nwindow.portfolioProjects = ${JSON.stringify(localizedProjects(projects),null,2)};\n`);
await write('scripts/project-data.js',`// Generated from content/projects.json by tools/build-pages.mjs.\nwindow.portfolioProjects = ${JSON.stringify(projects,null,2)};\n`);
await write('work/index.html',page({title:'Work',description:'Academic projects and collaborative contributions by Elkin López.',current:'work',body:workPage(),kind:'work-page'}));
await write('about/index.html',page({title:'About',description:'Elkin Joao López Garcés — software engineering studies, learning credentials and areas of work.',current:'about',body:sections.about(masthead),kind:'about-page'}));
await write('toolkit/index.html',page({title:'Toolkit',description:'Technologies used by Elkin López across projects and coursework, with public project examples.',current:'toolkit',body:toolkitPage(),kind:'toolkit-page'}));
await write('contact/index.html',page({title:'Contact',description:'Contact Elkin López for a project, collaboration or conversation about software.',current:'contact',body:sections.contact(masthead),kind:'contact-page'}));
if(!portfolioOnly)await write('lab/index.html',page({title:'Orbital',description:'An orbital expedition through Elkin’s software projects. Recover signals, solve three challenges and activate the Nexus.',current:'lab',body:await labBody(),kind:'lab-page',head:'<link rel="stylesheet" href="/styles/lab.css"><link rel="stylesheet" href="/styles/orbital.css"><link rel="stylesheet" href="/styles/systems.css"><link rel="stylesheet" href="/styles/fields.css"><link rel="stylesheet" href="/styles/dossier.css"><link rel="stylesheet" href="/styles/orbital-integration.css"><script type="module" src="/scripts/lab/main.js"></script>'}));
for(let i=0;i<projectList.length;i++) {
  const p=projectList[i];
  await write(`work/${p.path}/index.html`,page({title:p.title,description:p.summary,current:'work',path:'/work/'+p.path+'/',body:projectPage(p,projectList[(i+1)%projectList.length]),kind:'project-page'}));
}
await write('404.html',page({title:'Page not found',description:'Find your way back to Elkin López’s portfolio.',body:masthead('404 / PAGE NOT FOUND','Let’s get<br><em>you back.</em>','This address does not lead to a page in the portfolio.','<a class="button button-dark" href="/">Return home ↗</a>')}));
console.log(portfolioOnly?'Built the portfolio and project pages; preserved Orbital.':'Built the portfolio, playable lab, project pages and shared project data.');

await finishTranslations();
const portfolioRoutes=['/','/work/','/about/','/toolkit/','/contact/',...projectList.map(p=>p.url)];
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${portfolioRoutes.flatMap(route=>[route,'/es'+route]).map(route=>`<url><loc>https://elkinnn.github.io${route}</loc></url>`).join('')}</urlset>\n`);
