import {CARGO,STATIONS,NEXUS} from './gameplay.js';
export const EXPEDITION_KEY='elkin-orbit:v1';
export const emptyExpedition=()=>({version:1,cells:[],missions:[],launched:false});
export function readyToLaunch(state) {return state.cells.length===3&&state.missions.length===3;}
export function advanceExpedition(state,kind,id) {
  const next={...state,cells:[...state.cells],missions:[...state.missions]};
  if(kind==='cell'&&CARGO.some(c=>c.id===id)&&!next.cells.includes(id))next.cells.push(id);
  if(kind==='mission'&&STATIONS.some(s=>s.id===id)&&!next.missions.includes(id))next.missions.push(id);
  if(kind==='launch'&&readyToLaunch(next))next.launched=true;
  return next;
}
export function nextObjective(state) {
  if(state.launched)return {...NEXUS,label:'Network online',kind:'nexus'};
  const cell=CARGO.find(c=>!state.cells.includes(c.id));
  if(cell)return {...cell,label:'Recover '+cell.name,kind:'cargo'};
  const station=STATIONS.find(s=>!state.missions.includes(s.id));
  return station?{...station,label:'Restore '+station.name,kind:'station'}:{...NEXUS,label:'Activate the Nexus',kind:'nexus'};
}
export function readExpedition(storage,legacySystems=false) {
  try {
    const raw=storage?.getItem(EXPEDITION_KEY);
    if(raw!==null&&raw!==undefined) {
      const value=JSON.parse(raw);if(value?.version!==1)return emptyExpedition();
      const state=emptyExpedition();
      state.cells=CARGO.filter(c=>Array.isArray(value.cells)&&value.cells.includes(c.id)).map(c=>c.id);
      state.missions=STATIONS.filter(s=>Array.isArray(value.missions)&&value.missions.includes(s.id)).map(s=>s.id);
      state.launched=value.launched===true&&readyToLaunch(state);return state;
    }
  } catch {return emptyExpedition();}
  const state=emptyExpedition();if(legacySystems)state.missions.push('systems');return state;
}
export function saveExpedition(storage,state) {try{storage?.setItem(EXPEDITION_KEY,JSON.stringify(state));return !!storage;}catch{return false;}}
export const INTERFACE_SEQUENCE=['observe','evaluate','notify'];
export function routeInterface(sequence,action) {
  return action===INTERFACE_SEQUENCE[sequence.length]?[...sequence,action]:[];
}
export function scannerPosition(seconds,period=2.8) {const t=((seconds%period)+period)%period/period;return t<.5?t*2:2-t*2;}
export function captureSignal(hits,position) {return {hit:position>=.4&&position<=.6,hits:Math.min(3,hits+(position>=.4&&position<=.6?1:0))};}
