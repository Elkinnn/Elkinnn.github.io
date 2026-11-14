import * as THREE from 'three';
const colors={ink:0x23383e,navy:0x2c4356,paper:0xece5d5,sage:0x83916b,wood:0xb58055,copper:0xbd7c52,metal:0x405747};
export class SceneObjects {
  material(color) {
    if(!this.materials.has(color))this.materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.85,metalness:.03}));
    return this.materials.get(color);
  }
  cube(w,h,d,x,y,z,color,parent=this.scene) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.material(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  cylinder(top,bottom,height,x,y,z,color,parent=this.scene) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,16),this.material(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  texture(kind) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=kind==='interfaces'?'#f3f0e3':'#233b34';ctx.fillRect(0,0,512,320);
    ctx.fillStyle=kind==='interfaces'?'#556c4c':'#d6dfbc';ctx.font='22px sans-serif';ctx.fillText(kind==='interfaces'?'StaySchool':kind==='systems'?'SYSTEMS / 02':'COMPUTER VISION',26,42);
    if(kind==='interfaces') {
      ctx.fillStyle='#dfe5d0';ctx.fillRect(24,68,464,224);ctx.fillStyle='#607752';ctx.font='31px Georgia';ctx.fillText('Student follow-up',44,113);
      ctx.strokeStyle='#819660';ctx.lineWidth=6;ctx.beginPath();[[43,241],[105,212],[171,222],[235,175],[298,187],[356,153],[445,139]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    } else if(kind==='systems') {
      ctx.strokeStyle='#c5d5a0';ctx.lineWidth=4;
      for(const y of [104,151,198]){ctx.beginPath();ctx.ellipse(256,y,85,26,0,0,Math.PI*2);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(171,104);ctx.lineTo(171,198);ctx.moveTo(341,104);ctx.lineTo(341,198);ctx.stroke();
      ctx.font='16px monospace';ctx.fillText('API  →  DATA',183,271);
    } else {
      ctx.strokeStyle='#b9c9a3';ctx.lineWidth=4;ctx.strokeRect(92,81,329,162);
      ctx.fillStyle='#c7bca2';ctx.beginPath();ctx.moveTo(139,188);ctx.lineTo(164,115);ctx.lineTo(340,115);ctx.lineTo(380,188);ctx.closePath();ctx.fill();
      ctx.fillStyle='#254139';ctx.fillRect(173,128,154,45);ctx.fillStyle='#f0e8d0';ctx.fillRect(206,193,105,32);
      ctx.fillStyle='#253d34';ctx.font='18px monospace';ctx.fillText('DEMO 001',213,215);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  monitor(x,z,kind,width=1.12) {
    this.cube(width,.76,.1,x,1.87,z,colors.ink);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(width-.08,.67),new THREE.MeshBasicMaterial({map:this.texture(kind)}));
    screen.position.set(x,1.87,z+.056);this.scene.add(screen);
    this.cube(.09,.28,.09,x,1.38,z,colors.metal);this.cube(.5,.055,.3,x,1.23,z+.03,colors.metal);
  }
  desk(x,z,width,depth=1.4) {
    this.cube(width,.12,depth,x,1.14,z,colors.wood);
    for(const dx of [-width/2+.13,width/2-.13])for(const dz of [-depth/2+.13,depth/2-.13])this.cube(.09,1.08,.09,x+dx,.54,z+dz,0x7b785b);
    this.cube(.76,.035,.29,x,1.222,z+.36,0xd1c9ac);
    for(let row=0;row<3;row++)this.cube(.66,.008,.012,x,1.244,z+.27+row*.07,0x9a9e82);
    this.cylinder(.075,.075,.04,x+.6,1.23,z+.36,0xdcd7c3);
  }
  plant(x,z,height=.75) {
    this.cylinder(.23,.16,.35,x,.18,z,0xba885f);
    this.cylinder(.018,.018,height,x,.4+height/2,z,0x657950);
    for(let i=0;i<6;i++) {
      const leaf=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),this.material(i%2?0x6e8156:0x87936b));
      leaf.scale.set(.58,1.3,.48);leaf.position.set(x+Math.sin(i*2.4)*.16,.5+i*.1,z+Math.cos(i*2.4)*.15);leaf.rotation.z=Math.sin(i*2.4)*.7;leaf.castShadow=true;this.scene.add(leaf);
    }
  }
  chair(x,z) {
    this.cube(.65,.1,.6,x,.53,z,0x6a7c5d);this.cube(.65,.58,.12,x,.82,z+.25,0x728364);
    this.cylinder(.045,.045,.43,x,.25,z,0x415347);
    this.cube(.76,.055,.07,x,.07,z,0x415347);this.cube(.07,.055,.76,x,.07,z,0x415347);
  }
}
