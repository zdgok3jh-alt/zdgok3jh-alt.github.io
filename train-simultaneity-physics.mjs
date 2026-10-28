// State machine for the simultaneity stage (05 / EINSTEIN, part 2).
// Mirrors train-physics.mjs (newTrainState / startTrain / finishReview) so the
// chapter feels identical: assemble -> predict -> cruise -> review -> complete.
// All times are model seconds (train-missions units: L=3, c=3, one-way = 1.00).
import {gamma} from './train-physics.mjs?v=63';
import {simultaneityEvents} from './train-comparison.mjs?v=68';
export {gamma,simultaneityEvents};
export const PART_NAMES=['発信器','前のランプ','後ろのランプ'];
export const PREDICTIONS={rear:'後ろが先',same:'同時',front:'前が先'};
export const GAP_PREDICTIONS={grow:'大きくなる',same:'同じ',shrink:'小さくなる'};
export const RUN_PAD=.5; // model seconds of stillness after the last arrival
export function runDuration(beta){return simultaneityEvents(beta).arrivals.front.home+RUN_PAD;}
export function newSimultaneityState(){return{installed:[false,false,false],placed:[null,null,null],beta:.4,runBeta:.4,phase:'assembly',elapsed:0,proper:0,trainX:0,view:'train',seen:{train:false,home:false},prediction:null,gapPrediction:null,trials:[],gateOpen:false,won:false};}
export function setSimView(s,view){if(!['train','home'].includes(view))return;s.view=view;if(['cruise','review'].includes(s.phase))s.seen[view]=true;finishSimReview(s);}
export function setPrediction(s,choice){if(!(choice in PREDICTIONS))return false;s.prediction=choice;return true;}
export function setGapPrediction(s,choice){if(!(choice in GAP_PREDICTIONS))return false;s.gapPrediction=choice;return true;}
export function startRun(s){if(!s.installed.every(Boolean)||s.phase==='cruise'||s.gateOpen)return false;if(!s.prediction)return false;if(s.trials.some(t=>Math.abs(t.beta-s.beta)<.01))return false;s.phase='cruise';s.runBeta=s.beta;s.elapsed=s.proper=s.trainX=0;s.seen={train:false,home:false};s.seen[s.view]=true;return true;}
export function stepSimultaneity(s,dt){if(s.phase==='assembly'&&s.installed.every(Boolean))s.phase='ready';if(s.phase==='cruise'){const duration=runDuration(s.runBeta),rate=duration/12;s.elapsed=Math.min(duration,s.elapsed+dt*rate);s.proper=s.elapsed/gamma(s.runBeta);s.trainX=s.runBeta*7*s.elapsed;if(s.elapsed>=duration){s.phase='review';finishSimReview(s);}}}
// A trial counts only when the run was watched from both viewpoints and both
// arrival moments were recorded in the review overlay (same rule as finishReview).
export function recordTrial(s,record){if(s.phase!=='review'||!s.seen.train||!s.seen.home)return false;const ev=simultaneityEvents(s.runBeta);if(Math.abs(record.rear-ev.arrivals.rear.home)>.13||Math.abs(record.front-ev.arrivals.front.home)>.13)return false;if(!s.trials.some(t=>Math.abs(t.beta-s.runBeta)<.01))s.trials.push({beta:s.runBeta,rear:record.rear,front:record.front,prediction:s.prediction,gapPrediction:s.gapPrediction});finishSimReview(s);return true;}
function finishSimReview(s){if(s.phase!=='review'||!s.seen.train||!s.seen.home)return;if(!s.trials.some(t=>Math.abs(t.beta-s.runBeta)<.01))return;if(s.trials.some(t=>t.beta<.6)&&s.trials.some(t=>t.beta>.6)){s.gateOpen=true;s.phase='complete';}}
export function resetRun(s){if(s.gateOpen||s.phase!=='review')return;s.phase='ready';s.elapsed=s.proper=s.trainX=0;s.prediction=null;s.gapPrediction=null;s.seen={train:false,home:false};}
