import {FIELD_CONFIG,FIELD_STATIC} from './field-layout.js';
import {SYSTEMS_DECK,SYSTEMS_BRIDGE,SYSTEMS_STATIC} from './systems-layout.js';
export const PLAYER_RADIUS=.32;
export const ROOM_BOUNDS={minX:-34,maxX:32,minZ:-47,maxZ:14};
export const SPAWN={x:-2,z:10};
export const DECKS=[{x:0,z:1,r:7.3},{x:-2,z:10,r:3.1},{x:-11,z:-5,r:4},{x:11,z:-6,r:4.2},{x:4,z:-15,r:4.2}];
export const BRIDGES=[...Object.values(FIELD_CONFIG).map(c=>c.bridge),SYSTEMS_BRIDGE,{a:{x:-2,z:6},b:{x:-2,z:10},width:3.5},{a:{x:-4,z:-1},b:{x:-11,z:-5},width:3.4},{a:{x:5,z:-1},b:{x:11,z:-6},width:3.4},{a:{x:2,z:-4},b:{x:4,z:-15},width:3.4}];
export const OBSTACLES=[...FIELD_STATIC,...SYSTEMS_STATIC,
 {minX:-1.15,maxX:1.15,minZ:-1.5,maxZ:1.1,height:4.5},
 {minX:-12,maxX:-10,minZ:-7,maxZ:-5.9,height:1.6},
 {minX:10,maxX:12,minZ:-8,maxZ:-6.9,height:1.6},
 {minX:3,maxX:5,minZ:-17.2,maxZ:-16.1,height:1.6}
];
export const STATIONS=[
 {id:'interfaces',number:'01',name:'Interfaces',point:{x:-11,z:-4.4},anchor:{x:-11,y:2.9,z:-6.2},url:'/work/stayschool/'},
 {id:'systems',number:'02',name:'Systems',point:{x:11,z:-5.4},anchor:{x:11,y:3,z:-7.2},url:'/work/hospital-platform/'},
 {id:'ai',number:'03',name:'Applied AI',point:{x:4,z:-13.6},anchor:{x:4,y:3.6,z:-16.4},url:'/work/traffic-monitor/'}
];
export const CARGO=[{id:'signal-01',name:'Signal 01',point:{x:-3.6,z:5.3}},{id:'signal-02',name:'Signal 02',point:{x:5,z:3.2}},{id:'signal-03',name:'Signal 03',point:{x:2.8,z:-9.1}}];
export const NEXUS={id:'nexus',name:'Nexus',point:{x:0,z:3}};
function segmentDistance(p,a,b) {
 const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));
 return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);
}
export function onDeck(point,radius=PLAYER_RADIUS) {
 return Object.values(FIELD_CONFIG).some(c=>point.x>=c.deck.minX+radius&&point.x<=c.deck.maxX-radius&&point.z>=c.deck.minZ+radius&&point.z<=c.deck.maxZ-radius)||(point.x>=SYSTEMS_DECK.minX+radius&&point.x<=SYSTEMS_DECK.maxX-radius&&point.z>=SYSTEMS_DECK.minZ+radius&&point.z<=SYSTEMS_DECK.maxZ-radius)||DECKS.some(d=>Math.hypot(point.x-d.x,point.z-d.z)<=d.r-radius)||BRIDGES.some(b=>segmentDistance(point,b.a,b.b)<=b.width/2-radius);
}
export function nearestInteraction(point,progress) {
 const items=[...STATIONS.map(s=>({...s,kind:'station'})),{...NEXUS,kind:'nexus'},...CARGO.filter(c=>!progress.cells.includes(c.id)).map(c=>({...c,kind:'cargo'}))];
 return items.map(s=>({...s,distance:Math.hypot(point.x-s.point.x,point.z-s.point.z)})).sort((a,b)=>a.distance-b.distance)[0];
}

export function canStand(point,obstacles=OBSTACLES,bounds=ROOM_BOUNDS,radius=PLAYER_RADIUS) {
  if(!onDeck(point,radius))return false;
  if(point.x<bounds.minX+radius||point.x>bounds.maxX-radius||point.z<bounds.minZ+radius||point.z>bounds.maxZ-radius)return false;
  return !obstacles.some(box=>point.x>box.minX-radius&&point.x<box.maxX+radius&&point.z>box.minZ-radius&&point.z<box.maxZ+radius);
}

// Resolve axes separately; magnetic deck boundaries also prevent walking into space.
export function movePlayer(point,direction,dt,speed=2.6,obstacles=OBSTACLES,bounds=ROOM_BOUNDS) {
  const length=Math.hypot(direction.x,direction.z);
  if(!length)return {...point};
  const distance=Math.min(Math.max(dt,0),0.05)*speed;
  const next={...point};
  const x=next.x+direction.x/length*distance;
  if(canStand({x,z:next.z},obstacles,bounds))next.x=x;
  const z=next.z+direction.z/length*distance;
  if(canStand({x:next.x,z},obstacles,bounds))next.z=z;
  return next;
}

export function nearestStation(point) {
  return STATIONS.map(s=>({...s,distance:Math.hypot(point.x-s.point.x,point.z-s.point.z)})).sort((a,b)=>a.distance-b.distance)[0];
}

// A* on a small walkable grid. Diagonal moves cannot cut furniture corners.
export function findPath(start,target,obstacles=OBSTACLES,bounds=ROOM_BOUNDS,cell=0.35) {
  if(!canStand(start,obstacles,bounds)||!canStand(target,obstacles,bounds))return [];
  const clearSegment=(a,b)=>{for(let i=0;i<=20;i++)if(!canStand({x:a.x+(b.x-a.x)*i/20,z:a.z+(b.z-a.z)*i/20},obstacles,bounds))return false;return true;};
  const x0=bounds.minX+PLAYER_RADIUS,z0=bounds.minZ+PLAYER_RADIUS;
  const snap=p=>({x:Math.round((p.x-x0)/cell),z:Math.round((p.z-z0)/cell)});
  const world=p=>({x:x0+p.x*cell,z:z0+p.z*cell});
  const key=p=>p.x+','+p.z;
  const first=snap(start),last=snap(target);
  if(!clearSegment(start,world(first))||!clearSegment(world(last),target))return [];
  const startKey=key(first),goalKey=key(last);
  const nodes=new Map([[startKey,{...first,g:0,f:0,parent:null}]]);
  const open=new Set([startKey]),closed=new Set();
  const offsets=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  while(open.size) {
    const currentKey=[...open].reduce((best,k)=>nodes.get(k).f<nodes.get(best).f?k:best);
    const current=nodes.get(currentKey);
    if(currentKey===goalKey) {
      const path=[];
      let node=current;
      while(node.parent){path.unshift(world(node));node=nodes.get(node.parent);}
      path.unshift(world(first));path.push({...target});
      return path;
    }
    open.delete(currentKey);closed.add(currentKey);
    for(const [dx,dz] of offsets) {
      const candidate={x:current.x+dx,z:current.z+dz},candidateKey=key(candidate);
      if(closed.has(candidateKey)||!canStand(world(candidate),obstacles,bounds))continue;
      if(!clearSegment(world(current),world(candidate)))continue;
      if(dx&&dz&&(!canStand(world({x:current.x+dx,z:current.z}),obstacles,bounds)||!canStand(world({x:current.x,z:current.z+dz}),obstacles,bounds)))continue;
      const g=current.g+Math.hypot(dx,dz);
      if(!nodes.has(candidateKey)||g<nodes.get(candidateKey).g) {
        nodes.set(candidateKey,{...candidate,g,f:g+Math.hypot(last.x-candidate.x,last.z-candidate.z),parent:currentKey});
        open.add(candidateKey);
      }
    }
  }
  return [];
}

export const CONNECTIONS = [
  {id:'request',ports:['browser-out','api-in']},
  {id:'data',ports:['api-out','database-in']}
];

export function connectPorts(existing,first,second) {
  if(first===second)return {ok:false,reason:'Choose a different port.',connections:[...existing]};
  const edge=CONNECTIONS.find(e=>e.ports.includes(first)&&e.ports.includes(second));
  if(!edge)return {ok:false,reason:'Connect Browser to API, then API to Database. Choose an output and the matching input.',connections:[...existing]};
  if(existing.includes(edge.id))return {ok:true,duplicate:true,connections:[...existing]};
  return {ok:true,connections:[...existing,edge.id]};
}

export const PROGRESS_KEY='elkin-systems-lab:v1';
export function readProgress(storage) {
  try {
    const value=JSON.parse(storage.getItem(PROGRESS_KEY));
    return value?.version===1&&value.systems===true;
  } catch {return false;}
}
export function saveProgress(storage) {
  try {storage.setItem(PROGRESS_KEY,JSON.stringify({version:1,systems:true}));return true;}
  catch {return false;}
}

export function stepJump(state,dt,trigger=false) {
  let {height=0,velocity=0}=state;
  if(trigger&&height===0)velocity=5.4;
  velocity-=14*Math.min(dt,.05);
  height+=velocity*Math.min(dt,.05);
  if(height<=0&&velocity<=0)return {height:0,velocity:0};
  return {height,velocity};
}
