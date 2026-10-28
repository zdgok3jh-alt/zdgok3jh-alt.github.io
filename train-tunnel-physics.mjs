// Length-contraction tunnel (05 / EINSTEIN, finale). Model units match the
// rest of the chapter: the train's rest length is L0 = 2 * SIM_L = 6 and the
// tunnel lengths are chosen so the threshold beta lands exactly on the
// chapter's speed steps (0.4 / 0.6 / 0.8). Judgement is a home-frame statement:
// the train fits when L0/gamma <= tunnel length.
import {gamma} from './train-physics.mjs?v=63';
import {SIM_L} from './train-comparison.mjs?v=68';
export {gamma};
export const TRAIN_LENGTH=2*SIM_L;
export const TUNNELS=[5.5,4.8,3.6];
export const BETA_CHOICES=[0,.2,.4,.6,.8];
export const TUNNEL_PREDICTIONS={rest:'止まっていても収まる',speed:'速ければ収まる',never:'どうやっても収まらない'};
export function contractedLength(beta){return TRAIN_LENGTH/gamma(beta);}
export function requiredBeta(tunnel){const r=tunnel/TRAIN_LENGTH;return Math.sqrt(Math.max(0,1-r*r));}
export function fits(beta,tunnel){return contractedLength(beta)<=tunnel+1e-9;}
// Display model for one run (home frame). The approach uses a fixed display
// speed -- a schematic, like the rest of the chapter -- while the judged
// physics is the contracted length above. frontX is the train's front end;
// the tunnel spans [0, tunnel]. Returns the phase so the renderer can flash
// on success or shake on impact.
export const TUNNEL_SPEED=2.4,TUNNEL_START=-3.4,TUNNEL_HIT_TIME=.55,TUNNEL_RETREAT_TIME=1.15;
export function tunnelRunAt(beta,tunnel,t){
 const len=contractedLength(beta),ok=fits(beta,tunnel),time=Math.max(0,t);
 const parkFront=len+(tunnel-len)*.5; // centred inside the tunnel
 const parkTime=(parkFront-TUNNEL_START)/TUNNEL_SPEED;
 if(ok){if(time<parkTime)return{frontX:TUNNEL_START+TUNNEL_SPEED*time,len,phase:'approach',done:false};
  return{frontX:parkFront,len,phase:'inside',done:true};}
 const hitTime=(tunnel-TUNNEL_START)/TUNNEL_SPEED; // front reaches the back wall
 if(time<hitTime)return{frontX:TUNNEL_START+TUNNEL_SPEED*time,len,phase:'approach',done:false};
 if(time<hitTime+TUNNEL_HIT_TIME)return{frontX:tunnel,len,phase:'hit',done:false};
 if(time<hitTime+TUNNEL_HIT_TIME+TUNNEL_RETREAT_TIME){const k=(time-hitTime-TUNNEL_HIT_TIME)/TUNNEL_RETREAT_TIME;return{frontX:tunnel+(TUNNEL_START-tunnel)*k*k,len,phase:'retreat',done:false};}
 return{frontX:TUNNEL_START,len,phase:'out',done:true};
}
export function tunnelRunDuration(beta,tunnel){const len=contractedLength(beta);if(fits(beta,tunnel))return (len+(tunnel-len)*.5-TUNNEL_START)/TUNNEL_SPEED+.5;return (tunnel-TUNNEL_START)/TUNNEL_SPEED+TUNNEL_HIT_TIME+TUNNEL_RETREAT_TIME+.3;}
export function newTunnelState(){return{stage:0,cleared:[false,false,false],attempts:[],prediction:null,won:false};}
export function recordTunnelAttempt(s,beta){const tunnel=TUNNELS[s.stage],ok=fits(beta,tunnel);s.attempts.push({tunnel,beta,ok,prediction:s.prediction});if(ok){s.cleared[s.stage]=true;if(s.cleared.every(Boolean))s.won=true;else{s.stage++;s.prediction=null;}}return ok;}
