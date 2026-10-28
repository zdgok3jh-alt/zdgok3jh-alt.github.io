// Inertial cruise segment. c is scaled for visibility; beta is v/c, never a real train speed.
export const LIGHT_SPEED=10,MIRROR_GAP=3,CRUISE_TIME=16;
export const gamma=beta=>1/Math.sqrt(1-beta*beta);
export function newTrainState(){return{installed:[false,false],placed:[null,null],beta:.4,runBeta:.4,phase:'assembly',elapsed:0,proper:0,trainX:0,view:'train',seen:{train:false,home:false},trials:[],gateOpen:false,won:false};}
export function setView(s,view){if(!['train','home'].includes(view))return;s.view=view;if(['cruise','review'].includes(s.phase))s.seen[view]=true;finishReview(s);}
export function startTrain(s){if(!s.installed.every(Boolean)||s.phase==='cruise'||s.gateOpen)return false;s.phase='cruise';s.runBeta=s.beta;s.elapsed=s.proper=s.trainX=0;s.seen={train:false,home:false};s.seen[s.view]=true;return true;}
function finishReview(s){if(s.phase!=='review'||!s.seen.train||!s.seen.home)return;if(!s.trials.some(t=>Math.abs(t.beta-s.runBeta)<.01))s.trials.push({beta:s.runBeta,home:s.elapsed,train:s.proper});if(s.trials.some(t=>t.beta<.6)&&s.trials.some(t=>t.beta>.6)){s.gateOpen=true;s.phase='complete';}}
export function stepTrain(s,dt){if(s.phase==='assembly'&&s.installed.every(Boolean))s.phase='ready';if(s.phase==='cruise'){s.elapsed=Math.min(CRUISE_TIME,s.elapsed+dt);s.proper=s.elapsed/gamma(s.runBeta);s.trainX=s.runBeta*LIGHT_SPEED*s.elapsed;if(s.elapsed>=CRUISE_TIME){s.phase='review';finishReview(s);}}}
export function photonAt(beta,time,view='home'){const proper=time/gamma(beta),distance=(proper*LIGHT_SPEED)%(2*MIRROR_GAP),y=distance<=MIRROR_GAP?distance:2*MIRROR_GAP-distance;return{x:view==='home'?beta*LIGHT_SPEED*time:0,y};}
// Exact reflection vertices from launch onward, retained for the whole observation.
export function photonTrail(beta,elapsed,view='home'){const half=MIRROR_GAP*gamma(beta)/LIGHT_SPEED,points=[];for(let i=0;i*half<elapsed-1e-8;i++)points.push(photonAt(beta,i*half,view));points.push(photonAt(beta,elapsed,view));return points;}
