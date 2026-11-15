export const KEYS=Object.freeze({theme:'elkin-portfolio-theme',language:'elkin-portfolio-language',motion:'elkin-orbital-reduced-motion',quality:'elkin-orbital-quality'});
const get=(storage,key)=>{try{return storage?.getItem(key)}catch{return null}};
export function writePreference(storage,key,value){try{storage?.setItem(key,String(value));return !!storage}catch{return false}}
export function readPreferences(storage,{language='en',reducedMotion=false}={}){
 const theme=get(storage,KEYS.theme),locale=get(storage,KEYS.language),motion=get(storage,KEYS.motion),quality=get(storage,KEYS.quality);
 return {theme:['light','dark'].includes(theme)?theme:'dark',language:['en','es'].includes(locale)?locale:String(language).toLowerCase().startsWith('es')?'es':'en',reducedMotion:motion==='true'||motion!=='false'&&reducedMotion,quality:['auto','high','low'].includes(quality)?quality:'auto'};
}
export function graphicsPreset(quality,{mobile=false,pixelRatio=1}={}){const low=quality==='low'||quality==='auto'&&mobile;return {name:low?'low':'high',pixelRatio:Math.min(Math.max(.5,pixelRatio||1),low?1:1.6),shadows:!low,shadowSize:low?512:2048};}
// A wall-clock timer whose phase stays fixed while a modal or focus pause is active.
export class ActiveClock{
 constructor(now=0){this.reset(now)}
 reset(now){this.total=0;this.anchor=now;this.paused=false}
 seconds(now){return (this.total+(this.paused?0:Math.max(0,now-this.anchor)))/1000}
 pause(now){if(!this.paused){this.total+=Math.max(0,now-this.anchor);this.paused=true}}
 resume(now){if(this.paused){this.anchor=now;this.paused=false}}
}
export class FrameBudget{
 constructor(){this.reset()}
 reset(){this.count=0;this.total=0;this.warned=false}
 sample(milliseconds,quality){if(!Number.isFinite(milliseconds)||milliseconds<=0||milliseconds>1000)return null;this.total+=milliseconds;this.count++;if(this.count<120)return null;const average=this.total/this.count;this.count=0;this.total=0;if(quality==='auto'&&average>42)return 'lower';if(average>100&&!this.warned){this.warned=true;return 'warn'}return null}
}
