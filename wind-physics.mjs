export function newWindState(){return{cartZ:12,cartV:0,sail:-Math.PI/2,aboard:false,arrived:false,installed:[false,false],placed:[null,null],angle:0,mode:'prediction',predictionSamples:[false,false],samples:[false,false,false,false],dwell:0,lastSector:-1,gateOpen:false,won:false,playerPrediction:null};}
export function stepWind(s,dt,observing=true){
 if(s.aboard&&!s.arrived){const drive=Math.max(0,Math.cos(s.sail));s.cartV=Math.max(0,Math.min(2.4,s.cartV+(drive*2.8-.5-s.cartV*.5)*dt));s.cartZ=Math.max(0,s.cartZ-s.cartV*dt);if(s.cartZ===0){s.arrived=true;s.aboard=false;s.cartV=0;}}
 if(s.installed.every(Boolean)){const a=((s.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2),sector=Math.round(a/(Math.PI/2))%4,error=Math.abs(Math.atan2(Math.sin(a-sector*Math.PI/2),Math.cos(a-sector*Math.PI/2)));if(error<.08){if(s.lastSector!==sector){s.lastSector=sector;s.dwell=0;}if(observing)s.dwell+=dt;else s.dwell=Math.max(0,s.dwell-dt);if(s.dwell>3.2){if(s.mode==='prediction'){s.predictionSamples[sector%2]=true;if(s.predictionSamples.every(Boolean)){s.mode='experiment';s.dwell=0;s.lastSector=-1;}}else{s.samples[sector]=true;if((s.samples[0]||s.samples[2])&&(s.samples[1]||s.samples[3])){s.mode='complete';s.gateOpen=true;}}}}else{s.dwell=0;s.lastSector=-1;}}

}
// An ideal equal-arm interferometer has no orientation-dependent fringe shift here.
export function screenIntensity(offset){return .5+.5*Math.cos(offset);}
export const cartHeight=z=>.35+(12-z)/12*4;
export function clearAt(x,z,y,obstacles){if(!Number.isFinite(x)||!Number.isFinite(z))return false;const floor=y>2?x>-16.5&&x<16.5&&z>-27&&z<1.4:x>-16.5&&x<16.5&&z>6.2&&z<20;if(!floor)return false;return !obstacles.some(o=>y<o.y+o.h&&y+1.8>o.y&&Math.abs(x-o.x)<o.w/2+.48&&Math.abs(z-o.z)<o.d/2+.48);}
function segment(a,b,y,obs){const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.15);for(let i=1;i<=n;i++)if(!clearAt(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,y,obs))return false;return true;}
export function route(start,end,y,obs){if(!clearAt(end.x,end.z,y,obs))return[];if(segment(start,end,y,obs))return[end];const step=.6,key=(x,z)=>x+','+z,first={x:Math.round(start.x/step),z:Math.round(start.z/step),p:null},queue=[first],seen=new Set([key(first.x,first.z)]);if(!segment(start,{x:first.x*step,z:first.z*step},y,obs))return[];let found;for(let i=0;i<queue.length&&i<5500;i++){const a=queue[i],p={x:a.x*step,z:a.z*step};if(Math.hypot(p.x-end.x,p.z-end.z)<.9&&segment(p,end,y,obs)){found=a;break;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const b={x:a.x+dx,z:a.z+dz,p:a},k=key(b.x,b.z);if(seen.has(k)||!segment(p,{x:b.x*step,z:b.z*step},y,obs))continue;seen.add(k);queue.push(b);}}if(!found)return[];const path=[end];for(let a=found;a;a=a.p)path.unshift({x:a.x*step,z:a.z*step});return path;}
export function moveWithCollision(c,dx,dz,y,obs){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let i=0;i<n;i++){if(clearAt(c.x+dx/n,c.z,y,obs))c.x+=dx/n;if(clearAt(c.x,c.z+dz/n,y,obs))c.z+=dz/n;}}
export function approachItem(start,item,y,obs){for(let i=0;i<16;i++){const a=i*Math.PI/8,p={x:item.x+Math.sin(a)*1.6,z:item.z+Math.cos(a)*1.6},path=route(start,p,y,obs);if(path.length)return path;}return[];}
export const clampZoom=v=>Math.max(.55,Math.min(4,v));export function stickAxis(x,z){const n=Math.max(42,Math.hypot(x,z));return{x:x/n,z:z/n};}

// Exaggerated teaching model, not a numerical reconstruction of 1887 apparatus.
export function opticalComparison(angle){const delay=.45*Math.cos(2*angle);return {prediction:{times:[2+delay,2-delay],phase:2.5*Math.cos(2*angle)},experiment:{times:[2,2],phase:0}};}
// The model shown in the "prediction" phase follows the player's own pick:
// 'move' fringes shift with orientation, 'still' never moves, 'reverse'
// shifts the opposite way. The experiment model never depends on the pick.
export function playerModel(prediction,angle){const phase=2.5*Math.cos(2*angle),delay=.45*Math.cos(2*angle);if(prediction==='still')return{times:[2,2],phase:0};if(prediction==='reverse')return{times:[2-delay,2+delay],phase:-phase};return{times:[2+delay,2-delay],phase};}
