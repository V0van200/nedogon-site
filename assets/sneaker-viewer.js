import * as THREE from './vendor/three.module.min.js';
import {sneakers} from './sneaker-data.js';
import {buildShoe,disposeShoe} from './shoe-model.js';
import {exportShoeGLB} from './shoe-glb.js';

const $=s=>document.querySelector(s),host=$('#sneaker-canvas'),studio=$('.s-studio'),catalog=$('#sneaker-products');
let current=0,mode='product',renderModel=()=>{},exportTarget=null;
catalog.innerHTML=sneakers.map((item,i)=>`<button type="button" class="s-product" data-product="${i}" aria-pressed="${i===0}"><img src="${item.photo}" alt="${item.name}" width="180" height="180" loading="lazy"><strong>${item.name}</strong></button>`).join('');
function select(index){current=index;const item=sneakers[current];$('#s-name').textContent=item.name;$('#s-description').textContent=item.detail;$('#s-color').textContent=item.color;$('.s-photo img').src=item.photo;$('.s-photo img').alt=item.name;$('.s-fallback').src=item.photo;catalog.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));$('.s-export-status').textContent='';renderModel();history.replaceState(null,'','#'+item.id);}
catalog.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.product))));
function setMode(next){mode=next;document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));renderModel();}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
$('.s-try').addEventListener('click',()=>{setMode('tryon');if(innerWidth<650)host.scrollIntoView({behavior:'smooth',block:'center'});});
const dialog=$('.s-lightbox');$('.s-photo').addEventListener('click',()=>{dialog.querySelector('img').src=sneakers[current].photo;dialog.querySelector('img').alt=sneakers[current].name;dialog.showModal();});dialog.querySelector('button').addEventListener('click',()=>dialog.close());
$('.s-export').addEventListener('click',()=>{
 if(!exportTarget){$('.s-export-status').textContent='Модель ещё не готова.';return;}
 try{const bytes=exportShoeGLB(exportTarget),blob=new Blob([bytes],{type:'model/gltf-binary'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=sneakers[current].id+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);$('.s-export-status').textContent='GLB подготовлен для скачивания.';}catch{ $('.s-export-status').textContent='Не удалось экспортировать. Файлы базовых моделей доступны внизу страницы.'; }
});

try{
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x1d1c1b,1);renderer.shadowMap.enabled=innerWidth>800;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.05,80),root=new THREE.Group();scene.add(root);scene.add(new THREE.HemisphereLight(0xfff4e5,0x555264,2.4));
 const key=new THREE.DirectionalLight(0xffefda,3.2);key.position.set(3,6,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=key.shadow.camera.bottom=-4;key.shadow.camera.right=key.shadow.camera.top=4;scene.add(key);const fill=new THREE.DirectionalLight(0xc9d6ff,1.8);fill.position.set(-4,3,-3);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.MeshStandardMaterial({color:0x252321,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.09;floor.receiveShadow=true;scene.add(floor);
 let angle=.85,phi=1.15,distance=5.5,targetY=.55,dirty=true,inView=true,drag=null,pinch=0,moved=false;const touches=new Map();
 function reset(){angle=.85;phi=1.15;distance=mode==='tryon'?8.2:5.5;targetY=mode==='tryon'?1.65:.55;dirty=true;}
 function zoom(factor){distance=Math.max(mode==='tryon'?4:2.7,Math.min(13,distance*factor));dirty=true;}
 function size(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();dirty=true;}new ResizeObserver(size).observe(host);size();
 renderModel=()=>{
  exportTarget=null;disposeShoe(root);root.clear();const item=sneakers[current],shoe=buildShoe(item);exportTarget=shoe;
  if(mode==='tryon'){
   shoe.position.x=-.7;shoe.rotation.y=-.06;root.add(shoe);const right=shoe.clone(true);right.position.x=.7;right.scale.x=-1;right.rotation.y=.06;root.add(right);
   const clay=new THREE.MeshStandardMaterial({color:0x9d9995,roughness:.9});for(const x of [-.7,.7]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.21,.14,2.7,24),clay);leg.position.set(x,2,-.88);leg.name='Нейтральный манекен · голень';leg.castShadow=true;root.add(leg);const ankle=new THREE.Mesh(new THREE.SphereGeometry(.17,20,12),clay);ankle.scale.y=1.2;ankle.position.set(x,.78,-.88);ankle.name='Нейтральный манекен · щиколотка';root.add(ankle);}
  }else root.add(shoe);
  reset();$('.s-part').textContent=mode==='tryon'?'Пара на нейтральном манекене · вращай, чтобы рассмотреть':'Нажми на шнурки, верх или подошву';dirty=true;
 };
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function pick(event){const r=host.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);scene.updateMatrixWorld();camera.updateMatrixWorld();raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(root,true)[0];if(!hit)return;$('.s-part').textContent='Деталь: '+hit.object.name;$('.s-info').classList.remove('is-selected');requestAnimationFrame(()=>$('.s-info').classList.add('is-selected'));if(innerWidth<650)$('.s-info').scrollIntoView({behavior:'smooth',block:'start'});}
 renderer.domElement.addEventListener('pointerdown',event=>{if(event.button!==0)return;renderer.domElement.setPointerCapture(event.pointerId);touches.set(event.pointerId,{x:event.clientX,y:event.clientY});drag={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};moved=false;if(touches.size===2){const [a,b]=[...touches.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);moved=true;}});
 renderer.domElement.addEventListener('pointermove',event=>{if(!touches.has(event.pointerId))return;touches.set(event.pointerId,{x:event.clientX,y:event.clientY});if(touches.size===2){const [a,b]=[...touches.values()],next=Math.hypot(a.x-b.x,a.y-b.y);if(next&&pinch)zoom(pinch/next);pinch=next;moved=true;return;}if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5)moved=true;angle-=dx*.008;phi=Math.max(.13,Math.min(Math.PI-.13,phi-dy*.007));drag.x=event.clientX;drag.y=event.clientY;dirty=true;});
 renderer.domElement.addEventListener('pointerup',event=>{const wasPinch=pinch>0;touches.delete(event.pointerId);if(!moved&&!wasPinch)pick(event);drag=null;pinch=0;});renderer.domElement.addEventListener('pointercancel',event=>{touches.delete(event.pointerId);drag=null;pinch=0;moved=true;});
 renderer.domElement.addEventListener('wheel',event=>{event.preventDefault();zoom(Math.exp(Math.max(-150,Math.min(150,event.deltaY))*.0018));},{passive:false});
 host.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key))return;event.preventDefault();if(event.key==='ArrowLeft')angle-=.13;if(event.key==='ArrowRight')angle+=.13;if(event.key==='ArrowUp')phi=Math.max(.13,phi-.1);if(event.key==='ArrowDown')phi=Math.min(Math.PI-.13,phi+.1);if(['+','='].includes(event.key))zoom(.9);if(event.key==='-')zoom(1.1);dirty=true;});
 $('.s-reset').addEventListener('click',reset);document.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>zoom(b.dataset.zoom==='in'?.85:1.17)));
 new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;dirty=true;},{rootMargin:'100px'}).observe(host);
 function animate(){requestAnimationFrame(animate);if(!dirty||!inView||document.hidden)return;dirty=false;camera.position.set(Math.sin(angle)*Math.sin(phi)*distance,targetY+Math.cos(phi)*distance,Math.cos(angle)*Math.sin(phi)*distance);camera.lookAt(0,targetY,0);renderer.render(scene,camera);}requestAnimationFrame(animate);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();studio.classList.remove('ready');$('.s-loading').hidden=false;$('.s-loading').textContent='3D временно недоступно. Фото и файлы моделей остаются доступны.';});
 renderModel();studio.classList.add('ready');$('.s-loading').hidden=true;
}catch(error){$('.s-loading').textContent='3D не запустилось на этом устройстве. Можно открыть фото и скачать модель ниже.';document.querySelectorAll('[data-mode],.s-try').forEach(button=>button.disabled=true);console.info('Sneaker 3D fallback:',error.message);}
const initial=sneakers.findIndex(item=>item.id===location.hash.slice(1));select(initial>=0?initial:0);
