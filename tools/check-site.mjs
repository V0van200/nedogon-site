import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=file=>fs.readFileSync(file,'utf8');
const moduleFromSource=async file=>import('data:text/javascript;base64,'+Buffer.from(read(file)).toString('base64'));
const {countries,safeContentOverride}=await moduleFromSource('assets/atlas-data.js');
const {findCountry,pointInGeometry,normalizeLongitude}=await moduleFromSource('assets/atlas-math.js');
const {clips,nextClip,randomOtherClip}=await moduleFromSource('assets/moments-data.js');
const {streamClips,twitchEmbedUrl}=await moduleFromSource('assets/stream-player.js');
const {shouldNudge}=await moduleFromSource('assets/polya-guide.js');
const {localImageKey}=await moduleFromSource('assets/media-loading.js');
assert.equal(localImageKey('assets/photos/polina-stream.webp?v=1','https://nedogon-polya.ru/'),'assets/photos/polina-stream.webp');
assert.equal(localImageKey('https://elsewhere.test/photo.webp','https://nedogon-polya.ru/'),null);
assert.ok(shouldNudge([{y:0,time:0,chapter:-1},{y:2600,time:1500,chapter:2}],1000));
assert.ok(!shouldNudge([{y:0,time:0,chapter:0},{y:1000,time:1500,chapter:2}],1000));
assert.ok(!shouldNudge([{y:0,time:0,chapter:0},{y:3000,time:4000,chapter:3}],1000));
assert.ok(!shouldNudge([{y:0,time:0,chapter:0},{y:3000,time:1200,chapter:1}],1000));
assert.ok(!shouldNudge([],1000));
assert.equal(streamClips.length,3);
for(const clip of streamClips){const url=new URL(twitchEmbedUrl(clip.id,'nedogon-polya.ru'));assert.equal(url.hostname,'clips.twitch.tv');assert.equal(url.searchParams.get('clip'),clip.slug);assert.equal(url.searchParams.get('parent'),'nedogon-polya.ru');assert.equal(url.searchParams.get('autoplay'),'false');}
assert.equal(new URL(twitchEmbedUrl('channel','localhost')).searchParams.get('channel'),'nedogonpolya');
assert.throws(()=>twitchEmbedUrl('unknown','nedogon-polya.ru'));assert.throws(()=>twitchEmbedUrl('channel','bad/host'));
assert.equal(clips.length,6);assert.equal(new Set(clips.map(c=>c.id)).size,6);
for(const clip of clips){assert.ok(clip.url.startsWith('https://www.youtube.com/watch?'));assert.ok(/^\d\d:\d\d$/.test(clip.time));assert.ok(fs.readFileSync(clip.image).length);}
assert.equal(nextClip(0,-1),5);assert.equal(nextClip(5,1),0);
for(let i=0;i<clips.length;i++)for(const random of [0,.25,.5,.99,1]){const result=randomOtherClip(i,()=>random);assert.ok(result>=0&&result<clips.length);assert.notEqual(result,i);}
assert.equal(countries.length,8);assert.equal(new Set(countries.map(c=>c.id)).size,8);assert.equal(new Set(countries.map(c=>c.code)).size,8);
for(const country of countries){assert.ok(country.lat>=-90&&country.lat<=90);assert.ok(country.lon>=-180&&country.lon<=180);assert.ok(country.images.length>=2,`${country.name}: photo carousel needs two images`);assert.ok(country.story.length);assert.ok(country.years.every(y=>Number.isInteger(y)&&y>=2022&&y<=2026));assert.ok(country.sources.every(s=>s.url.startsWith('https://')));assert.ok(country.images.every(p=>['personal','scenery','video'].includes(p.role)));}
for(const year of [2022,2023,2024,2025,2026])assert.ok(countries.some(c=>c.years.includes(year)),`Empty filter ${year}`);
const boundaries=JSON.parse(read('assets/countries/boundaries.json'));
assert.equal(boundaries.length,7);assert.ok(!boundaries.some(c=>c.id==='mv'));
for(const [id,lon,lat] of [['in',78,22],['ae',54.5,24],['id',102,0],['th',100,16],['tr',35,39],['ru',37.6,55.7],['vn',105.8,21]])assert.equal(findCountry(lon,lat,boundaries),id,`Country hit test: ${id}`);
assert.equal(findCountry(0,0,boundaries),null);assert.equal(findCountry(78,22,boundaries,new Set(['ae'])),null);
const dateline={type:'Polygon',coordinates:[[[179,-10],[-179,-10],[-179,10],[179,10],[179,-10]]]};
assert.ok(pointInGeometry(180,0,dateline));assert.ok(pointInGeometry(-180,0,dateline));assert.ok(!pointInGeometry(0,0,dateline));assert.equal(normalizeLongitude(181),-179);
const withHole={type:'Polygon',coordinates:[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[3,3],[7,3],[7,7],[3,7],[3,3]]]};assert.ok(pointInGeometry(1,1,withHole));assert.ok(!pointInGeometry(5,5,withHole));
const base=countries[0],invalid=safeContentOverride(base,{lat:99,id:'wrong',images:[{src:'https://unsafe.example/image.webp',alt:'x'}],sources:[{url:'javascript:alert(1)',label:'x'}]});assert.equal(invalid.lat,base.lat);assert.equal(invalid.id,base.id);assert.equal(invalid.images,base.images);assert.equal(invalid.sources,base.sources);
const valid=safeContentOverride(base,{title:'Новая глава',story:['Проверенный текст'],images:[{src:'content/countries/id/photo.webp',alt:'Описание',role:'personal'}]});assert.equal(valid.title,'Новая глава');assert.deepEqual(valid.story,['Проверенный текст']);assert.equal(valid.images[0].role,'personal');
const html=read('index.html'),gallery=read('gallery.html');
const bootSource=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(bootSource);
for(const action of ['timeout','skip','escape']){
 const classes=new Set(),timers=[],handlers={};let ready=0;
 const context={document:{documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}},addEventListener:(name,fn)=>handlers[name]=fn},window:{dispatchEvent:()=>ready++},setTimeout:(fn,ms)=>timers.push({fn,ms}),Event:class{}};
 vm.runInNewContext(bootSource,context);assert.ok(classes.has('boot-loading'));
 if(action==='timeout')timers.find(t=>t.ms===8000).fn();else if(action==='skip')handlers.click({target:{closest:()=>true}});else handlers.keydown({key:'Escape'});
 assert.ok(!classes.has('boot-loading'));assert.equal(ready,1);context.window.finishSiteBoot();assert.equal(ready,1);
}
const previews=JSON.parse(read('assets/image-previews.json'));assert.ok(Object.keys(previews).length>=40);for(const [file,data] of Object.entries(previews)){assert.ok(fs.readFileSync(file).length);assert.ok(data.startsWith('data:image/webp;base64,'));}assert.ok(fs.readFileSync('assets/image-previews.json').length<40000);
assert.ok(!html.includes('ЖИЗНЬ В МОМЕНТЕ'));assert.ok(!html.includes('class="ticker"'));assert.ok(html.includes('id="clip-panel"'));assert.ok(html.includes('data-open-clip="india"'));assert.ok(html.includes('class="portrait-stamp"'));
const contentIndex=html.match(/name="country-content" content="([^"]+)"/)?.[1];
if(contentIndex){const editorial=JSON.parse(read(contentIndex));assert.equal(editorial.countries.length,6);for(const entry of editorial.countries){const country=countries.find(c=>c.id===entry.id);assert.ok(country);const merged=safeContentOverride(country,entry);assert.ok(merged.moments.length===3);assert.ok(merged.story.every(p=>typeof p==='string'));}}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate HTML ids');
for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),`Missing anchor ${match[1]}`);
assert.ok(ids.includes('country-drawer'));assert.ok(ids.includes('drawer-country'));assert.ok(html.includes('aria-roledescription="карусель"'));assert.ok(!html.includes('<iframe'));
const resources=new Set(['index.html','gallery.html','assets/app.js','assets/atlas.js','assets/atlas-data.js','assets/atlas-math.js','assets/atlas-globe.js','assets/images/earth.jpg','assets/images/earth-lights.png','assets/countries/boundaries.json','assets/vendor/three.module.min.js']);
if(contentIndex)resources.add(contentIndex);
resources.add('assets/moments.js');resources.add('assets/moments-data.js');
resources.add('assets/stream-player.js');
resources.add('assets/polya-guide.js');resources.add('assets/img/guide/polya-wait-v1.webp');
resources.add('assets/media-loading.js');resources.add('assets/boot.js');resources.add('assets/image-previews.json');resources.add('story.html');resources.add('assets/story.js');resources.add('assets/story.css');
for(const source of [html,gallery])for(const match of source.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(https?:|mailto:)/.test(match[1]))resources.add(match[1].split(/[?#]/)[0]);
for(const file of ['assets/site.css','assets/atlas.css','assets/gallery.css'])for(const match of read(file).matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))resources.add(path.posix.normalize(path.posix.join('assets',match[1])));
for(const country of countries)for(const image of country.images)resources.add(image.src);
for(const image of JSON.parse(read('assets/countries/credits.json')).images){assert.equal(image.role,'illustrative country scenery, not Polina photo');resources.add(image.file);}
for(const file of resources)assert.ok(fs.readFileSync(file).length,`Missing or empty ${file}`);
assert.ok(read('assets/app.js').includes('prefers-reduced-motion'));assert.ok(fs.readFileSync('assets/img/hero.webp').length<200000);assert.ok(fs.readFileSync('assets/images/portrait-room.webp').length<200000);
console.log(`PASS: 8 country stories, photo carousels, filters, 7 polygon hit tests, dateline/holes, safe content overrides, anchors and ${resources.size} resources.`);
if(process.env.CHECK_HTTP){for(const file of resources){const response=await fetch('http://127.0.0.1:4173/'+file);assert.equal(response.status,200,`HTTP ${file}`);}console.log('PASS: every resource returns HTTP 200.');}
