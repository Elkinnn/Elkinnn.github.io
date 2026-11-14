import test from 'node:test';
import assert from 'node:assert/strict';
import {SystemsMission,freshSystemsRun,readSystemsRun,saveSystemsRun,SYSTEMS_SAVE_KEY,sphereHit,boxHit,dronePosition,clearShot} from '../scripts/lab/systems-mission.js';
import {RELAYS,closedGates,checkpoint,SYSTEMS_TERMINAL,SYSTEMS_CHECKPOINTS} from '../scripts/lab/systems-layout.js';
import {OBSTACLES,findPath,canStand} from '../scripts/lab/gameplay.js';
const walls=mission=>[...OBSTACLES,...closedGates(mission.run)];
test('three real projectile hits open a traversable route to the final terminal',()=>{
 const mission=new SystemsMission();let player=mission.start(true);
 assert.equal(mission.finish(),false);
 for(const relay of RELAYS){
  const path=findPath(player,relay.approach,walls(mission));assert.ok(path.length,relay.id);
  let previous=player;for(const point of path){for(let i=0;i<=20;i++)assert.ok(canStand({x:previous.x+(point.x-previous.x)*i/20,z:previous.z+(point.z-previous.z)*i/20},walls(mission)));previous=point;}
  player={...relay.approach};assert.ok(clearShot({...player,y:1.25},relay.point,walls(mission)),relay.id);
  assert.ok(mission.shoot(player,relay.point));for(let i=0;i<40;i++)mission.tick(.02,player,walls(mission));
  assert.ok(mission.run.relays.includes(relay.id),relay.id);
 }
 assert.ok(findPath(player,SYSTEMS_TERMINAL.approach,walls(mission)).length);assert.ok(mission.finish());assert.equal(mission.run.completed,true);
});
test('closed barriers stop fast bolts and prevent skipping relays',()=>{
 const mission=new SystemsMission(),player=mission.start(true);mission.shoot(player,RELAYS[1].point);
 for(let i=0;i<50;i++)mission.tick(.05,player,walls(mission));assert.deepEqual(mission.run.relays,[]);
 assert.equal(mission.activateRelay('relay-03'),false);assert.ok(mission.activateRelay('relay-01'));assert.equal(mission.activateRelay('relay-01'),false);
 assert.equal(findPath(SYSTEMS_CHECKPOINTS[0],RELAYS[1].approach,walls(new SystemsMission())).length,0);
});
test('segment intersections detect thin walls and small targets between frames',()=>{
 const a={x:0,y:1,z:2},b={x:0,y:1,z:-2};assert.equal(sphereHit(a,b,{x:0,y:1,z:0},.25),.4375);
 assert.ok(boxHit(a,b,{minX:-1,maxX:1,minZ:-.05,maxZ:.05,height:3})<.51);
 assert.equal(sphereHit(a,b,{x:4,y:1,z:0},.3),null);
});
test('a relay beyond blaster range requires moving deeper into the sector',()=>{
 const mission=new SystemsMission();mission.start(true);mission.activateRelay('relay-01');mission.activateRelay('relay-02');
 const pilot=SYSTEMS_CHECKPOINTS[1];mission.shoot(pilot,RELAYS[2].point);
 for(let i=0;i<50;i++)mission.tick(.02,pilot,walls(mission));
 assert.deepEqual(mission.run.relays,['relay-01','relay-02']);
});
test('drone warns before firing and pauses freeze the encounter',()=>{
 const mission=new SystemsMission();mission.start();mission.activateRelay('relay-01');const player={x:26,z:-5.5};let warned=false,fired=false;
 for(let i=0;i<230;i++){const events=mission.tick(.02,player,walls(mission));warned ||= events.some(e=>e.type==='warning');if(mission.bolts.some(b=>b.owner==='enemy')){assert.ok(warned);fired=true;break;}}
 assert.ok(warned);assert.ok(fired);mission.leave();const time=mission.clock;mission.tick(.05,player,walls(mission));assert.equal(mission.clock,time);
});
test('shield depletion retries the last checkpoint and assist mode absorbs damage',()=>{
 const mission=new SystemsMission();mission.start();mission.activateRelay('relay-01');mission.invulnerable=0;
 for(let i=0;i<3;i++){mission.invulnerable=0;mission.hurt();}
 assert.equal(mission.shields,3);assert.ok(mission.events.some(e=>e.type==='retry'&&e.point.z===SYSTEMS_CHECKPOINTS[1].z));assert.deepEqual(mission.run.relays,['relay-01']);
 mission.start(true);mission.invulnerable=0;mission.hurt();assert.equal(mission.shields,3);
});
test('drone takes three hits and shooting has a cooldown',()=>{
 const mission=new SystemsMission();mission.start(true);mission.activateRelay('relay-01');
 for(let shot=0;shot<3;shot++){
  const p=dronePosition(mission.clock),pilot={x:p.x,z:p.z+1.4};mission.fireCooldown=0;
  assert.ok(mission.shoot(pilot,p));assert.equal(mission.shoot(pilot,p),false);
  for(let i=0;i<20;i++)mission.tick(.02,pilot,walls(mission));
 }
 assert.equal(mission.run.droneHp,0);
});

test('finishing Systems ends combat while preserving the restored terminal state',()=>{
 const mission=new SystemsMission();mission.start(false);
 for(const relay of RELAYS)mission.activateRelay(relay.id);
 assert.equal(mission.finish(),true);mission.invulnerable=0;
 assert.equal(mission.shoot({x:26,z:-11.2},{x:23,y:2,z:-6}),false);
 mission.hurt();assert.equal(mission.shields,3);
 for(let i=0;i<300;i++)mission.tick(.02,{x:23,z:-6},walls(mission));
 assert.equal(mission.bolts.length,0);assert.equal(mission.charge,0);assert.equal(mission.run.completed,true);
});
test('saved checkpoints are validated and cannot unlock a skipped barrier',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const mission=new SystemsMission();mission.start();mission.activateRelay('relay-01');mission.activateRelay('relay-02');mission.run.droneHp=0;
 saveSystemsRun(storage,mission.run);const restored=new SystemsMission(readSystemsRun(storage));assert.deepEqual(restored.start(),SYSTEMS_CHECKPOINTS[2]);assert.equal(restored.run.droneHp,0);
 storage.setItem(SYSTEMS_SAVE_KEY,JSON.stringify({version:1,relays:['relay-03'],completed:true}));assert.deepEqual(readSystemsRun(storage).relays,[]);assert.equal(readSystemsRun(storage).completed,false);
 storage.setItem(SYSTEMS_SAVE_KEY,'{bad');assert.deepEqual(readSystemsRun(storage),freshSystemsRun());assert.equal(saveSystemsRun(null,mission.run),false);
});
