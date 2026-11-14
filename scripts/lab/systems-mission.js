import {RELAYS,closedGates,checkpoint} from './systems-layout.js';
export const SYSTEMS_SAVE_KEY='elkin-systems-sector:v1';
export const BLASTER_RANGE=5.5;
export const freshSystemsRun=()=>({relays:[],droneHp:3,completed:false});
export function readSystemsRun(storage) {
 try {const raw=JSON.parse(storage?.getItem(SYSTEMS_SAVE_KEY));if(raw?.version!==1)return freshSystemsRun();
  const relays=[];for(const relay of RELAYS){if(!Array.isArray(raw.relays)||!raw.relays.includes(relay.id))break;relays.push(relay.id);}
  return {relays,droneHp:raw.droneDisabled===true?0:3,completed:raw.completed===true&&relays.length===3};
 }catch{return freshSystemsRun();}
}
export function saveSystemsRun(storage,run) {try{storage?.setItem(SYSTEMS_SAVE_KEY,JSON.stringify({version:1,relays:run.relays,droneDisabled:run.droneHp===0,completed:run.completed}));return !!storage;}catch{return false;}}
// Segment collisions prevent fast bolts passing through targets or closed barriers.
export function sphereHit(a,b,center,radius) {
 const d={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},m={x:a.x-center.x,y:a.y-center.y,z:a.z-center.z};
 const aa=d.x*d.x+d.y*d.y+d.z*d.z,bb=m.x*d.x+m.y*d.y+m.z*d.z,cc=m.x*m.x+m.y*m.y+m.z*m.z-radius*radius;
 if(cc<=0)return 0;if(!aa)return null;const disc=bb*bb-aa*cc;if(disc<0)return null;
 const t=(-bb-Math.sqrt(disc))/aa;return t>=0&&t<=1?t:null;
}
export function boxHit(a,b,box) {
 let lo=0,hi=1;for(const [axis,min,max] of [['x',box.minX,box.maxX],['y',0,box.height],['z',box.minZ,box.maxZ]]){
  const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-9){if(a[axis]<min||a[axis]>max)return null;continue;}
  let t0=(min-a[axis])/delta,t1=(max-a[axis])/delta;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return null;
 }return lo;
}
export function clearShot(a,b,obstacles) {return !obstacles.some(box=>boxHit(a,b,box)!==null);}
export const dronePosition=time=>({x:23+Math.sin(time*.65)*2.1,y:2.35+Math.sin(time*1.8)*.1,z:-6.4+Math.cos(time*.65)*.6});
const direction=(a,b,speed)=>{const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)||1;return {x:(b.x-a.x)/length*speed,y:(b.y-a.y)/length*speed,z:(b.z-a.z)/length*speed};};
export class SystemsMission {
 constructor(saved=freshSystemsRun()){this.run={...saved,relays:[...saved.relays]};this.active=false;this.events=[];this.clock=0;this.bolts=[];this.shields=3;this.invulnerable=0;this.fireCooldown=0;this.enemyCooldown=2;this.charge=0;this.serial=0;}
 start(assist=false){this.active=true;this.assist=assist;this.shields=3;this.invulnerable=2.5;this.bolts=[];this.charge=0;this.enemyCooldown=2;this.fireCooldown=0;return {...checkpoint(this.run)};}
 leave(){this.active=false;this.bolts=[];this.charge=0;}
 restart(){this.run=freshSystemsRun();this.clock=0;this.leave();}
 targets(){return [...RELAYS.filter(r=>!this.run.relays.includes(r.id)).map(r=>({...r,kind:'relay',radius:.42})),...(this.run.droneHp>0&&!this.run.completed?[{id:'drone',name:'Patrol drone',kind:'drone',point:dronePosition(this.clock),radius:.65}]:[])];}
 shoot(player,aim){if(!this.active||this.run.completed||this.fireCooldown>0)return false;const position={x:player.x,y:1.25+(player.height||0),z:player.z};this.bolts.push({id:++this.serial,owner:'player',position,velocity:direction(position,aim,19),life:BLASTER_RANGE/19});this.fireCooldown=.28;return true;}
 activateRelay(id){const next=RELAYS[this.run.relays.length];if(!next||next.id!==id)return false;this.run.relays.push(id);this.events.push({type:'relay',id});return true;}
 hurt(){if(this.invulnerable>0||this.run.completed)return;this.invulnerable=1.2;
  if(this.assist){this.events.push({type:'absorbed'});return;}
  this.shields--;this.events.push({type:'hurt',shields:this.shields});
  if(this.shields===0){this.shields=3;this.invulnerable=2.5;this.bolts=[];this.charge=0;this.enemyCooldown=2.2;this.events.push({type:'retry',point:{...checkpoint(this.run)}});}
 }
 finish(){if(this.run.relays.length!==3)return false;this.run.completed=true;this.bolts=[];this.charge=0;return true;}
 tick(dt,player,obstacles){
  if(!this.active)return [];dt=Math.max(0,Math.min(dt,.05));this.events=[];this.clock+=dt;this.fireCooldown=Math.max(0,this.fireCooldown-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);
  const drone=dronePosition(this.clock),pilot={x:player.x,y:.95+(player.height||0),z:player.z};
  if(this.run.droneHp>0&&!this.run.completed){
   this.enemyCooldown=Math.max(0,this.enemyCooldown-dt);
   if(this.charge>0){this.charge-=dt;if(this.charge<=0){this.bolts.push({id:++this.serial,owner:'enemy',position:{...drone},velocity:direction(drone,this.lock,4.2),life:3});this.enemyCooldown=2;}}
   else if(this.enemyCooldown===0&&Math.hypot(drone.x-pilot.x,drone.z-pilot.z)<10&&clearShot(drone,pilot,obstacles)){this.lock={...pilot};this.charge=1.15;this.events.push({type:'warning'});}
  }
  const survivors=[];for(const bolt of this.bolts){
   const travel=Math.min(dt,bolt.life),a=bolt.position,b={x:a.x+bolt.velocity.x*travel,y:a.y+bolt.velocity.y*travel,z:a.z+bolt.velocity.z*travel};let closest={t:Infinity,kind:'none'};
   for(const wall of obstacles){const t=boxHit(a,b,wall);if(t!==null&&t<closest.t)closest={t,kind:'wall'};}
   if(bolt.owner==='player')for(const target of this.targets()){const t=sphereHit(a,b,target.point,target.radius);if(t!==null&&t<closest.t)closest={t,kind:target.kind,id:target.id};}
   else {const t=sphereHit(a,b,pilot,.45);if(t!==null&&t<closest.t)closest={t,kind:'pilot'};}
   if(closest.kind!=='none'){
    if(closest.kind==='relay')this.activateRelay(closest.id);
    if(closest.kind==='drone'){this.run.droneHp=Math.max(0,this.run.droneHp-1);this.events.push({type:this.run.droneHp===0?'drone-disabled':'drone-hit'});if(!this.run.droneHp)this.charge=0;}
    if(closest.kind==='pilot')this.hurt();
    continue;
   }
   bolt.position=b;bolt.life-=dt;if(bolt.life>0&&b.y>0)survivors.push(bolt);
  }
  // A checkpoint retry clears every old projectile, including those in this frame.
  this.bolts=this.events.some(e=>e.type==='retry')?[]:survivors;return this.events;
 }
}
