// Race stage physics (05 / EINSTEIN, intro): the cat runs from the rear of the
// car to the front while a light pulse races the same course. Model units match
// train-comparison.mjs (half-length L=3, c=3), so the course is 2L=6 long.
// The cat's in-train speed is 0.45c -- the same "everyday object" speed the
// comparison overlay uses for the ball. In the home frame the cat's speed is
// the relativistic sum (u+v)/(1+uv/c^2); the light stays at c in both frames.
import {gamma} from './train-physics.mjs?v=63';
import {SIM_L,SIM_C} from './train-comparison.mjs?v=68';
export {gamma};
export const RACE_U_FRAC=.45; // cat speed as a fraction of c, in the train frame
export const RACE_DISTANCE=2*SIM_L;
export const RACE_U=RACE_U_FRAC*SIM_C;
export const RACE_BETAS=[.4,.8];
export const RACE_PREDICTIONS={faster:'光も速く見える',same:'光は同じ速さ',cat:'猫が光に勝つ'};
export const RACE_GAP_PREDICTIONS={closer:'もっと光に近づく',samesame:'差は同じ',wider:'かえって差が開く'};
// Relativistic velocity addition in model units (c = SIM_C).
export function addVelocity(u,v){return (u+v)/(1+u*v/(SIM_C*SIM_C));}
export function raceEvents(beta){
 const g=gamma(beta),v=beta*SIM_C,w=addVelocity(RACE_U,v),span=RACE_DISTANCE/g;
 return{beta,gamma:g,trainSpeed:v,catTrainSpeed:RACE_U,catHomeSpeed:w,naiveSum:RACE_U+v,contractedSpan:span,
  train:{light:RACE_DISTANCE/SIM_C,cat:RACE_DISTANCE/RACE_U},
  home:{light:span/(SIM_C-v),cat:span/(w-v)}};
}
export function raceDuration(beta){return raceEvents(beta).home.cat+.5;}
// Positions at frame time t (each frame is read with its own clock).
// x is measured from the start line: the rear wall sits at rearX, the goal
// (front wall) at frontX, and both racers are clamped to the goal on arrival.
export function raceAt(beta,t,view='home'){
 const ev=raceEvents(beta),time=Math.max(0,t);
 if(view==='train'){return{rearX:0,frontX:RACE_DISTANCE,lightX:Math.min(RACE_DISTANCE,SIM_C*time),catX:Math.min(RACE_DISTANCE,RACE_U*time),lightSpeed:SIM_C,catSpeed:RACE_U,lightArrived:time>=ev.train.light,catArrived:time>=ev.train.cat};}
 const rearX=ev.trainSpeed*time,frontX=ev.contractedSpan+rearX;
 return{rearX,frontX,lightX:Math.min(frontX,SIM_C*time),catX:Math.min(frontX,ev.catHomeSpeed*time),lightSpeed:SIM_C,catSpeed:ev.catHomeSpeed,lightArrived:time>=ev.home.light,catArrived:time>=ev.home.cat};
}
export function newRaceState(){return{stage:0,beta:RACE_BETAS[0],prediction:null,gapPrediction:null,results:[],won:false};}
export function recordRaceResult(s){if(s.results.some(r=>Math.abs(r.beta-s.beta)<.01))return false;const ev=raceEvents(s.beta);s.results.push({beta:s.beta,prediction:s.prediction,gapPrediction:s.gapPrediction,train:ev.train,home:ev.home,catHomeSpeed:ev.catHomeSpeed,naiveSum:ev.naiveSum});if(s.stage<RACE_BETAS.length-1){s.stage++;s.beta=RACE_BETAS[s.stage];s.prediction=null;s.gapPrediction=null;}else s.won=true;return true;}
