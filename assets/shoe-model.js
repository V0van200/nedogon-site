import * as THREE from './vendor/three.module.min.js';
import {shoeProfile,upperGeometryData} from './shoe-profile.js';

function material(color,roughness=.85){return new THREE.MeshStandardMaterial({color,roughness,side:THREE.DoubleSide});}
function mesh(geometry,mat,name){const m=new THREE.Mesh(geometry,mat);m.name=name;m.castShadow=m.receiveShadow=true;return m;}
function tube(points,radius,mat,name,closed=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);return mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*5),radius,6,closed),mat,name);}
function shell(y,height,mat,name,scale=1){
 const points=[];for(let i=0;i<120;i++){const angle=i/120*Math.PI*2,z=1.44*Math.cos(angle),p=shoeProfile(Math.max(-1.45,Math.min(1.43,z)));points.push(new THREE.Vector2(p.width*Math.sign(Math.sin(angle))*scale,z*scale));}
 const shape=new THREE.Shape(points),geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.022,bevelThickness:.018,curveSegments:1});geometry.rotateX(Math.PI/2);geometry.translate(0,y+height,0);return mesh(geometry,mat,name);
}
function clothTexture(item){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.fillStyle=item.upper;c.fillRect(0,0,512,512);
 let seed=91;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(item.pattern==='cow'||item.pattern==='leopard')for(let i=0;i<95;i++){
  const x=rnd()*512,y=rnd()*512,r=10+rnd()*25;c.save();c.translate(x,y);c.rotate(rnd()*6.28);c.beginPath();for(let j=0;j<12;j++){const a=j/12*Math.PI*2,d=r*(.6+rnd()*.5),px=Math.cos(a)*d,py=Math.sin(a)*d*.7;j?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fillStyle=item.pattern==='cow'?'#19191b':'#241d1b';c.fill();if(item.pattern==='leopard'){c.scale(.55,.5);c.fillStyle='#9f633c';c.fill();}c.restore();
 }
 if(item.pattern==='ripple'){c.strokeStyle='#ffffff55';c.lineWidth=2;for(let y=0;y<512;y+=8){c.beginPath();for(let x=0;x<=512;x+=6){const py=y+Math.sin(x*.065+y)*3;x?c.lineTo(x,py):c.moveTo(x,py);}c.stroke();}}
 for(let i=0;i<18000;i++){c.fillStyle=rnd()>.5?'#ffffff12':'#00000010';c.fillRect(rnd()*512,rnd()*512,1,1);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
export function buildShoe(item){
 const group=new THREE.Group();group.name=item.name;
 const rubber=material(item.sole,.7),upper=material(item.upper,.95),lining=material(item.lining),laces=material(item.laces),dark=material('#303031');upper.map=clothTexture(item);if(upper.map)upper.color.set('#ffffff');
 const {positions,uv,indices,base}=upperGeometryData(item.shape),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();group.add(mesh(geometry,upper,'Верх · ткань и форма'));
 group.add(shell(0,.055,material(item.shape==='converse'?'#b3ae9a':'#40352b'),'Подошва · протектор'),shell(.055,base-.055,rubber,'Подошва · боковина'));
 const insole=mesh(new THREE.SphereGeometry(1,32,12),lining,'Стелька · условная форма');insole.scale.set(.29,.045,.48);insole.position.set(0,base+.08,-.9);group.add(insole);
 const collar=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2;collar.push([.285*Math.cos(a),base+.48+.07*Math.sin(a),-.87+.34*Math.sin(a)]);}group.add(tube(collar,.045,lining,'Воротник и подкладка',true));
 const tongue=mesh(new THREE.BoxGeometry(.38,.07,.92,2,1,8),upper,'Язычок');tongue.position.set(0,base+.45,-.12);tongue.rotation.x=.25;group.add(tongue);
 for(let i=0;i<6;i++){
  const z=-.42+i*.165,y=base+shoeProfile(z).height+.025;
  for(const sign of [-1,1]){const eye=mesh(new THREE.TorusGeometry(.037,.009,6,12),item.shape==='converse'?dark:upper,'Люверсы');eye.rotation.x=Math.PI/2;eye.position.set(sign*.225,y,z);group.add(eye);}
  const next=z+.13,ny=base+shoeProfile(next).height+.045;
  group.add(tube([[-.225,y,z],[0,(y+ny)/2+.055,z+.07],[.225,ny,next]],.022,laces,'Шнурки'),tube([[.225,y+.015,z],[0,(y+ny)/2+.073,z+.07],[-.225,ny+.015,next]],.022,laces,'Шнурки'));
 }
 group.add(tube([[0,base+.7,-.51],[-.21,base+.79,-.68],[-.29,base+.72,-.45],[0,base+.7,-.51],[.23,base+.78,-.68],[.3,base+.71,-.43],[0,base+.7,-.51]],.018,laces,'Бант шнурков'));
 for(const sign of [-1,1]){
  const seam=[];for(let i=0;i<35;i++){const z=-1.3+2.53*i/34;seam.push([sign*(shoeProfile(z).width+.004),base+.08,z]);}group.add(tube(seam,.006,material(item.shape==='converse'?'#d5d1c3':item.upper),'Шов боковины'));
  if(item.shape==='terrace')for(let stripe=0;stripe<3;stripe++){
   const z=-.32+stripe*.25,coords=[];for(const [zz,y] of [[z,base+.08],[z+.11,base+.08],[z-.07,base+.39],[z-.18,base+.39]])coords.push(sign*(shoeProfile(zz).width+.012),y,zz);
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();group.add(mesh(g,material(item.stripe||'#eee9d9'),'Боковые полосы'));
  }
 }
 if(item.shape==='converse'){
  const cap=geometry.clone(),index=[];for(let i=0;i<indices.length;i+=3){if(positions[indices[i]*3+2]>.76)index.push(indices[i],indices[i+1],indices[i+2]);}cap.setIndex(index);cap.translate(0,.014,.004);group.add(mesh(cap,rubber,'Резиновый носок'));
 }
 // Visible geometric tread. Its pattern is approximate where the source has no bottom view.
 const tread=new THREE.BoxGeometry(.045,.018,.15);for(let z=-1.2;z<1.2;z+=.16)for(let x=-.32;x<=.32;x+=.16){if(Math.abs(x)<shoeProfile(z).width*.8){const m=mesh(tread,dark,'Протектор · реконструкция');m.position.set(x,-.022,z);m.rotation.y=.6;group.add(m);}}
 group.userData.productId=item.id;return group;
}

export function disposeShoe(group){const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)for(const mat of Array.isArray(node.material)?node.material:[node.material]){materials.add(mat);if(mat.map)textures.add(mat.map);}});geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());}
