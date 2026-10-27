export const toRadians=degrees=>degrees*Math.PI/180;
export const toDegrees=radians=>radians*180/Math.PI;
export function normalizeLongitude(lon){return((lon+180)%360+360)%360-180;}
export function pointInRing(lon,lat,ring){
 const crossesDateline=Math.max(...ring.map(p=>p[0]))-Math.min(...ring.map(p=>p[0]))>180;
 const x=crossesDateline&&lon<0?lon+360:lon;
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const xi=crossesDateline&&ring[i][0]<0?ring[i][0]+360:ring[i][0],yi=ring[i][1];
  const xj=crossesDateline&&ring[j][0]<0?ring[j][0]+360:ring[j][0],yj=ring[j][1];
  if((yi>lat)!==(yj>lat)&&x<(xj-xi)*(lat-yi)/(yj-yi)+xi)inside=!inside;
 }
 return inside;
}
export function pointInGeometry(lon,lat,geometry){
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
 return polygons.some(rings=>pointInRing(lon,lat,rings[0])&&!rings.slice(1).some(hole=>pointInRing(lon,lat,hole)));
}
export function findCountry(lon,lat,boundaries,allowed){return boundaries.find(c=>(!allowed||allowed.has(c.id))&&pointInGeometry(lon,lat,c.geometry))?.id||null;}
