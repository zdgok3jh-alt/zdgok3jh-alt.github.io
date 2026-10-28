import {lakeContains,LAKE_ISLAND,islandAt} from './lake.mjs?v=18';
import {terrainHeight} from './terrain.mjs?v=42';
import {LEVEL,newWorld,stepWorld,setTarget,takeBall,throwBall,toggleGrab} from './physics.mjs?v=18';
export {setTarget,takeBall,throwBall,toggleGrab};
export const DOCK={x:-24.3,z:-18},SLIDE={x:30,topZ:-32,endZ:22,landingZ:26,base:2.5,height:18,stairX:39};
export const PARTS=[{id:'fuel',name:'燃料タンク',x:0,z:-5.7,y:2.9},{id:'nose',name:'先端パーツ',x:-37,z:-16,y:.35},{id:'fin',name:'翼パーツ',x:30,z:26,y:2.5}];
export const WALLS=[{x:22,z:24,w:1,d:13,y:2.5,h:9},{x:38,z:24,w:1,d:13,y:2.5,h:9},{x:23.5,z:18,w:3,d:1,y:2.5,h:9},{x:36.5,z:18,w:3,d:1,y:2.5,h:9},{x:30,z:18,w:12,d:1,y:12,h:3},{x:25,z:30,w:6,d:1,y:2.5,h:9},{x:35,z:30,w:6,d:1,y:2.5,h:9}];
export function adventureHeight(x,z){let y=terrainHeight(x,z);if(Math.abs(x-SLIDE.stairX)<1.1&&z>=-32&&z<=22)y=2.5+(22-z)/54*18;if(z>=-33.1&&z<=-30.9&&x>=24.5&&x<=37.8)y=20.5;else if(z>=-33.1&&z<-32&&x>37.8&&x<=40.1)y=20.5;if(Math.abs(x-30)<5&&z>=-32&&z<=22)y=Math.max(y,2.5+(22-z)/54*18);return y;}
export function supportHeight(s,x,z){const ground=terrainHeight(x,z),surface=adventureHeight(x,z);return s.cat.y>=surface-.3?surface:ground;}
export function recoverStairFall(s){if(!s.stairFallArmed||s.slideStage==='sliding')return false;const c=s.cat,ground=terrainHeight(c.x,c.z);if(c.grounded&&(c.y<=ground+.15||adventureHeight(c.x,c.z)<=ground+.15)){c.x=40.5;c.z=24;c.y=terrainHeight(c.x,c.z);c.vy=0;c.grounded=true;s.target=null;s.stairFallArmed=false;return true;}return false;}
// supportHeight() lets a cat below a high surface walk on the terrain, so it can
// slip in underneath the stairs, the slide chute or the top platform from the
// side. Those footprints hold nothing to do, so ease the cat back out to the
// nearest open edge instead of leaving it under the structure.
export function recoverUnderStructure(s){const c=s.cat;if(s.aboard||s.slideStage==='sliding'||!c.grounded)return false;const surf=adventureHeight(c.x,c.z),terr=terrainHeight(c.x,c.z);if(surf-terr<=2.2||c.y>terr+.15)return false;if(Math.abs(c.x-SLIDE.stairX)<1.3)c.x=40.6;else if(c.z<-30.5)c.z=-34.2;else c.x=c.x<30?24.2:35.8;c.y=terrainHeight(c.x,c.z);c.vy=0;c.grounded=true;s.target=null;s.stairFallArmed=false;return true;}
export function createAdventure(){const s=newWorld(true);s.bounds=58;s.groundHeight=(x,z)=>supportHeight(s,x,z);s.stairFallArmed=false;s.cat.x=0;s.cat.z=6;s.ball.x=-1;s.ball.z=4;s.switchX=-1;s.switchZ=-1;s.parts=[];s.partPositions=Object.fromEntries(PARTS.map(p=>[p.id,{...p}]));s.carriedPart=null;s.partRequested=null;s.events=[];s.aboard=false;s.boarding=false;s.oarsHeld={left:false,right:false};s.boat={x:-20.5,z:-18,y:terrainHeight(-20.5,-18),vx:0,vz:0,heading:Math.PI*1.5,strokeLeft:0,strokeRight:0,afloat:false,held:false,requested:false};s.slideRamp=false;s.slid=false;s.slideStage=null;s.slideSpeed=0;s.slideProgress=0;s.slideGateOpen=false;s.water={contains:lakeContains,island:islandAt};s.extraSupports=[...WALLS,{x:30,z:30,w:4,d:1,y:2.5,h:9,slideGate:true},{x:-37,z:-16,w:2.5,d:2.5,y:0,h:.35}];return s;}
export function openSlideGate(s){if(s.cat.x>23&&s.cat.x<37&&s.cat.z>18.5&&s.cat.z<29.5&&Math.hypot(s.cat.x-36,s.cat.z-28)<2){s.slideGateOpen=true;s.extraSupports=s.extraSupports.filter(o=>!o.slideGate);return true;}return false;}
function partDropSurface(s,x,z){
let y=s.groundHeight(x,z);
for(const o of [{...LEVEL.ledge,y:0,h:LEVEL.ledge.top},s.box,...s.extraSupports]){
if(Math.abs(x-o.x)<o.w/2+.35&&Math.abs(z-o.z)<o.d/2+.35){
const top=o.y+o.h;
if(top>s.cat.y+.3)return null;
y=Math.max(y,top);
}}
if(lakeContains(x,z)&&!islandAt(x,z)||Math.abs(y-s.cat.y)>1.2)return null;
return {x,z,y};
}
export function grabPart(s,id){
if(s.parts.includes(id)||!s.partPositions[id]||s.aboard)return false;
const p=s.partPositions[id];
if(s.carriedPart===id){
const x=s.cat.x+Math.sin(s.cat.heading)*1.1,z=s.cat.z+Math.cos(s.cat.heading)*1.1;
const spot=partDropSurface(s,x,z)??partDropSurface(s,s.cat.x,s.cat.z)??{x:s.cat.x,z:s.cat.z,y:s.cat.y};
Object.assign(p,spot);s.carriedPart=null;s.partRequested=null;s.target=null;return true;
}
if(s.carriedPart||s.boat.held)return false;
if(Math.hypot(s.cat.x-p.x,s.cat.z-p.z)<1.6&&Math.abs(s.cat.y-p.y)<1.4){
s.carriedPart=id;s.partRequested=null;s.target=null;s.grabbed=false;s.grabRequested=false;return true;
}
s.partRequested=id;setTarget(s,p.x,p.z);return true;
}
export function deliverPart(s){if(!s.carriedPart||Math.hypot(s.cat.x-1.8,s.cat.z+5.8)>1.6||s.cat.y<2.6)return false;s.parts.push(s.carriedPart);s.carriedPart=null;s.partRequested=null;return true;}
export function grabBoat(s){if(s.aboard||s.carriedPart)return false;if(s.boat.held){const b=s.boat;b.x=s.cat.x+Math.sin(s.cat.heading)*1.8;b.z=s.cat.z+Math.cos(s.cat.heading)*1.8;b.afloat=lakeContains(b.x,b.z);b.held=false;b.y=b.afloat?.22:terrainHeight(b.x,b.z);return true;}s.boat.requested=true;setTarget(s,s.boat.x,s.boat.z);return true;}
export function boardBoat(s){const b=s.boat;if(s.aboard){const shore=Math.hypot(b.x-(DOCK.x-.5),b.z-DOCK.z)<2.4,island=Math.hypot(b.x-LAKE_ISLAND.x,b.z-LAKE_ISLAND.z)<2.9;if(!shore&&!island)return false;s.aboard=false;s.oarsHeld={left:false,right:false};s.cat.x=shore?DOCK.x:LAKE_ISLAND.x;s.cat.z=shore?DOCK.z:LAKE_ISLAND.z;s.cat.y=shore?terrainHeight(DOCK.x,DOCK.z):.35;b.vx=b.vz=0;return true;}if(!b.afloat||b.held)return false;if(Math.hypot(s.cat.x-b.x,s.cat.z-b.z)<2.4){s.aboard=true;s.boarding=false;s.target=null;s.grabbed=false;s.grabRequested=false;return true;}s.boarding=true;setTarget(s,Math.hypot(b.x-LAKE_ISLAND.x,b.z-LAKE_ISLAND.z)<3?LAKE_ISLAND.x:DOCK.x,Math.hypot(b.x-LAKE_ISLAND.x,b.z-LAKE_ISLAND.z)<3?LAKE_ISLAND.z:DOCK.z);return false;}
export function grabOar(s,side){if(!s.aboard)return false;s.oarsHeld[side]=!s.oarsHeld[side];return true;}
export function rowBoat(s,side,strength=1){if(!s.aboard||!s.oarsHeld[side])return false;const b=s.boat,k=Math.max(-1.5,Math.min(1.5,strength));b.heading+=(side==='left'?1:-1)*.15*k;b.vx+=Math.sin(b.heading)*1.25*k;b.vz+=Math.cos(b.heading)*1.25*k;b[side==='left'?'strokeLeft':'strokeRight']=k;return true;}
export function moveAdventure(s,x,z){if(!s.aboard)setTarget(s,x,z);}
export function startSlide(s){return false;}
export function stepAdventure(s,input={},dt=1/60){s.won=false;if(!s.aboard&&s.slideStage!=='sliding'&&Math.abs(s.cat.x-39)<1.2&&s.cat.z>=-33&&s.cat.z<=22&&s.cat.y>terrainHeight(s.cat.x,s.cat.z)+2)s.stairFallArmed=true;
if(s.aboard){const b=s.boat;b.vx*=Math.exp(-dt*.5);b.vz*=Math.exp(-dt*.5);b.strokeLeft*=Math.exp(-dt*4);b.strokeRight*=Math.exp(-dt*4);const nx=b.x+b.vx*dt,nz=b.z+b.vz*dt;if(lakeContains(nx,nz)){b.x=nx;b.z=nz;}else{b.vx*=.2;b.vz*=.2;}s.cat.x=b.x;s.cat.z=b.z;s.cat.y=.42;s.cat.heading=b.heading;s.cat.grounded=true;}
else if(s.slideStage==='sliding'){s.slideSpeed=Math.min(22,s.slideSpeed+9*dt);s.cat.x=30;s.cat.z=Math.min(26,s.cat.z+s.slideSpeed*dt);s.cat.y=adventureHeight(s.cat.x,s.cat.z)+.11;s.cat.heading=0;s.cat.vy=0;s.cat.grounded=true;if(s.cat.z>=26){s.slideStage=null;s.stairFallArmed=false;s.slid=true;s.cat.y=2.5;s.target=null;}}
else{stepWorld(s,input,dt);if(s.boarding&&Math.hypot(s.cat.x-s.boat.x,s.cat.z-s.boat.z)<2.4)boardBoat(s);if(Math.abs(s.cat.x-30)<3.7&&s.cat.z>-31.4&&s.cat.z<-29&&s.cat.y>19){s.slideStage='sliding';s.slideSpeed=0;s.target=null;}}
recoverStairFall(s);
recoverUnderStructure(s);
if(s.boat.requested&&Math.hypot(s.cat.x-s.boat.x,s.cat.z-s.boat.z)<2){s.boat.held=true;s.boat.requested=false;s.target=null;s.grabbed=false;s.grabRequested=false;}
if(s.boat.held){const b=s.boat;b.x=s.cat.x+Math.sin(s.cat.heading)*1.8;b.z=s.cat.z+Math.cos(s.cat.heading)*1.8;b.y=s.cat.y+.6;b.heading=s.cat.heading;b.vx=b.vz=0;}
if(s.partRequested){const p=s.partPositions[s.partRequested];if(Math.hypot(s.cat.x-p.x,s.cat.z-p.z)<1.15&&Math.abs(s.cat.y-p.y)<1.4){s.carriedPart=s.partRequested;s.partRequested=null;s.target=null;s.grabbed=false;s.grabRequested=false;}}
// A dropped crate can land past the water's edge, where the cat (blocked by
// the water) can never get within grab range again. Return it to the same
// shore spot the observation-base phase already uses for a lost crate.
if(!s.grabbed&&lakeContains(s.box.x,s.box.z)&&!islandAt(s.box.x,s.box.z)){const wasRequested=s.grabRequested;s.box.x=-8;s.box.z=-6;s.box.y=terrainHeight(-8,-6);s.box.vx=0;s.box.vy=0;s.box.vz=0;s.grabRequested=false;if(wasRequested)s.target=null;s.events.push('箱が湖に落ちたので、道の入口に戻したよ。');}
s.won=false;}
