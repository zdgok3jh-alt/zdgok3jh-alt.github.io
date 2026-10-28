export const LEVEL={floor:{x:0,z:0,w:18,d:18,top:0},ledge:{x:0,z:-5.6,w:7,d:4,top:2.9},goal:{x:0,z:-5.7,r:1.1},boxStart:{x:5.8,z:3.1}};
const R=.48,CARRY_DISTANCE=1.8,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function newWorld(mission=false){return{mission,doorOpen:false,ladderRaised:false,ballHeld:false,ballRequested:false,ball:{x:-5,z:4,y:6,vx:0,vy:0,vz:0},cat:{x:0,z:6,y:0,vy:0,heading:Math.PI,grounded:true},box:{x:LEVEL.boxStart.x,z:LEVEL.boxStart.z,y:0,w:1.5,d:1.5,h:1.45,vx:0,vz:0,vy:0},grabbed:false,grabRequested:false,target:null,history:[],won:false,climbed:false,boxPlaced:false,steps:0,blocked:false};}
export function snapshot(s){return{mission:s.mission,doorOpen:s.doorOpen,ladderRaised:s.ladderRaised,ballHeld:s.ballHeld,ballRequested:s.ballRequested,ball:{...s.ball},cat:{...s.cat},box:{...s.box},grabbed:s.grabbed,grabRequested:s.grabRequested,target:s.target?{...s.target}:null,won:s.won,climbed:s.climbed,boxPlaced:s.boxPlaced};}
export function restore(s,p){Object.assign(s,{...p,cat:{...p.cat},box:{...p.box},ball:{...p.ball},target:p.target?{...p.target}:null});}
export function rewind(s){if(!s.history.length)return false;restore(s,s.history[0]);s.history=[];s.target=null;return true;}
export function toggleGrab(s){if(s.grabbed||s.grabRequested){s.grabbed=false;s.grabRequested=false;s.target=null;return'dropped';}s.grabRequested=true;s.target={x:s.box.x,z:s.box.z};return'approaching';}
export function setTarget(s,x,z){if(!Number.isFinite(x)||!Number.isFinite(z))throw new Error('Invalid destination');s.target={x:clamp(x,-(s.bounds??8.5),s.bounds??8.5),z:clamp(z,-(s.bounds??8.5),s.bounds??8.5)};}
function overlap(x,z,o,pad=0){return Math.abs(x-o.x)<o.w/2+pad&&Math.abs(z-o.z)<o.d/2+pad;}
function obstacles(s){return[{...LEVEL.ledge,y:0,h:LEVEL.ledge.top},s.box,...(s.extraSupports||[]),...(s.mission&&!s.doorOpen?[{x:0,z:-3.4,w:7,d:.25,y:0,h:4}]:[])];}
function moveCat(s,dx,dz,dt){let c=s.cat,obs=obstacles(s);s.blocked=false;for(let axis of ['x','z']){let amount=axis==='x'?dx:dz;if(!amount)continue;let nx=c.x+(axis==='x'?amount:0),nz=c.z+(axis==='z'?amount:0);const floor=s.groundHeight?.(nx,nz)??0,oldFloor=s.groundHeight?.(c.x,c.z)??0;const onSlope=c.grounded&&Math.abs(c.y-oldFloor)<.12;if(onSlope&&floor-oldFloor>.25){s.blocked=true;continue;}if(s.water&&(s.water.contains?s.water.contains(nx,nz):nx>s.water.x0&&nx<s.water.x1&&nz>s.water.z0&&nz<s.water.z1)&&!s.aboard&&!s.water.island?.(nx,nz)){s.blocked=true;continue;}let hit=obs.find(o=>overlap(nx,nz,o,R)&&c.y<o.y+o.h-.08&&c.y+1.85>o.y);if(hit){const rise=hit.y+hit.h-c.y;if(c.grounded&&rise>0&&rise<=1.56&&!s.grabbed){c.vy=7.1;c.grounded=false;}s.blocked=true;continue;}c.x=clamp(nx,-(s.bounds??8.5),s.bounds??8.5);c.z=clamp(nz,-(s.bounds??8.5),s.bounds??8.5);if(onSlope)c.y+=floor-oldFloor;}}
export function jump(s){if(s.cat.grounded&&!s.grabbed){s.cat.vy=7.1;s.cat.grounded=false;return true;}return false;}
function separateCatFromBox(s){
const c=s.cat,b=s.box;
if(!overlap(c.x,c.z,b,R)||c.y>=b.y+b.h-.08||c.y+1.85<=b.y)return;
// Repair overlap after dropping, turning near a wall, or restoring an old snapshot.
const gap=.005,xGap=b.w/2+R+gap,zGap=b.d/2+R+gap;
const candidates=[{x:b.x-xGap,z:c.z},{x:b.x+xGap,z:c.z},{x:c.x,z:b.z-zGap},{x:c.x,z:b.z+zGap}];
const l={...LEVEL.ledge,y:0,h:LEVEL.ledge.top};
const valid=candidates.filter(p=>Math.abs(p.x)<=(s.bounds??8.5)&&Math.abs(p.z)<=(s.bounds??8.5)&&!(overlap(p.x,p.z,l,R)&&c.y<l.h-.08));
valid.sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z));
if(valid.length){c.x=valid[0].x;c.z=valid[0].z;s.blocked=true;}
}
function updateBox(s,dt){let b=s.box,c=s.cat;if(s.grabbed){
const tx=clamp(c.x+Math.sin(c.heading)*CARRY_DISTANCE,-(s.bounds??8.5)+.35,(s.bounds??8.5)-.35),tz=clamp(c.z+Math.cos(c.heading)*CARRY_DISTANCE,-(s.bounds??8.5)+.35,(s.bounds??8.5)-.35),ty=c.y+.18,l=LEVEL.ledge;
const hitsLedge=Math.abs(tx-l.x)<(l.w+b.w)/2&&Math.abs(tz-l.z)<(l.d+b.d)/2&&ty<l.top;
const hitsCat=Math.abs(tx-c.x)<b.w/2+R&&Math.abs(tz-c.z)<b.d/2+R;
// Place the held box at a safe fixed distance; lagging behind the cat caused clipping.
if(!hitsLedge&&!hitsCat){b.x=tx;b.z=tz;}else s.blocked=true;
b.y=Math.max(ty,(s.groundHeight?.(b.x,b.z)??0)+.04);b.vx=0;b.vz=0;b.vy=0;
}else{b.vy-=14*dt;b.y+=b.vy*dt;const ground=s.groundHeight?.(b.x,b.z)??0;if(b.y<ground){b.y=ground;b.vy=0;}}
separateCatFromBox(s);s.boxPlaced=b.z< -2&&Math.abs(b.x)<3.8&&!s.grabbed;}
export function takeBall(s){if(!s.mission||s.ballHeld)return;s.ballRequested=true;s.target={x:s.ball.x,z:s.ball.z};}
export function throwBall(s,x=-5,z=-1){if(!s.ballHeld)return false;const b=s.ball,t=.85;s.ballHeld=false;s.ballRequested=false;b.vx=(x-b.x)/t;b.vz=(z-b.z)/t;b.vy=(1.25-b.y+7*t*t)/t;return true;}
function updateBall(s,dt){if(!s.mission)return;const b=s.ball,c=s.cat;if(s.ballRequested&&Math.hypot(c.x-b.x,c.z-b.z)<1.3&&b.y<2){s.ballHeld=true;s.ballRequested=false;s.grabbed=false;s.grabRequested=false;s.target=null;}
if(s.ballHeld){b.x=c.x+Math.sin(c.heading)*.8;b.z=c.z+Math.cos(c.heading)*.8;b.y=c.y+1.25;b.vx=0;b.vz=0;b.vy=0;return;}
b.vy-=14*dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;if(b.y<.22){b.y=.22;b.vy=Math.abs(b.vy)*.48;if(b.vy<.4)b.vy=0;b.vx*=.95;b.vz*=.95;}if(Math.abs(b.x)>8.5){b.x=Math.sign(b.x)*8.5;b.vx*=-.6;}if(Math.abs(b.z)>8.5){b.z=Math.sign(b.z)*8.5;b.vz*=-.6;}
if(Math.hypot(b.x-(s.switchX??-5),b.z-(s.switchZ??-1),b.y-1.25)<.65)s.doorOpen=true;
}
export function stepWorld(s,input={},dt=1/60){if(input.rewind){rewind(s);return;}if(s.won)return;separateCatFromBox(s);s.history.push(snapshot(s));if(s.history.length>180)s.history.shift();s.steps++;let c=s.cat,b=s.box;updateBall(s,dt);if(s.grabRequested){let d=Math.hypot(c.x-b.x,c.z-b.z);if(d<1.55){s.grabbed=true;s.grabRequested=false;s.target=null;c.heading=Math.atan2(b.x-c.x,b.z-c.z);}}
let mx=input.x||0,mz=input.z||0;if(Math.hypot(mx,mz)>.05)s.target=null;else if(s.target){let dx=s.target.x-c.x,dz=s.target.z-c.z,d=Math.hypot(dx,dz);if(d<.22)s.target=null;else{mx=dx/d;mz=dz/d;}}
let len=Math.hypot(mx,mz);if(len>1){mx/=len;mz/=len;}if(len>.04){c.heading=Math.atan2(mx,mz);moveCat(s,mx*dt*(s.grabbed?2.5:3.8),mz*dt*(s.grabbed?2.5:3.8),dt);}if(input.jump)jump(s);let prev=c.y;c.vy-=14*dt;c.y+=c.vy*dt;let top=s.groundHeight?.(c.x,c.z)??0;if(s.slideRamp&&Math.abs(c.x-(s.rampX??6))<.65&&c.z<=3.2&&c.z>=-1.2)top=(s.slideBase??0)+Math.max(0,Math.min(3,(3-c.z)*.75));if(s.mission&&s.ladderRaised&&Math.abs(c.x-2)<.65&&c.z<=.1&&c.z>=-3.6)top=Math.max(0,-c.z/3.6*2.9);for(let o of obstacles(s))if(overlap(c.x,c.z,o,R*.5)&&prev>=o.y+o.h-.14)top=Math.max(top,o.y+o.h);if(c.y<=top){c.y=top;c.vy=0;c.grounded=true;}else c.grounded=false;updateBox(s,dt);if(c.y>=1.4)s.climbed=true;if((!s.mission||(s.doorOpen&&s.ladderRaised))&&c.y>=2.85&&Math.hypot(c.x-LEVEL.goal.x,c.z-LEVEL.goal.z)<LEVEL.goal.r){s.won=true;s.target=null;}}
