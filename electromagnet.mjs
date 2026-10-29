import {createTapIntent,isCarryAction,nearbyPick} from './touch-intent.mjs?v=52';
const touchIntent=createTapIntent();
import {createGPSMap} from './gps-map.mjs?v=64';
const gpsMap=createGPSMap();gpsMap.show();
import * as T from './vendor/three.module.js';
import {createCat} from './avatar.mjs?v=18';
import {newInduction,moveMagnet,stepInduction,canWalk} from './induction-physics.mjs?v=46';
import {clearAt,route,approachItem,moveWithCollision,clampZoom,stickAxis} from './lab-navigation.mjs?v=52';
const obstacles=[];
const $=id=>document.getElementById(id);let r;try{r=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('error').hidden=false;throw e;}
r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;document.body.prepend(r.domElement);
const scene=new T.Scene();scene.background=new T.Color(0x9cb8bb);scene.fog=new T.FogExp2(0x9cb8bb,.012);const cam=new T.PerspectiveCamera(44,1,.1,230);scene.add(new T.HemisphereLight(0xe9f6ed,0x52675f,2.6));const sun=new T.DirectionalLight(0xffe5bd,2.7);sun.position.set(-15,35,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32});sun.shadow.normalBias=.04;scene.add(sun);
const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.75,...extra});const M={stone:mat(0x88958c),dark:mat(0x22434a),cream:mat(0xd8d3b4),copper:mat(0xc97b49,{metalness:.65,roughness:.3}),red:mat(0xe26555),blue:mat(0x548eb3),gold:mat(0xf3c56e),mint:mat(0x7af2bb,{emissive:0x36bf80,emissiveIntensity:.5}),off:mat(0x34545a),wood:mat(0xa18d6d)};const targets=[];
function box(w,h,d,m,x,y,z,parent=scene,id){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);if(parent===scene&&h>.35&&id!=='ground')obstacles.push({x,z,w,d,y:y-h/2,h});if(id){o.userData.action=id;targets.push(o);}return o;}
function ball(rad,m,x,y,z,parent=scene,id){const o=new T.Mesh(new T.SphereGeometry(rad,16,10),m);o.position.set(x,y,z);parent.add(o);if(id){o.userData.action=id;targets.push(o);}return o;}
function line(points,m,rad=.05,parent=scene){const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(c,Math.max(12,points.length*6),rad,6,false),m);parent.add(o);return o;}
function sign(text,x,y,z,width=3){const c=document.createElement('canvas');c.width=768;c.height=192;const g=c.getContext('2d');g.fillStyle='#244851';g.fillRect(0,0,768,192);g.strokeStyle='#cfc8a4';g.lineWidth=10;g.strokeRect(8,8,752,176);g.fillStyle='#f6ebcd';g.font='bold 66px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,96);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:tx,side:T.DoubleSide}));o.position.set(x,y,z);scene.add(o);return o;}
box(28,2,18,M.stone,0,-1,5,scene,'ground');box(28,2,14,M.stone,0,-1,-17,scene,'ground');
const water=box(100,.15,7,mat(0x3f8998,{metalness:.4,roughness:.22}),0,-1.25,-7);for(let i=0;i<32;i++)box(1.6,.015,.06,M.cream,-48+i*3,-1.16,-6+(i%3-1)*1.8);
// Canyon banks and cliffs make the powered bridge the only crossing.
for(const side of [-1,1])for(let i=0;i<7;i++){const rock=ball(4+(i%3),M.stone,side*(19+i*5),-1,-7);rock.scale.y=1.8;}
for(const z of [13.8,-24])box(28,.85,.22,M.dark,0,.45,z);for(const x of [-13.8,13.8]){box(.22,.85,18,M.dark,x,.45,5);box(.22,.85,14,M.dark,x,.45,-17);}
for(const x of [-13.5,-9,-4.5,4.5,9,13.5]){box(.18,1.2,.18,M.dark,x,.6,-3.9);box(.18,1.2,.18,M.dark,x,.6,-10.1);}for(const x of [-8,8]){box(10,.12,.12,M.gold,x,1,-3.9);box(10,.12,.12,M.gold,x,1,-10.1);}
const bridge=new T.Group();bridge.position.set(0,0,-3.5);scene.add(bridge);box(3.7,.26,7,M.wood,0,-.13,-3.5,bridge);for(const x of [-1.75,1.75]){box(.1,1,7,M.dark,x,.5,-3.5,bridge);for(let z=-.6;z>-7;z-=1.4)box(.1,1,.1,M.gold,x,.5,z,bridge);}bridge.rotation.x=Math.PI/2;bridge.visible=false;
for(const x of [-2.3,2.3]){box(.6,3,.7,M.dark,x,1.5,-3.2);ball(.28,M.gold,x,2.8,-3.2);}
// Abandoned generator hall, open front and roof girders.
box(12,.25,9,M.cream,-6,.12,3);for(const x of [-11.5,-.5])for(const z of [-.9,7])box(.3,5,.3,M.dark,x,2.5,z);for(const z of [-.9,7])box(11.5,.4,.3,M.dark,-6,5,z);box(.3,.4,8,M.dark,-6,5,3);sign('FARADAY · 1831',-6,4.2,-.9,7);
box(6,1,3,M.dark,-6,.5,2,scene,'coil');box(5,.12,.3,M.cream,-6,1.12,2,scene,'coil');
const coil=new T.Group();coil.position.set(-6,1.65,2);scene.add(coil);for(let i=0;i<12;i++){const ring=new T.Mesh(new T.TorusGeometry(.7,.07,8,32),M.copper);ring.rotation.y=Math.PI/2;ring.position.x=(i-5.5)*.12;coil.add(ring);}for(const x of [-7.2,-4.8])box(.17,.7,1.8,M.cream,x,1.3,2);sign('↔',-6,2.9,2,2);
const magnet=new T.Group();scene.add(magnet);box(1.1,.55,.55,M.red,-.55,0,0,magnet,'magnet');box(1.1,.55,.55,M.blue,.55,0,0,magnet,'magnet');const handle=ball(.3,M.red,1.25,0,0,magnet,'magnet');box(2.6,.1,.1,M.dark,0,-.32,0,magnet);magnet.position.set(4,.9,7);
box(3,.6,2,M.wood,4,.3,7);sign('N',3.45,1.6,7,1);sign('S',4.55,1.6,7,1);
const plug=new T.Group();scene.add(plug);box(.65,.4,.7,M.gold,0,0,0,plug,'plug');for(const x of [-.18,.18])box(.1,.1,.3,M.copper,x,0,-.4,plug,'plug');plug.position.set(8,.5,5.5);
const socket=box(.8,.65,.25,M.gold,-2.4,1.2,2.5,scene,'socket');box(.4,.25,.1,M.dark,-2.4,1.2,2.65,scene,'socket');
const cable=line([[-2.4,1.1,2.5],[-1.4,.2,3],[1,.12,2.5],[2,.12,.5],[2.3,1,-2.8]],M.gold,.075);
const capacitor=new T.Group();capacitor.position.set(2.3,0,-2.8);scene.add(capacitor);box(1.1,2.6,.9,M.dark,0,1.3,0,capacitor);const cells=[];for(let i=0;i<8;i++)cells.push(box(.76,.21,.1,M.off,0,.4+i*.27,.5,capacitor));sign('青=手回し · 緑=水車',2.3,3.35,-2.2,3.6);const cellBlue=mat(0x6db5ff,{emissive:0x3a7bd5,emissiveIntensity:.55});
// Centre-zero analog meter: direction reverses when magnetic flux reverses.
box(2.4,1.7,.35,M.cream,-9.8,2.1,1.8);const dial=new T.Mesh(new T.CircleGeometry(.65,32),M.dark);dial.position.set(-9.8,2.1,2);scene.add(dial);sign('−     0     +',-9.8,2.85,2,2.2);const needle=new T.Group();needle.position.set(-9.8,1.85,2.05);scene.add(needle);box(.055,.7,.04,M.gold,0,.3,0,needle);ball(.07,M.red,0,0,0,needle);
const ghostPlus=new T.Group();ghostPlus.position.set(-9.8,1.85,2.03);scene.add(ghostPlus);box(.04,.7,.02,new T.MeshBasicMaterial({color:0x9ef4ba,transparent:true,opacity:.35}),0,.3,0,ghostPlus);const ghostMinus=new T.Group();ghostMinus.position.set(-9.8,1.85,2.03);scene.add(ghostMinus);box(.04,.7,.02,new T.MeshBasicMaterial({color:0xffc17b,transparent:true,opacity:.35}),0,.3,0,ghostMinus);let ghostMax=0,ghostMin=0;
for(let i=0;i<10;i++)box(.5,.02,.5,M.gold,4-i,.02,8-i*.55).rotation.y=Math.PI/4;
// Receiving tower, reachable only over the bridge.
box(7,.3,6,M.cream,0,.15,-18);for(const x of [-2,2]){box(.25,10,.25,M.dark,x,5,-19);line([[x,0,-19],[-x,4,-19],[x,8,-19]],M.dark,.08);}box(5,.3,.4,M.dark,0,9,-19);const dish=new T.Mesh(new T.SphereGeometry(1.5,24,16,0,Math.PI*2,0,Math.PI/2),M.cream);dish.position.set(0,10,-19);dish.rotation.x=Math.PI/3;scene.add(dish);const endButton=box(.8,.8,.3,M.mint,0,1.2,-16,scene,'receiver');box(2.3,1.8,1,M.dark,0,.9,-16.5);sign('通信塔',0,3,-18,3.2);const beacon=ball(.35,M.off,0,11,-19);
// Water-powered generator and a vertical lift to the cliff-top receiving room.
const wheel=new T.Group();wheel.position.set(10,1,-3.8);scene.add(wheel);
for(let i=0;i<12;i++){const a=i*Math.PI/6;const paddle=box(.25,.55,1.5,M.wood,Math.cos(a)*1.7,Math.sin(a)*1.7,0,wheel);paddle.rotation.z=a;}
const rim=new T.Mesh(new T.TorusGeometry(1.7,.12,8,40),M.dark);wheel.add(rim);ball(.3,M.gold,0,0,0,wheel);
for(const x of [8.9,11.1])box(.18,2,.3,M.dark,x,1,-2.8);box(2.4,.12,.18,M.dark,10,1.15,-2.8);const gateHandle=box(1,.25,.5,M.gold,10,1.8,5,scene,'water');box(.18,1.8,.18,M.dark,10,.9,5);
const stream=box(1,.08,7,mat(0x87d6e6),10,-.1,.1);
line([[10,-.18,-3.5],[10,-.18,.1],[10,-.18,3.5]],M.copper,.11);stream.visible=false;
const gear=new T.Group();gear.position.set(-1,.45,8);scene.add(gear);const gearRing=new T.Mesh(new T.TorusGeometry(.65,.19,8,20),M.gold);gearRing.userData.action='gear';targets.push(gearRing);gear.add(gearRing);for(let i=0;i<10;i++){const a=i*Math.PI/5;const tooth=box(.3,.3,.3,M.gold,Math.cos(a)*.76,Math.sin(a)*.76,0,gear,'gear');tooth.rotation.z=a;}
const gearSocket=box(1.4,1.4,.4,M.copper,3,1.2,1,scene,'drive');line([[10,1,-3.8],[3,1.2,1],[-6,1.2,2]],M.dark,.12);
// Tall glazed openings through both faces expose the original riverside wheel.
// The roof and load-bearing piers retain the upper receiving-room floor.
box(1.4,8,7,M.stone,6.2,4,-.3);box(.8,8,7,M.stone,12.1,4,-.3);box(7,.65,7,M.stone,9,7.675,-.3);
const windowGlass=mat(0xbde7e9,{transparent:true,opacity:.07,roughness:.15,depthWrite:false,side:T.DoubleSide});
for(const z of [3.24,-3.84]){
 box(4.8,6.95,.035,windowGlass,9.3,3.825,z);
 for(const x of [6.94,11.66])box(.08,7.1,.09,M.dark,x,3.8,z);
 for(const y of [.3,7.32])box(4.8,.09,.09,M.dark,9.3,y,z);
 box(.06,7,.07,M.dark,9.3,3.8,z);
}
// Glazing blocks entry even though the wheel is visible through it.
obstacles.push({x:9,z:-.3,w:7,d:7,y:0,h:8});const lift=new T.Group();lift.position.set(5,0,4);scene.add(lift);box(2.8,.25,2.8,M.wood,0,.12,0,lift);for(const x of [-1.3,1.3])box(.1,1,.1,M.gold,x,.65,1.3,lift);for(const x of [3.5,6.5])box(.16,11,.16,M.dark,x,5.5,4);
const liftButton=box(.7,.7,.4,M.gold,5,1.2,5.6,scene,'lift');
endButton.position.set(9,9.2,0);box(2.3,1.8,1,M.dark,9,8.9,-.5);sign('通信室',9,11,-1,3.5);box(6,.2,6,M.cream,9,8.05,0);
const lamps=[];for(let i=0;i<9;i++)lamps.push(ball(.12,M.off,2.5+i*.3,.18,-1+i*.75));
const lamp=ball(.2,M.off,-6,3.2,2);
let waterLevel=0,gearInstalled=false,manualSeen=false,liftY=0,lifting=false,magnetPhase=0;
let emPrediction=null,emVerdictShown=false;
for(const [id,value] of [['emPredMoving','moving'],['emPredStays','stays'],['emPredNever','never']]){const b=$(id);if(b)b.onclick=()=>{emPrediction=value;$('predict').hidden=true;};}
// Physical cues instead of a task overlay: matched silhouettes and soft halos.
function halo(x,y,z,color,radius=.7){const m=new T.MeshBasicMaterial({color,transparent:true,opacity:.35,depthWrite:false,side:T.DoubleSide});const o=new T.Mesh(new T.RingGeometry(radius*.85,radius,36),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);scene.add(o);return o;}
const magnetCue=halo(4,.64,7,0xffcf86,1.65),coilCue=halo(-6,1.02,2,0xffcf86,1.6),plugCue=halo(8,.05,5.5,0xffdb75),socketCue=halo(-2.4,.05,3.8,0xffdb75),gearCue=halo(-1,.05,8,0xffdb75),driveCue=halo(3,.05,2.7,0xffdb75),waterCue=halo(10,.05,5,0x89e0ed),liftCue=halo(5,.3,4,0x9affcf,1.1);
const gearOutline=new T.Mesh(new T.TorusGeometry(.65,.07,8,24),new T.MeshStandardMaterial({color:0xf3c56e,emissive:0xb77a27,emissiveIntensity:.25}));gearOutline.position.set(3,1.2,1.24);scene.add(gearOutline);
const ghostMagnet=new T.Group();ghostMagnet.position.set(-6,1.65,2);scene.add(ghostMagnet);box(1.1,.55,.55,mat(0xe26555,{transparent:true,opacity:.22}),-.55,0,0,ghostMagnet);box(1.1,.55,.55,mat(0x548eb3,{transparent:true,opacity:.22}),.55,0,0,ghostMagnet);
obstacles.push({x:2.3,z:-2.8,w:1.1,d:.9,y:0,h:2.6});
// Distant hills, solid trees and rocks.
let seed=43;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<60;i++){const a=rand()*Math.PI*2,dist=33+rand()*45,x=Math.sin(a)*dist,z=Math.cos(a)*dist;if(Math.abs(z+7)<7)continue;const h=4+rand()*9;box(.4,h,.4,M.wood,x,h/2-2,z);for(let j=0;j<3;j++){const o=ball(2+rand()*2,mat(0x506950),x+(rand()-.5)*2,h-2+j,z);o.scale.y=1.2;}}
for(let i=0;i<16;i++){const o=ball(10+rand()*10,mat(0x6e8580),Math.sin(i)*76,-3,Math.cos(i)*76);o.scale.y=1+rand();}
const avatar=createCat();scene.add(avatar.cat);const state=newInduction(),cat={x:5,z:10,heading:Math.PI},keys={};let held=null,target=null,task=null,yaw=.15,pitch=.7,zoom=1,walk=0,visualHeading=Math.PI,smoothedWalk=0,waypoints=[],drag=null,movingUntil=0,paused=false,bridgeAngle=Math.PI/2;
function dropItem(obj){for(const offset of [0,Math.PI/2,-Math.PI/2,Math.PI]){const a=cat.heading+offset,x=cat.x+Math.sin(a)*1.7,z=cat.z+Math.cos(a)*1.7;if(clearAt(x,z,liftY,obstacles)){obj.position.set(x,liftY+.5,z);obj.rotation.y=0;held=null;return;}}}
function near(x,z,d=2.5){return Math.hypot(cat.x-x,cat.z-z)<d;}
function go(x,z,action=null){const path=route(cat,{x,z},liftY,obstacles);if(!path.length)return;waypoints=path;target=waypoints.shift();task=action;}
function pickupItem(obj,id){const path=approachItem(cat,obj.position,liftY,obstacles);if(!path.length)return;waypoints=path;target=waypoints.shift();task=id;if(Math.hypot(target.x-cat.x,target.z-cat.z)<.12){target=null;waypoints=[];finishTask();}}
function finishTask(){const a=task;task=null;if(a==='magnet'){held='magnet';}if(a==='plug')held='plug';if(a==='gear')held='gear';if(a==='drive'&&held==='gear'){gearInstalled=true;held=null;}if(a==='water'){waterLevel=(waterLevel+.25)%1.25;}if(a==='lift'&&state.bridgeOpen){lifting=true;target=null;cat.x=5;cat.z=4;}if(a==='install'&&held==='magnet'){state.installed=true;held=null;state.magnetZ=2.3;if(!emPrediction)$('predict').hidden=false;}if(a==='connect'&&held==='plug'){state.connected=true;held=null;}if(a==='win'&&liftY>=7.99){state.won=true;beacon.material=M.mint;$('ending').hidden=false;paused=true;try{localStorage.setItem('cat-physics-induction-complete','1');}catch{}}}
function interact(id,long=false){if(lifting)return false;if(['magnet','plug','gear'].includes(id)&&held&&held!==id)return false;if(id==='water'){go(10,6,'water');return false;}if(id==='gear'){if(held==='gear'){dropItem(gear);return false;}if(!gearInstalled&&long)pickupItem(gear,'gear');return false;}if(id==='drive'){go(3,2.8,held==='gear'?'drive':null);return false;}if(id==='lift'){go(6.1,5.7,'lift');return false;}if(id==='magnet'){if(state.installed){if(near(-6,4,3.3)&&long){if(!emPrediction){$('predict').hidden=false;return false;}drag={kind:'generator',lastX:0};return true;}go(-6,4);return;}if(held==='magnet'){dropItem(magnet);return;}if(long)pickupItem(magnet,'magnet');else go(magnet.position.x,magnet.position.z+1.6);}if(id==='plug'){if(state.connected)return;if(held==='plug'){dropItem(plug);return;}if(long)pickupItem(plug,'plug');else go(plug.position.x,plug.position.z+1.2);}if(id==='coil')go(-6,4,held==='magnet'?'install':null);if(id==='socket')go(-2.4,4,held==='plug'?'connect':null);if(id==='receiver'&&liftY>=7.99)go(9,1.5,'win');return false;}
function walkable(x,z){return clearAt(x,z,liftY,obstacles);}
const ray=new T.Raycaster(),uv=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0);function rawHit(e){plane.constant=-liftY;const b=r.domElement.getBoundingClientRect();uv.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(uv,cam);return ray.intersectObjects(targets,false).find(h=>h.object.visible&&h.object.parent.visible);}
function hit(e){return nearbyPick((x,y)=>rawHit({clientX:x,clientY:y}),e.clientX,e.clientY,isCarryAction);}
const point=new T.Vector3();let axis={x:0,z:0};const pointers=new Map();let pinching=false,pinch=null;
function fingerDistance(){const [a,b]=[...pointers.values()];return Math.hypot(a.x-b.x,a.y-b.y);}
function stopGesture(){for(const p of pointers.values())clearTimeout(p.timer);pointers.clear();touchIntent.reset();pinching=false;pinch=null;axis={x:0,z:0};drag=null;$('stick').style.opacity=0;}
r.domElement.addEventListener('pointerdown',e=>{if(paused)return;e.preventDefault();r.domElement.setPointerCapture(e.pointerId);const h=hit(e),id=h?.object.userData.action;const p={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,px:e.clientX,py:e.clientY,hit:h,moved:false,long:false,at:performance.now(),eligible:!id||id==='ground',mode:touchIntent.begin(e.clientX,e.clientY,performance.now(),!id||id==='ground')};pointers.set(e.pointerId,p);if(p.mode==='move'){target=null;task=null;waypoints=[];axis={x:0,z:0};}
 if(pointers.size>=2){pinching=true;touchIntent.reset();pinch={distance:Math.max(1,fingerDistance()),zoom};axis={x:0,z:0};target=null;task=null;waypoints=[];drag=null;for(const q of pointers.values()){q.moved=true;clearTimeout(q.timer);}$('stick').style.opacity=0;return;}
 p.timer=setTimeout(()=>{if(!pointers.has(p.id)||p.moved||pinching||p.eligible||!isCarryAction(id))return;p.long=true;if(p.hit){if(interact(id,true)){drag.lastX=p.x;drag.time=performance.now();}}},300);
});
r.domElement.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p)return;p.x=e.clientX;p.y=e.clientY;
 if(pinching){if(pointers.size>=2&&pinch)zoom=clampZoom(pinch.zoom*fingerDistance()/pinch.distance);return;}
 if(drag?.kind==='generator'){moveMagnet(state,state.magnetZ+(p.x-drag.lastX)*.025,Math.max(.016,(performance.now()-drag.time)/1000));drag.lastX=p.x;drag.time=performance.now();movingUntil=performance.now()+80;p.moved=true;return;}
 if(Math.hypot(p.x-p.sx,p.y-p.sy)>(isCarryAction(p.hit?.object.userData.action)?14:9)){p.moved=true;clearTimeout(p.timer);}
 if(p.moved){if(p.mode==='move'){axis=stickAxis(p.x-p.sx,p.y-p.sy);$('stick').style.left=(p.sx-56)+'px';$('stick').style.top=(p.sy-56)+'px';$('stick').style.bottom='auto';$('stick').style.opacity=1;$('stick').firstChild.style.transform=`translate(${axis.x*25}px,${axis.z*25}px)`;target=null;task=null;waypoints=[];}else{yaw-=(p.x-p.px)*.006;pitch=Math.max(.22,Math.min(1.15,pitch+(p.y-p.py)*.004));}}p.px=p.x;p.py=p.y;
});
function release(e,cancel=false){const p=pointers.get(e.pointerId);if(!p)return;clearTimeout(p.timer);pointers.delete(e.pointerId);axis={x:0,z:0};drag=null;$('stick').style.opacity=0;
 if(pinching){pinch=null;if(!pointers.size)pinching=false;return;}
 touchIntent.end(p,performance.now(),cancel);if(!cancel&&!p.moved&&!p.long){const id=p.hit?.object.userData.action;if(id&&id!=='ground')interact(id,!!isCarryAction(id)&&!(id==='magnet'&&state.installed));}
}
r.domElement.addEventListener('pointerup',e=>release(e));r.domElement.addEventListener('pointercancel',e=>release(e,true));r.domElement.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))release(e,true);});r.domElement.addEventListener('contextmenu',e=>e.preventDefault());r.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=clampZoom(zoom*Math.exp(-e.deltaY*.001));},{passive:false});
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{for(const k in keys)delete keys[k];stopGesture();});
$('begin').onclick=()=>{$('arrival').hidden=true;paused=false;};$('helpButton').onclick=()=>{$('help').hidden=false;paused=true;stopGesture();};$('closeHelp').onclick=()=>{$('help').hidden=true;paused=!$('arrival').hidden;};$('continue').onclick=()=>{$('ending').hidden=true;paused=false;};$('reset').onclick=()=>location.reload();
function resize(){r.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}addEventListener('resize',resize);resize();cam.position.set(15,24,30);cam.lookAt(0,0,1);let prev=performance.now();
function frame(t){gpsMap.update({x:cat.x,z:cat.z,heading:cat.heading,stage:"lab"});const dt=Math.min(.05,(t-prev)/1000);prev=t;let speed=0;if(!paused){let sx=axis.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),sz=axis.z+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);let dx=sx*Math.cos(yaw)+sz*Math.sin(yaw),dz=-sx*Math.sin(yaw)+sz*Math.cos(yaw);if(Math.hypot(dx,dz)>.05){target=null;task=null;}else if(target){dx=target.x-cat.x;dz=target.z-cat.z;const d=Math.hypot(dx,dz);if(d<.12){target=waypoints.shift()??null;if(!target)finishTask();dx=dz=0;}else{dx/=d;dz/=d;}}const len=Math.hypot(dx,dz);if(len>.05){dx/=Math.max(1,len);dz/=Math.max(1,len);const before={x:cat.x,z:cat.z};const amount=Math.min(dt*(held?2.5:3.8),target?Math.hypot(target.x-cat.x,target.z-cat.z):Infinity);if(!lifting)moveWithCollision(cat,dx*amount,dz*amount,liftY,obstacles);cat.heading=Math.atan2(dx,dz);speed=Math.min(1,Math.hypot(cat.x-before.x,cat.z-before.z)/Math.max(dt*3.8,.001));}if(Math.abs(state.current)>.08&&t<movingUntil)manualSeen=true;
if(emPrediction&&!emVerdictShown&&manualSeen){emVerdictShown=true;const v=$('verdict');if(v){v.textContent=`予想：${{moving:'動かしている間だけ振れる',stays:'止めても振れ続ける',never:'まったく振れない'}[emPrediction]} → 結果：針は、磁石を動かしている間だけ振れた`;v.hidden=false;setTimeout(()=>{v.hidden=true;},8000);}}
const auto=gearInstalled&&waterLevel>0&&state.connected&&state.installed;
if(auto){magnetPhase+=dt*waterLevel*5;moveMagnet(state,Math.sin(magnetPhase)*2.2,dt);}
stepInduction(state,dt,auto||t<movingUntil);
if(!gearInstalled)state.charge=Math.min(.2,state.charge);
wheel.rotation.z-=dt*waterLevel*3;stream.visible=waterLevel>0;gateHandle.position.y=1.8+waterLevel;lamp.material=Math.abs(state.current)>.05?M.mint:M.off;
if(lifting){liftY=Math.min(8,liftY+dt*1.8);cat.x=5;cat.z=4;if(liftY>=8){lifting=false;cat.x=6.1;cat.z=2.5;}}
}
walk+=dt*8;lift.position.y=liftY;avatar.cat.position.set(cat.x,liftY,cat.z);visualHeading+=Math.atan2(Math.sin(cat.heading-visualHeading),Math.cos(cat.heading-visualHeading))*(1-Math.exp(-dt*8));avatar.cat.rotation.y=visualHeading;smoothedWalk+=(speed-smoothedWalk)*(1-Math.exp(-dt*6));avatar.legs.forEach((o,i)=>o.rotation.x=Math.sin(walk+i*Math.PI)*.48*smoothedWalk);avatar.arms.forEach((o,i)=>{const desired=(held||drag?.kind==='generator')?-1.15:-Math.sin(walk+i*Math.PI-.65)*.4*smoothedWalk;o.rotation.x+=(desired-o.rotation.x)*(1-Math.exp(-dt*7));});avatar.catVisual.position.y=Math.sin(walk*2)*.045*smoothedWalk;avatar.catVisual.rotation.z=Math.sin(walk)*.06*smoothedWalk;avatar.catVisual.rotation.x=.06*smoothedWalk;avatar.tail.rotation.z=Math.sin(t*.0015)*.18;
if(held){const obj=held==='magnet'?magnet:held==='gear'?gear:plug;obj.rotation.y=visualHeading;obj.position.set(cat.x+Math.sin(cat.heading)*.9,liftY+1.05,cat.z+Math.cos(cat.heading)*.9);}
if(gearInstalled){gear.rotation.y=0;gear.position.set(3,1.2,1.3);gear.rotation.z=wheel.rotation.z;}
if(state.installed){magnet.rotation.y=0;magnet.position.set(-6+state.magnetZ,1.65,2);}if(state.connected)plug.position.set(-2.4,1.2,2.9);needle.rotation.z=-state.current*1.15;if(state.current>ghostMax){ghostMax=state.current;ghostPlus.rotation.z=-ghostMax*1.15;}if(state.current<ghostMin){ghostMin=state.current;ghostMinus.rotation.z=-ghostMin*1.15;}cells.forEach((o,i)=>o.material=state.charge>i/8?(i<2?cellBlue:M.mint):M.off);bridgeAngle+=((state.bridgeOpen?0:Math.PI/2)-bridgeAngle)*(1-Math.exp(-dt*2));bridge.rotation.x=bridgeAngle;socket.material=state.connected?M.mint:M.gold;cable.material=state.connected&&Math.abs(state.current)>.05?M.mint:M.gold;$('pulse').style.opacity=Math.abs(state.current);
lamps.forEach((o,i)=>o.material=state.charge>i/9?M.mint:M.off);liftButton.material=state.bridgeOpen?M.mint:M.gold;
magnetCue.position.set(magnet.position.x,state.installed?1.02:.05,magnet.position.z);plugCue.position.set(plug.position.x,.05+liftY,plug.position.z);gearCue.position.set(gear.position.x,.05+liftY,gear.position.z);
const pulse=.27+.15*Math.sin(t*.003);for(const cue of [magnetCue,coilCue,plugCue,socketCue,gearCue,driveCue,waterCue,liftCue])cue.material.opacity=pulse;
magnetCue.visible=!state.installed&&held!=='magnet';coilCue.visible=!state.installed&&held==='magnet';ghostMagnet.visible=!state.installed;ghostMagnet.position.x=-6+Math.sin(t*.0014)*.6;
plugCue.visible=state.installed&&!state.connected&&held!=='plug';socketCue.visible=!state.connected&&held==='plug';gearCue.visible=state.installed&&state.connected&&!gearInstalled&&held!=='gear';driveCue.visible=held==='gear';gearOutline.visible=!gearInstalled;waterCue.visible=gearInstalled&&waterLevel===0;liftCue.visible=state.bridgeOpen&&liftY===0;
const focus=new T.Vector3(cat.x+Math.sin(visualHeading)*1.1,.85+liftY,cat.z+Math.cos(visualHeading)*1.1),dist=(innerWidth<innerHeight?31:25)/zoom;const desired=new T.Vector3(focus.x+Math.sin(yaw)*Math.cos(pitch)*dist,focus.y+Math.sin(pitch)*dist,focus.z+Math.cos(yaw)*Math.cos(pitch)*dist);cam.position.lerp(desired,1-Math.exp(-dt*5));cam.lookAt(focus);r.render(scene,cam);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.catInduction={getState:()=>({...state,cat:{...cat},held,paused,waterLevel,gearInstalled,manualSeen,liftY,lifting,zoom,pinching,axis:{...axis},waypoints:waypoints.length,yaw,pitch}),release:51};
