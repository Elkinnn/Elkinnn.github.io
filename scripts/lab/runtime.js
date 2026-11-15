import {readPreferences,writePreference,KEYS} from './preferences.js';
import {translate,localPath} from './localization.js';
let storage;try{storage=localStorage}catch{}
const motionQuery=matchMedia('(prefers-reduced-motion:reduce)');
export const preferences=readPreferences(storage,{language:navigator.language,reducedMotion:motionQuery.matches});
const listeners=new Set(),textSources=new WeakMap(),attributeSources=new WeakMap(),linkSources=new WeakMap();
export const subscribeSettings=callback=>{listeners.add(callback);return()=>listeners.delete(callback)};
const attributes=['aria-label','aria-valuetext','title','alt','placeholder'];
function renderText(node){
 if(!node.parentElement||node.parentElement.closest('script,style,noscript,[data-orbital-ignore]'))return;
 const current=node.nodeValue;if(!current.trim())return;
 let record=textSources.get(node);if(!record||current!==record.rendered)record={source:current,rendered:current};
 const value=record.source.match(/^\s*/)[0]+translate(record.source,preferences.language)+record.source.match(/\s*$/)[0];
 if(value!==current)node.nodeValue=value;record.rendered=value;textSources.set(node,record);
}
function renderElement(element){
 if(element.closest('[data-orbital-ignore]'))return;
 let record=attributeSources.get(element);if(!record){record={};attributeSources.set(element,record)}
 for(const name of attributes){const current=element.getAttribute(name);if(current===null)continue;const old=record[name];const source=old&&current===old.rendered?old.source:current;const value=translate(source,preferences.language);record[name]={source,rendered:value};if(value!==current)element.setAttribute(name,value);}
 if(element.matches('a[href]')){let source=linkSources.get(element);if(!source){source=element.getAttribute('href');linkSources.set(element,source)}const base=source.startsWith('/es/')?source.slice(3):source;element.setAttribute('href',localPath(base,preferences.language));}
}
function renderTree(root){
 if(root.nodeType===Node.TEXT_NODE){renderText(root);return}
 if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
 if(root.nodeType===Node.ELEMENT_NODE)renderElement(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode()))node.nodeType===Node.TEXT_NODE?renderText(node):renderElement(node);
}
const observer=new MutationObserver(records=>{
 observer.disconnect();
 const nodes=new Set();for(const record of records){if(record.type==='childList')record.addedNodes.forEach(node=>nodes.add(node));else nodes.add(record.target)}
 for(const node of nodes)renderTree(node);observe();
});
function observe(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes})}
const descriptionSource=document.querySelector('meta[name="description"]').content;
export function refreshLocalization(){observer.disconnect();document.documentElement.lang=preferences.language;document.title='Orbital — Elkin López';document.querySelectorAll('meta[name="description"],meta[property="og:description"]').forEach(meta=>meta.content=translate(descriptionSource,preferences.language));renderTree(document.body);observe();}
export function applySettings(changes={},persist=true){
 Object.assign(preferences,changes);
 if(persist)for(const [key,value] of Object.entries(changes))writePreference(storage,KEYS[key==='language'?'language':key==='reducedMotion'?'motion':key],value);
 const root=document.documentElement;root.dataset.theme=preferences.theme;root.dataset.reducedMotion=String(preferences.reducedMotion);root.lang=preferences.language;
 document.querySelector('meta[name="theme-color"]').content=preferences.theme==='dark'?'#0b1021':'#f7f8fc';
 document.querySelectorAll('[data-game-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.gameLanguage===preferences.language)));
 document.querySelectorAll('[data-game-theme]').forEach(button=>button.setAttribute('aria-label',preferences.theme==='dark'?'Switch to light theme':'Switch to dark theme')); 
 document.querySelector('#reduce-game-motion').checked=preferences.reducedMotion;document.querySelector('#game-quality').value=preferences.quality;
 refreshLocalization();listeners.forEach(callback=>callback({...preferences}));
}
document.querySelectorAll('[data-game-language]').forEach(button=>button.addEventListener('click',()=>applySettings({language:button.dataset.gameLanguage})));
document.querySelectorAll('[data-game-theme]').forEach(button=>button.addEventListener('click',()=>applySettings({theme:preferences.theme==='dark'?'light':'dark'}))); 
document.querySelector('#reduce-game-motion').addEventListener('change',event=>applySettings({reducedMotion:event.target.checked}));
document.querySelector('#game-quality').addEventListener('change',event=>applySettings({quality:event.target.value}));
motionQuery.addEventListener('change',event=>{let explicit;try{explicit=storage?.getItem(KEYS.motion)}catch{}if(explicit!=='true'&&explicit!=='false')applySettings({reducedMotion:event.matches},false)});
applySettings({},false);
