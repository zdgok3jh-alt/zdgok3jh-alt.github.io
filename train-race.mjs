// Race stage page: prediction card + two-panel observation (train frame on
// top, home frame below), drawn on a 2D canvas in the style of the chapter's
// comparison overlay. All numbers come from train-race-physics.mjs.
import {gamma,raceEvents,raceAt,raceDuration,newRaceState,recordRaceResult,RACE_BETAS,RACE_PREDICTIONS,RACE_GAP_PREDICTIONS} from './train-race-physics.mjs?v=1';
import {SIM_C} from './train-comparison.mjs?v=68';
const $=id=>document.getElementById(id);
const state=newRaceState();
const css=document.createElement('style');css.textContent=`
#raceMain{position:fixed;inset:0;background:#102c39;display:flex;flex-direction:column;color:#edf4e9;padding:max(52px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));gap:7px}
#raceMain .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#raceMain button{width:auto;height:38px;border-radius:10px;padding:0 12px;font-size:12px}
#raceMain button:disabled{opacity:.35}
#raceMain strong{font-size:14px;flex:1}
#raceMain canvas{width:100%;min-height:0;flex:1;border-radius:14px}
#raceMain p{margin:0;font-size:12px;line-height:1.6;color:#cee1dd;background:#173b49e8;padding:7px;border-radius:10px}
#raceMain input{width:100%;accent-color:#a7d7b3}
#raceAction{background:#a7d7b3;color:#12333c;font-weight:600}
#racePredict{position:fixed;inset:0;z-index:40;background:#102d3c99;display:grid;place-items:center;padding:24px;backdrop-filter:blur(6px)}#racePredict[hidden]{display:none}
#racePredict .card{max-width:470px;background:#143c49;border:1px solid #97c9c5;border-radius:22px;padding:28px;box-shadow:0 24px 80px #07192266}
#racePredict h1{font-size:22px}#racePredict p{font-size:15px;line-height:1.9;color:#d2e6e2}
#racePredict .choices{display:flex;flex-direction:column;gap:8px;margin:10px 0}
#racePredict .choices button{width:100%;height:auto;border-radius:12px;padding:13px;font-size:16px}
#racePredict .choices button[aria-pressed=true]{background:#b1dab6;color:#143541}
#racePredict .row{display:flex;gap:8px}#racePredict .row button{width:auto;height:auto;border-radius:12px;padding:12px 20px;font-size:16px}
#racePredict button:disabled{opacity:.35}
#raceChip{position:fixed;top:118px;left:50%;transform:translateX(-50%);background:#173b49cc;color:#fff3cf;padding:6px 14px;border-radius:999px;font-size:12px;pointer-events:none;z-index:5;white-space:nowrap}
#raceChip[hidden]{display:none}
@media(max-height:480px){#raceMain{gap:3px}#raceMain p{font-size:11px}#raceMain button{height:29px}}`;
document.head.append(css);
const main=document.createElement('section');main.id='raceMain';
main.innerHTML=`<div class="row"><strong id="rcTitle"></strong><span id="rcBeta"></span></div><canvas aria-label="上は車内、下はホームから見た競争"></canvas><input id="rcTime" type="range" min="0" step="0.01" value="0" aria-label="レースの時間"><div class="row"><button id="rcBack">◀ 1コマ</button><button id="rcPlay">Ⅱ 一時停止</button><button id="rcStep">1コマ ▶</button><button id="rcRetry">↻ 最初から</button><button id="rcAction" disabled>結果を見る</button></div><p id="rcFeedback" aria-live="polite"></p>`;
document.body.append(main);
const card=document.createElement('section');card.id='racePredict';card.hidden=true;
card.innerHTML=`<div class="card"><small>05 / 山の駅 · 光と競争</small><h1>まず、予想。</h1><p id="rpText"></p><div class="choices" id="rpChoices"></div><div id="rpGap" hidden><p>速い列車では、光と猫の到着の差はどうなる？</p><div class="choices" id="rpGapChoices"></div></div><div class="row"><button id="rpGo" disabled>レース開始</button></div></div>`;
document.body.append(card);
const chip=document.createElement('div');chip.id='raceChip';chip.hidden=true;document.body.append(chip);
const canvas=main.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=$('rcTime');
let time=0,playing=false,finished=false,last=0,picked=null,pickedGap=null;
const beta=()=>state.beta,end=()=>raceDuration(beta());
const frac=v=>(v/SIM_C).toFixed(2);
function buildChoices(box,dict,cb){box.innerHTML='';for(const [key,label] of Object.entries(dict)){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{cb(key);box.querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));refreshGo();};box.append(b);}}
buildChoices($('rpChoices'),RACE_PREDICTIONS,k=>picked=k);
buildChoices($('rpGapChoices'),RACE_GAP_PREDICTIONS,k=>pickedGap=k);
const needsGap=()=>state.stage===1;
function refreshGo(){$('rpGo').disabled=!picked||(needsGap()&&!pickedGap);}
function openPrediction(){picked=null;pickedGap=null;$('rpGap').hidden=!needsGap();$('rpChoices').querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed','false'));$('rpGapChoices').querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed','false'));
 $('rpText').innerHTML=state.stage===0?'列車の後ろから、猫と光が先頭まで競争します。<br><strong>ホームから見ると</strong>、光は列車の分だけ速く見える？':'今度は速い列車（β=0.8）でもう一度競争。<strong>ホームから見ると</strong>、光は列車の分だけ速く見える？';
 refreshGo();card.hidden=false;playing=false;}
$('rpGo').onclick=()=>{state.prediction=picked;if(needsGap())state.gapPrediction=pickedGap;card.hidden=true;configure();};
function configure(){time=0;playing=true;finished=false;slider.max=end();slider.value=0;$('rcAction').disabled=true;
 $('rcTitle').textContent=state.stage===0?'レース1 / ゆっくりした列車':'レース2 / 速い列車';
 $('rcBeta').textContent='β = '+beta().toFixed(1);
 $('rcFeedback').textContent=state.stage===0?'上の画面は車内、下の画面はホーム。同じ競争を、2つの立場で見比べます。':'速い列車では、猫はもっと光に近づける？ 到着の差に注目。';
 chip.hidden=false;chip.textContent='予想：『'+RACE_PREDICTIONS[state.prediction]+'』';}
$('rcPlay').onclick=()=>{if(time>=end()){time=0;finished=false;$('rcAction').disabled=true;playing=true;}else playing=!playing;};
$('rcRetry').onclick=()=>{time=0;finished=false;$('rcAction').disabled=true;playing=true;};
$('rcBack').onclick=()=>{time=Math.max(0,time-.05);playing=false;};
$('rcStep').onclick=()=>{time=Math.min(end(),time+.05);playing=false;};
slider.oninput=()=>{time=+slider.value;playing=false;if(time<end()){finished=false;$('rcAction').disabled=true;}};
$('rcAction').onclick=()=>{if(!finished)return;const wasStage=state.stage;recordRaceResult(state);
 if(wasStage===0){openPrediction();}
 else{chip.hidden=true;try{localStorage.setItem('cat-physics-race-complete','1');}catch{} $('ending').hidden=false;}};
$('helpButton').onclick=()=>{$('help').hidden=false;};
$('closeHelp').onclick=()=>{$('help').hidden=true;};
$('reset').onclick=()=>location.reload();
$('continue').onclick=()=>{$('ending').hidden=true;};
const text=(s,x,y,size=12,color='#cde0dc')=>{ctx.fillStyle=color;ctx.font=`${size}px system-ui`;ctx.fillText(s,x,y);};
function drawCat(x,y,s,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,7*s,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-6*s,y-4*s);ctx.lineTo(x-4.5*s,y-9*s);ctx.lineTo(x-1.5*s,y-6*s);ctx.fill();ctx.beginPath();ctx.moveTo(x+6*s,y-4*s);ctx.lineTo(x+4.5*s,y-9*s);ctx.lineTo(x+1.5*s,y-6*s);ctx.fill();}
function panel(px,py,w,h,view){
 const b=beta(),ev=raceEvents(b),ft=view==='train'?time/gamma(b):time,pos=raceAt(b,ft,view);
 ctx.save();ctx.beginPath();ctx.rect(px,py,w,h);ctx.clip();ctx.fillStyle=view==='train'?'#204450':'#173643';ctx.fillRect(px,py,w,h);
 const horizon=py+h*.72;
 // Camera: the train view is fixed; the home view tracks the goal wall so the
 // chase stays on screen while the start line scrolls away.
 const winW=8.5;let camX=-1.2;if(view==='home')camX=Math.max(-1.2,pos.frontX-winW*.7);
 const X=x=>px+(x-camX)/winW*w;
 ctx.strokeStyle='#63818a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,horizon+16);ctx.lineTo(px+w,horizon+16);ctx.stroke();
 ctx.fillStyle='#607b80';const spacing=1.4;const off=view==='train'?-((ft*b*SIM_C)%spacing):0;
 for(let i=-2;i<winW/spacing+3;i++){const wx=camX+i*spacing+(view==='train'?off:0);if(wx<camX||wx>camX+winW)continue;ctx.fillRect(X(wx),horizon+19,10,3);}
 // Start line and train body.
 ctx.strokeStyle='#8faeb3';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(X(pos.rearX),horizon-34);ctx.lineTo(X(pos.rearX),horizon+14);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#2b5a68';ctx.fillRect(X(pos.rearX),horizon-30,X(pos.frontX)-X(pos.rearX),26);
 ctx.strokeStyle='#a8d6cb';ctx.lineWidth=2;ctx.strokeRect(X(pos.rearX),horizon-30,X(pos.frontX)-X(pos.rearX),26);
 text('電車',X(pos.rearX)+4,horizon-36,10);
 // Goal flash on arrival.
 if(pos.lightArrived){ctx.fillStyle='#a5f6cd55';ctx.fillRect(X(pos.frontX)-3,horizon-34,6,48);}
 // Light pulse and cat.
 ctx.shadowColor='#a5f6cd';ctx.shadowBlur=12;ctx.fillStyle='#a5f6cd';ctx.beginPath();ctx.arc(X(pos.lightX),horizon-18,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 drawCat(X(pos.catX),horizon-12,1,'#ffc17b');
 // Arrival stamps.
 if(pos.lightArrived)text('光 到着 '+(view==='train'?ev.train.light:ev.home.light).toFixed(2),X(pos.frontX)-64,horizon+34,10,'#a5f6cd');
 if(pos.catArrived)text('猫 到着 '+(view==='train'?ev.train.cat:ev.home.cat).toFixed(2),X(pos.frontX)-64,horizon+47,10,'#ffc17b');
 text(view==='train'?'車内から':'ホームから',px+12,py+20,13);
 text((view==='train'?'車内の時計 ':'ホームの時計 ')+ft.toFixed(2)+' 秒',px+w-118,py+20,11);
 text(`光の速さ ${frac(pos.lightSpeed)} c`,px+12,py+h-24,11,'#a5f6cd');
 text(`猫の速さ ${frac(pos.catSpeed)} c`,px+12,py+h-9,11,'#ffc17b');
 ctx.restore();}
function finish(){finished=true;playing=false;$('rcAction').disabled=false;const ev=raceEvents(beta());
 const pred=RACE_PREDICTIONS[state.prediction];
 if(state.stage===0){$('rcFeedback').textContent=`予想：『${pred}』／結果：光は両方とも 1.00 c。猫（ホーム）${frac(ev.catHomeSpeed)} c ＜ 足し算の ${frac(ev.naiveSum)} c。到着 車内 光 ${ev.train.light.toFixed(2)}・猫 ${ev.train.cat.toFixed(2)} ／ ホーム 光 ${ev.home.light.toFixed(2)}・猫 ${ev.home.cat.toFixed(2)}`;
  $('rcAction').textContent='次のレースへ →';}
 else{const prev=state.results[0],gapPrev=prev.home.cat-prev.home.light,gapNow=ev.home.cat-ev.home.light;
  $('rcFeedback').textContent=`予想：『${pred}』／結果：猫 ${frac(ev.catHomeSpeed)} c（足し算の ${frac(ev.naiveSum)} c に届かず）、光は 1.00 c。到着の差 ${gapPrev.toFixed(2)} 秒 → ${gapNow.toFixed(2)} 秒に開いた。`;
  $('rcAction').textContent='結果をまとめる →';}}
function frame(stamp){const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
 if(playing&&card.hidden){time=Math.min(end(),time+dt*end()/12);if(time>=end()&&!finished)finish();}
 slider.value=time;$('rcPlay').textContent=playing?'Ⅱ 一時停止':(time>=end()?'↻ もう一度':'▶ 再生');
 const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
 if(r.width>0){if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);
  const w=r.width,h=(r.height-6)/2;panel(0,0,w,h,'train');panel(0,h+6,w,h,'home');}
 requestAnimationFrame(frame);}
openPrediction();
requestAnimationFrame(frame);
window.catRace={getState:()=>({...state,time,finished}),openPrediction};
