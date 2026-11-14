export const SYSTEMS_DECK={minX:17,maxX:29,minZ:-13,maxZ:3};
export const SYSTEMS_BRIDGE={a:{x:13,z:-5.5},b:{x:23,z:2},width:3.4};
export const RELAYS=[
 {id:'relay-01',name:'Relay 01',point:{x:20,y:1.65,z:-2.7},approach:{x:20,z:-1.2}},
 {id:'relay-02',name:'Relay 02',point:{x:26,y:1.65,z:-7},approach:{x:26,z:-5.6}},
 {id:'relay-03',name:'Relay 03',point:{x:20,y:1.65,z:-11.5},approach:{x:20,z:-10.1}}
];
export const SYSTEMS_CHECKPOINTS=[{x:23,z:1.6},{x:23,z:-5},{x:23,z:-9.8}];
export const SYSTEMS_TERMINAL={id:'systems-terminal',point:{x:26,z:-11.2},approach:{x:26,z:-10.1}};
export const SYSTEMS_GATES=[
 {id:'gate-01',relay:'relay-01',minX:17,maxX:29,minZ:-4.3,maxZ:-4,height:3},
 {id:'gate-02',relay:'relay-02',minX:17,maxX:29,minZ:-9.1,maxZ:-8.8,height:3}
];
export const SYSTEMS_COVER=[
 {minX:22.4,maxX:24,minZ:-1.2,maxZ:.4,height:1.3},
 {minX:17.6,maxX:21,minZ:-7.2,maxZ:-5.7,height:1.6},
 {minX:23,maxX:24.6,minZ:-8.1,maxZ:-6.6,height:1.4}
];
export const SYSTEMS_STATIC=[...SYSTEMS_COVER,...RELAYS.map(r=>({minX:r.point.x-.4,maxX:r.point.x+.4,minZ:r.point.z-.35,maxZ:r.point.z+.35,height:1.15})),{minX:25,maxX:27,minZ:-12.8,maxZ:-11.9,height:1.5}];
export const closedGates=run=>SYSTEMS_GATES.filter(g=>!run.relays.includes(g.relay));
export const checkpoint=run=>SYSTEMS_CHECKPOINTS[run.relays.includes('relay-02')?2:run.relays.includes('relay-01')?1:0];
export function systemsObjective(run) {
 const relay=RELAYS.find(r=>!run.relays.includes(r.id));
 return relay?{label:'Activate '+relay.name,point:relay.approach}:{label:run.completed?'Sector restored':'Connect the terminal',point:SYSTEMS_TERMINAL.approach};
}
