export const SCAN_RANGE=4.5;
export const FIELD_CONFIG={
 interfaces:{id:'interfaces',title:'Alert Courier',accent:0x74e6b8,deck:{minX:-31,maxX:-18,minZ:-10,maxZ:9},bridge:{a:{x:-13,z:-4},b:{x:-20,z:7},width:3.6},spawn:{x:-24,z:7},
  checkpoints:[{x:-24,z:7},{x:-24,z:.6},{x:-24,z:-6.3}],
  gates:[{id:'courier-gate-01',minX:-31,maxX:-18,minZ:1.5,maxZ:1.8,height:2.8},{id:'courier-gate-02',minX:-31,maxX:-18,minZ:-4.6,maxZ:-4.3,height:2.8}],
  cover:[{minX:-22,maxX:-19,minZ:3.5,maxZ:5.2,height:1.5},{minX:-30,maxX:-27,minZ:-3.8,maxZ:-2.6,height:1.5}],
  consoles:[{minX:-28,maxX:-26,minZ:-9,maxZ:-8,height:1.4}],
  pulses:[{id:'courier-pulse-01',minX:-31,maxX:-18,minZ:2.3,maxZ:2.7,period:4.4,offset:0},{id:'courier-pulse-02',minX:-31,maxX:-18,minZ:-5.7,maxZ:-5.3,period:4.8,offset:2}],
  actions:[{id:'observe',name:'Collect observation packet',point:{x:-26,z:4}},{id:'archive',name:'Archive',point:{x:-28,z:-.6}},{id:'evaluate',name:'Needs follow-up',point:{x:-24,z:-.6}},{id:'routine',name:'Routine',point:{x:-20,z:-.6}},{id:'notify',name:'Transmit guardian alert',point:{x:-27,z:-7.2}}],url:'/work/stayschool/'},
 ai:{id:'ai',title:'Signal Hunt',accent:0xb09bff,deck:{minX:-3,maxX:11,minZ:-44,maxZ:-23},bridge:{a:{x:4,z:-17},b:{x:4,z:-24},width:3.6},spawn:{x:4,z:-24.2},
  checkpoints:[{x:4,z:-24.2},{x:1,z:-29.2},{x:0,z:-33.5},{x:7,z:-38.3}],
  gates:[{id:'scanner-gate',minX:-3,maxX:11,minZ:-28.5,maxZ:-28.2,height:2.8}],
  cover:[{minX:3,maxX:6,minZ:-27.6,maxZ:-25.8,height:1.3},{minX:2.5,maxX:5.5,minZ:-33.3,maxZ:-31.5,height:2.1},{minX:2,maxX:5,minZ:-39,maxZ:-37.2,height:1.9}],
  consoles:[{minX:-.8,maxX:.8,minZ:-27,maxZ:-26.2,height:1.3},{minX:6,maxX:8,minZ:-43.6,maxZ:-42.8,height:1.4}],
  pulses:[{id:'scan-noise-01',minX:-3,maxX:11,minZ:-32.7,maxZ:-32.2,period:4.6,offset:1},{id:'scan-noise-02',minX:-3,maxX:11,minZ:-37.8,maxZ:-37.3,period:5,offset:2.3}],
  actions:[{id:'calibrate',name:'Calibrate scanner',point:{x:0,z:-25.4}},{id:'analyze',name:'Synchronize analysis',point:{x:7,z:-42}}],url:'/work/traffic-monitor/'}
};
export const SAMPLES=[{id:'sample-01',name:'Sample 01',x:0,z:-31,approach:{x:0,z:-29.6}},{id:'sample-02',name:'Sample 02',x:7,z:-36,approach:{x:7,z:-34.6}},{id:'sample-03',name:'Sample 03',x:0,z:-41,approach:{x:0,z:-39.6}}];
export const FIELD_STATIC=Object.values(FIELD_CONFIG).flatMap(c=>[...c.cover,...c.consoles]);
export const samplePosition=(sample,time,assist=false)=>({x:sample.x+(assist?0:Math.sin(time*.85+SAMPLES.indexOf(sample)*2)*1.1),y:1.9+(assist?0:Math.sin(time*1.2)*.15),z:sample.z});
export const pulseActive=(pulse,time)=>((time+pulse.offset)%pulse.period)<pulse.period*.43;
export function fieldGates(kind,run){const c=FIELD_CONFIG[kind];return kind==='interfaces'?c.gates.filter((g,i)=>run.stage<=i):run.calibrated?[]:c.gates;}
export function fieldCheckpoint(kind,run){const c=FIELD_CONFIG[kind];if(kind==='interfaces')return c.checkpoints[Math.min(run.stage,2)];let prefix=0;while(prefix<3&&run.captures.includes(SAMPLES[prefix].id))prefix++;return c.checkpoints[run.calibrated?Math.min(1+prefix,3):0];}
export function fieldObjective(kind,run){const c=FIELD_CONFIG[kind];if(kind==='interfaces'){const id=run.stage===0?'observe':run.stage===1?'evaluate':'notify';const action=c.actions.find(a=>a.id===id);return {label:run.completed?'Alert delivered':action.name,point:action.point};}
 if(!run.calibrated){const a=c.actions[0];return {label:a.name,point:a.point};}const sample=SAMPLES.find(s=>!run.captures.includes(s.id));return sample?{label:'Track '+sample.name,point:sample.approach}:{label:run.completed?'Analysis synchronized':'Synchronize analysis',point:c.actions[1].point};}
