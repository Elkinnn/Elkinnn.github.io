import test from 'node:test';
import assert from 'node:assert/strict';
import {FieldMission,freshFieldRun,readFieldRun,saveFieldRun,fieldSaveKey} from '../scripts/lab/field-model.js';
import {FIELD_CONFIG,SAMPLES,fieldGates,fieldCheckpoint,samplePosition,pulseActive} from '../scripts/lab/field-layout.js';
import {OBSTACLES,findPath,canStand,SPAWN,STATIONS} from '../scripts/lab/gameplay.js';
import {closedGates} from '../scripts/lab/systems-layout.js';
const walls=model=>[...OBSTACLES,...closedGates({relays:[]}),...Object.keys(FIELD_CONFIG).flatMap(kind=>fieldGates(kind,kind===model.kind?model.run:freshFieldRun()))];
const advance=(model,player,options={},seconds=2)=>{const events=[];for(let i=0;i<seconds/.02;i++)events.push(...model.tick(.02,player,options));return events;};
function validRoute(from,to,obstacles,label){const path=findPath(from,to,obstacles);assert.ok(path.length,label);let previous=from;for(const next of path){for(let i=0;i<=20;i++)assert.ok(canStand({x:previous.x+(next.x-previous.x)*i/20,z:previous.z+(next.z-previous.z)*i/20},obstacles),label);previous=next;}return to;}
test('Alert Courier requires observation and the correct physical review before transmission',()=>{
 const model=new FieldMission('interfaces');model.start(true);const actions=model.config.actions;
 assert.deepEqual(model.interact('notify',actions.find(a=>a.id==='notify').point),[]);
 model.interact('observe',actions[0].point);assert.equal(model.run.stage,1);
 const wrong=actions.find(a=>a.id==='routine');assert.equal(model.interact(wrong.id,wrong.point)[0].type,'incorrect');assert.equal(model.run.stage,1);
 const correct=actions.find(a=>a.id==='evaluate');model.interact(correct.id,correct.point);assert.equal(model.run.stage,2);
 const uplink=actions.find(a=>a.id==='notify');model.interact(uplink.id,uplink.point);assert.equal(model.run.completed,false);
 assert.ok(advance(model,uplink.point).some(e=>e.type==='complete'));assert.equal(model.run.stage,3);
});
test('walking away interrupts an uplink and remote interactions do not advance the route',()=>{
 const model=new FieldMission('interfaces',{...freshFieldRun(),stage:2});model.start(true);const point=model.config.actions.find(a=>a.id==='notify').point;
 model.interact('notify',{x:point.x+4,z:point.z});assert.equal(model.channel,0);
 model.interact('notify',point);advance(model,{x:point.x+3,z:point.z});assert.equal(model.channel,0);assert.equal(model.run.completed,false);
});

test('completed field terminals reopen their own project without replaying or awarding completion again',()=>{
 for(const kind of ['interfaces','ai']){
  const model=new FieldMission(kind),point=model.config.actions.at(-1).point;model.start(true);
  assert.equal(model.nearest(point),null);
  model.run={...freshFieldRun(),stage:3,calibrated:true,captures:SAMPLES.map(s=>s.id),completed:true};
  const target=model.nearest(point);assert.equal(target.kind,'project');assert.equal(target.id,kind+'-project');
  assert.equal(model.nearest({x:point.x+3,z:point.z}),null);
  assert.deepEqual(model.interact(target.id,point),[]);assert.deepEqual(advance(model,point),[]);
  assert.equal(model.run.completed,true);
 }
});
test('Signal Hunt needs calibration, sustained acquisition and a separate final synchronization',()=>{
 const model=new FieldMission('ai');model.start(true);advance(model,SAMPLES[0].approach,{scanTarget:'sample-01',obstacles:walls(model)});assert.equal(model.run.captures.length,0);
 model.interact('calibrate',model.config.actions[0].point);assert.equal(model.run.calibrated,true);
 for(const sample of SAMPLES){advance(model,sample.approach,{scanTarget:sample.id,obstacles:walls(model)});assert.ok(model.run.captures.includes(sample.id));}
 assert.equal(model.run.completed,false);const end=model.config.actions[1];model.interact('analyze',end.point);advance(model,end.point);assert.equal(model.run.completed,true);
});
test('scanner range, cover and interrupted tracking prevent false captures',()=>{
 const model=new FieldMission('ai',{...freshFieldRun(),calibrated:true});model.start(false);
 advance(model,{x:8,z:-25},{scanTarget:'sample-01',obstacles:[]});assert.equal(model.run.captures.length,0);
 const sample=SAMPLES[0],block={minX:-3,maxX:3,minZ:-30.5,maxZ:-30.4,height:4};advance(model,sample.approach,{scanTarget:sample.id,obstacles:[block]});assert.equal(model.run.captures.length,0);
 advance(model,sample.approach,{scanTarget:sample.id,obstacles:[]},.5);assert.ok(model.scan>0&&model.scan<1);advance(model,sample.approach,{},.7);assert.equal(model.scan,0);assert.equal(model.run.captures.length,0);
});
test('normal samples move and assisted samples stay stable',()=>{
 assert.notDeepEqual(samplePosition(SAMPLES[0],0),samplePosition(SAMPLES[0],1));assert.deepEqual(samplePosition(SAMPLES[0],0,true),samplePosition(SAMPLES[0],4,true));
});
test('pulse interference can be jumped, assisted or retried without losing confirmed progress',()=>{
 const model=new FieldMission('interfaces',{...freshFieldRun(),stage:1});model.start();const pulse=model.config.pulses[0],p={x:-24,z:(pulse.minZ+pulse.maxZ)/2};assert.ok(pulseActive(pulse,0));model.invulnerable=0;
 model.tick(.02,{...p,height:.8});assert.equal(model.health,3);model.tick(.02,p);assert.equal(model.health,2);
 model.invulnerable=0;model.tick(.02,p);model.invulnerable=0;const events=model.tick(.02,p);assert.ok(events.some(e=>e.type==='retry'));assert.equal(model.run.stage,1);assert.equal(model.health,3);
 model.start(true);model.invulnerable=0;model.tick(.02,p);assert.equal(model.health,3);
});

test('an active thruster impulse crosses a pulse without damage and immunity ends with the impulse',()=>{
 for(const kind of ['interfaces','ai']){
  const model=new FieldMission(kind);model.start(false);model.invulnerable=0;
  const pulse=model.config.pulses[0],point={x:(pulse.minX+pulse.maxX)/2,z:(pulse.minZ+pulse.maxZ)/2,height:0};
  model.tick(.02,point,{boosting:true});assert.equal(model.health,3);
  model.tick(.02,point,{boosting:false});assert.equal(model.health,2);
 }
});
test('sector paths, choices and all scanner approaches remain reachable through their intended gates',()=>{
 for(const kind of ['interfaces','ai']){const m=new FieldMission(kind);let p=m.start(true);validRoute(SPAWN,p,[...OBSTACLES],kind+' entrance');
  if(kind==='interfaces'){const observe=m.config.actions[0];p=validRoute(p,observe.point,walls(m),'observation');m.interact(observe.id,p);for(const choice of m.config.actions.filter(a=>['archive','evaluate','routine'].includes(a.id)))validRoute(p,choice.point,walls(m),choice.id);p=m.config.actions.find(a=>a.id==='evaluate').point;m.interact('evaluate',p);validRoute(p,m.config.actions.find(a=>a.id==='notify').point,walls(m),'guardian');}
  else{const cal=m.config.actions[0];p=validRoute(p,cal.point,walls(m),'calibration');m.interact(cal.id,p);for(const sample of SAMPLES)p=validRoute(p,sample.approach,walls(m),sample.id);validRoute(p,m.config.actions[1].point,walls(m),'analysis');}
 }
});
test('save/load validates field progress and preserves explicit checkpoint resets',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const m=new FieldMission('interfaces');m.start();m.interact('observe',m.config.actions[0].point);saveFieldRun(storage,'interfaces',m.run);assert.equal(readFieldRun(storage,'interfaces').stage,1);
 assert.deepEqual(new FieldMission('interfaces',readFieldRun(storage,'interfaces')).start(),FIELD_CONFIG.interfaces.checkpoints[1]);
 storage.setItem(fieldSaveKey('ai'),JSON.stringify({version:1,calibrated:false,captures:['sample-01','sample-02','sample-03'],completed:true}));assert.equal(readFieldRun(storage,'ai').completed,false);assert.equal(readFieldRun(storage,'ai').captures.length,0);
 storage.setItem(fieldSaveKey('interfaces'),JSON.stringify({version:1,stage:3,completed:false}));assert.equal(readFieldRun(storage,'interfaces').completed,false);
 m.restart();saveFieldRun(storage,'interfaces',m.run);assert.deepEqual(readFieldRun(storage,'interfaces'),freshFieldRun());assert.equal(saveFieldRun(null,'ai',m.run),false);
});
