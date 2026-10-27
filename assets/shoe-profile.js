const stations=[[-1.45,.035,.21],[-1.3,.31,.59],[-1.05,.39,.65],[-.65,.43,.59],[-.15,.47,.46],[.4,.49,.32],[.95,.42,.24],[1.25,.29,.18],[1.43,.025,.04]];
export function shoeProfile(z){
 if(z<=stations[0][0])return {width:stations[0][1],height:stations[0][2]};
 if(z>=stations.at(-1)[0])return {width:stations.at(-1)[1],height:stations.at(-1)[2]};
 const i=Math.max(0,stations.findIndex(p=>p[0]>=z)-1),a=stations[i],b=stations[Math.min(i+1,stations.length-1)];
 const t=Math.max(0,Math.min(1,(z-a[0])/(b[0]-a[0]))),s=t*t*(3-2*t);
 return {width:a[1]+(b[1]-a[1])*s,height:a[2]+(b[2]-a[2])*s};
}
export function upperGeometryData(shape='converse'){
 const positions=[],uv=[],indices=[],rings=65,segments=32,base=shape==='converse'?.29:.18;
 for(let i=0;i<rings;i++){
  const z=-1.45+2.88*i/(rings-1),p=shoeProfile(z);
  for(let j=0;j<=segments;j++){const a=Math.PI*j/segments;positions.push(p.width*Math.cos(a),base+p.height*Math.pow(Math.sin(a),.78),z);uv.push(j/segments,i/(rings-1));}
 }
 for(let i=0;i<rings-1;i++)for(let j=0;j<segments;j++){
  const z=-1.45+2.88*(i+.5)/(rings-1),a=Math.PI*(j+.5)/segments;
  if(z> -1.25&&z< -.48&&a>.72&&a<2.42)continue; // Real open collar, not a painted-on hole.
  const p=i*(segments+1)+j,q=p+segments+1;indices.push(p,p+1,q,p+1,q+1,q);
 }
 return {positions,uv,indices,base};
}
