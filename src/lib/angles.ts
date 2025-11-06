export type Pt={x:number;y:number;score?:number}
function vec(a:Pt,b:Pt){return{x:b.x-a.x,y:b.y-a.y}}
function dot(u:{x:number;y:number},v:{x:number;y:number}){return u.x*v.x+u.y*v.y}
function mag(u:{x:number;y:number}){return Math.hypot(u.x,u.y)}
export function angle(a:Pt,b:Pt,c:Pt){const u=vec(b,a),v=vec(b,c);const m=mag(u)*mag(v);if(!m)return 0;const cos=Math.min(1,Math.max(-1,(u.x*v.x+u.y*v.y)/m));return Math.acos(cos)*180/Math.PI}
export function rollingVariance(vals:number[],w=30){const out=[];for(let i=0;i<vals.length;i++){const s=Math.max(0,i-w+1);const sl=vals.slice(s,i+1);const m=sl.reduce((a,b)=>a+b,0)/sl.length;out.push(sl.reduce((a,b)=>a+(b-m)*(b-m),0)/sl.length)}return out}
export function normalize(x:number,min:number,max:number){if(max<=min)return 0;return Math.max(0,Math.min(1,(x-min)/(max-min)))}