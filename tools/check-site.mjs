import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/site.css','utf8');
const dataSource=fs.readFileSync('assets/travel-data.js','utf8');
const {places}=await import('data:text/javascript;base64,'+Buffer.from(dataSource).toString('base64'));
assert.equal(places.length,14);
assert.equal(new Set(places.map(p=>p.id)).size,14);
assert.equal(new Set(places.map(p=>p.code)).size,8);
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(match[1]),`Missing section ${match[1]}`);
const resources=new Set(['index.html','assets/app.js','assets/globe.js','assets/travel-data.js','assets/images/earth.jpg','assets/images/earth-lights.png','assets/vendor/three.module.min.js']);
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(https?:|mailto:)/.test(match[1]))resources.add(match[1]);
for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))resources.add(path.posix.normalize(path.posix.join('assets',match[1])));
for(const place of places){assert.ok(place.lat>=-90&&place.lat<=90);assert.ok(place.lon>=-180&&place.lon<=180);assert.ok(place.url.startsWith('https://'));assert.ok(place.years.length);if(place.image)resources.add(place.image);}
for(const file of resources){const data=fs.readFileSync(file);assert.ok(data.length,`Empty ${file}`);}
for(const year of [2022,2023,2024,2025,2026])assert.ok(places.some(p=>p.years.includes(year)),`Empty filter ${year}`);
assert.ok(!html.includes('<iframe'));
assert.ok(html.includes('prefers-reduced-motion')||fs.readFileSync('assets/app.js','utf8').includes('prefers-reduced-motion'));
const metadata=JSON.parse(fs.readFileSync('assets/photos/sources.json','utf8'));assert.ok(metadata);
console.log(`PASS: ${places.length} unique places / 8 countries, year filters, anchors and ${resources.size} local resources.`);
if(process.env.CHECK_HTTP){for(const file of resources){const response=await fetch('http://127.0.0.1:4173/'+file);assert.equal(response.status,200,`HTTP ${file}`);}console.log('PASS: all local resources return HTTP 200.');}
