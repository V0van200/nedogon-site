import fs from 'node:fs';
import assert from 'node:assert/strict';
const moduleFromFile=async file=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'));
const {shoeProfile,upperGeometryData}=await moduleFromFile('assets/shoe-profile.js');
const {sneakers}=await moduleFromFile('assets/sneaker-data.js');
assert.equal(sneakers.length,7);assert.equal(new Set(sneakers.map(s=>s.id)).size,7);
for(const item of sneakers){assert.ok(fs.readFileSync(item.photo).length);assert.ok(['converse','terrace'].includes(item.shape));}
for(const z of [-5,-1.45,-1,0,1,1.43,5]){const p=shoeProfile(z);assert.ok(p.width>0&&p.height>0);assert.ok(Number.isFinite(p.width+p.height));}
for(const shape of ['converse','terrace']){const g=upperGeometryData(shape);assert.ok(g.positions.every(Number.isFinite));assert.equal(g.positions.length/3,g.uv.length/2);assert.ok(g.indices.every(i=>i>=0&&i<g.positions.length/3));assert.ok(g.indices.length%3===0);assert.ok(g.indices.length>9000);}
for(const id of ['converse-black','gazelle-brown']){
 const b=fs.readFileSync('assets/models/'+id+'.glb');assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);const jsonLength=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+jsonLength).toString('utf8'));assert.equal(json.asset.version,'2.0');assert.ok(json.meshes.length>40);const offset=20+jsonLength;assert.equal(b.readUInt32LE(offset+4),0x004e4942);assert.equal(b.readUInt32LE(offset),json.buffers[0].byteLength);
 for(const view of json.bufferViews){assert.equal(view.byteOffset%4,0);assert.ok(view.byteOffset+view.byteLength<=json.buffers[0].byteLength);}
 for(const mesh of json.meshes)for(const p of mesh.primitives){const positions=json.accessors[p.attributes.POSITION];assert.ok(positions.min.every(Number.isFinite)&&positions.max.every(Number.isFinite));assert.ok(positions.count>0);const normals=json.accessors[p.attributes.NORMAL];assert.equal(normals.count,positions.count);}
}
console.log('PASS: 7 referenced products, loft geometry and bounds, two valid GLB containers and mesh accessors. GPU/browser visual fit is not covered.');
