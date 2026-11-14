import {FIELD_CONFIG,SAMPLES,SCAN_RANGE,samplePosition,pulseActive,fieldCheckpoint} from './field-layout.js';
import {clearShot} from './systems-mission.js';
export const fieldSaveKey=kind=>'elkin-field-'+kind+':v1';
export const freshFieldRun=()=>({stage:0,calibrated:false,captures:[],completed:false});
export function readFieldRun(storage,kind){try{const raw=JSON.parse(storage?.getItem(fieldSaveKey(kind)));if(raw?.version!==1)return freshFieldRun();const run=freshFieldRun();if(kind==='interfaces'){const stage=Number.isInteger(raw.stage)&&raw.stage>=0&&raw.stage<=3?raw.stage:0;run.stage=raw.completed===true&&stage===3?3:Math.min(stage,2);run.completed=run.stage===3;}else{run.calibrated=raw.calibrated===true;run.captures=run.calibrated?SAMPLES.filter(s=>Array.isArray(raw.captures)&&raw.captures.includes(s.id)).map(s=>s.id):[];run.completed=raw.completed===true&&run.calibrated&&run.captures.length===3;}return run;}catch{return freshFieldRun();}}
export function saveFieldRun(storage,kind,run){try{storage?.setItem(fieldSaveKey(kind),JSON.stringify({version:1,...run}));return !!storage;}catch{return false;}}
export class FieldMission {
 constructor(kind,saved=freshFieldRun()){this.kind=kind;this.config=FIELD_CONFIG[kind];this.run={...saved,captures:[...saved.captures]};this.active=false;this.clock=0;this.health=3;this.invulnerable=0;this.channel=0;this.scan=0;this.scanId=null;this.events=[];}
 start(assist=false){this.active=true;this.assist=assist;this.health=3;this.invulnerable=2;this.channel=0;this.scan=0;this.scanId=null;return {...fieldCheckpoint(this.kind,this.run)};}
 leave(){this.active=false;this.channel=0;this.scan=0;this.scanId=null;}
 restart(){this.run=freshFieldRun();this.clock=0;this.leave();}
 candidates(){if(this.run.completed)return [];const actions=this.config.actions;if(this.kind==='interfaces')return this.run.stage===0?[actions[0]]:this.run.stage===1?actions.filter(a=>['archive','evaluate','routine'].includes(a.id)):[actions.find(a=>a.id==='notify')];return !this.run.calibrated?[actions[0]]:this.run.captures.length===3?[actions[1]]:[];}
 nearest(player){
  if(this.run.completed){const action=this.config.actions.at(-1),distance=Math.hypot(action.point.x-player.x,action.point.z-player.z);return distance<1.65?{id:this.kind+'-project',kind:'project',name:'View project dossier',point:action.point,distance}:null;}
  return this.candidates().map(a=>({...a,kind:'field',distance:Math.hypot(a.point.x-player.x,a.point.z-player.z)})).filter(a=>a.distance<1.65).sort((a,b)=>a.distance-b.distance)[0]||null;
 }
 interact(id,player){if(!this.active||this.run.completed)return [];this.events=[];const action=this.candidates().find(a=>a.id===id);if(!action||Math.hypot(player.x-action.point.x,player.z-action.point.z)>=1.65)return [];
  if(this.kind==='interfaces'){
   if(id==='observe'){this.run.stage=1;this.events.push({type:'stage',message:'Observation collected. Repeated absence needs follow-up. Choose the correct review route.'});}
   else if(id==='evaluate'){this.run.stage=2;this.events.push({type:'stage',message:'Follow-up route confirmed. Deliver the packet to the guardian uplink.'});}
   else if(id==='notify'){if(!this.channel)this.channel=.001;}
   else this.events.push({type:'incorrect',message:'This demo observation needs follow-up. Use the Needs follow-up pad.'});
  }else if(id==='calibrate'){this.run.calibrated=true;this.events.push({type:'stage',message:'Scanner calibrated. Move close to a sample and hold F to acquire it.'});}
  else if(id==='analyze'&&!this.channel)this.channel=.001;
  return this.events;
 }
 damage(){if(this.invulnerable>0||this.assist||this.run.completed)return;this.health--;this.invulnerable=1.5;this.events.push({type:'noise',message:this.kind==='interfaces'?'Signal interference. Jump over the pulse or wait for its safe phase.':'Sensor noise. Jump, use Q or wait for the sweep to fade.'});if(this.health===0){this.health=3;this.invulnerable=2.5;this.channel=0;this.events.push({type:'retry',point:{...fieldCheckpoint(this.kind,this.run)},message:'Checkpoint restored. Confirmed observations and captures kept.'});}}
 tick(dt,player,{scanTarget=null,obstacles=[],boosting=false}={}){
  if(!this.active)return [];dt=Math.max(0,Math.min(dt,.05));this.events=[];this.clock+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);if(this.run.completed)return [];
  for(const pulse of this.config.pulses)if(!boosting&&pulseActive(pulse,this.clock)&&player.x>=pulse.minX&&player.x<=pulse.maxX&&player.z>=pulse.minZ&&player.z<=pulse.maxZ&&(player.height||0)<.55)this.damage();
  if(this.events.some(e=>e.type==='retry'))return this.events;
  if(this.kind==='ai'&&this.run.calibrated&&this.run.captures.length<3){
   const sample=SAMPLES.find(s=>s.id===scanTarget&&!this.run.captures.includes(s.id)),origin={x:player.x,y:1.25+(player.height||0),z:player.z},point=sample?samplePosition(sample,this.clock,this.assist):null;
   const valid=point&&Math.hypot(point.x-origin.x,point.y-origin.y,point.z-origin.z)<=SCAN_RANGE&&clearShot(origin,point,obstacles);
   if(valid){if(this.scanId!==sample.id){this.scanId=sample.id;this.scan=0;}this.scan+=dt/(this.assist?.7:1.35);if(this.scan>=1){this.run.captures.push(sample.id);this.events.push({type:'stage',message:sample.name+' acquired. '+this.run.captures.length+'/3 samples confirmed.'});this.scan=0;this.scanId=null;}}
   else{this.scan=Math.max(0,this.scan-dt*2);if(!this.scan)this.scanId=null;}
  }
  if(this.channel>0){const action=this.config.actions.find(a=>a.id===(this.kind==='interfaces'?'notify':'analyze'));if(Math.hypot(player.x-action.point.x,player.z-action.point.z)>1.8){this.channel=0;this.events.push({type:'interrupted',message:'Link interrupted. Stay beside the uplink while transmitting.'});}else{this.channel+=dt/1.8;if(this.channel>=1){this.channel=1;this.run.completed=true;if(this.kind==='interfaces')this.run.stage=3;this.events.push({type:'complete',message:this.kind==='interfaces'?'Guardian alert delivered. Interfaces restored.':'Analysis synchronized. Applied AI restored.'});}}}
  return this.events;
 }
}
