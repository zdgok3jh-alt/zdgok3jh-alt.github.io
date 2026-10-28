// Simultaneity switch (challenge added to simultaneity.html): the player delays
// the rear emission by d (train-frame time) so that the two lamps light at the
// same home-frame moment and the door opens. Event times come from the same
// Lorentz transform as simultaneityEvents: t = gamma * (t' + beta * x' / c).
// Front photon leaves the centre at t'=0, the rear one at t'=d. With L/c = 1
// the winning delay is exactly d* = 2 * beta.
import {gamma} from './train-physics.mjs?v=63';
import {SIM_L,SIM_C} from './train-comparison.mjs?v=68';
export {gamma};
export const SWITCH_LEVELS=[.4,.6,.8];
export const SWITCH_TOLERANCE=.25; // allowed home-frame arrival gap, model seconds
export const SWITCH_MAX_DELAY=2;
export function switchAnswer(beta){return 2*beta*SIM_L/SIM_C;}
export function switchEvents(beta,d){
 const g=gamma(beta),oneWay=SIM_L/SIM_C;
 const frontTrain=oneWay,rearTrain=d+oneWay;
 const frontHome=g*oneWay*(1+beta),rearHome=g*(d+oneWay*(1-beta));
 return{beta,gamma:g,delay:d,
  emission:{front:{train:0,home:0},rear:{train:d,home:g*d}},
  arrivals:{front:{train:frontTrain,home:frontHome},rear:{train:rearTrain,home:rearHome}},
  gap:rearHome-frontHome};
}
export function judgeSwitch(beta,d){return Math.abs(switchEvents(beta,d).gap)<=SWITCH_TOLERANCE+1e-9;}
export function switchDuration(beta,d){const ev=switchEvents(beta,d);return Math.max(ev.arrivals.front.home,ev.arrivals.rear.home)+.6;}
// Photon positions relative to the train centre at frame time t.
// Home frame: the walls sit at +/-L/gamma and move with the train; each photon
// still travels at SIM_C. The rear photon is emitted later, from the moving
// centre, at home time gamma*d (its emission event has x'=0).
export function switchAt(beta,d,t,view='home'){
 const ev=switchEvents(beta,d),time=Math.max(0,t);
 if(view==='train'){
  const frontX=Math.min(SIM_L,SIM_C*time);
  const rearX=time<ev.emission.rear.train?0:-Math.min(SIM_L,SIM_C*(time-ev.emission.rear.train));
  return{front:{x:frontX,arrived:time>=ev.arrivals.front.train,emitted:true},rear:{x:rearX,arrived:time>=ev.arrivals.rear.train,emitted:time>=ev.emission.rear.train},frontWall:SIM_L,rearWall:-SIM_L,centreX:0};
 }
 const wall=SIM_L/ev.gamma,centreX=beta*SIM_C*time;
 const frontX=Math.min(centreX+wall,SIM_C*time);
 const rearEmit=ev.emission.rear.home,rearStart=beta*SIM_C*rearEmit;
 const rearX=time<rearEmit?rearStart:Math.max(centreX-wall,rearStart-SIM_C*(time-rearEmit));
 return{front:{x:frontX,arrived:time>=ev.arrivals.front.home,emitted:true},rear:{x:rearX,arrived:time>=ev.arrivals.rear.home,emitted:time>=rearEmit},frontWall:centreX+wall,rearWall:centreX-wall,centreX};
}
export function newSwitchState(){return{level:0,cleared:[false,false,false],won:false};}
export function clearSwitchLevel(s,beta,d){const i=SWITCH_LEVELS.findIndex(b=>Math.abs(b-beta)<.01);if(i<0||!judgeSwitch(beta,d))return false;s.cleared[i]=true;if(s.cleared.every(Boolean))s.won=true;return true;}
