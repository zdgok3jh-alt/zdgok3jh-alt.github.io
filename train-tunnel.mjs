// Tunnel stage page: prediction card, beta choice, and a schematic run in
// which the (contracted) train tries to fit inside a shorter tunnel. All
// judged numbers come from train-tunnel-physics.mjs; judgement is home-frame.
import {contractedLength,fits,tunnelRunAt,tunnelRunDuration,newTunnelState,recordTunnelAttempt,TUNNELS,BETA_CHOICES,TUNNEL_PREDICTIONS,TRAIN_LENGTH,TUNNEL_SPEED,TUNNEL_START,gamma} from './train-tunnel-physics.mjs?v=1';
const $=id=>document.getElementById(id);
const state=newTunnelState();
const css=document.createElement('style');css.textContent=`
#tunnelMain{position:fixed;inset:0;background:#102c39;display:flex;flex-direction:column;color:#edf4e9;padding:max(52px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));gap:7px}
#tunnelMain .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#tunnelMain button{width:auto;height:38px;border-radius:10px;padding:0 12px;font-size:12px}
#tunnelMain button:disabled{opacity:.35}
#tunnelMain button[aria-pressed=true]{background:#a7d7b3;color:#12333c}
#tunnelMain strong{font-size:14px;flex:1}
#tunnelMain canvas{width:100%;min-height:0;flex:1;border-radius:14px;background:#173643}
#tunnelMain p{margin:0;font-size:12px;line-height:1.6;color:#cee1dd;background:#173b49e8;padding:7px;border-radius:10px}
#tnAction{background:#a7d7b3;color:#12333c;font-weight:600}
#tnRun{background:#6a9e84;color:#fff;font-weight:600}
#tunnelPredict{position:fixed;inset:0;z-index:40;background:#102d3c99;display:grid;place-items:center;padding:24px;backdrop-filter:blur(6px)}#tunnelPredict[hidden]{display:none}
#tunnelPredict .card{max-width:470px;background:#143c49;border:1px solid #97c9c5;border-radius:22px;padding:28px;box-shadow:0 24px 80px #07192266}
#tunnelPredict h1{font-size:22px}#tunnelPredict p{font-size:15px;line-height:1.9;color:#d2e6e2}
#tunnelPredict .choices{display:flex;flex-direction:column;gap:8px;margin:10px 0}
#tunnelPredict .choices button{width:100%;height:auto;border-radius:12px;padding:13px;font-size:16px}
#tunnelPredict .choices button[aria-pressed=true]{background:#b1dab6;color:#143541}
#tunnelPredict .row{display:flex;gap:8px}#tunnelPredict .row button{width:auto;height:auto;border-radius:12px;padding:12px 20px;font-size:16px}
#tunnelPredict button:disabled{opacity:.35}
.dots{letter-spacing:.3em;font-size:13px}
@media(max-height:480px){#tunnelMain{gap:3px}#tunnelMain p{font-size:11px}#tunnelMain button{height:29px}}`;
document.head.append(css);
const main=document.createElement('section');main.id='tunnelMain';
main.innerHTML=`<div class="row"><strong id="tnTitle"></strong><span class="dots" id="tnDots"></span></div><canvas aria-label="トンネルへ進入する列車の模式図"></canvas><div class="row"><span>速さ</span><span id="tnBetas"></span><span id="tnLen"></span></div><div class="row"><span>見る立場</span><button id="tnViewHome" aria-pressed="true">ホーム（判定）</button><button id="tnViewTrain" aria-pressed="false">車内</button><button id="tnRun">走らせる</button><button id="tnAction" disabled>次のトンネルへ →</button></div><p id="tnFeedback" aria-live="polite"></p>`;
document.body.append(main);
const card=document.createElement('section');card.id='tunnelPredict';card.hidden=true;
card.innerHTML=`<div class="card"><small>05 / 山の駅 · 収縮トンネル</small><h1>まず、予想。</h1><p id="tpText"></p><div class="choices" id="tpChoices"></div><div class="row"><button id="tpGo" disabled>速さを選ぶ</button></div></div>`;
document.body.append(card);
const canvas=main.querySelector('canvas'),ctx=canvas.getContext('2d');
let beta=.4,view='home',phase='choose',runTime=0,recorded=false,last=0,picked=null,shake=0,shownStage=0;
// Rendering keeps showing the tunnel of the current/last run even after the
// state machine advances to the next stage on a clear.
const tunnel=()=>TUNNELS[shownStage];
for(const b of BETA_CHOICES){const btn=document.createElement('button');btn.textContent=b===0?'止まる':'β='+b.toFixed(1);btn.dataset.beta=b;btn.setAttribute('aria-pressed',String(b===beta));btn.onclick=()=>{if(phase==='running')return;beta=b;runTime=0;phase='choose';$('tnAction').disabled=true;$('tnBetas').querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed',String(o===btn)));syncLen();};$('tnBetas').append(btn);}
function syncLen(){$('tnLen').textContent=`その速さでの列車の長さ： ${contractedLength(beta).toFixed(2)}（トンネル ${tunnel().toFixed(1)}）`;}
function syncDots(){$('tnDots').textContent=state.cleared.map(c=>c?'●':'○').join('');}
function syncHeader(){$('tnTitle').textContent=`トンネル ${state.stage+1} / ${TUNNELS.length}（長さ ${tunnel().toFixed(1)}）`;syncDots();syncLen();}
for(const [key,label] of Object.entries(TUNNEL_PREDICTIONS)){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{picked=key;$('tpChoices').querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));$('tpGo').disabled=false;};$('tpChoices').append(b);}
function openPrediction(){picked=null;$('tpGo').disabled=true;$('tpChoices').querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed','false'));
 $('tpText').innerHTML=`列車の長さは ${TRAIN_LENGTH}。トンネル ${state.stage+1} の長さは ${tunnel().toFixed(1)} で、列車より短い。<br><strong>ホームから見て</strong>、列車はトンネルにすっぽり収まる？`;
 card.hidden=false;}
$('tpGo').onclick=()=>{state.prediction=picked;card.hidden=true;phase='choose';$('tnFeedback').textContent='速さを選んで「走らせる」。ホームから見た列車の長さが、トンネル以下になれば収まります。';};
function syncViewButtons(){$('tnViewHome').setAttribute('aria-pressed',String(view==='home'));$('tnViewTrain').setAttribute('aria-pressed',String(view==='train'));}
$('tnViewHome').onclick=()=>{view='home';syncViewButtons();};
$('tnViewTrain').onclick=()=>{view='train';syncViewButtons();};
$('tnRun').onclick=()=>{if(phase==='running'||state.won)return;phase='running';runTime=0;recorded=false;$('tnRun').disabled=true;$('tnAction').disabled=true;$('tnFeedback').textContent='走行中…';};
$('tnAction').onclick=()=>{if(phase!=='done')return;
 if(state.won){try{localStorage.setItem('cat-physics-tunnel-complete','1');}catch{} $('ending').hidden=false;return;}
 shownStage=state.stage;runTime=0;phase='choose';syncHeader();openPrediction();};
$('helpButton').onclick=()=>{$('help').hidden=false;};
$('closeHelp').onclick=()=>{$('help').hidden=true;};
$('reset').onclick=()=>location.reload();
$('continue').onclick=()=>{$('ending').hidden=true;};
const text=(s,x,y,size=12,color='#cde0dc')=>{ctx.fillStyle=color;ctx.font=`${size}px system-ui`;ctx.fillText(s,x,y);};
function drawCat(x,y,s,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,7*s,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-6*s,y-4*s);ctx.lineTo(x-4.5*s,y-9*s);ctx.lineTo(x-1.5*s,y-6*s);ctx.fill();ctx.beginPath();ctx.moveTo(x+6*s,y-4*s);ctx.lineTo(x+4.5*s,y-9*s);ctx.lineTo(x+1.5*s,y-6*s);ctx.fill();}
function drawHome(w,h){
 const T=tunnel(),run=tunnelRunAt(beta,T,runTime),len=run.len;
 const x0=-5.8,x1=8.6,X=x=> (x-x0)/(x1-x0)*w,horizon=h*.78;
 ctx.fillStyle='#173643';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#63818a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,horizon+16);ctx.lineTo(w,horizon+16);ctx.stroke();
 ctx.fillStyle='#607b80';for(let x=x0;x<x1;x+=1.4)ctx.fillRect(X(x),horizon+19,10,3);
 // Tunnel: pillars and a roof beam, opening spans [0, T].
 ctx.fillStyle='#3d6a72';ctx.fillRect(X(-.35),horizon-92,Math.max(3,(X(0)-X(-.35))),92);ctx.fillRect(X(T),horizon-92,Math.max(3,(X(T+.35)-X(T))),92);
 ctx.fillRect(X(-.35),horizon-92,(X(T+.35)-X(-.35)),16);
 ctx.fillStyle='#102c39';ctx.fillRect(X(0),horizon-76,X(T)-X(0),76);
 text(`トンネル ${T.toFixed(1)}`,X(T/2)-30, horizon-100,12,'#b8d4d6');
 // Train body.
 const fx=X(run.frontX),rx=X(run.frontX-len);
 const shx=run.phase==='hit'?Math.sin(performance.now()*.05)*3*(1-runTime%1):0;
 ctx.save();ctx.translate(shx,0);
 ctx.fillStyle=run.phase==='inside'?'#3f7d5a':'#2b5a68';ctx.fillRect(rx,horizon-34,fx-rx,30);
 ctx.strokeStyle='#a8d6cb';ctx.lineWidth=2;ctx.strokeRect(rx,horizon-34,fx-rx,30);
 drawCat(fx-12,horizon-20,.9,'#ffc17b');
 if(run.phase==='hit'){ctx.fillStyle='#ff9d7b';ctx.fillRect(fx-2,horizon-40,4,42);text('ドン！',fx-14,horizon-52,14,'#ff9d7b');}
 if(run.phase==='inside'){ctx.fillStyle='#a5f6cd';text('すっぽり！',X(T/2)-28,horizon-52,15,'#a5f6cd');}
 ctx.restore();
 text(`列車 ${len.toFixed(2)}`,rx,horizon-44,11,'#ffc17b');
 if(run.frontX-len<0&&['hit','retreat','out'].includes(run.phase))text('はみ出し',Math.max(2,rx-4),horizon+34,10,'#ff9d7b');
 text('ホームから',12,22,13);text(`列車の長さ ${len.toFixed(2)} ／ トンネル ${T.toFixed(1)}`,12,h-10,11,'#b8d4d6');
}
function drawTrain(w,h){
 const T=tunnel(),run=tunnelRunAt(beta,T,runTime),tLen=T/gamma(beta);
 const horizon=h*.78;ctx.fillStyle='#204450';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#63818a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,horizon+16);ctx.lineTo(w,horizon+16);ctx.stroke();
 ctx.fillStyle='#607b80';const off=-((runTime*TUNNEL_SPEED)%52);
 for(let x=(off%52+52)%52;x<w;x+=52)ctx.fillRect(x,horizon+19,10,3);
 // Train fixed: spans [12% , 12%+6 units]. Window is 9 units wide in px terms.
 const unit=w/9,tx0=w*.08,tx1=tx0+6*unit;
 ctx.fillStyle='#2b5a68';ctx.fillRect(tx0,horizon-34,tx1-tx0,30);ctx.strokeStyle='#a8d6cb';ctx.lineWidth=2;ctx.strokeRect(tx0,horizon-34,tx1-tx0,30);
 drawCat(tx1-14,horizon-20,.9,'#ffc17b');text(`列車 ${TRAIN_LENGTH.toFixed(1)}（いつも同じ）`,tx0,horizon-44,11,'#ffc17b');
 // Tunnel rushes in from the right, contracted to T/gamma.
 const prog=(run.frontX-TUNNEL_START); // 0 .. about T+3.4
 const tl=tx1+ (6.2-prog)*unit - tLen*unit, tr=tl+tLen*unit;
 ctx.fillStyle='#3d6a72';ctx.fillRect(tl,horizon-92,Math.max(3,.35*unit),92);ctx.fillRect(tr,horizon-92,Math.max(3,.35*unit),92);ctx.fillRect(tl,horizon-92,tr-tl+ .35*unit,16);
 text(`トンネル ${tLen.toFixed(2)} に縮む`,Math.max(4,tl),horizon-100,12,'#b8d4d6');
 text('車内から',12,22,13);text('判定はホームの立場で',12,h-10,11,'#b8d4d6');
}
function finishRun(){phase='done';$('tnRun').disabled=false;const T=tunnel(),len=contractedLength(beta),ok=fits(beta,T);
 const pred=state.prediction?TUNNEL_PREDICTIONS[state.prediction]:'―';
 if(!recorded){recorded=true;recordTunnelAttempt(state,beta);}
 if(ok){$('tnFeedback').textContent=`予想：『${pred}』／結果：β=${beta.toFixed(1)} では列車の長さ ${len.toFixed(2)}。トンネル ${T.toFixed(1)} にすっぽり収まった。${state.won?'3本全部クリア！':'次のトンネルはもっと短い。'}`;
  $('tnAction').textContent=state.won?'章クリア →':'次のトンネルへ →';$('tnAction').disabled=false;syncDots();}
 else{$('tnFeedback').textContent=`予想：『${pred}』／結果：β=${beta.toFixed(1)} では列車の長さ ${len.toFixed(2)}。トンネル ${T.toFixed(1)} から ${ (len-T).toFixed(2) } はみ出した。もっと速くすると、ホームからはもっと縮んで見える。`;
  $('tnAction').disabled=true;}}
function frame(stamp){const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
 if(phase==='running'&&card.hidden){const dur=tunnelRunDuration(beta,tunnel());runTime+=dt*dur/5;const run=tunnelRunAt(beta,tunnel(),runTime);if(run.done)finishRun();}
 const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
 if(r.width>0){if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);
  if(view==='home')drawHome(r.width,r.height);else drawTrain(r.width,r.height);}
 requestAnimationFrame(frame);}
syncHeader();openPrediction();
requestAnimationFrame(frame);
window.catTunnel={getState:()=>({...state,beta,view,phase,runTime})};
