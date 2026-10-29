// Prediction card + frame-stepping record overlay for the simultaneity stage.
// Structure follows train-missions.mjs (createMissions): a transparent overlay
// drives the 3D observation through onSample, with a slider, step buttons and
// judged record buttons (tolerance = the missions' returned(), +/-0.13).
import {gamma,setPrediction,setGapPrediction,recordTrial,PREDICTIONS,GAP_PREDICTIONS} from './train-simultaneity-physics.mjs?v=1';
import {simultaneityEvents,photonPairAt} from './train-comparison.mjs?v=68';
export const recordOk=(time,arrival)=>Math.abs(time-arrival)<=.13;
export function createSimultaneityMissions({state,onSample,onOpen,onClose,onPredictionDone}){
 const css=document.createElement('style');css.textContent=`
 #simMission{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;justify-content:flex-end;background:transparent;pointer-events:none;color:#eef4e7;padding:max(10px,env(safe-area-inset-top)) 10px max(16px,env(safe-area-inset-bottom));gap:7px}#simMission[hidden]{display:none}#simMission .row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:#173b49e8;padding:7px;border-radius:10px}#simMission strong{flex:1;font-size:14px}#simMission button{border-radius:10px;width:auto;height:38px;padding:0 11px;font-size:12px;pointer-events:auto}#simMission button:disabled{opacity:.35}#simMission button[aria-pressed=true]{background:#b1dab6;color:#143541}#simMission p{margin:0;font-size:12px;line-height:1.5;background:#173b49e8;padding:7px;border-radius:10px}#simMission input{width:100%;accent-color:#a8d6cb;pointer-events:auto}#simMission .label{position:absolute;left:12px;background:#173b49cf;padding:6px 10px;border-radius:9px;font-size:12px;pointer-events:none}#simMission .inside{top:96px}#simMission .outside{top:48px}#simMission .hint{color:#bcd2d1;font-size:10px;background:#173b49e8}#simMission .recDone{background:#6a9e84!important;color:#fff}
 #predictCard{position:fixed;inset:0;z-index:40;background:#102d3c99;display:grid;place-items:center;padding:24px;backdrop-filter:blur(6px)}#predictCard[hidden]{display:none}#predictCard .card{max-width:470px;background:#143c49;border:1px solid #97c9c5;border-radius:22px;padding:28px;box-shadow:0 24px 80px #07192266}#predictCard h1{font-size:22px;font-weight:600}#predictCard p{font-size:15px;line-height:1.9;color:#d2e6e2}#predictCard .choices{display:flex;flex-direction:column;gap:8px;margin:10px 0}#predictCard .choices button{width:100%;height:auto;border-radius:12px;padding:13px;font-size:16px}#predictCard .choices button[aria-pressed=true]{background:#b1dab6;color:#143541}#predictCard .row{display:flex;gap:8px;flex-wrap:wrap}#predictCard .row button{width:auto;height:auto;border-radius:12px;padding:12px 20px;font-size:16px}#predictCard button:disabled{opacity:.35}
 #predictChip{position:fixed;top:118px;left:50%;transform:translateX(-50%);background:#173b49cc;color:#fff3cf;padding:6px 14px;border-radius:999px;font-size:12px;pointer-events:none;z-index:5;white-space:nowrap}#predictChip[hidden]{display:none}
 body:has(#simMission:not([hidden])) header,body:has(#simMission:not([hidden])) .viewSwitch,body:has(#simMission:not([hidden])) #simOpen,body:has(#predictCard:not([hidden])) .viewSwitch{display:none!important}
 @media(max-height:480px){#simMission button{height:29px}#simMission p{font-size:11px}}`;
 document.head.append(css);
 // --- Prediction card ---
 const card=document.createElement('section');card.id='predictCard';card.hidden=true;
 card.innerHTML=`<div class="card"><small>05 / 山の駅 · 同時の実験</small><h1>まず、予想。</h1><p>列車の中央から、光を前と後ろへ同時に発射します。</p><p><strong>ホームから見ると</strong>、光はどちらのランプに先に着く？</p><div class="choices" id="pcChoices"></div><div id="pcGap" hidden><p>速い列車では、到着の差はどうなる？</p><div class="choices" id="pcGapChoices"></div></div><div class="row"><button id="pcGo" disabled>走行を始める</button><button id="pcCancel">やめる</button></div></div>`;
 document.body.append(card);
 const chip=document.createElement('div');chip.id='predictChip';chip.hidden=true;document.body.append(chip);
 const pcChoices=card.querySelector('#pcChoices'),pcGap=card.querySelector('#pcGap'),pcGapChoices=card.querySelector('#pcGapChoices'),pcGo=card.querySelector('#pcGo');
 let picked=null,pickedGap=null;
 for(const [key,label] of Object.entries(PREDICTIONS)){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{picked=key;pcChoices.querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));refreshGo();};pcChoices.append(b);}
 for(const [key,label] of Object.entries(GAP_PREDICTIONS)){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{pickedGap=key;pcGapChoices.querySelectorAll('button').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));refreshGo();};pcGapChoices.append(b);}
 const needsGap=()=>state.beta>.6&&!state.trials.some(t=>t.beta>.6);
 function refreshGo(){pcGo.disabled=!picked||(needsGap()&&!pickedGap);}
 function openPrediction(){picked=state.prediction;pickedGap=state.gapPrediction;pcGap.hidden=!needsGap();pcChoices.querySelectorAll('button').forEach((o,i)=>o.setAttribute('aria-pressed',String(Object.keys(PREDICTIONS)[i]===picked)));pcGapChoices.querySelectorAll('button').forEach((o,i)=>o.setAttribute('aria-pressed',String(Object.keys(GAP_PREDICTIONS)[i]===pickedGap)));refreshGo();card.hidden=false;onOpen();}
 function closePrediction(){card.hidden=true;onClose();}
 pcGo.onclick=()=>{setPrediction(state,picked);if(needsGap())setGapPrediction(state,pickedGap);card.hidden=true;onPredictionDone();};
 card.querySelector('#pcCancel').onclick=closePrediction;
 // --- Review / record overlay ---
 const root=document.createElement('section');root.id='simMission';root.hidden=true;
 root.innerHTML=`<div class="label outside" id="smOutside"></div><div class="label inside" id="smInside"></div><div class="row"><strong id="smTitle"></strong><button id="smClose">駅へ ×</button></div><p id="smGoal"></p><div class="row"><span>見る立場</span><button id="smViewHome" aria-pressed="true">ホーム（記録）</button><button id="smViewTrain" aria-pressed="false">車内（見直し）</button></div><input id="smTime" type="range" min="0" step="0.025" value="0" aria-label="実験の時間"><div class="row"><button id="smBack">◀ 1コマ</button><button id="smPlay">▶ 再生</button><button id="smStep">1コマ ▶</button><button id="smRetry">↻</button><button id="smRear">後ろが点いた！</button><button id="smFront">前が点いた！</button></div><p id="smFeedback" aria-live="polite"></p><p class="hint">到着は、ランプのそばの時計がその場で記録します。目に届くまでの時間差ではありません。光の速さは前後とも同じ。変わるのは到着の時刻だけです。</p><div class="row"><button id="smAction" disabled>駅へ戻る</button></div>`;
 document.body.append(root);
 const openButton=document.createElement('button');openButton.id='simOpen';openButton.textContent='記録を見直す';openButton.style.cssText='position:fixed;right:12px;bottom:115px;width:auto;height:38px;border-radius:10px;font-size:12px;padding:0 12px;z-index:6';openButton.hidden=true;document.body.append(openButton);
 const $=id=>root.querySelector('#'+id);
 let time=0,playing=false,view='home',records={rear:null,front:null},success=false,autoOpened=false,last=0;
 const ev=()=>simultaneityEvents(state.runBeta);
 const end=()=>ev().arrivals.front.home+.5;
 function configure(){time=0;playing=true;view='home';records={rear:null,front:null};success=false;$('smTime').max=end();$('smTime').value=0;$('smAction').disabled=true;$('smRear').disabled=false;$('smFront').disabled=false;$('smRear').classList.remove('recDone');$('smFront').classList.remove('recDone');$('smTitle').textContent=state.runBeta<.6?'実験1 / ゆっくりした列車':'実験2 / 速い列車';$('smGoal').textContent='光が前後へ同時発射。ランプが点いた時刻を記録しよう。';$('smFeedback').textContent='片道の到着を記録します（約12秒に引き伸ばし中）。';syncViewButtons();}
 function syncViewButtons(){$('smViewHome').setAttribute('aria-pressed',String(view==='home'));$('smViewTrain').setAttribute('aria-pressed',String(view==='train'));}
 function open(){root.hidden=false;onOpen();configure();}
 openButton.onclick=open;
 $('smClose').onclick=()=>{root.hidden=true;playing=false;onSample(null);onClose();};
 $('smViewHome').onclick=()=>{view='home';syncViewButtons();};
 $('smViewTrain').onclick=()=>{view='train';syncViewButtons();};
 $('smPlay').onclick=()=>{if(time>=end()){time=0;playing=true;}else playing=!playing;};
 $('smRetry').onclick=configure;
 $('smBack').onclick=()=>{time=Math.max(0,time-.05);playing=false;};
 $('smStep').onclick=()=>{time=Math.min(end(),time+.05);playing=false;};
 $('smTime').oninput=()=>{time=+$('smTime').value;playing=false;};
 $('smAction').onclick=()=>{if(!success)return;root.hidden=true;playing=false;onSample(null);onClose();};
 function tryRecord(which){if(success||records[which]!==null)return;if(view!=='home'){$('smFeedback').textContent='記録は「ホーム」の立場で。視点を切り替えよう。';return;}
  const arrival=ev().arrivals[which].home;
  if(recordOk(time,arrival)){records[which]=time;const btn=which==='rear'?$('smRear'):$('smFront');btn.disabled=true;btn.classList.add('recDone');$('smFeedback').textContent=(which==='rear'?'後ろ':'前')+`のランプ：${time.toFixed(2)} 秒で記録しました。`;if(records.rear!==null&&records.front!==null)finish();}
  else if(time<arrival)$('smFeedback').textContent='まだ点いていないみたい。もう少し進めてみよう。';
  else $('smFeedback').textContent='もう点いています。少し戻って、点いた瞬間を探そう。';}
 $('smRear').onclick=()=>tryRecord('rear');
 $('smFront').onclick=()=>tryRecord('front');
 function finish(){const ok=recordTrial(state,{rear:records.rear,front:records.front});
  if(!ok){$('smFeedback').textContent='記録はそろった。あとは駅に戻り、もう一方の立場で走行を見よう。';return;}
  success=true;playing=false;$('smAction').disabled=false;const e=ev();
  const answer=e.arrivals.rear.home<e.arrivals.front.home?'後ろが先':'同時';
  let text=`予想：${state.prediction?{rear:'後ろが先',same:'同時',front:'前が先'}[state.prediction]:'―'} ／ 結果：${answer}（後ろ ${e.arrivals.rear.home.toFixed(2)} 秒、前 ${e.arrivals.front.home.toFixed(2)} 秒、差 ${e.gap.toFixed(2)}）`;
  if(state.runBeta>.6){const prev=state.trials.find(t=>t.beta<.6);if(prev){const prevEv=simultaneityEvents(prev.beta);text+=` 低速の差は ${prevEv.gap.toFixed(2)} でした。差は大きくなりました。`;}}
  text+=state.gateOpen?' 駅の出口が開きました。':' 金色のつまみで速さを変えて、次の実験へ。';
  $('smFeedback').textContent=text;}
 function frame(stamp){const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
  chip.hidden=!(state.prediction&&['cruise','review','complete'].includes(state.phase));if(!chip.hidden)chip.textContent='予想：ホームでは『'+({rear:'後ろが先',same:'同時',front:'前が先'})[state.prediction]+'』';
  openButton.hidden=state.phase!=='review'||!root.hidden;
  if(state.phase==='review'&&!autoOpened){autoOpened=true;open();}
  if(state.phase!=='review')autoOpened=false;
  if(!root.hidden){if(playing){time=Math.min(end(),time+dt*end()/12);if(time>=end())playing=false;}
   $('smTime').value=time;$('smPlay').textContent=playing?'Ⅱ 一時停止':'▶ 再生';
   const e=ev(),pair=photonPairAt(state.runBeta,time,view),proper=time/gamma(state.runBeta);
   $('smOutside').textContent='ホームの時計群 '+time.toFixed(2)+' 秒';
   $('smInside').textContent='車内の時計 '+proper.toFixed(2)+' 秒';
   onSample({view,beta:state.runBeta,t:time,proper,pair,arrivals:e.arrivals});}
  requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
 return{open,openPrediction};
}
