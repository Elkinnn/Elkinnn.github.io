import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyExpedition,advanceExpedition,readyToLaunch,nextObjective,readExpedition,saveExpedition,EXPEDITION_KEY,routeInterface,scannerPosition,captureSignal} from '../scripts/lab/expedition.js';
import {CARGO,STATIONS} from '../scripts/lab/gameplay.js';
test('launch requires every unique signal and module; duplicate and unknown events cannot inflate progress',()=>{
 let state=emptyExpedition();assert.equal(advanceExpedition(state,'launch').launched,false);
 state=advanceExpedition(state,'cell','unknown');assert.equal(state.cells.length,0);
 for(const cell of CARGO){state=advanceExpedition(state,'cell',cell.id);state=advanceExpedition(state,'cell',cell.id);}
 assert.equal(state.cells.length,3);assert.equal(readyToLaunch(state),false);
 for(const station of STATIONS)state=advanceExpedition(state,'mission',station.id);
 assert.equal(readyToLaunch(state),true);assert.equal(advanceExpedition(state,'launch').launched,true);
 assert.equal(state.launched,false);
});
test('flight plan leads through signals, missing modules and finally the Nexus',()=>{
 let state=emptyExpedition();assert.equal(nextObjective(state).id,'signal-01');
 for(const c of CARGO)state=advanceExpedition(state,'cell',c.id);
 assert.equal(nextObjective(state).id,'interfaces');
 for(const s of STATIONS)state=advanceExpedition(state,'mission',s.id);
 assert.equal(nextObjective(state).id,'nexus');
});
test('save/load validates progress, migrates the old Systems result and preserves an explicit replay',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 assert.deepEqual(readExpedition(storage,true).missions,['systems']);
 saveExpedition(storage,emptyExpedition());assert.deepEqual(readExpedition(storage,true).missions,[]);
 storage.setItem(EXPEDITION_KEY,JSON.stringify({version:1,cells:['signal-01','signal-01','fake'],missions:['systems','fake'],launched:true}));
 const loaded=readExpedition(storage);assert.deepEqual(loaded.cells,['signal-01']);assert.deepEqual(loaded.missions,['systems']);assert.equal(loaded.launched,false);
 storage.setItem(EXPEDITION_KEY,'null');assert.deepEqual(readExpedition(storage),emptyExpedition());
 assert.equal(saveExpedition({setItem(){throw Error('Unavailable');}},loaded),false);
});
test('alert routing rejects out-of-order notifications and accepts the complete workflow',()=>{
 assert.deepEqual(routeInterface([],'notify'),[]);
 let sequence=[];for(const action of ['observe','evaluate','notify'])sequence=routeInterface(sequence,action);
 assert.equal(sequence.length,3);assert.deepEqual(routeInterface(['observe'],'notify'),[]);
});
test('scanner sweeps both ways and misses keep previously captured frames',()=>{
 assert.equal(scannerPosition(0),0);assert.ok(Math.abs(scannerPosition(.7)-.5)<1e-9);assert.ok(Math.abs(scannerPosition(1.4)-1)<1e-9);assert.ok(Math.abs(scannerPosition(2.1)-.5)<1e-9);
 assert.deepEqual(captureSignal(1,.2),{hit:false,hits:1});assert.deepEqual(captureSignal(1,.5),{hit:true,hits:2});assert.equal(captureSignal(3,.5).hits,3);
});
