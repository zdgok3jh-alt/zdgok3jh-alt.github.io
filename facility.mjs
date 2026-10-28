import * as THREE from './vendor/three.module.js';
export function buildFacility(parent,{box,sphere,action,M,material}){
const ground=action(box(48,.3,50,material(0x59666d),-1,-.16,0,parent),'facilityGround');
for(const x of [-22,20])for(let z=-22;z<=22;z+=4){box(.14,1.5,.14,M.rail,x,.75,z,parent);box(.08,.1,4,M.dark,x,1.3,z,parent);}
// Warehouse with open front, upper storage floor and a lift.
box(9,.2,8,M.dark,-17,3.9,-5,parent);box(9,7,.25,M.blue,-17,3.5,-9,parent);for(const x of [-21.5,-12.5])box(.3,7,8,M.blue,x,3.5,-5,parent);box(9.5,.25,8.5,material(0xffffff,{transparent:true,opacity:.2,depthWrite:false}),-17,7.2,-5,parent);
for(const x of [-20.5,-13.5])box(.2,4,.2,M.rail,x,2,-3,parent);
const lift=new THREE.Group();lift.position.set(-17,0,0);parent.add(lift);action(box(4,.2,4,M.wood,0,-.1,0,lift),'facilityGround');for(const x of [-2,2])box(.08,1,.08,M.rail,x,.5,0,lift);for(const x of [-19.2,-14.8])box(.25,6,.25,M.dark,x,3,0,parent);action(box(.6,1.2,.6,M.blue,-19.4,.6,1,parent),'liftControl');const lever=action(sphere(.23,M.orange,-19.4,1.3,1,parent),'liftControl');
// Recessed channel, bridge and counterweight tray.
box(5,.03,48,material(0x1c3442),-8,.01,0,parent);const bridge=new THREE.Group();bridge.position.set(-10.5,0,7);parent.add(bridge);action(box(5,.2,3,M.orange,2.5,-.1,0,bridge),'facilityGround');for(const z of [-1.5,1.5])box(5,.6,.1,M.rail,2.5,.3,z,bridge);
const weight=action(box(.7,.7,.7,M.dark,-14,.35,7,parent),'facilityWeight');action(box(1.8,.12,1.8,M.orange,-12,.06,7,parent),'weightTray');for(const x of [-12.7,-11.3])box(.1,3,.1,M.rail,x,1.5,7,parent);box(1.5,.12,.12,M.white,-12,3,7,parent);
// A gantry crane with a suspended payload.
for(const x of [6,16])for(const z of [8,13])box(.35,10,.35,M.rail,x,5,z,parent);box(11,.45,6,M.orange,11,10.2,10.5,parent);const crane=new THREE.Group();crane.position.set(11,10.2,10.5);parent.add(crane);box(9,.3,.4,M.dark,0,0,0,crane);box(.06,5,.06,M.dark,3,-2.5,0,crane);const cargo=box(1.4,1.4,1.4,M.wood,3,-5.7,0,crane);action(box(.9,1,.8,M.blue,7,.5,10,parent),'craneControl');action(sphere(.25,M.orange,7,1.15,10,parent),'craneControl');
// Hangar and control building flank a broad service yard.
box(8,6,.3,M.blue,11,3,-15,parent);for(const x of [7,15])box(.3,6,8,M.blue,x,3,-11,parent);box(8.4,.25,8.4,M.white,11,6.1,-11,parent);box(5,4,6,M.blue,14,2,19,parent);box(4.4,.1,2,M.dark,14,2.8,22.05,parent);
for(const x of [-18,0,18])for(const z of [-20,20]){box(.14,8,.14,M.dark,x,4,z,parent);sphere(.25,material(0xffdf91,{emissive:0xffdf91,emissiveIntensity:2}),x,8,z,parent);}for(let z=-20;z<20;z+=4)box(.15,.015,1.8,M.white,3,0,z,parent);
return {ground,lift,lever,bridge,weight,crane,cargo};}
export function updateFacility(view,s,t){view.lift.position.y=s.liftY;view.lever.position.y=1.3+s.liftY*.03;view.bridge.rotation.z=(1-s.bridge)*Math.PI/2;view.weight.position.set(s.weight.x,s.weight.y+.35,s.weight.z);view.crane.rotation.y=s.craneAngle;view.cargo.rotation.z=Math.sin(t*.0015+s.craneAngle)*.09;}
