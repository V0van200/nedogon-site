import {wardrobeItems,cycleWardrobe} from './wardrobe-data.js';

const $=selector=>document.querySelector(selector),rail=$('#wardrobe-rail'),stage=$('#wardrobe-stage'),dialog=$('.w-lightbox');
let current=0,view='look',request=0;
try{if(localStorage.getItem('nedogon-motion')==='off')document.documentElement.classList.add('w-motion-off');}catch{}
const reduced=()=>document.documentElement.classList.contains('w-motion-off')||matchMedia('(prefers-reduced-motion: reduce)').matches;
rail.innerHTML=wardrobeItems.map((item,i)=>`<button class="w-piece" data-item="${i}" type="button" aria-pressed="${i===0}" aria-label="Выбрать: ${item.name}" draggable="true"><span class="w-piece-frame"><img src="${item.image}" alt="${item.name}" width="240" height="300" loading="lazy" draggable="false"></span><small>${item.number} / ${item.category}</small><strong>${item.name}</strong></button>`).join('');

async function showStage(){
 const item=wardrobeItems[current],source=view==='look'&&item.look?item.look:item.image,id=++request;
 const loading=$('.w-load');stage.setAttribute('aria-busy','true');loading.hidden=false;loading.textContent=view==='look'?'Секунду, переодеваюсь…':'Загружаю деталь…';
 const next=new Image();next.decoding='async';next.alt=view==='look'?`Образ Поли: ${item.name}`:`Фото магазина: ${item.name}`;
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('timeout')),15000);next.onload=()=>{clearTimeout(timer);resolve();};next.onerror=()=>{clearTimeout(timer);reject(Error('image'));};next.src=source;});
  if(next.decode)await next.decode();if(id!==request)return;
  const previous=stage.querySelector('img:last-of-type');stage.dataset.view=view;next.className='w-next-frame'+(view==='product'?' w-product-frame':'');stage.insertBefore(next,loading);
  requestAnimationFrame(()=>requestAnimationFrame(()=>next.classList.add('visible')));
  setTimeout(()=>{if(previous.isConnected)previous.remove();next.classList.remove('w-next-frame','visible');},reduced()?0:650);
  loading.hidden=true;
 }catch{if(id===request){loading.textContent='Фото задерживается. Нажми «Примерить» ещё раз.';}}
 finally{if(id===request)stage.setAttribute('aria-busy','false');}
}
function select(index){
 current=index;const item=wardrobeItems[current];if(view==='look'&&!item.look)view='product';
 rail.querySelectorAll('[data-item]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));
 $('#wardrobe-item-name').textContent=item.name;$('#wardrobe-item-brand').textContent=item.detail;$('#wardrobe-item-description').textContent=item.description;$('#wardrobe-tone').textContent=item.tone;
 $('#wardrobe-item-image').src=item.image;$('#wardrobe-item-image').alt=`Фото магазина: ${item.name}`;$('#wardrobe-source').href=item.source;
 $('.w-look-number').textContent=`ОБРАЗ ${item.number} / ${String(wardrobeItems.length).padStart(2,'0')}`;$('#wardrobe-stage-caption').textContent=item.name;
 $('.w-try').disabled=!item.look;$('#wardrobe-try-note').textContent=item.id==='fleece'?'Этот образ показан со спины — как на фото магазина.':'Выбирай вид «На Поле» или рассмотри вещь отдельно.';
 syncView();showStage();$('.w-announcement').textContent=`Выбрано: ${item.name}`;history.replaceState(null,'','#'+item.id);
}
function syncView(){document.querySelectorAll('[data-view]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.view===view));button.disabled=button.dataset.view==='look'&&!wardrobeItems[current].look;});}
rail.querySelectorAll('[data-item]').forEach(button=>{
 button.addEventListener('click',()=>select(Number(button.dataset.item)));
 button.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain',button.dataset.item);event.dataTransfer.effectAllowed='copy';});
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){button.addEventListener('pointermove',event=>{if(reduced())return;const box=button.getBoundingClientRect();button.style.setProperty('--item-y',((event.clientX-box.left)/box.width-.5)*22+'deg');button.style.setProperty('--item-x',-((event.clientY-box.top)/box.height-.5)*13+'deg');});button.addEventListener('pointerleave',()=>{button.style.setProperty('--item-y','0deg');button.style.setProperty('--item-x','0deg');});}
});
stage.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';});stage.addEventListener('drop',event=>{event.preventDefault();const raw=event.dataTransfer.getData('text/plain');if(!/^\d+$/.test(raw))return;const index=Number(raw);if(index>=wardrobeItems.length)return;view='look';select(index);});
$('.w-prev').addEventListener('click',()=>select(cycleWardrobe(current,-1)));$('.w-next').addEventListener('click',()=>select(cycleWardrobe(current,1)));
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;syncView();showStage();}));$('.w-try').addEventListener('click',()=>{view='look';syncView();showStage();if(innerWidth<650)stage.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'center'});});
$('.w-original').addEventListener('click',()=>{const item=wardrobeItems[current];dialog.querySelector('h2').textContent=item.name;dialog.querySelector('img').src=item.image;dialog.querySelector('img').alt=item.name;dialog.querySelector('a').href=item.source;dialog.showModal();});$('.w-lightbox-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
const initial=wardrobeItems.findIndex(item=>item.id===location.hash.slice(1));if(initial>0)select(initial);else{syncView();$('#wardrobe-try-note').textContent='Выбирай вид «На Поле» или рассмотри вещь отдельно.';}
