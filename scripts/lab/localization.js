import {catalog} from './locale-data.js';
const normalize=s=>String(s).replace(/\s+/g,' ').trim();
const invariant=new Set(catalog.invariants.map(normalize));
const insensitive=new Map(Object.entries(catalog.strings).map(([k,v])=>[k.toLocaleLowerCase('en'),v]));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.entries(catalog.patterns).sort((a,b)=>b[0].replace(/\{\w+\}/g,'').length-a[0].replace(/\{\w+\}/g,'').length).map(([source,value])=>{
 const keys=[];let last=0,expression='';for(const match of source.matchAll(/\{(\w+)\}/g)){expression+=escape(source.slice(last,match.index))+(['n','m','range'].includes(match[1])?'([\\d.]+)':'(.+?)');keys.push(match[1]);last=match.index+match[0].length;}expression+=escape(source.slice(last));return {regex:new RegExp('^'+expression+'$','i'),keys,value};
});
const warned=new Set();
export function translate(text,language='en',{strict=false,depth=0}={}){
 const source=normalize(text);if(language!=='es'||!source||!/[\p{L}]/u.test(source)||invariant.has(source))return source;
 const decoration=source.match(/\s*([↗→↺◎◇×✓])$/);if(decoration&&source.length>decoration[0].length)return translate(source.slice(0,-decoration[0].length),language,{strict,depth})+' '+decoration[1];
 const exact=catalog.strings[source];if(exact)return exact;
 const upper=source===source.toLocaleUpperCase('en');const insensitiveValue=insensitive.get(source.toLocaleLowerCase('en'));if(insensitiveValue)return upper?insensitiveValue.toLocaleUpperCase('es'):insensitiveValue;
 if(depth<5)for(const {regex,keys,value} of patterns){const match=regex.exec(source);if(!match)continue;const values=Object.fromEntries(keys.map((key,i)=>[key,translate(match[i+1],'es',{strict,depth:depth+1})]));const result=value.replace(/\{(\w+)\}/g,(_,key)=>values[key]);return upper?result.toLocaleUpperCase('es'):result;}
 // Translating already localized content is harmless (e.g. browser-generated option text).
 if(Object.values(catalog.strings).includes(source))return source;
 if(strict)throw Error('Missing Orbital translation: '+source);
 if(!warned.has(source)){warned.add(source);console.warn('Missing Orbital translation:',source)}return source;
}
export const t=text=>translate(text,globalThis.document?.documentElement?.lang||'en');
export function localPath(path,language){return path==='/'||path.startsWith('/work/')? (language==='es'?'/es':'')+path:path;}
