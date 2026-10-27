export const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
export function wheelImpulse(delta,mode=0,height=800) {
  const pixels=delta*(mode===1?16:mode===2?height:1);
  return clamp(pixels*.006,-1.4,1.4);
}
export function flightPoint(a,b,t,radius=1.08) {
  t=clamp(t,0,1);
  const dot=clamp(a.reduce((sum,v,i)=>sum+v*b[i],0),-1,1),angle=Math.acos(dot);
  const sine=Math.sin(angle);
  const vector=a.map((v,i)=>Math.abs(sine)<.00001?v*(1-t)+b[i]*t:(v*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/sine);
  const length=Math.hypot(...vector)||1,altitude=.025+.23*Math.sin(Math.PI*t);
  return vector.map(v=>v/length*(radius+altitude));
}
