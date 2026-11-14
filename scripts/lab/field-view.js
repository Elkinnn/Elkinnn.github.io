import * as THREE from 'three';
import {FIELD_CONFIG,SAMPLES,samplePosition,pulseActive} from './field-layout.js';
export class FieldView {
 constructor(world,kind){this.world=world;this.kind=kind;this.config=FIELD_CONFIG[kind];this.gates=[];this.pulses=[];this.samples=new Map();const w=world,c=this.config,d=c.deck,x=(d.minX+d.maxX)/2,z=(d.minZ+d.maxZ)/2,width=d.maxX-d.minX,depth=d.maxZ-d.minZ;
  w.cube(width,.6,depth,x,-.32,z,0x142b43);w.cube(width-.1,.05,depth-.1,x,.025,z,kind==='interfaces'?0x102c35:0x191d3c);
  for(const side of [-1,1]){const edge=w.cube(.045,.04,depth-.3,x+side*(width/2-.2),.08,z,c.accent);edge.material=w.luminous(c.accent,.6);}
  for(let i=d.minZ+1;i<d.maxZ;i+=1.4)w.cube(width-.6,.012,.025,x,.065,i,0x35506b);
  for(const box of c.cover){const px=(box.minX+box.maxX)/2,pz=(box.minZ+box.maxZ)/2,bw=box.maxX-box.minX,bd=box.maxZ-box.minZ;
   w.cube(bw,box.height,bd,px,box.height/2,pz,0x294259);w.cube(bw-.1,.06,bd-.1,px,box.height+.025,pz,0x55708a);for(let k=0;k<3;k++)w.cube(bw*.65,.055,.03,px,.3+k*.28,pz+bd/2+.02,c.accent);
  }
  for(const gate of c.gates){const gz=(gate.minZ+gate.maxZ)/2,group=new THREE.Group();w.scene.add(group);for(let y=.3;y<2.8;y+=.45){const line=w.cube(width-.15,.025,.045,x,y,gz,c.accent,group);line.material=w.luminous(c.accent,.65);}for(const px of [d.minX+.1,d.maxX-.1])w.cube(.13,2.9,.2,px,1.45,gz,0x6b889b);this.gates.push(group);}
  for(const pulse of c.pulses){const pz=(pulse.minZ+pulse.maxZ)/2;const floor=new THREE.Mesh(new THREE.PlaneGeometry(width-.3,.65),new THREE.MeshBasicMaterial({color:0xffc075,transparent:true,opacity:.22,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.set(x,.08,pz);w.scene.add(floor);const beam=w.cube(width-.2,.035,.03,x,.5,pz,0xffc075);beam.material=w.luminous(0xffc075,.8);this.pulses.push({floor,beam,pulse});w.sign('PULSE CROSSING','JUMP / Q / WAIT FOR THE GAP',2.1,d.maxX-1.4,1.8,pz);}
  if(kind==='interfaces')this.buildCourier();else this.buildScanner();
  this.packet=new THREE.Group();w.body.add(this.packet);const payload=new THREE.Mesh(new THREE.OctahedronGeometry(.18),w.luminous(0xffc880,.8));payload.position.set(-.45,1.2,.08);this.packet.add(payload);this.packet.visible=false;
 }
 console(action,title,subtitle,width=2.3){const w=this.world,z=action.point.z-1.2,x=action.point.x;w.cube(1.6,1.1,.8,x,.55,z,0x284458);w.cube(1.8,.065,.9,x,1.14,z,0x587b8a);const panel=w.cube(1.4,.04,.55,x,1.2,z,this.config.accent);panel.material=w.luminous(this.config.accent,.5);w.sign(title,subtitle,width,x,2.4,z-.1);w.ring(.7,.02,action.point.x,.08,action.point.z,this.config.accent);}
 buildCourier(){const w=this.world,c=this.config;
  w.sign('INTERFACES / ALERT COURIER','OBSERVE. EVALUATE. NOTIFY.',5,-24,4.2,-9.2);
  this.payload=new THREE.Group();this.payload.position.set(-26,1.35,4);w.scene.add(this.payload);const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.3),w.luminous(0xffc880,1));this.payload.add(orb);const ring=new THREE.Mesh(new THREE.TorusGeometry(.47,.025,8,48),w.luminous(c.accent,.7));this.payload.add(ring);w.sign('01 / OBSERVE','E TO COLLECT THE DEMO OBSERVATION',2.7,-26,2.6,3.8);w.ring(.7,.02,-26,.08,4,c.accent);
  this.reviewPads=[];for(const action of c.actions.filter(a=>['archive','evaluate','routine'].includes(a.id))){const disc=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.06,40),w.material(0x284759));disc.position.set(action.point.x,.09,action.point.z);w.scene.add(disc);this.reviewPads.push({disc,id:action.id});w.ring(1,.025,action.point.x,.14,action.point.z,c.accent);w.sign(action.name.toUpperCase(),'E / SELECT A REVIEW ROUTE',2.4,action.point.x,1.9,action.point.z-1);}
  this.console(c.actions.find(a=>a.id==='notify'),'03 / GUARDIAN UPLINK','E TO TRANSMIT / STAY CLOSE',3);
  this.links=[w.link(new THREE.Vector3(-26,.12,4),new THREE.Vector3(-24,.12,-.6),0x365568,.02),w.link(new THREE.Vector3(-24,.12,-.6),new THREE.Vector3(-27,.12,-7.2),0x365568,.02)];
  for(let i=0;i<3;i++){const card=w.cube(1.5,1,.05,-30.5,1.5+i*.4,6-i*3,0x41677c);card.rotation.y=.35;}
 }
 buildScanner(){const w=this.world,c=this.config;this.console(c.actions[0],'01 / CALIBRATION','E TO INITIALIZE THE SCANNER',3.2);this.console(c.actions[1],'FINAL / ANALYSIS UPLINK','E TO SYNCHRONIZE THE CAPTURES',3.5);
  w.sign('APPLIED AI / SIGNAL HUNT','CALIBRATE. TRACK. SYNCHRONIZE.',5.5,4,5,-44);
  for(const sample of SAMPLES){const group=new THREE.Group();w.scene.add(group);const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.38,1),new THREE.MeshStandardMaterial({color:0x151d3a,emissive:c.accent,emissiveIntensity:.5,wireframe:true}));group.add(mesh);const core=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),w.luminous(0xffc783,.9));group.add(core);const ring=new THREE.Mesh(new THREE.TorusGeometry(.52,.025,8,48),w.luminous(c.accent,.7));group.add(ring);group.traverse(o=>o.userData.fieldSample=sample.id);this.samples.set(sample.id,{group,core,ring});
   const arch=w.ring(1.85,.035,sample.x,2,sample.z,c.accent);arch.rotation.x=0;w.sign(sample.name.toUpperCase(),'HOLD F / HOLD SCAN TO ACQUIRE',3,sample.x,4,sample.z);w.ring(.7,.02,sample.approach.x,.09,sample.approach.z,c.accent);
  }
  const dish=new THREE.Mesh(new THREE.SphereGeometry(2.5,24,12,0,Math.PI*2,0,Math.PI*.5),new THREE.MeshStandardMaterial({color:0x7d8fb0,wireframe:true,side:THREE.DoubleSide}));dish.position.set(4,3.5,-44.7);dish.rotation.x=Math.PI/2;w.scene.add(dish);w.cylinder(.15,.28,3.5,4,1.7,-44.7,0x4b617e);
  const lineGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);this.scanBeam=new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({color:0xb7a6ff,transparent:true,opacity:.8}));this.scanBeam.visible=false;w.scene.add(this.scanBeam);
  this.scanner=new THREE.Group();w.rightArm.add(this.scanner);w.cube(.17,.14,.28,0,-.3,.24,0xb7c5df,this.scanner);const lens=w.cylinder(.08,.08,.07,0,-.3,.43,c.accent,this.scanner);lens.rotation.x=Math.PI/2;lens.material=w.luminous(c.accent,.7);this.scanner.visible=false;
 }
 update(model,position){const w=this.world,r=model.run;
  for(let i=0;i<this.gates.length;i++)this.gates[i].visible=this.kind==='interfaces'?r.stage<=i:!r.calibrated;
  for(const item of this.pulses){const on=pulseActive(item.pulse,model.clock);item.beam.visible=on;item.floor.material.opacity=on?.22:.035;}
  this.packet.visible=this.kind==='interfaces'&&model.active&&r.stage>0&&!r.completed;
  if(this.kind==='interfaces'){this.payload.visible=r.stage===0;this.payload.rotation.y=w.reduced?0:model.clock*.6;for(const pad of this.reviewPads)pad.disc.material=w.material(r.stage>=2&&pad.id==='evaluate'?0x286a59:0x284759);this.links.forEach((link,i)=>link.material=w.luminous(r.stage>i?0x74e6b8:0x365568,r.stage>i?.6:.03));}
  else{this.scanner.visible=model.active;for(const sample of SAMPLES){const view=this.samples.get(sample.id),p=samplePosition(sample,model.clock,model.assist);view.group.position.set(p.x,p.y,p.z);view.core.material=w.luminous(r.captures.includes(sample.id)?0x74e6b8:0xffc783,.8);view.ring.rotation.z=w.reduced?0:model.clock*.6;view.ring.scale.setScalar(model.scanId===sample.id?1+model.scan*.3:1);}
   this.scanBeam.visible=model.active&&model.scan>0&&!!model.scanId;if(this.scanBeam.visible){const sample=SAMPLES.find(s=>s.id===model.scanId),p=samplePosition(sample,model.clock,model.assist),a=this.scanBeam.geometry.attributes.position;a.setXYZ(0,position.x,1.25+(position.height||0),position.z);a.setXYZ(1,p.x,p.y,p.z);a.needsUpdate=true;this.scanBeam.geometry.computeBoundingSphere();}
  }
 }
}
