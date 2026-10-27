import fs from 'node:fs';
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const three=data(fs.readFileSync('assets/vendor/three.module.min.js','utf8'));
const profile=data(fs.readFileSync('assets/shoe-profile.js','utf8'));
const model=fs.readFileSync('assets/shoe-model.js','utf8').replace("'./vendor/three.module.min.js'",JSON.stringify(three)).replace("'./shoe-profile.js'",JSON.stringify(profile));
const {buildShoe,disposeShoe}=await import(data(model));
const {sneakers}=await import(data(fs.readFileSync('assets/sneaker-data.js','utf8')));
const {exportShoeGLB}=await import(data(fs.readFileSync('assets/shoe-glb.js','utf8')));
fs.mkdirSync('assets/models',{recursive:true});
for(const id of ['converse-black','gazelle-brown']){const item=sneakers.find(s=>s.id===id),group=buildShoe(item),binary=exportShoeGLB(group);fs.writeFileSync(`assets/models/${id}.glb`,binary);disposeShoe(group);console.log(id,binary.length,'bytes');}
