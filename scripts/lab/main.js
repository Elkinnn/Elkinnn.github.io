import {STATIONS,CARGO,CONNECTIONS,connectPorts,readProgress,saveProgress} from './gameplay.js';
import {readFieldRun,saveFieldRun,freshFieldRun} from './field-model.js';
import {readSystemsRun,saveSystemsRun,freshSystemsRun,BLASTER_RANGE} from './systems-mission.js';
import {emptyExpedition,advanceExpedition,readExpedition,saveExpedition,nextObjective,readyToLaunch,routeInterface,INTERFACE_SEQUENCE,scannerPosition,captureSignal} from './expedition.js';
const $=selector=>document.querySelector(selector);
const mission=$('#systems-dialog'),entry=$('#entry-dialog'),aiDialog=$('#ai-dialog');
const dialogs=[...document.querySelectorAll('dialog')];
let scene,nearTarget=null,selectedPort=null,connections=[],completed=false,started=false,messageTimer;
let storage;try{storage=window.localStorage;}catch{storage=null;}
let fieldSaved={interfaces:readFieldRun(storage,'interfaces'),ai:readFieldRun(storage,'ai')},selectedField='interfaces',fieldHudKey='';
let systemsSaved=readSystemsRun(storage),missionPractice=false,sectorHudKey="";
let expedition=readExpedition(storage,readProgress(storage));completed=expedition.missions.includes('systems');
if(completed)connections=CONNECTIONS.map(edge=>edge.id);
let interfaceSequence=expedition.missions.includes('interfaces')?[...INTERFACE_SEQUENCE]:[];
let scanHits=expedition.missions.includes('ai')?3:0,scanStart=0,scanFrame=0,scanPosition=0,scanAssisted=matchMedia('(prefers-reduced-motion:reduce)').matches;
function message(text){clearTimeout(messageTimer);$('#lab-message').textContent=text;messageTimer=setTimeout(()=>$('#lab-message').textContent='',4800);}
function updateProgress(){
  $('#lab-progress').textContent=expedition.launched?'NETWORK ONLINE ✓':'SIGNALS '+expedition.cells.length+'/3 · MODULES '+expedition.missions.length+'/3';
  $('#objective-label').textContent=nextObjective(expedition).label;
  $('#map-progress').textContent=expedition.cells.length+'/3 signals recovered · '+expedition.missions.length+'/3 modules restored'+(expedition.launched?' · Network online':'');
  for(const cargo of CARGO){const button=$('[data-walk="'+cargo.id+'"]'),found=expedition.cells.includes(cargo.id);button.disabled=found;button.textContent=cargo.name+(found?' ✓':' ↗');}
  for(const station of STATIONS)$('.map-destinations [data-walk="'+station.id+'"]').classList.toggle('is-complete',expedition.missions.includes(station.id));
  $('#label-systems').classList.toggle('is-complete',completed);scene?.setProgress(expedition);
}
function advance(kind,id){expedition=advanceExpedition(expedition,kind,id);saveExpedition(storage,expedition);updateProgress();}
function completeMission(id){const fresh=!expedition.missions.includes(id);advance('mission',id);if(fresh)message(STATIONS.find(s=>s.id===id).name+' restored. Return to the Nexus when all signals and modules are ready.');}
function syncPause(){const paused=!started||dialogs.some(d=>d.open);scene?.setPaused(paused);if(!paused)scene?.focus();}
function closeOverlays(){for(const dialog of dialogs)if(dialog.open)dialog.close();}
function openOverlay(dialog){if(dialog.open)return;closeOverlays();scene?.setPaused(true);dialog.showModal();}
for(const dialog of dialogs){
 dialog.addEventListener('close',()=>{if(dialog===aiDialog)cancelAnimationFrame(scanFrame);syncPause();});
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(dialog!==entry&&event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
}
entry.addEventListener('cancel',event=>event.preventDefault());
$('#enter-world').addEventListener('click',()=>{started=true;entry.close();scene?.setStarted();message(expedition.launched?'Network remains online. Explore the modules, or restart from Menu.':'Recover the golden signals with a jump. Press Q for a thruster impulse. Map can guide you.');});
function openSystemsBriefing(){
 const run=scene?.systems.run||systemsSaved;$('#systems-resume-status').textContent=run.completed?'Sector restored. Enter again to replay the field mission.':run.relays.length+'/3 relays saved. Three shields; checkpoint retries keep activated relays.';
 $('#start-systems').textContent=run.completed?'Replay Systems sector →':run.relays.length?'Resume Systems sector →':'Enter Systems sector →';openOverlay($('#systems-briefing'));
 $('#restart-sector').hidden=run.relays.length===0||run.completed;
}
function openMission(practice=false){
 if(!practice&&scene?.systems.run.completed){openProjectDossier('systems');return;}
 if(!practice&&!(scene?.systems.active&&scene.systems.run.relays.length===3)){openSystemsBriefing();return;}
 missionPractice=practice;if(practice)connections=[];
 openOverlay(mission);selectedPort=null;$('#systems-mode').textContent=practice?'SYSTEMS / WIRING PRACTICE':'FINAL TERMINAL / SYSTEMS';
 $('#continue-exploring').textContent=practice?'Back to world':'Continue exploring';renderMission();$('#close-mission').focus({preventScroll:true});$('#connection-status').textContent='Choose a port to begin.';requestAnimationFrame(updateWires);
}
$('#start-systems').addEventListener('click',()=>{if(!scene)return;const assist=$('#systems-assist').checked,replay=scene.systems.run.completed;connections=[];selectedPort=null;closeOverlays();scene.startSystems(assist,replay);});
$('#restart-sector').addEventListener('click',()=>{if(!scene)return;scene.leaveSystems();scene.resetSystemsRun();connections=[];selectedPort=null;openSystemsBriefing();});
$('#leave-systems').addEventListener('click',()=>{scene?.leaveSystems();message('Returned to the Systems module. Your sector checkpoint is saved.');});
$('#guide-systems').addEventListener('click',()=>scene?.guideSystems());
const fireButton=$('#fire-blaster');
fireButton.addEventListener('pointerdown',event=>{event.preventDefault();fireButton.setPointerCapture(event.pointerId);scene?.focus();scene?.shoot();scene?.keys.add('f');});
for(const event of ['pointerup','pointercancel','lostpointercapture'])fireButton.addEventListener(event,()=>scene?.keys.delete('f'));
fireButton.addEventListener('click',event=>{if(event.detail===0)scene?.shoot();});
function renderSector(data,position){
 const signature=[data.active,data.relays,data.shields,data.droneHp,data.assist,data.completed,data.aim?.name||''].join('|');
 if(signature!==sectorHudKey){sectorHudKey=signature;document.querySelector('.game-world').classList.toggle('systems-active',data.active);$('#systems-hud').hidden=!data.active;$('#fire-blaster').hidden=!data.active||data.completed;document.querySelector('.game-objective').hidden=data.active;
  $('#sector-objective').textContent=data.objective.label;$('#sector-relays').textContent='Relays '+data.relays+'/3';$('#sector-shields').textContent=data.assist?'Shields: assisted':'Shields '+data.shields+'/3';$('#sector-shields').classList.toggle('low-shields',data.shields===1&&!data.assist);
  $('#sector-drone').textContent=data.completed?'Drone: standby':data.droneHp===0?'Drone: disabled':'Drone: '+data.droneHp+'/3 energy cells';$('#sector-aim-hint').textContent=data.completed?'Press E at the terminal to reopen the project dossier.':data.aim?'F / click · '+data.aim.name:data.relays===3?'Reach the terminal and press E.':'Move closer or face a target. Blaster range: '+BLASTER_RANGE+' m.';
 }
 if(data.active)$('#sector-distance').textContent=Math.round(Math.hypot(position.x-data.objective.point.x,position.z-data.objective.point.z))+' m';
 const aim=$('#systems-aim');aim.hidden=!data.active||!data.aim?.visible;if(!aim.hidden){aim.style.left=data.aim.x+'px';aim.style.top=data.aim.y+'px';aim.querySelector('span').textContent=data.aim.name;}
}
const FIELD_META={
 interfaces:{title:'Alert Courier',category:'01 / INTERFACES',description:'Carry a demo student observation through its review route and restore the guardian alert uplink. The demo case is repeated absence: it needs follow-up.',assist:'Signal assist · no interference damage',steps:[['Collect the observation','Reach the gold packet and press E. The first barrier opens and saves a checkpoint.'],['Choose the review route','Carry the packet to Needs follow-up. Archive and Routine are incorrect for this demo case.'],['Cross the pulse lanes','Jump over active light bars, use Q, or wait for their safe phase. Three interference hits restore your checkpoint.'],['Deliver the alert','Reach the guardian uplink, press E and stay close until transmission finishes.']],success:'Guardian alert delivered.',summary:'Observation collected, review route confirmed and guardian uplink restored.',url:'/work/stayschool/'},
 ai:{title:'Signal Hunt',category:'03 / APPLIED AI',description:'Calibrate the orbital scanner, acquire three moving samples and synchronize the analysis uplink. This is a capture-and-tracking game inspired by the project; it does not run the recognition model.',assist:'Scan assist · stable samples and no noise damage',steps:[['Calibrate the scanner','Reach the calibration console and press E to release the barrier.'],['Acquire three samples','Move within 4.5 m and hold F or hold SCAN. Clicking a sample toggles tracking while it remains visible.'],['Keep the signal clear','Cover blocks the scan. Track the moving sample and avoid the noise crossings by jumping, using Q or waiting.'],['Synchronize the result','After three acquisitions, reach the final uplink, press E and stay close to complete analysis.']],success:'Analysis synchronized.',summary:'Scanner calibrated, three samples acquired and the analysis uplink restored.',url:'/work/traffic-monitor/'}
};
function openFieldBriefing(kind){
 selectedField=kind;const meta=FIELD_META[kind],run=scene?.fields[kind].run||fieldSaved[kind];$('#field-category').textContent=meta.category+' · FIELD MISSION';$('#field-title').textContent=meta.title+'.';$('#field-description').textContent=meta.description;$('#field-assist-label').textContent=meta.assist;
 $('#field-steps').replaceChildren(...meta.steps.map(([title,copy])=>{const li=document.createElement('li'),strong=document.createElement('strong');strong.textContent=title;li.append(strong,document.createTextNode(copy));return li;}));
 const progress=kind==='interfaces'?run.stage:run.captures.length+(run.calibrated?1:0);$('#field-save-status').textContent=run.completed?'Mission complete. Enter again to replay this sector.':kind==='interfaces'?'Review checkpoint '+run.stage+'/3 saved. Confirmed steps survive retries.':(run.calibrated?'Scanner calibrated. ':'Scanner offline. ')+run.captures.length+'/3 sample acquisitions saved.';
 $('#start-field').textContent=(run.completed?'Replay ':progress?'Resume ':'Enter ')+meta.title+' →';$('#restart-field').hidden=progress===0||run.completed;openOverlay($('#field-briefing'));
}
$('#start-field').addEventListener('click',()=>{if(!scene)return;const kind=selectedField,replay=scene.fields[kind].run.completed,assist=$('#field-assist').checked;closeOverlays();scene.startField(kind,assist,replay);});
$('#restart-field').addEventListener('click',()=>{if(!scene)return;if(scene.field)scene.leaveField();scene.resetField(selectedField);openFieldBriefing(selectedField);});
$('#leave-field').addEventListener('click',()=>{scene?.leaveField();message('Returned to the module. Your confirmed field progress is saved.');});
$('#guide-field').addEventListener('click',()=>scene?.guideField());
$('#dossier-return').addEventListener('click',()=>{if(scene?.field)scene.leaveField();if(scene?.systems.active)scene.leaveSystems();$('#project-dossier').close();});
function openProjectDossier(kind){
 if(!expedition.missions.includes(kind))return;
 const template=$('template[data-dossier="'+kind+'"]');if(!template)return;
 $('#dossier-content').replaceChildren(template.content.cloneNode(true));
 const station=STATIONS.find(s=>s.id===kind);$('#dossier-category').textContent=station.number+' / '+station.name.toUpperCase()+' · MISSION COMPLETE';
 openOverlay($('#project-dossier'));$('#project-dossier').scrollTop=0;
 $('#project-dossier .dialog-close').focus({preventScroll:true});
}
function fieldComplete(kind){completeMission(kind);openProjectDossier(kind);}
function practiceField(kind){if(kind==='interfaces'){interfaceSequence=[];renderInterface();openOverlay($('#interfaces-dialog'));}else{scanHits=0;scanPosition=0;openOverlay(aiDialog);scanStart=performance.now();$('#scanner-assist').checked=scanAssisted;$('#step-scanner').hidden=!scanAssisted;$('#scan-feedback').textContent='Timing practice. Field-mission progress is unchanged.';cancelAnimationFrame(scanFrame);scanLoop();}}
document.querySelectorAll('[data-practice]').forEach(button=>button.addEventListener('click',()=>button.dataset.practice==='systems'?openMission(true):practiceField(button.dataset.practice)));
function renderField(data,position){
 const meta=FIELD_META[data.kind],run=data.run,signature=[data.kind,run.stage,run.calibrated,run.captures.length,run.completed,data.health,data.assist,data.channel>0,data.aim?.name||''].join('|');
 if(signature!==fieldHudKey){fieldHudKey=signature;sectorHudKey='';document.querySelector('.game-world').classList.remove('systems-active');document.querySelector('.game-world').classList.add('field-active');document.querySelector('.game-world').classList.toggle('field-courier',data.kind==='interfaces');document.querySelector('.game-world').classList.toggle('field-scanner',data.kind==='ai');$('#systems-hud').hidden=true;$('#systems-aim').hidden=true;document.querySelector('.game-objective').hidden=true;$('#field-hud').hidden=false;$('#field-kicker').textContent=meta.category+' · '+meta.title.toUpperCase();$('#field-objective').textContent=data.objective.label;$('#field-count').textContent=data.kind==='interfaces'?'Route '+run.stage+'/3':'Samples '+run.captures.length+'/3';$('#field-health').textContent=data.assist?'Assist enabled':(data.kind==='interfaces'?'Signal ':'Shield ')+data.health+'/3';$('#field-detail').textContent=data.kind==='interfaces'?(run.completed?'Alert delivered':run.stage?'Packet: observation aboard':'Demo case: repeated absence'):(run.completed?'Analysis synchronized':run.captures.length===3?'3 samples confirmed · uplink ready':run.calibrated?'Scanner ready · 4.5 m range':'Scanner: calibration required');$('#field-hint').textContent=run.completed?'Press E at the terminal to reopen the project dossier.':data.channel>0?'Stay beside the uplink to finish transmitting.':data.aim?'Hold F / SCAN · '+data.aim.name:data.kind==='ai'?(run.captures.length===3?'Press E at the analysis uplink, then stay close.':run.calibrated?'Hold SCAN on a visible nearby sample.':'Press E at the calibration console.'):'Use E at the current route station.';$('#guide-field').disabled=run.completed;
  $('#fire-blaster').hidden=data.kind!=='ai'||!run.calibrated||run.captures.length===3||run.completed;$('#fire-blaster').setAttribute('aria-label','Hold scanner');$('#fire-blaster small').textContent='SCAN / HOLD';
 }
 $('#field-distance').textContent=Math.round(Math.hypot(position.x-data.objective.point.x,position.z-data.objective.point.z))+' m';const progress=Math.min(1,data.channel||data.scan||0);$('#field-meter i').style.width=progress*100+'%';$('#field-meter').setAttribute('aria-valuenow',Math.round(progress*100));const aim=$('#field-aim');aim.hidden=!data.aim?.visible;if(!aim.hidden){aim.style.left=data.aim.x+'px';aim.style.top=data.aim.y+'px';aim.querySelector('span').textContent=data.aim.name;}
}
function renderMissionHUD(projection){if(projection.field.active){renderField(projection.field,projection.position);return;}if(fieldHudKey){fieldHudKey='';document.querySelector('.game-world').classList.remove('field-active','field-courier','field-scanner');$('#field-hud').hidden=true;$('#field-aim').hidden=true;$('#fire-blaster').setAttribute('aria-label','Fire energy blaster');$('#fire-blaster small').textContent='FIRE / F';sectorHudKey='';}renderSector(projection.systems,projection.position);}
function renderInterface(){
 const solved=interfaceSequence.length===3;
 [...$('#alert-route').children].forEach((step,i)=>step.classList.toggle('is-active',i<interfaceSequence.length));
 document.querySelectorAll('[data-route]').forEach(button=>button.disabled=solved);
 $('#interface-feedback').textContent=solved?'Sequence practice complete. Field-mission progress is unchanged.':interfaceSequence.length+'/3 steps routed. Choose the next step.';
}
function paintScanner(){
 $('#scan-cursor').style.left=(scanPosition*100)+'%';$('#scan-reading').textContent=Math.round(scanPosition*100)+'%';$('#scan-meter').setAttribute('aria-valuenow',Math.round(scanPosition*100));
 [...$('#scan-locks').children].forEach((lock,i)=>lock.classList.toggle('is-active',i<scanHits));$('#capture-signal').disabled=scanHits===3;
}
function scanLoop(){if(!aiDialog.open)return;if(!scanAssisted)scanPosition=scannerPosition((performance.now()-scanStart)/1000);paintScanner();scanFrame=requestAnimationFrame(scanLoop);}
function openStation(id){
 if(id.endsWith('-project')){openProjectDossier(id.replace('-project',''));return;}
 if(id==='nexus'){
  if(expedition.launched){openOverlay($('#completion-dialog'));return;}
  if(!readyToLaunch(expedition)){message('Nexus standby: recover all 3 signals and restore all 3 modules. Check your mission map.');return;}
  advance('launch');openOverlay($('#completion-dialog'));return;
 }
 if(id==='systems'){openSystemsBriefing();return;}
 if(id==='systems-terminal'){openMission(false);return;}
 if(id==='interfaces'||id==='ai'){openFieldBriefing(id);return;}
}
$('#close-mission').addEventListener('click',()=>mission.close());$('#continue-exploring').addEventListener('click',()=>{if(!missionPractice&&scene?.systems.run.completed)scene.leaveSystems();mission.close();});
$('#fallback-challenge').addEventListener('click',()=>openMission(true));
for(const button of document.querySelectorAll('[data-mission]'))button.addEventListener('click',()=>openStation(button.dataset.mission));
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>{$('#'+button.dataset.close).close();syncPause();});
$('#open-map').addEventListener('click',()=>openOverlay($('#map-dialog')));$('#pause-map').addEventListener('click',()=>openOverlay($('#map-dialog')));$('#open-help').addEventListener('click',()=>openOverlay($('#help-dialog')));$('#open-pause').addEventListener('click',()=>openOverlay($('#pause-dialog')));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&started&&!dialogs.some(d=>d.open)){event.preventDefault();openOverlay($('#pause-dialog'));}});
function cameraChanged(mode){$('#camera-name').textContent=mode==='first'?'First person':'Third person';$('#switch-camera').setAttribute('aria-label',mode==='first'?'Switch to third-person camera':'Switch to first-person camera');$('#crosshair').hidden=mode!=='first';}
$('#switch-camera').addEventListener('click',()=>scene?.toggleCamera());
$('#reset-camera').addEventListener('click',()=>{scene?.resetCamera();closeOverlays();});
$('#reset-position').addEventListener('click',()=>{scene?.resetPosition();closeOverlays();message('Back at the arrival dock.');});
for(const button of document.querySelectorAll('[data-restart]'))button.addEventListener('click',()=>{scene?.resetSystemsRun();scene?.resetFields();for(const kind of ['interfaces','ai']){fieldSaved[kind]=freshFieldRun();saveFieldRun(storage,kind,fieldSaved[kind]);}systemsSaved=freshSystemsRun();saveSystemsRun(storage,systemsSaved);expedition=emptyExpedition();completed=false;connections=[];interfaceSequence=[];scanHits=0;selectedPort=null;saveExpedition(storage,expedition);updateProgress();scene?.resetPosition();closeOverlays();message('New expedition. Recover the signals, restore the modules, activate the Nexus.');});
$('#touch-jump').addEventListener('click',()=>{scene?.jumpNow();scene?.focus();});$('#touch-boost').addEventListener('click',()=>{scene?.dashNow();scene?.focus();});
$('#world-interact').addEventListener('click',()=>scene?.interact());
$('#toggle-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message('This browser keeps the game inside its full-window view.');}});
document.addEventListener('fullscreenchange',()=>$('#toggle-fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
function walk(id){closeOverlays();if(scene){scene.setPaused(false);scene.walkTo(id);}else if(STATIONS.some(s=>s.id===id))openStation(id);}
document.querySelectorAll('[data-walk]').forEach(button=>button.addEventListener('click',()=>walk(button.dataset.walk)));
document.querySelectorAll('[data-direction]').forEach(button=>{
 const press=()=>{if(scene&&started&&!dialogs.some(d=>d.open)){scene.focus();scene.path=[];scene.keys.add(button.dataset.direction);}};
 const release=()=>scene?.keys.delete(button.dataset.direction);
 button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);press();});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
 button.addEventListener('click',event=>{if(event.detail===0){press();setTimeout(release,180);}});
});
document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
 const next=routeInterface(interfaceSequence,button.dataset.route),wrong=next.length===0;interfaceSequence=next;renderInterface();if(wrong)$('#interface-feedback').textContent='Route interrupted. Start by observing, then evaluate before notifying.';if(interfaceSequence.length===3)$('#interface-feedback').textContent='Sequence practice complete. Finish Alert Courier to restore the module.';
}));
$('#replay-interface').addEventListener('click',()=>{interfaceSequence=[];renderInterface();});
$('#scanner-assist').addEventListener('change',()=>{scanAssisted=$('#scanner-assist').checked;$('#step-scanner').hidden=!scanAssisted;scanPosition=0;scanStart=performance.now();paintScanner();});
$('#step-scanner').addEventListener('click',()=>{scanPosition=scanPosition>=1?0:Math.round((scanPosition+.1)*10)/10;paintScanner();});
$('#capture-signal').addEventListener('click',()=>{
 if(!scanAssisted)scanPosition=scannerPosition((performance.now()-scanStart)/1000);const result=captureSignal(scanHits,scanPosition);scanHits=result.hits;paintScanner();
 $('#scan-feedback').textContent=scanHits===3?'Three frames locked. Applied AI module restored.':result.hit?'Frame locked. '+scanHits+'/3 captured.':'Outside the target zone. Previous locks kept; try again.';
 if(scanHits===3)$('#scan-feedback').textContent='Timing practice complete. Finish Signal Hunt to restore the module.';
});
$('#replay-scan').addEventListener('click',()=>{scanHits=0;scanPosition=0;scanStart=performance.now();paintScanner();$('#scan-feedback').textContent='New scan. Capture three frames inside the cyan zone.';});
function updateWires() {
  if(!mission.open)return;
  const board=$('#connection-board'),rect=board.getBoundingClientRect();
  const svg=$('#connection-wires');svg.setAttribute('viewBox','0 0 '+rect.width+' '+rect.height);
  const vertical=matchMedia('(max-width:680px)').matches;
  for(const edge of CONNECTIONS) {
    const path=$('#wire-'+edge.id);path.hidden=!connections.includes(edge.id);
    path.style.display=connections.includes(edge.id)?'':'none';
    const a=$('#'+edge.ports[0]).getBoundingClientRect(),b=$('#'+edge.ports[1]).getBoundingClientRect();
    const x1=a.left+a.width/2-rect.left,y1=a.top+a.height/2-rect.top,x2=b.left+b.width/2-rect.left,y2=b.top+b.height/2-rect.top;
    const d=vertical?'M '+x1+' '+y1+' C '+x1+' '+(y1+22)+' '+x2+' '+(y2-22)+' '+x2+' '+y2:'M '+x1+' '+y1+' C '+(x1+28)+' '+y1+' '+(x2-28)+' '+y2+' '+x2+' '+y2;
    path.setAttribute('d',d);
  }
}
function renderMission() {
  const solved=connections.length===2;
  $('#connection-count').textContent=connections.length+' / 2 connected';
  $('#mission-success').hidden=!solved;mission.classList.toggle('is-solved',solved);$('#mission-success p').textContent=missionPractice?'Wiring practice complete. Enter the sector to finish the field mission.':'Systems field mission complete. Explore the project behind it.';
  document.querySelectorAll('[data-port]').forEach(port=>{
    port.setAttribute('aria-pressed',String(port.id===selectedPort));
    port.classList.toggle('is-connected',CONNECTIONS.some(edge=>connections.includes(edge.id)&&edge.ports.includes(port.id)));
  });
  updateWires();
}
document.querySelectorAll('[data-port]').forEach(port=>port.addEventListener('click',()=>{
  let showDossier=false;
  const id=port.dataset.port;
  if(!selectedPort){selectedPort=id;$('#connection-status').textContent=port.getAttribute('aria-label')+' selected. Choose the matching port.';renderMission();return;}
  if(selectedPort===id){selectedPort=null;$('#connection-status').textContent='Selection cleared. Choose a port.';renderMission();return;}
  const result=connectPorts(connections,selectedPort,id);selectedPort=null;
  if(result.ok) {
    connections=result.connections;
    if(connections.length===2){if(!missionPractice&&scene?.finishSystems()){completed=true;saveProgress(storage);completeMission('systems');showDossier=true;$('#connection-status').textContent='System connected. Systems sector restored.';$('#continue-exploring').textContent='Return to orbit →';}else $('#connection-status').textContent='Practice connected. Enter the Systems sector to complete the field mission.';}
    else $('#connection-status').textContent=result.duplicate?'That connection is already in place.':'Connection made. Connect the remaining pair.';
  } else $('#connection-status').textContent=result.reason;
  renderMission();
  if(showDossier)openProjectDossier('systems');
}));
$('#reset-puzzle').addEventListener('click',()=>{connections=[];selectedPort=null;renderMission();$('#connection-status').textContent='Puzzle reset. Reconnect the browser, API and database.';});
new ResizeObserver(updateWires).observe($('#connection-board'));

function fallback(){closeOverlays();scene?.setPaused(true);$('#lab-loading').hidden=true;$('#lab-fallback').hidden=false;$('#world-labels').hidden=true;document.querySelector('.game-objective').hidden=true;message('The Systems challenge and project pages are available without the 3D world.');}
updateProgress();entry.showModal();
try{
 const {LabScene}=await import('/assets/lab/scene.js');
 scene=new LabScene($('#lab-canvas'),{
  fieldRuns:fieldSaved,onFieldSave:(kind,run)=>{fieldSaved[kind]={...run,captures:[...run.captures]};saveFieldRun(storage,kind,run);},onFieldComplete:fieldComplete,
  systemsRun:systemsSaved,onSystemsSave:run=>{systemsSaved={...run,relays:[...run.relays]};saveSystemsRun(storage,run);},
  onMessage:message,onInteract:openStation,onFailure:fallback,onCameraChange:cameraChanged,
  onCollect:id=>{advance('cell',id);message('Signal recovered. '+expedition.cells.length+'/3 aboard. '+(expedition.cells.length===3?'Restore the modules, then return to the Nexus.':'Follow the next flight-plan marker.'));},
  onState:state=>{
   nearTarget=state.target;$('#world-interact').hidden=!nearTarget;
   if(nearTarget)$('#world-interact span').textContent=nearTarget.kind==='cargo'?'Jump to recover '+nearTarget.name:nearTarget.kind==='field'||nearTarget.kind==='project'?nearTarget.name:nearTarget.kind==='terminal'?'Connect the Systems terminal':nearTarget.kind==='nexus'?(expedition.launched?'View expedition result':readyToLaunch(expedition)?'Activate the Nexus':'Check Nexus status'):'Open '+nearTarget.name+' challenge';
  },
  onProjection:projection=>{
   for(const item of projection.stations){const label=$('#label-'+item.id);label.hidden=!started||!item.visible||item.distance>8;if(!label.hidden){label.style.left=item.x+'px';label.style.top=item.y+'px';}}
   const objective=nextObjective(expedition);$('#objective-distance').textContent=Math.round(Math.hypot(projection.position.x-objective.point.x,projection.position.z-objective.point.z))+' m';
   const player=$('#player-label');player.hidden=!started||!projection.player.visible;if(!player.hidden){player.style.left=projection.player.x+'px';player.style.top=projection.player.y+'px';}
   $('#map-player').setAttribute('cx',220+projection.position.x*6);$('#map-player').setAttribute('cy',300+projection.position.z*6);
   $('#boost-meter').style.setProperty('--charge',projection.dashReady);$('#boost-status').textContent=projection.dashReady>=1?'IMPULSE READY':'RECHARGING';
   $('#touch-boost').classList.toggle('is-recharging',projection.dashReady<1);renderMissionHUD(projection);
  }
 });
 scene.setProgress(expedition);$('#start-systems').disabled=false;$('#start-field').disabled=false;$('#lab-loading').hidden=true;$('#enter-world').disabled=false;$('#enter-world').textContent='Launch expedition →';if(entry.open)$('#enter-world').focus({preventScroll:true});
 window.addEventListener('pagehide',event=>event.persisted?scene?.setPaused(true):scene?.dispose());window.addEventListener('pageshow',event=>{if(event.persisted)syncPause();});
}catch(error){console.error('The orbital world could not start.',error);fallback();}
