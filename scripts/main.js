document.documentElement.classList.add('js');
const ui=window.portfolioUI;
const message=(key,n)=>ui[key].replace('{n}',String(n));
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const storage={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
const themeButton=document.querySelector('.theme-toggle');
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(theme){document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#0b1021':'#f7f8fc';themeButton.setAttribute('aria-label',ui[theme==='dark'?'light':'dark']);}
applyTheme(document.documentElement.dataset.theme||'light');themeButton.hidden=false;
themeButton.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';storage.set('elkin-portfolio-theme',next);applyTheme(next)});
systemTheme.addEventListener('change',event=>{if(!storage.get('elkin-portfolio-theme'))applyTheme(event.matches?'dark':'light')});
document.querySelectorAll('[data-language]').forEach(link=>link.addEventListener('click',()=>storage.set('elkin-portfolio-language',link.dataset.language)));
const siteHeader=document.querySelector('.site-header');
const updateHeader=()=>siteHeader.classList.toggle('is-scrolled',scrollY>12);updateHeader();addEventListener('scroll',updateHeader,{passive:true});

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
menuToggle.hidden = false;

function setMenu(open, restoreFocus = false) {
  menuToggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  menuToggle.querySelector('.menu-label').textContent = open ? ui.close : ui.menu;
  if (restoreFocus) menuToggle.focus();
}

menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
matchMedia('(min-width: 961px)').addEventListener('change', () => setMenu(false));

// The homepage inspector and dedicated project pages share the same source data.
const dialog = document.querySelector('#project-dialog');
if (dialog && window.portfolioProjects) {
  const projects = window.portfolioProjects;
  const order = Object.keys(projects);
  let activeProject = order[0];
  let trigger;

  function renderProject(key) {
    const project = projects[key];
    activeProject = key;
    for (const field of ['title', 'category', 'summary', 'context', 'contribution', 'architecture']) {
      document.querySelector('#dialog-' + field).textContent = project[field];
    }
    document.querySelector('#dialog-page').href = project.url;
    document.querySelector('#dialog-repo').href = project.repo;
    document.querySelector('#dialog-history').href = project.history;
    document.querySelector('#dialog-tags').replaceChildren(...project.tags.map(tag => {
      const item = document.createElement('li');
      item.textContent = tag;
      return item;
    }));
  }

  document.querySelectorAll('[data-project]').forEach(button => {
    button.addEventListener('click', () => {
      trigger = button;
      setMenu(false);
      renderProject(button.dataset.project);
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('dialog-open');
      dialog.querySelector('.dialog-close').focus({preventScroll:true});
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    trigger?.focus({preventScroll:true});
  });
  document.querySelector('#next-project').addEventListener('click', () => {
    renderProject(order[(order.indexOf(activeProject)+1)%order.length]);
    dialog.scrollTop = 0;
    dialog.querySelector('.dialog-close').focus({preventScroll:true});
  });
}

const workFilter = document.querySelector('.collection-controls [role="group"]');
if (workFilter) {
  const cards = [...document.querySelectorAll('[data-work-area]')];
  const buttons = [...workFilter.querySelectorAll('[data-filter]')];
  workFilter.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item===button)));
    cards.forEach(card => card.hidden = button.dataset.filter !== 'all' && card.dataset.workArea !== button.dataset.filter);
    const count = cards.filter(card => !card.hidden).length;
    document.querySelector('#work-count').textContent = message(count===1?'project':'projects',count);
  });
}

const toolSearch = document.querySelector('#tool-search');
if (toolSearch) {
  const groups = [...document.querySelectorAll('[data-tool-group]')];
  const filter = document.querySelector('.toolkit-controls [role="group"]');
  const buttons = [...filter.querySelectorAll('[data-filter]')];
  const clear = document.querySelector('#clear-search');
  let area = 'all';

  function updateTools() {
    const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const term = normalize(toolSearch.value.trim());
    let count = 0;
    groups.forEach(group => {
      let groupCount = 0;
      group.querySelectorAll('[data-tool-name]').forEach(tool => {
        const visible = (area==='all' || group.dataset.toolGroup===area) && normalize(tool.dataset.toolName + ' ' + group.dataset.toolGroup + ' ' + group.querySelector('h2').textContent).includes(term);
        tool.hidden = !visible;
        if (visible) groupCount++;
      });
      group.hidden = groupCount===0;
      count += groupCount;
    });
    clear.hidden = toolSearch.value.length===0;
    document.querySelector('#empty-tools').hidden = count!==0;
    document.querySelector('#toolkit-count').textContent = message(count===1?'tool':'tools',count);
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.filter===area)));
  }

  filter.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    area = button.dataset.filter;
    updateTools();
  });
  toolSearch.addEventListener('input',updateTools);
  clear.addEventListener('click', () => {
    toolSearch.value = '';
    updateTools();
    toolSearch.focus();
  });
  document.querySelector('#reset-tools').addEventListener('click', () => {
    area = 'all';
    toolSearch.value = '';
    updateTools();
    toolSearch.focus();
  });
}

const year=document.querySelector('#year');
if(year)year.textContent=String(new Date().getFullYear());

const copyEmail=document.querySelector('[data-copy-email]');
if(copyEmail)copyEmail.addEventListener('click',async()=>{
 const feedback=document.querySelector('#copy-feedback');
 try{await navigator.clipboard.writeText(copyEmail.dataset.copyEmail);feedback.textContent=ui.copied;}
 catch{feedback.textContent=ui.copyFailed;}
});

// Content is visible before enhancement; motion is optional and stops in hidden tabs.
const revealTargets=document.querySelectorAll('.selected-project,.experience-card,.secondary-portrait,.focus-tool-grid>article,.home-credential,.learning-card,.about-principles article');
function showAll(){document.body.classList.remove('reveal-ready');revealTargets.forEach(el=>el.classList.add('is-visible'));}
if(!reduceMotion.matches&&'IntersectionObserver' in window){document.body.classList.add('reveal-ready');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:0.07});revealTargets.forEach(el=>{el.dataset.reveal='';observer.observe(el)});}else showAll();
reduceMotion.addEventListener('change',event=>{if(event.matches)showAll()});
if(!reduceMotion.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;observer.unobserve(entry.target);const target=Number(entry.target.dataset.counter),start=performance.now();const step=now=>{const progress=Math.min(1,(now-start)/1100);entry.target.textContent=String(Math.round(target*(1-Math.pow(1-progress,3))));if(progress<1&&!reduceMotion.matches)requestAnimationFrame(step);else entry.target.textContent=String(target)};requestAnimationFrame(step)}),{threshold:.8});document.querySelectorAll('[data-counter]').forEach(el=>observer.observe(el));}
const phrase=document.querySelector('[data-rotating]');let phraseIndex=0,phraseTimer;
function rotatePhrase(){clearInterval(phraseTimer);if(!phrase||reduceMotion.matches||document.hidden)return;phraseTimer=setInterval(()=>{phrase.classList.add('is-changing');setTimeout(()=>{phraseIndex=(phraseIndex+1)%ui.phrases.length;phrase.textContent=ui.phrases[phraseIndex];phrase.classList.remove('is-changing')},200)},3400)}
rotatePhrase();document.addEventListener('visibilitychange',rotatePhrase);reduceMotion.addEventListener('change',rotatePhrase);addEventListener('pagehide',()=>clearInterval(phraseTimer));
