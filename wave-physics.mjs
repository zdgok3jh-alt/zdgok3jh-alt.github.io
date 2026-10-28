// Qualitative radio direction finding and geometric optics, in metres in the XZ plane.
export const SOURCE={x:7,z:6},MOUNTS=[{x:7,z:-2},{x:17,z:-2}],RECEIVERS=[{x:17,z:-8},{x:22,z:-2}];
export const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function newWaveState(){return{antenna:-Math.PI/2,signal:0,lock:0,signalLocked:false,boat:'waiting',boatX:2.5,aboard:false,installed:[false,false],placed:[null,null],angles:[0,Math.PI/2],splitter:false,lockerOpen:false,receivers:[false,false],charge:0,bridgeOpen:false,won:false};}
function cross(a,b){return a.x*b.z-a.z*b.x;}
function segmentHit(p,d,m,angle){const tangent={x:Math.cos(angle),z:Math.sin(angle)},a={x:m.x-tangent.x*1.25,z:m.z-tangent.z*1.25},v={x:tangent.x*2.5,z:tangent.z*2.5},delta={x:a.x-p.x,z:a.z-p.z},den=cross(d,v);if(Math.abs(den)<1e-7)return null;const t=cross(delta,v)/den,u=cross(delta,d)/den;return t>.025&&u>=0&&u<=1?t:null;}
export function traceLight(s){const paths=[],power=[0,0],queue=[{p:{...SOURCE},d:{x:0,z:-1},power:1,depth:0}];while(queue.length){const q=queue.shift();if(q.depth>6||q.power<.05)continue;let distance=38,kind=null,index=-1;
 for(let i=0;i<2;i++){if(!s.installed[i])continue;const t=segmentHit(q.p,q.d,MOUNTS[i],s.angles[i]);if(t!==null&&t<distance){distance=t;kind='mirror';index=i;}}
 for(let i=0;i<2;i++){const v={x:RECEIVERS[i].x-q.p.x,z:RECEIVERS[i].z-q.p.z},t=v.x*q.d.x+v.z*q.d.z,perp=Math.abs(cross(v,q.d));if(t>.025&&perp<.65&&t<distance){distance=t;kind='receiver';index=i;}}
 const end={x:q.p.x+q.d.x*distance,z:q.p.z+q.d.z*distance};paths.push({from:q.p,to:end,power:q.power});
 if(kind==='receiver'){power[index]+=q.power;continue;}if(kind!=='mirror')continue;
 const a=s.angles[index],n={x:-Math.sin(a),z:Math.cos(a)},dot=q.d.x*n.x+q.d.z*n.z,reflected={x:q.d.x-2*dot*n.x,z:q.d.z-2*dot*n.z};
 const next=(d,power)=>queue.push({p:{x:end.x+d.x*.035,z:end.z+d.z*.035},d,power,depth:q.depth+1});
 if(index===1&&s.splitter){next(q.d,q.power*.5);next(reflected,q.power*.5);}else next(reflected,q.power*.95);
 }return{paths,power,hits:power.map(p=>p>.2)};}
export function stepWaves(s,dt){s.signal=Math.exp(-Math.pow(wrap(s.antenna-Math.PI/3)/.3,2));if(!s.signalLocked){s.lock=s.signal>.92?s.lock+dt:Math.max(0,s.lock-dt);if(s.lock>=1){s.signalLocked=true;s.boat='arriving';}}
 if(s.boat==='arriving'){s.boatX=Math.max(-3.8,s.boatX-dt*2);if(s.boatX<=-3.8)s.boat='ready';}if(s.boat==='crossing'){s.boatX=Math.min(2.5,s.boatX+dt*1.4);if(s.boatX>=2.5){s.boat='arrived';s.aboard=false;}}
 const light=traceLight(s);s.receivers=light.hits;if(light.hits[0])s.lockerOpen=true;
 s.charge=light.hits.every(Boolean)?Math.min(1,s.charge+dt*.4):Math.max(0,s.charge-dt*.5);if(s.charge>=1)s.bridgeOpen=true;return light;}
export function boardBoat(s){if(s.boat!=='ready')return false;s.aboard=true;s.boat='crossing';return true;}
