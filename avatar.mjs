import * as THREE from './vendor/three.module.js';
export function createCat(){const materials={};for(const [k,v] of Object.entries({white:0xfff8ed,orange:0xdf9a61,pink:0xefbcae,dark:0x293947}))materials[k]=new THREE.MeshStandardMaterial({color:v,roughness:.8});function ball(r,m,x,y,z,parent){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
// Two-legged cat with soft, trailing limb animation.
const cat=new THREE.Group(),catVisual=new THREE.Group();cat.add(catVisual);
const body=ball(.34,materials.white,0,1.02,0,catVisual);body.scale.set(1,1.45,.9);
const head=ball(.3,materials.white,0,1.53,.07,catVisual);head.scale.set(1,.95,1);
for(let x of [-.19,.19]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.13,.29,3),materials.orange);ear.position.set(x,1.8,.06);ear.rotation.y=Math.PI/6;catVisual.add(ear);const points=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*5,r=.008+i/64*.047;const ex=x*.62+Math.cos(a)*r,ey=1.57+Math.sin(a)*r;const ez=.07+Math.sqrt(Math.max(0,.3*.3-ex*ex-((ey-1.53)/.95)**2))+.003;points.push(new THREE.Vector3(ex,ey,ez));}const spiral=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.003,5,false),materials.dark);catVisual.add(spiral);}
ball(.035,materials.pink,0,1.47,.368,catVisual);
const legs=[],arms=[];
for(let x of [-.18,.18]){const leg=new THREE.Group();leg.position.set(x,.73,0);catVisual.add(leg);const shin=new THREE.Mesh(new THREE.CylinderGeometry(.095,.085,.43,10),materials.white);shin.position.y=-.25;leg.add(shin);const foot=ball(.13,materials.orange,0,-.56,.09,leg);foot.scale.set(1,.75,1.6);legs.push(leg);
const arm=new THREE.Group();arm.position.set(x*2.3,1.25,0);catVisual.add(arm);const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.075,.085,.46,10),materials.white);sleeve.position.y=-.23;arm.add(sleeve);ball(.105,materials.orange,0,-.49,0,arm);arms.push(arm);}
const tail=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,.65,8),materials.orange);tail.position.set(0,.91,-.42);tail.rotation.x=.7;catVisual.add(tail);
return {cat,catVisual,legs,arms,head,tail};}
