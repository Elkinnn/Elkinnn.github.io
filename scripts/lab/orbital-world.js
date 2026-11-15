import {t} from '/scripts/lab/localization.js';
import * as THREE from 'three';
import {SceneObjects} from './objects.js';
import {DECKS,BRIDGES,STATIONS,CARGO} from './gameplay.js';
const P={hull:0x172c47,edge:0x365573,white:0xd9e8ee,dark:0x081322,cyan:0x80d9ef,gold:0xffbf70,blue:0xb5a8ff};
export class OrbitalWorld extends SceneObjects {
  luminous(color,intensity=1.3) {const key='glow:'+color+':'+intensity;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color:0x102139,emissive:color,emissiveIntensity:intensity,roughness:.35,metalness:.2}));return this.materials.get(key);}
  ring(radius,tube,x,y,z,color,parent=this.scene) {
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,72),this.luminous(color));mesh.position.set(x,y,z);mesh.rotation.x=Math.PI/2;parent.add(mesh);return mesh;
  }
  link(a,b,color,width=.025) {
    const direction=new THREE.Vector3().subVectors(b,a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(width,width,direction.length(),8),this.luminous(color));
    mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());this.scene.add(mesh);return mesh;
  }
  halo(x,y,z,color,size=3) {
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'#ffffff');g.addColorStop(.16,'#ffffff88');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),color,transparent:true,opacity:.25,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.position.set(x,y,z);sprite.scale.set(size,size,size);this.scene.add(sprite);return sprite;
  }
  buildWorld() {
    this.scene.background=new THREE.Color(0x050c20);this.coreRings=[];this.beacons={};this.cargoMeshes=new Map();this.cargoHalos=new Map();
    let seed=1457;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const positions=[],colors=[];
    for(let i=0;i<1800;i++){const a=random()*Math.PI*2,y=random()*1.8-.55,r=75+random()*75,s=Math.sqrt(1-y*y/3);positions.push(Math.cos(a)*r*s,y*r,Math.sin(a)*r*s);const c=new THREE.Color().setHSL(.54+random()*.16,.2,.55+random()*.4);colors.push(c.r,c.g,c.b);}
    const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));stars.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    this.scene.add(new THREE.Points(stars,new THREE.PointsMaterial({size:.13,vertexColors:true,transparent:true,opacity:.85,fog:false})));
    this.planet();
    for(let i=0;i<3;i++){const orbital=this.ring(48+i*7,.018,0,-12-i*5,-42,0x27496e);orbital.rotation.x=.13+i*.12;orbital.rotation.z=.2;}
    for(const [index,deck] of DECKS.entries()) {
      const base=this.cylinder(deck.r,deck.r*.88,.65,deck.x,-.34,deck.z,P.hull);base.receiveShadow=true;
      this.cylinder(deck.r-.15,deck.r-.15,.07,deck.x,.015,deck.z,P.dark);
      this.ring(deck.r-.18,.045,deck.x,.075,deck.z,index===1?P.gold:P.cyan);
      this.ring(deck.r-.4,.014,deck.x,.08,deck.z,0x3c6586);
      for(let n=0;n<12;n++){const a=n*Math.PI/6,r=deck.r-.65;const block=this.cube(.08,.025,.3,deck.x+Math.sin(a)*r,.08,deck.z+Math.cos(a)*r,P.edge);block.rotation.y=a;}
      this.cylinder(deck.r*.68,deck.r*.3,1,deck.x,-1.12,deck.z,0x0b1a30);
      for(const side of [-1,1])this.cube(.25,.9,.25,deck.x+side*(deck.r-.65),-.5,deck.z,P.edge);
    }
    for(const bridge of BRIDGES) {
      const dx=bridge.b.x-bridge.a.x,dz=bridge.b.z-bridge.a.z,length=Math.hypot(dx,dz),x=(bridge.a.x+bridge.b.x)/2,z=(bridge.a.z+bridge.b.z)/2,angle=Math.atan2(dx,dz);
      const body=this.cube(bridge.width,.48,length,x,-.22,z,P.hull);body.rotation.y=angle;
      const floor=this.cube(bridge.width-.2,.04,length,x,.045,z,0x213b55);floor.rotation.y=angle;
      for(const side of [-1,1]) {const edge=this.cube(.045,.035,length,x+Math.cos(angle)*side*(bridge.width/2-.16),.09,z-Math.sin(angle)*side*(bridge.width/2-.16),P.cyan);edge.material=this.luminous(P.cyan);edge.rotation.y=angle;}
      for(let i=0;i<Math.floor(length/.8);i++){const t=(i+.5)*.8/length,strip=this.cube(.8,.015,.035,bridge.a.x+dx*t,.075,bridge.a.z+dz*t,0x64829b);strip.rotation.y=angle;}
    }
    this.core();
    for(const station of STATIONS)this.module(station);
    for(const cargo of CARGO) {
      const group=new THREE.Group();group.position.set(cargo.point.x,1.35,cargo.point.z);this.scene.add(group);
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.3),this.luminous(P.gold,1.8));group.add(crystal);
      const ring=this.ring(.5,.025,0,0,0,P.gold,group);ring.rotation.x=.65;
      this.cargoMeshes.set(cargo.id,group);this.ring(.55,.02,cargo.point.x,.08,cargo.point.z,P.gold);
      this.cargoHalos.set(cargo.id,this.halo(cargo.point.x,1.35,cargo.point.z,P.gold,1.8));
    }
    this.ring(1,.035,-2,.08,10,P.gold);
    for(const [x,z] of [[-14,-12],[14,-15]]) {
      this.cylinder(.08,.12,7,x,2,z,P.edge);
      for(const side of [-1,1]){const panel=this.cube(3.1,.1,4.2,x+side*2,3,z,P.dark);panel.rotation.z=side*.25;for(let i=0;i<5;i++)this.cube(2.9,.018,.035,x+side*2,3.07,z-1.7+i*.8,0x527eac);}
    }
    this.link(new THREE.Vector3(-15,-1,-20),new THREE.Vector3(16,-1,-20),0x1a3d60,.02);
  }
  planet() {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
    for(let y=0;y<512;y++){const v=Math.sin(y*.08)*.08+Math.sin(y*.031)*.12;ctx.fillStyle=`hsl(${23+Math.sin(y*.025)*8} 38% ${48+v*80}%)`;ctx.fillRect(0,y,1024,1);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const planet=new THREE.Mesh(new THREE.SphereGeometry(14,64,40),new THREE.MeshStandardMaterial({map:texture,roughness:1,color:0xc9b8b0}));planet.position.set(-29,15,-100);planet.rotation.z=.18;this.scene.add(planet);
    const ring=new THREE.Mesh(new THREE.RingGeometry(18,23,128),new THREE.MeshBasicMaterial({color:0x9c8ba2,side:THREE.DoubleSide,transparent:true,opacity:.35}));ring.position.copy(planet.position);ring.rotation.x=1.12;ring.rotation.y=.1;this.scene.add(ring);
    const moon=new THREE.Mesh(new THREE.SphereGeometry(3.1,24,20),this.material(0x8698b5));moon.position.set(30,16,-75);this.scene.add(moon);
  }
  sign(title,subtitle,width,x,y,z) {
    const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
    const texture=this.textTexture(c,()=>{const light=document.documentElement.dataset.theme==='light';ctx.fillStyle=light?'#f7f8fc':'#141c32';ctx.fillRect(0,0,1024,256);ctx.fillStyle=light?'#4e49d8':'#b5a8ff';ctx.fillRect(0,0,8,256);ctx.font='600 65px Space';ctx.fillStyle=light?'#18223c':'#eff2fc';ctx.fillText(t(title),45,110,934);ctx.font='400 31px Inter';ctx.fillStyle=light?'#55627d':'#a9b5cf';ctx.fillText(t(subtitle),48,180,928)});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide,transparent:true,depthWrite:false}));mesh.position.set(x,y,z);mesh.userData.signWidth=width;(this.signs??=[]).push(mesh);this.scene.add(mesh);return mesh;
  }
  core() {
    this.cylinder(1.1,1.35,.4,0,.2,0,P.edge);this.cylinder(.7,.85,1.5,0,1.1,0,P.hull);
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.8),this.luminous(P.cyan,1.5));crystal.position.set(0,2.5,0);this.scene.add(crystal);this.coreCrystal=crystal;
    for(let i=0;i<3;i++){const ring=this.ring(1.1+i*.15,.035,0,2.5,0,i===1?P.gold:P.cyan);ring.rotation.x=.4+i*.9;ring.rotation.z=i*.7;this.coreRings.push(ring);}
    this.ring(1.7,.04,0,.09,0,P.cyan);this.halo(0,2.4,0,P.cyan,4);
    this.sign('NEXUS / 00','RESTORE THE NETWORK',2.8,0,4.3,0);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.3,24,24,1,true),new THREE.MeshBasicMaterial({color:P.cyan,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));beam.position.set(0,14,0);beam.visible=false;this.scene.add(beam);this.launchBeam=beam;
    this.networkLinks=STATIONS.map(s=>this.link(new THREE.Vector3(0,.1,0),new THREE.Vector3(s.point.x,.1,s.point.z),0x285875,.02));
  }
  module(station) {
    const {x,z}=station.point,centerZ=z-1.75,index=Number(station.number),color=index===1?P.cyan:index===2?P.gold:P.blue;
    this.cube(2,1.1,1.1,x,.58,centerZ,P.hull);this.cube(2.1,.08,1.2,x,1.17,centerZ,P.edge);
    const screen=this.cube(1.7,.055,.7,x,1.23,centerZ+.05,color);screen.material=this.luminous(color,.4);screen.rotation.x=.18;
    this.sign(station.number+' / '+station.name.toUpperCase(),index===1?'STAYSCHOOL / ALERT SEQUENCE':index===2?'HOSPITAL / CONNECT THE SYSTEM':'TRAFFIC MONITOR / SIGNAL LOCK',3.6,x,3,centerZ-.35);
    const light=this.cube(.08,1.4,.08,x-1.1,1.1,centerZ,P.edge);light.material=this.luminous(color,.7);this.beacons[station.id]=light;
    this.ring(.8,.03,x,.09,z,color);
    if(index===1) {
      for(let i=0;i<3;i++){const card=this.cube(.85,.65,.08,x-1+i*.9,2+i*.12,centerZ-.3,0x355578);card.rotation.y=(i-1)*-.25;this.cube(.6,.05,.02,x-1+i*.9,2.1+i*.12,centerZ-.24,P.cyan);}
    } else if(index===2) {
      for(let i=0;i<4;i++){this.cube(.65,.32,.7,x+1.7,.4+i*.4,centerZ,P.dark);const led=this.cube(.07,.07,.02,x+1.85,.4+i*.4,centerZ+.36,P.gold);led.material=this.luminous(P.gold);}
      this.ring(1.25,.022,x,2.1,centerZ,P.gold).rotation.x=.3;
    } else {
      const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),new THREE.MeshStandardMaterial({color:P.blue,wireframe:true,emissive:P.blue,emissiveIntensity:.4}));orb.position.set(x,2.1,centerZ);this.scene.add(orb);this.aiOrb=orb;
      const sweep=this.ring(1.1,.025,x,2.1,centerZ,P.blue);sweep.rotation.x=.4;this.aiSweep=sweep;
    }
  }
  buildCharacter() {
    this.avatar=new THREE.Group();this.scene.add(this.avatar);this.body=new THREE.Group();this.avatar.add(this.body);
    const shell=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),this.material(P.white));shell.scale.set(1,.85,.8);shell.position.y=1.27;shell.castShadow=true;this.body.add(shell);
    this.cube(.49,.22,.06,0,1.3,.25,P.dark,this.body);
    for(const x of [-.115,.115]){const eye=this.cube(.11,.045,.03,x,1.31,.287,P.cyan,this.body);eye.material=this.luminous(P.cyan);}
    this.cylinder(.23,.29,.42,0,.78,0,P.hull,this.body);this.cube(.14,.12,.025,0,.83,.255,P.gold,this.body);
    this.cylinder(.025,.025,.22,.15,1.64,0,P.edge,this.body);const tip=this.cylinder(.045,.045,.05,.15,1.77,0,P.cyan,this.body);tip.material=this.luminous(P.cyan);
    for(const side of [-1,1]) {
      const arm=new THREE.Group();arm.position.set(side*.35,.98,0);this.body.add(arm);this.cube(.12,.28,.19,0,-.1,0,P.white,arm);this.cube(.11,.08,.2,0,-.3,0,P.cyan,arm);
      const leg=new THREE.Group();leg.position.set(side*.16,.6,0);this.body.add(leg);this.cylinder(.1,.13,.25,0,-.2,0,P.white,leg);this.cylinder(.055,.08,.1,0,-.38,0,P.cyan,leg);
      if(side<0){this.leftArm=arm;this.leftLeg=leg;}else{this.rightArm=arm;this.rightLeg=leg;}
    }
    this.ring(.42,.02,0,.47,0,P.cyan,this.body);
    this.cube(.35,.28,.14,0,.8,-.24,P.white,this.body);
    const shadow=new THREE.Mesh(new THREE.RingGeometry(.23,.32,40),new THREE.MeshBasicMaterial({color:P.cyan,transparent:true,opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.09;this.avatar.add(shadow);this.avatar.rotation.y=Math.PI;
  }
  setProgress(state) {
    this.progress=state;
    for(const [id,mesh] of this.cargoMeshes){mesh.visible=!state.cells.includes(id);this.cargoHalos.get(id).visible=mesh.visible;}
    for(const [id,light] of Object.entries(this.beacons))light.material=this.luminous(state.missions.includes(id)?P.cyan:0x5e7188,state.missions.includes(id)?1.5:.15);
    this.launchBeam.visible=state.launched;
    for(let i=0;i<this.networkLinks.length;i++)this.networkLinks[i].material=this.luminous(state.missions.includes(STATIONS[i].id)?P.cyan:0x285875,state.missions.includes(STATIONS[i].id)?1:.05);
  }
  animateWorld(time) {
    const t=this.reduced?0:time;
    this.coreCrystal.rotation.y=t*.35;this.coreCrystal.position.y=2.5+Math.sin(t)*.08;
    this.coreRings.forEach((ring,i)=>{ring.rotation.y=t*(.2+i*.1);ring.rotation.z=i*.7+t*.12;});
    for(const mesh of this.cargoMeshes.values()){mesh.rotation.y=t;mesh.position.y=1.35+Math.sin(t*2+mesh.position.x)*.12;}
    if(this.aiOrb)this.aiOrb.rotation.y=t*.3;if(this.aiSweep)this.aiSweep.rotation.z=t*.5;
    this.body.position.y+=.13+Math.sin(t*3)*.035;
  }
}
