import {graphicsPreset,FrameBudget} from './preferences.js';
import * as THREE from 'three';
import {OrbitalWorld} from './orbital-world.js';
import {emptyExpedition} from './expedition.js';
import {SystemsMission,clearShot,BLASTER_RANGE} from './systems-mission.js';
import {SystemsView} from './systems-view.js';
import {FieldMission} from './field-model.js';
import {FieldView} from './field-view.js';
import {FIELD_CONFIG,SAMPLES,SCAN_RANGE,fieldGates,fieldObjective,samplePosition} from './field-layout.js';
import {closedGates,systemsObjective,SYSTEMS_TERMINAL,RELAYS} from './systems-layout.js';
import {SPAWN,STATIONS,OBSTACLES,CARGO,NEXUS,movePlayer,findPath,nearestInteraction,stepJump} from './gameplay.js';

const clamp=THREE.MathUtils.clamp;

export class LabScene extends OrbitalWorld {
  constructor(canvas,callbacks={}) {
    super();
    this.canvas=canvas;this.callbacks=callbacks;this.position={...SPAWN};this.keys=new Set();this.path=[];
    this.yaw=0;this.pitch=.27;this.distance=5.6;this.mode='third';this.paused=true;this.started=false;
    this.fields=Object.fromEntries(['interfaces','ai'].map(kind=>[kind,new FieldMission(kind,callbacks.fieldRuns?.[kind])]));this.field=null;this.scanLatch=null;this.systems=new SystemsMission(callbacks.systemsRun);this.progress=emptyExpedition();this.dashTime=0;this.dashCooldown=0;this.last=0;this.walkPhase=0;this.jump={height:0,velocity:0};this.lastState='';this.materials=new Map();
    this.reduced=callbacks.settings?.reducedMotion??matchMedia('(prefers-reduced-motion:reduce)').matches;this.budget=new FrameBudget();this.autoLowered=false;this.events=new AbortController();
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;
    this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog(0x050c20,65,190);
    this.camera=new THREE.PerspectiveCamera(62,1,.08,220);this.cameraPosition=new THREE.Vector3();this.cameraTarget=new THREE.Vector3();
    this.hemi=new THREE.HemisphereLight(0xa9cfff,0x122344,2);this.scene.add(this.hemi);
    const sun=new THREE.DirectionalLight(0xddeaff,3.5);sun.position.set(-12,25,16);sun.castShadow=true;
    this.sun=sun;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-50,right:50,top:50,bottom:-45,near:.5,far:130});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;this.scene.add(sun);
    this.buildWorld();this.buildCharacter();this.systemsView=new SystemsView(this);this.fieldViews={interfaces:new FieldView(this,'interfaces'),ai:new FieldView(this,'ai')};
    this.raycaster=new THREE.Raycaster();this.floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
    this.bindControls();this.resize();this.updateCamera(1,true);
    this.renderer.setAnimationLoop(time=>this.frame(time));
  }
  suspendRendering(){this.renderer.setAnimationLoop(null)}
  applyPreferences(settings){this.reduced=settings.reducedMotion;this.applyQuality(settings.quality);this.setTheme(settings.theme);this.refreshLabels();}
  applyQuality(requested='auto'){
    if(requested!==this.qualityRequested){this.autoLowered=false;this.budget.reset()}this.qualityRequested=requested;
    const preset=graphicsPreset(this.autoLowered&&requested==='auto'?'low':requested,{mobile:matchMedia('(pointer:coarse)').matches||innerWidth<=760,pixelRatio:devicePixelRatio});
    const signature=JSON.stringify(preset);if(signature!==this.qualitySignature){this.qualitySignature=signature;this.renderer.setPixelRatio(preset.pixelRatio);this.renderer.shadowMap.enabled=preset.shadows;this.sun.shadow.mapSize.set(preset.shadowSize,preset.shadowSize);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.resize()}this.effectiveQuality=preset.name;this.callbacks.onQualityChange?.(preset.name);
  }
  setTheme(theme){const light=theme==='light';this.scene.background.set(light?0x263751:0x0b1021);this.scene.fog.color.set(light?0x263751:0x0b1021);this.hemi.color.set(light?0xe5ecff:0xa9cfff);this.hemi.groundColor.set(light?0x243651:0x122344);this.renderer.toneMappingExposure=1;}
  resize() {
    const {width,height}=this.canvas.parentElement.getBoundingClientRect();if(!width||!height)return;
    this.width=width;this.height=height;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
  }
  updateCamera(dt,snap=false) {
    const p=this.position,head=1.45+this.jump.height;
    let desired,target;
    if(this.mode==='first'&&this.started) {
      desired=new THREE.Vector3(p.x,head,p.z);target=desired.clone().add(new THREE.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch)*10,-Math.sin(this.pitch)*10,-Math.cos(this.yaw)*Math.cos(this.pitch)*10));
    } else {
      const distance=this.started?this.distance:7.7;
      target=new THREE.Vector3(p.x,1.25+this.jump.height*.3,p.z);
      desired=new THREE.Vector3(p.x+Math.sin(this.yaw)*distance*Math.cos(this.pitch),1.35+Math.sin(this.pitch)*distance+(this.started?0:1.2)+this.jump.height*.25,p.z+Math.cos(this.yaw)*distance*Math.cos(this.pitch));
      const direction=desired.clone().sub(target),ray=new THREE.Ray(target,direction.clone().normalize());let length=direction.length();direction.normalize();
      for(const obstacle of this.getObstacles()) {
        const box=new THREE.Box3(new THREE.Vector3(obstacle.minX,0,obstacle.minZ),new THREE.Vector3(obstacle.maxX,obstacle.height||4,obstacle.maxZ));
        const hit=ray.intersectBox(box,new THREE.Vector3());if(hit&&target.distanceTo(hit)<length){length=Math.max(.45,target.distanceTo(hit)-.3);desired=target.clone().addScaledVector(direction,length);}
      }
    }
    const alpha=snap||this.reduced?1:1-Math.exp(-dt*12);
    this.cameraPosition.lerp(desired,alpha);this.cameraTarget.lerp(target,alpha);this.camera.position.copy(this.cameraPosition);this.camera.lookAt(this.cameraTarget);
    this.avatar.visible=this.mode!=='first'||!this.started;
  }
  setStarted() {this.started=true;this.setPaused(false);this.focus();}
  setPaused(value) {this.paused=value;this.keys.clear();if(value){this.path=[];this.pointer=null;this.scanLatch=null;}}
  focus() {this.canvas.focus({preventScroll:true});}
  toggleCamera() {this.mode=this.mode==='third'?'first':'third';this.pitch=this.mode==='first'?.03:(this.systems.active||this.field)&&this.width<=650?.1:.27;this.updateCamera(1,true);this.callbacks.onCameraChange?.(this.mode);this.focus();}
  zoom(amount) {if(this.mode==='third')this.distance=clamp(this.distance-amount*4,3.2,7.5);else{this.camera.fov=clamp(this.camera.fov-amount*15,48,78);this.camera.updateProjectionMatrix();}}
  resetCamera() {this.yaw=0;this.pitch=this.mode==='first'?.03:(this.systems.active||this.field)&&this.width<=650?.1:.27;this.distance=5.6;this.camera.fov=62;this.camera.updateProjectionMatrix();this.updateCamera(1,true);}
  resetPosition() {if(this.field)this.leaveField();this.systems.leave();this.position={...SPAWN};this.path=[];this.keys.clear();this.jump={height:0,velocity:0};this.dashTime=0;this.dashCooldown=0;this.resetCamera();this.focus();}
  jumpNow() {if(this.jump.height===0)this.jump=stepJump(this.jump,0,true);}
  dashNow() {
    if(this.paused)return;
    if(this.dashCooldown>0){this.callbacks.onMessage?.('Thrusters recharging.');return;}
    const dx=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0),dz=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);
    this.dashDirection=dx||dz?{x:dx*Math.cos(this.yaw)+dz*Math.sin(this.yaw),z:-dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw)}:{x:-Math.sin(this.yaw),z:-Math.cos(this.yaw)};
    this.path=[];this.dashTime=.22;this.dashCooldown=1.6;this.callbacks.onMessage?.('Impulse engaged.');
  }
  getObstacles(){return [...OBSTACLES,...closedGates(this.systems.run),...Object.entries(this.fields).flatMap(([kind,model])=>fieldGates(kind,model.run))];}
  startSystems(assist=false,replay=false){
    if(this.field)this.leaveField();if(replay)this.systems.restart();this.position=this.systems.start(assist);this.path=[];this.keys.clear();this.jump={height:0,velocity:0};this.dashTime=0;this.dashCooldown=0;this.resetCamera();const look=RELAYS[this.systems.run.relays.length]?.point||SYSTEMS_TERMINAL.point;this.yaw=Math.atan2(this.position.x-look.x,this.position.z-look.z);this.updateCamera(1,true);this.callbacks.onSystemsSave?.(this.systems.run);this.setPaused(false);this.focus();
    this.callbacks.onMessage?.('Systems sector online. Shoot the highlighted relay with F or a click.');
  }
  leaveSystems(){this.systems.leave();this.position={...STATIONS.find(s=>s.id==='systems').point};this.path=[];this.keys.clear();this.jump={height:0,velocity:0};this.dashTime=0;this.resetCamera();this.focus();}
  resetSystemsRun(){this.systems.restart();this.callbacks.onSystemsSave?.(this.systems.run);}
  finishSystems(){if(!this.systems.active||!this.systems.finish())return false;this.callbacks.onSystemsSave?.(this.systems.run);return true;}
  guideSystems(){if(!this.systems.active)return;this.walkToPoint(systemsObjective(this.systems.run).point);this.destination=systemsObjective(this.systems.run).point;this.focus();}
  aimTarget(){
    this.camera.updateMatrixWorld();const origin={x:this.position.x,y:1.25+this.jump.height,z:this.position.z};
    return this.systems.targets().map(t=>{const v=new THREE.Vector3(t.point.x,t.point.y,t.point.z).project(this.camera);return {...t,screen:v,score:v.x*v.x+v.y*v.y};}).filter(t=>t.screen.z>-1&&t.screen.z<1&&Math.abs(t.screen.x)<.9&&Math.abs(t.screen.y)<.9&&Math.hypot(t.point.x-origin.x,t.point.y-origin.y,t.point.z-origin.z)<BLASTER_RANGE&&clearShot(origin,t.point,this.getObstacles())).sort((a,b)=>a.score-b.score)[0]||null;
  }
  shoot(pointer){
    if(this.paused)return;
    if(this.field){if(this.field.kind==='ai'&&pointer){let target=this.fieldAim();const rect=this.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((pointer.clientX-rect.left)/rect.width*2-1,-(pointer.clientY-rect.top)/rect.height*2+1),this.camera);const hits=this.raycaster.intersectObjects([...this.fieldViews.ai.samples.values()].map(s=>s.group),true);const hit=hits.find(h=>!this.field.run.captures.includes(h.object.userData.fieldSample));if(hit){const sample=SAMPLES.find(s=>s.id===hit.object.userData.fieldSample);target=sample;}this.scanLatch=target?.id===this.scanLatch?null:target?.id||null;}return;}
    if(!this.systems.active)return;let target=this.aimTarget();
    if(pointer){const rect=this.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((pointer.clientX-rect.left)/rect.width*2-1,-(pointer.clientY-rect.top)/rect.height*2+1),this.camera);const hit=this.raycaster.intersectObjects(this.systemsView.targets,true).find(h=>this.systems.targets().some(t=>t.id===h.object.userData.systemsTarget));if(hit)target=this.systems.targets().find(t=>t.id===hit.object.userData.systemsTarget);}
    const forward=this.camera.getWorldDirection(new THREE.Vector3()),aim=target?.point||{x:this.position.x+forward.x*20,y:1.25+this.jump.height+forward.y*20,z:this.position.z+forward.z*20};
    if(this.systems.shoot({...this.position,height:this.jump.height},aim))this.avatar.rotation.y=Math.atan2(aim.x-this.position.x,aim.z-this.position.z);
  }
  startField(kind,assist=false,replay=false){
    if(this.systems.active)this.leaveSystems();if(this.field)this.leaveField();const model=this.fields[kind];if(replay)model.restart();this.field=model;this.position=model.start(assist);this.scanLatch=null;this.path=[];this.keys.clear();this.jump={height:0,velocity:0};this.dashTime=0;this.dashCooldown=0;this.resetCamera();const point=fieldObjective(kind,model.run).point;this.yaw=Math.atan2(this.position.x-point.x,this.position.z-point.z);this.updateCamera(1,true);this.callbacks.onFieldSave?.(kind,model.run);this.setPaused(false);this.focus();this.callbacks.onMessage?.('Objective: '+fieldObjective(kind,model.run).label+'. Use the mission panel for guidance.');
  }
  leaveField(){if(!this.field)return;const kind=this.field.kind;this.field.leave();this.field=null;this.scanLatch=null;this.position={...STATIONS.find(s=>s.id===kind).point};this.path=[];this.keys.clear();this.jump={height:0,velocity:0};this.dashTime=0;this.resetCamera();this.focus();}
  resetField(kind){if(this.field?.kind===kind)this.leaveField();this.fields[kind].restart();this.callbacks.onFieldSave?.(kind,this.fields[kind].run);}
  resetFields(){if(this.field)this.leaveField();for(const kind of Object.keys(this.fields))this.resetField(kind);}
  guideField(){if(!this.field)return;const point=fieldObjective(this.field.kind,this.field.run).point;this.walkToPoint(point);this.destination=point;this.focus();}
  fieldAim(){
    const model=this.field;if(model?.kind!=='ai'||!model.run.calibrated||model.run.completed)return null;this.camera.updateMatrixWorld();const origin={x:this.position.x,y:1.25+this.jump.height,z:this.position.z};
    return SAMPLES.filter(s=>!model.run.captures.includes(s.id)).map(sample=>{const point=samplePosition(sample,model.clock,model.assist),screen=new THREE.Vector3(point.x,point.y,point.z).project(this.camera);return {...sample,point,screen,score:screen.x*screen.x+screen.y*screen.y};}).filter(s=>s.screen.z>-1&&s.screen.z<1&&Math.abs(s.screen.x)<.9&&Math.abs(s.screen.y)<.9&&Math.hypot(s.point.x-origin.x,s.point.y-origin.y,s.point.z-origin.z)<=SCAN_RANGE&&clearShot(origin,s.point,this.getObstacles())).sort((a,b)=>a.score-b.score)[0]||null;
  }
  fieldEvents(model,events){for(const event of events){
    if(event.message)this.callbacks.onMessage?.(event.message);
    if(event.type==='stage'||event.type==='complete')this.callbacks.onFieldSave?.(model.kind,model.run);
    if(event.type==='stage')this.scanLatch=null;
    if(event.type==='complete'){this.scanLatch=null;this.callbacks.onFieldComplete?.(model.kind);}
    if(event.type==='retry'){this.position={...event.point};this.jump={height:0,velocity:0};this.path=[];this.keys.clear();this.scanLatch=null;this.dashTime=0;this.resetCamera();}
  }}
  interactionTarget() {if(this.field)return this.field.nearest(this.position);if(this.systems.active){const point=SYSTEMS_TERMINAL.point;if(Math.hypot(this.position.x-point.x,this.position.z-point.z)<1.6&&this.systems.run.relays.length===3)return this.systems.run.completed?{id:'systems-project',kind:'project',name:'View project dossier'}:{id:'systems-terminal',kind:'terminal',name:'Connection terminal'};return null;}const target=nearestInteraction(this.position,this.progress);return target.distance<(target.kind==='cargo'?1.1:1.65)?target:null;}
  interact() {
    const target=this.interactionTarget();if(!target)return;
    if(target.kind==='project'){this.callbacks.onInteract?.(target.id);return;}
    if(this.field){this.fieldEvents(this.field,this.field.interact(target.id,this.position));return;}if(target.kind==='cargo')this.jumpNow();else this.callbacks.onInteract?.(target.id);
  }
  walkTo(id) {if(this.field)this.leaveField();if(this.systems.active)this.leaveSystems();const station=[...STATIONS,...CARGO,NEXUS].find(s=>s.id===id);if(station){this.walkToPoint(station.point);this.destination=station.point;}this.focus();}
  walkToPoint(point) {const path=findPath(this.position,point,this.getObstacles());if(!path.length){this.callbacks.onMessage?.('Choose a magnetic walkway or deck.');return;}this.path=path;this.pathLook=true;this.destination=null;this.keys.clear();this.callbacks.onMessage?.('Walking to your destination.');}
  bindControls() {
    const signal=this.events.signal;
    this.canvas.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase();
      if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e','v','q','f',' '].includes(key))event.preventDefault();
      if(this.paused)return;
      if(key==='f'){if(!event.repeat)this.shoot();this.keys.add('f');return;}
      if(key==='v'&&!event.repeat){this.toggleCamera();return;}
      if(key===' '&&!event.repeat){this.jumpNow();return;}
      if(key==='q'&&!event.repeat){this.dashNow();return;}
      if(key==='e'&&!event.repeat){this.interact();return;}
      this.keys.add(key);if(key!=='shift')this.path=[];
    },{signal});
    window.addEventListener('keyup',event=>this.keys.delete(event.key.toLowerCase()),{signal});window.addEventListener('blur',()=>this.keys.clear(),{signal});this.canvas.addEventListener('blur',()=>this.keys.clear(),{signal});
    this.canvas.addEventListener('pointerdown',event=>{if(this.paused||event.button>0)return;this.focus();this.pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,dragged:false};this.canvas.setPointerCapture(event.pointerId);},{signal});
    this.canvas.addEventListener('pointermove',event=>{if(!this.pointer||this.pointer.id!==event.pointerId)return;const p=this.pointer;if(Math.hypot(event.clientX-p.x,event.clientY-p.y)>6)p.dragged=true;if(p.dragged){this.pathLook=false;this.yaw-=(event.clientX-p.lastX)*.005;this.pitch=clamp(this.pitch+(event.clientY-p.lastY)*.003,this.mode==='first'?-.95:-.08,this.mode==='first'?.95:.65);}p.lastX=event.clientX;p.lastY=event.clientY;},{signal});
    this.canvas.addEventListener('pointerup',event=>{const pointer=this.pointer;if(!pointer||pointer.id!==event.pointerId)return;this.pointer=null;if(pointer.dragged)return;if(this.systems.active||this.field?.kind==='ai'){this.shoot(event);return;}if(this.mode==='first')return;const rect=this.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),this.camera);const point=this.raycaster.ray.intersectPlane(this.floorPlane,new THREE.Vector3());if(point)this.walkToPoint({x:point.x,z:point.z});},{signal});
    this.canvas.addEventListener('pointercancel',()=>this.pointer=null,{signal});this.canvas.addEventListener('wheel',event=>{event.preventDefault();if(!this.paused)this.zoom(-Math.sign(event.deltaY)*.08);},{signal,passive:false});
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.callbacks.onFailure?.();},{signal});
  }
  frame(time) {
    const elapsed=time-(this.last||time),dt=Math.min(elapsed/1000,.04);this.last=time;if(document.hidden)return;
    if(!this.paused){const action=this.budget.sample(elapsed,this.qualityRequested==='auto'&&!this.autoLowered?'auto':this.effectiveQuality);if(action==='lower'){this.autoLowered=true;this.applyQuality('auto');this.callbacks.onMessage?.('Graphics adjusted for smoother play. Mission rules are unchanged.')}if(action==='warn')this.callbacks.onPerformanceIssue?.();}
    const old={...this.position};
    if(!this.paused) {
      const dx=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0);
      const dz=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);
      if(this.dashTime>0)this.position=movePlayer(this.position,this.dashDirection,dt,10,this.getObstacles());
      else if(dx||dz)this.position=movePlayer(this.position,{x:dx*Math.cos(this.yaw)+dz*Math.sin(this.yaw),z:-dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw)},dt,this.keys.has('shift')?5.3:3.4,this.getObstacles());
      else if(this.path.length){const goal=this.path[0],delta={x:goal.x-this.position.x,z:goal.z-this.position.z},distance=Math.hypot(delta.x,delta.z);if(this.pathLook){const ahead=this.path[Math.min(6,this.path.length-1)],atDoor=this.destination&&Math.hypot(this.destination.x-this.position.x,this.destination.z-this.position.z)<2.3;const angle=atDoor?0:Math.atan2(this.position.x-ahead.x,this.position.z-ahead.z);this.yaw+=Math.atan2(Math.sin(angle-this.yaw),Math.cos(angle-this.yaw))*Math.min(1,dt*3);}if(distance<.06)this.path.shift();else this.position=movePlayer(this.position,delta,Math.min(dt,distance/3.4),3.4,this.getObstacles());}
      this.jump=stepJump(this.jump,dt);this.dashTime=Math.max(0,this.dashTime-dt);this.dashCooldown=Math.max(0,this.dashCooldown-dt);
      if(this.keys.has('f'))this.shoot();
      const events=this.systems.tick(dt,{...this.position,height:this.jump.height},this.getObstacles());
      for(const event of events){
        if(event.type==='relay'){this.callbacks.onSystemsSave?.(this.systems.run);this.callbacks.onMessage?.(this.systems.run.relays.length<3?'Relay activated. Barrier released; progress saved.':'Third relay activated. Final terminal unlocked; progress saved.');}
        if(event.type==='drone-disabled'){this.callbacks.onSystemsSave?.(this.systems.run);this.callbacks.onMessage?.('Patrol drone disabled. Continue to the relays.');}
        if(event.type==='drone-hit')this.callbacks.onMessage?.('Drone hit: '+this.systems.run.droneHp+' energy cells left.');
        if(event.type==='warning')this.callbacks.onMessage?.('Drone locking on. Move, jump or use Q to dodge.');
        if(event.type==='hurt')this.callbacks.onMessage?.('Shield hit. Use the crates as cover.');
        if(event.type==='absorbed')this.callbacks.onMessage?.('Shield assist absorbed the shot.');
        if(event.type==='retry'){this.position={...event.point};this.path=[];this.keys.clear();this.dashTime=0;this.jump={height:0,velocity:0};this.resetCamera();this.callbacks.onMessage?.('Checkpoint restored. Activated relays kept.');}
      }
      if(this.field){const model=this.field,aim=this.fieldAim(),requested=this.keys.has('f')?aim?.id:this.scanLatch&&aim?.id===this.scanLatch?this.scanLatch:null;this.fieldEvents(model,model.tick(dt,{...this.position,height:this.jump.height},{scanTarget:requested,obstacles:this.getObstacles(),boosting:this.dashTime>0}));}
      for(const cargo of CARGO)if(!this.progress.cells.includes(cargo.id)&&this.jump.height>.3&&Math.hypot(this.position.x-cargo.point.x,this.position.z-cargo.point.z)<1.1)this.callbacks.onCollect?.(cargo.id);
    }
    const moving=Math.hypot(this.position.x-old.x,this.position.z-old.z)>.0001;
    if(moving){this.walkPhase+=dt*(this.keys.has('shift')?15:10);const angle=Math.atan2(this.position.x-old.x,this.position.z-old.z),delta=Math.atan2(Math.sin(angle-this.avatar.rotation.y),Math.cos(angle-this.avatar.rotation.y));this.avatar.rotation.y+=delta*Math.min(1,dt*14);}
    const stride=moving&&!this.reduced?Math.sin(this.walkPhase)*.65:0;
    this.leftLeg.rotation.x=stride;this.rightLeg.rotation.x=-stride;this.leftArm.rotation.x=-stride*.75;this.rightArm.rotation.x=stride*.75;
    if(this.systems.active&&this.systems.fireCooldown>.1)this.rightArm.rotation.x=0;
    this.body.position.y=moving&&!this.reduced?Math.abs(Math.sin(this.walkPhase))*.018:0;this.avatar.position.set(this.position.x,.06+this.jump.height,this.position.z);
    this.updateCamera(dt);
    // Nearby signage fades before it can cover the explorer or the route.
    for(const sign of this.signs){const width=sign.userData.signWidth;sign.material.opacity=clamp((this.camera.position.distanceTo(sign.position)-width*.95)/(width*.45),0,1);}
    this.animateWorld(time/1000);this.systemsView.update(this.systems);for(const [kind,view] of Object.entries(this.fieldViews))view.update(this.fields[kind],{...this.position,height:this.jump.height});
    const target=this.interactionTarget(),state=(target?.id||'none')+(this.field?.run.completed||false)+this.progress.launched+this.progress.cells.length+this.progress.missions.length;
    if(state!==this.lastState){this.lastState=state;this.callbacks.onState?.({target});}
    const project=point=>{const v=new THREE.Vector3(point.x,point.y,point.z).project(this.camera);return {x:(v.x+1)*this.width/2,y:(1-v.y)*this.height/2,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<.92&&Math.abs(v.y)<.9};};
    this.callbacks.onProjection?.({stations:STATIONS.map(s=>({id:s.id,distance:Math.hypot(this.position.x-s.point.x,this.position.z-s.point.z),...project(s.anchor)})),player:{...project({x:this.position.x,y:2.1+this.jump.height,z:this.position.z}),visible:this.mode==='third'},position:this.position,mode:this.mode,dashReady:1-this.dashCooldown/1.6,field:this.field?{active:true,kind:this.field.kind,title:this.field.config.title,run:this.field.run,health:this.field.health,assist:this.field.assist,channel:this.field.channel,scan:this.field.scan,objective:fieldObjective(this.field.kind,this.field.run),aim:(()=>{const a=this.fieldAim();return a?{name:a.name,...project(a.point)}:null;})()}:{active:false},systems:{active:this.systems.active,objective:systemsObjective(this.systems.run),shields:this.systems.shields,assist:this.systems.assist,relays:this.systems.run.relays.length,droneHp:this.systems.run.droneHp,completed:this.systems.run.completed,aim:this.systems.active?(()=>{const target=this.aimTarget();return target?{name:target.name,...project(target.point)}:null;})():null}});
    this.renderer.render(this.scene,this.camera);
  }
  dispose() {this.events.abort();this.resizeObserver.disconnect();this.renderer.setAnimationLoop(null);this.scene.traverse(object=>{object.geometry?.dispose();if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material]){material.map?.dispose();material.dispose();}});this.renderer.dispose();}
}
