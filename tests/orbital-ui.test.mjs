import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {KEYS,readPreferences,writePreference,graphicsPreset,ActiveClock,FrameBudget} from '../scripts/lab/preferences.js';
import {translate,localPath} from '../scripts/lab/localization.js';
const store=values=>({values:new Map(Object.entries(values)),getItem(key){return this.values.get(key)??null},setItem(key,value){this.values.set(key,value)}});
test('saved portfolio language/theme are honored by Orbital and game changes use the same public keys',()=>{
 const storage=store({'elkin-portfolio-theme':'light','elkin-portfolio-language':'es'});
 assert.deepEqual(readPreferences(storage),{theme:'light',language:'es',reducedMotion:false,quality:'auto'});
 writePreference(storage,KEYS.theme,'dark');writePreference(storage,KEYS.language,'en');
 assert.equal(storage.getItem('elkin-portfolio-theme'),'dark');assert.equal(storage.getItem('elkin-portfolio-language'),'en');
 assert.equal(readPreferences(storage).language,'en');
});
test('missing or invalid preferences use a dark space scene and the browser language; storage denial is safe',()=>{
 const invalid=store({[KEYS.theme]:'purple',[KEYS.language]:'de',[KEYS.quality]:'ultra'});
 assert.deepEqual(readPreferences(invalid,{language:'es-EC',reducedMotion:true}),{theme:'dark',language:'es',reducedMotion:true,quality:'auto'});
 const denied={getItem(){throw Error('Denied')},setItem(){throw Error('Denied')}};
 assert.equal(readPreferences(denied,{language:'en-US'}).theme,'dark');assert.equal(writePreference(denied,KEYS.theme,'light'),false);
});
test('an explicit reduced-motion choice overrides the system default and remains separate from game saves',()=>{
 const storage=store({[KEYS.motion]:'false','elkin-orbit:v1':'existing progress'});
 assert.equal(readPreferences(storage,{reducedMotion:true}).reducedMotion,false);writePreference(storage,KEYS.motion,true);
 assert.equal(readPreferences(storage,{reducedMotion:false}).reducedMotion,true);assert.equal(storage.getItem('elkin-orbit:v1'),'existing progress');
});
test('graphics quality changes only rendering resolution/shadows, with conservative mobile auto defaults',()=>{
 assert.deepEqual(graphicsPreset('auto',{mobile:true,pixelRatio:3}),{name:'low',pixelRatio:1,shadows:false,shadowSize:512});
 assert.deepEqual(graphicsPreset('high',{mobile:true,pixelRatio:3}),{name:'high',pixelRatio:1.6,shadows:true,shadowSize:2048});
 assert.equal(graphicsPreset('auto',{mobile:false,pixelRatio:1}).name,'high');
});
test('timing practice freezes its phase during a long focus loss and resumes without a jump',()=>{
 const clock=new ActiveClock(1000);assert.equal(clock.seconds(1500),.5);clock.pause(1500);clock.pause(3000);
 assert.equal(clock.seconds(90000),.5);clock.resume(90000);assert.equal(clock.seconds(90250),.75);
 clock.reset(91000);assert.equal(clock.seconds(91200),.2);
});
test('frame budget ignores invalid/hidden gaps, lowers auto graphics before warning, and never changes mission state',()=>{
 const budget=new FrameBudget();for(const ms of [NaN,0,-1,5000])assert.equal(budget.sample(ms,'auto'),null);
 for(let i=0;i<119;i++)assert.equal(budget.sample(50,'auto'),null);assert.equal(budget.sample(50,'auto'),'lower');
 for(let i=0;i<119;i++)assert.equal(budget.sample(120,'low'),null);assert.equal(budget.sample(120,'low'),'warn');
 for(let i=0;i<120;i++)assert.equal(budget.sample(120,'low'),null);
});
test('dynamic HUD, instructions and nested targets translate without changing numbers or identifiers',()=>{
 const es=text=>translate(text,'es',{strict:true});
 assert.equal(es('GOLDEN SIGNALS 2/3 · MODULES 1/3'),'SEÑALES DORADAS 2/3 · MÓDULOS 1/3');
 assert.equal(es('Recover Golden signal 03'),'Recupera la señal dorada 03');
 assert.equal(es('Activate Relay 02'),'Activa el relé 02');
 assert.equal(es('Samples 3/3'),'Muestras 3/3');assert.equal(es('SYSTEMS'),'SISTEMAS');
 assert.equal(es('Enter Signal Hunt →'),'Entrar en Rastreo de señales →');
 assert.equal(es('12 m'),'12 m');assert.equal(es('TypeScript'),'TypeScript');
 assert.throws(()=>es('A newly added instruction without a translation'),/Missing Orbital translation/);
 assert.equal(translate('Activate Relay 02','en'),'Activate Relay 02');
});
test('return links follow the portfolio language and never rewrite assets, the game or external URLs',()=>{
 assert.equal(localPath('/','es'),'/es/');assert.equal(localPath('/work/stayschool/','es'),'/es/work/stayschool/');
 for(const path of ['/assets/cv/elkin-lopez-cv.pdf','/lab/','https://github.com/Elkinnn'])assert.equal(localPath(path,'es'),path);
});
test('every static game screen, accessibility label and project dossier has a Spanish translation',async()=>{
 const html=(await readFile(new URL('../lab/index.html',import.meta.url),'utf8')).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi,'');
 const strings=[...html.matchAll(/>([^<>]+)</g)].map(m=>m[1]);for(const m of html.matchAll(/(?:aria-label|alt|title)="([^"]+)"/g))strings.push(m[1]);
 for(const text of strings)assert.doesNotThrow(()=>translate(text.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"'),'es',{strict:true}),text);
});
test('3D signage is covered, including console instructions and dynamically numbered relays/samples',async()=>{
 for(const file of ['orbital-world.js','field-view.js','systems-view.js']){
  const source=await readFile(new URL('../scripts/lab/'+file,import.meta.url),'utf8');
  for(const m of source.matchAll(/\.sign\('([^']+)',\s*'([^']+)'/g))for(const text of [m[1],m[2]])assert.doesNotThrow(()=>translate(text,'es',{strict:true}),text);
 }
 for(const text of ['SAMPLE 01','RELAY 03','ACTIVATE RELAY 02','BARRIER / 01','01 / CALIBRATION','FINAL / ANALYSIS UPLINK','E TO INITIALIZE THE SCANNER'])assert.doesNotThrow(()=>translate(text,'es',{strict:true}),text);
});

test("completed practices explain their isolation even after a module has already been earned",()=>{
 for(const kind of ["Sequence","Wiring","Timing"]){const source=kind+" practice complete. Field-mission progress is unchanged.";const es=translate(source,"es",{strict:true});assert.notEqual(es,source);assert.doesNotMatch(es,/Completa |Entra en /);}
});
