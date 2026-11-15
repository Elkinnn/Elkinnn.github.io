import * as THREE from 'three';
import {SYSTEMS_DECK,SYSTEMS_GATES,SYSTEMS_COVER,RELAYS,SYSTEMS_CHECKPOINTS} from './systems-layout.js';
import {dronePosition} from './systems-mission.js';
export class SystemsView {
 constructor(world){
  this.world=world;this.targets=[];this.relays=new Map();this.gates=[];this.bolts=[];
  const w=world,deck=SYSTEMS_DECK,cx=(deck.minX+deck.maxX)/2,cz=(deck.minZ+deck.maxZ)/2;
  w.cube(12,.6,16,cx,-.32,cz,0x142b45);w.cube(11.9,.05,15.9,cx,.025,cz,0x0a172b);
  for(const x of [17.18,28.82]){const rail=w.cube(.045,.045,15.7,x,.09,cz,0x66d8df);rail.material=w.luminous(0x66d8df,.6);}
  for(const z of [-12.82,2.82]){const rail=w.cube(11.7,.045,.045,cx,.09,z,0x66d8df);rail.material=w.luminous(0x66d8df,.6);}
  for(let z=-12;z<3;z+=1){w.cube(10.8,.015,.025,23,.065,z,0x233b55);w.cube(.04,.02,.4,23,.07,z,0x45627a);}
  w.sign('SYSTEMS / RELAY BREACH','RESTORE THE GATES. RECONNECT THE TERMINAL.',5.4,23,4.4,-12.85);
  for(const box of SYSTEMS_COVER){const x=(box.minX+box.maxX)/2,z=(box.minZ+box.maxZ)/2,width=box.maxX-box.minX,depth=box.maxZ-box.minZ;
   w.cube(width,box.height,depth,x,box.height/2,z,0x243e57);w.cube(width-.1,.05,depth-.1,x,box.height+.025,z,0x47657a);
   for(const side of [-1,1])w.cube(.07,box.height,.04,x+side*(width/2-.12),box.height/2,z+depth/2+.025,0x83a8b9);
   w.cube(width*.6,.08,.03,x,box.height*.62,z+depth/2+.035,0xf0bb70);
  }
  for(const relay of RELAYS){
   const {x,y,z}=relay.point;w.cube(.65,1.1,.6,x,.55,z,0x2b4861);w.cube(.8,.08,.7,x,1.13,z,0x608195);
   const group=new THREE.Group();group.position.set(x,y,z);w.scene.add(group);
   const frame=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,8,40),w.luminous(0xffc375,.8));group.add(frame);
   const orb=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),w.luminous(0xffc375,.7));group.add(orb);
   group.traverse(o=>o.userData.systemsTarget=relay.id);this.targets.push(group);this.relays.set(relay.id,{group,frame,orb});
   w.sign(relay.name.toUpperCase(),'F / CLICK TO ACTIVATE',1.8,x,2.5,z-.08);
  }
  for(const gate of SYSTEMS_GATES){const z=(gate.minZ+gate.maxZ)/2;
   for(const x of [17,29])w.cube(.18,3.1,.3,x,1.55,z,0x526c82);
   const field=new THREE.Group();w.scene.add(field);
   const plane=new THREE.Mesh(new THREE.PlaneGeometry(11.8,2.8),new THREE.MeshBasicMaterial({color:0xff985e,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));plane.position.set(23,1.5,z);field.add(plane);
   for(let y=.2;y<=3;y+=.4){const bar=w.cube(11.7,.035,.05,23,y,z,0xff9a62,field);bar.material=w.luminous(0xff9a62,.8);}
   const locked=w.sign('BARRIER / '+gate.id.slice(-2),'ACTIVATE '+gate.relay.replace('-',' ').toUpperCase(),1.6,18.4,3.15,z);
   const open=w.sign('PASSAGE OPEN','CHECKPOINT SAVED',1.6,18.4,3.15,z);open.visible=false;this.gates.push({gate,field,locked,open});
  }
  w.cube(2,1.15,.85,26,.6,-12.35,0x243f58);w.cube(2.1,.08,1,26,1.22,-12.35,0x5a7f92);
  const screen=w.cube(1.65,.04,.6,26,1.29,-12.3,0x73ddca);screen.material=w.luminous(0x73ddca,.7);
  w.sign('FINAL / CONNECTION TERMINAL','E TO CONNECT THE SYSTEM',3.5,26,2.65,-12.7);
  for(const p of SYSTEMS_CHECKPOINTS)w.ring(.55,.025,p.x,.08,p.z,0x6ad7c6);
  this.drone=new THREE.Group();w.scene.add(this.drone);
  const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),w.material(0x3a263b));this.drone.add(body);
  this.droneEye=w.cube(.32,.12,.08,0,0,.45,0xff776b,this.drone);this.droneEye.material=w.luminous(0xff776b,1);
  this.droneRing=new THREE.Mesh(new THREE.TorusGeometry(.64,.027,8,48),w.luminous(0xff776b,.6));this.droneRing.rotation.x=Math.PI/2;this.drone.add(this.droneRing);
  for(const side of [-1,1]){w.cube(.3,.08,.1,side*.55,0,0,0x718799,this.drone);w.ring(.27,.035,side*.8,0,0,0xf8b56d,this.drone);}
  this.drone.traverse(o=>o.userData.systemsTarget='drone');this.targets.push(this.drone);
  const warningGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  this.warning=new THREE.Line(warningGeometry,new THREE.LineBasicMaterial({color:0xff8e70,transparent:true,opacity:.6}));this.warning.visible=false;w.scene.add(this.warning);
  const boltGeometry=new THREE.SphereGeometry(.075,8,6);for(let i=0;i<24;i++){const mesh=new THREE.Mesh(boltGeometry,new THREE.MeshBasicMaterial({color:0x85fff0}));mesh.visible=false;w.scene.add(mesh);this.bolts.push(mesh);}
  w.sign('SYSTEMS SECTOR →','ENTER AT THE SYSTEMS MODULE',3.5,15.4,2,-3.8);
  this.blaster=new THREE.Group();w.rightArm.add(this.blaster);
  w.cube(.15,.14,.32,0,-.31,.24,0xabc8d6,this.blaster);const barrel=w.cylinder(.045,.055,.22,0,-.31,.48,0x5cdfd2,this.blaster);barrel.rotation.x=Math.PI/2;barrel.material=w.luminous(0x5cdfd2,.6);
  this.muzzle=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0xa8fff0}));this.muzzle.position.set(0,-.31,.63);this.muzzle.scale.z=2;this.blaster.add(this.muzzle);
 }
 update(mission){
  const {run}=mission,w=this.world;
  this.blaster.visible=mission.active&&!run.completed;this.muzzle.visible=this.blaster.visible&&mission.fireCooldown>.18&&!w.reduced;
  for(const [id,relay] of this.relays){const color=run.relays.includes(id)?0x72edc9:0xffc375;relay.orb.material=w.luminous(color,.9);relay.frame.material=w.luminous(color,.6);}
  for(const item of this.gates){const open=run.relays.includes(item.gate.relay);item.field.visible=!open;item.locked.visible=!open;item.open.visible=open;}
  this.drone.visible=mission.active&&run.droneHp>0;const p=dronePosition(mission.clock);this.drone.position.set(p.x,p.y,p.z);this.droneRing.rotation.z=w.reduced?0:mission.clock*.7;
  this.droneEye.material=w.luminous(mission.charge>0?0xffc070:run.completed?0x72edc9:0xff776b,1);
  this.warning.visible=mission.active&&mission.charge>0&&run.droneHp>0&&!run.completed;
  if(this.warning.visible){const positions=this.warning.geometry.attributes.position;positions.setXYZ(0,p.x,p.y,p.z);positions.setXYZ(1,mission.lock.x,mission.lock.y,mission.lock.z);positions.needsUpdate=true;this.warning.geometry.computeBoundingSphere();}
  for(let i=0;i<this.bolts.length;i++){const mesh=this.bolts[i],bolt=mission.bolts[i];mesh.visible=!!bolt;if(bolt){mesh.position.set(bolt.position.x,bolt.position.y,bolt.position.z);mesh.material.color.set(bolt.owner==='enemy'?0xff8d68:0x85fff0);mesh.scale.setScalar(bolt.owner==='enemy'?1.8:1);}}
 }
}
