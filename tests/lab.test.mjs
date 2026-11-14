import test from 'node:test';
import assert from 'node:assert/strict';
import {canStand,movePlayer,findPath,connectPorts,readProgress,saveProgress,ROOM_BOUNDS,SPAWN,STATIONS,OBSTACLES,PLAYER_RADIUS,stepJump,CARGO,NEXUS,onDeck} from '../scripts/lab/gameplay.js';

test('diagonal and straight movement cover the same distance',()=>{
  const a=movePlayer(SPAWN,{x:1,z:0},0.02);
  const b=movePlayer(SPAWN,{x:1,z:1},0.02);
  assert.ok(Math.abs(Math.hypot(a.x-SPAWN.x,a.z-SPAWN.z)-Math.hypot(b.x-SPAWN.x,b.z-SPAWN.z))<1e-8);
});
test('solid reactor and deck boundaries block the character',()=>{
  let p={x:0,z:3};
  for(let i=0;i<150;i++)p=movePlayer(p,{x:0,z:-1},0.02);
  assert.ok(p.z>=1.1+PLAYER_RADIUS);
  assert.ok(canStand(p));
  let q={x:5,z:3};
  for(let i=0;i<150;i++)q=movePlayer(q,{x:1,z:1},0.02);
  assert.ok(q.x<=ROOM_BOUNDS.maxX-PLAYER_RADIUS&&q.z<=ROOM_BOUNDS.maxZ-PLAYER_RADIUS);
});
test('each station is reachable and every traversed path segment remains walkable',()=>{
  for(const station of [...STATIONS,...CARGO,NEXUS]) {
    for(const start of [SPAWN,...STATIONS.map(s=>s.point),...CARGO.map(c=>c.point),NEXUS.point]) {
    const path=findPath(start,station.point);
    assert.ok(path.length>0,station.id);
    let prior=start;
    for(const next of path) {
      for(let n=0;n<=20;n++)assert.ok(canStand({x:prior.x+(next.x-prior.x)*n/20,z:prior.z+(next.z-prior.z)*n/20}),station.id);
      prior=next;
    }
    }
  }
});
test('void and solid reactor targets are rejected',()=>{
  assert.equal(findPath(SPAWN,{x:0,z:-8}).length,0);
  assert.equal(canStand({x:0,z:0},OBSTACLES),false);
  assert.equal(onDeck({x:10,z:10}),false);
});

test('jump returns to the ground and cannot restart in midair',()=>{
  const impulse=stepJump({height:0,velocity:0},0,true);
  assert.ok(impulse.velocity>0);
  assert.ok(stepJump(impulse,.02).height>0);
  let state=stepJump({height:0,velocity:0},.02,true);
  assert.ok(state.height>0);
  const airborne=stepJump(state,.02,true);
  assert.ok(airborne.velocity<state.velocity);
  for(let i=0;i<150;i++)state=stepJump(state,.02);
  assert.deepEqual(state,{height:0,velocity:0});
});
test('mission accepts either click order, ignores duplicate edges and rejects shortcuts',()=>{
  let r=connectPorts([],'api-in','browser-out');
  assert.ok(r.ok);assert.equal(r.connections.length,1);
  r=connectPorts(r.connections,'browser-out','api-in');
  assert.ok(r.duplicate);assert.equal(r.connections.length,1);
  r=connectPorts(r.connections,'browser-out','database-in');
  assert.equal(r.ok,false);assert.equal(r.connections.length,1);
  r=connectPorts(r.connections,'api-out','database-in');
  assert.ok(r.ok);assert.equal(r.connections.length,2);
});
test('progress survives a reload and tolerates unavailable or corrupt storage',()=>{
  const values=new Map();const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  assert.equal(readProgress(storage),false);assert.equal(saveProgress(storage),true);assert.equal(readProgress(storage),true);
  const failing={getItem(){throw Error('Unavailable');},setItem(){throw Error('Unavailable');}};
  assert.equal(readProgress(failing),false);assert.equal(saveProgress(failing),false);
  assert.equal(readProgress({getItem:()=>'{bad JSON'}),false);
  assert.equal(readProgress({getItem:()=>'null'}),false);
});

test('a fast impulse cannot leave a magnetic deck',()=>{
 let p={...SPAWN};for(let i=0;i<100;i++)p=movePlayer(p,{x:1,z:0},.04,10);
 assert.ok(canStand(p));assert.ok(onDeck(p));
});
