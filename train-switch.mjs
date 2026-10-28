// Simultaneity switch: challenge overlay injected into simultaneity.html.
// Unlocked after the simultaneity experiments open the station gate. The
// player delays the rear emission so both lamps light at the same home-frame
// moment; success opens the train's door. Standalone module: it never touches
// the simultaneity state machine or 3D scene, it only reads localStorage to
// decide whether the entry button is available.
import {gamma,switchEvents,switchAt,switchAnswer,judgeSwitch,newSwitchState,clearSwitchLevel,SWITCH_LEVELS,SWITCH_TOLERANCE,SWITCH_MAX_DELAY,switchDuration} from './train-switch-physics.mjs?v=1';
const state=newSwitchState();
try{if(localStorage.getItem('cat-physics-switch-complete')==='1'){state.cleared=[true,true,true];state.won=true;}}catch{}
const css=document.createElement('style');css.textContent=`
#switchMission{position:fixed;inset:0;z-index:45;background:#102c39;display:flex;flex-direction:column;color:#edf4e9;padding:max(12px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));gap:7px}#switchMission[hidden]{display:none}
#switchMission .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#switchMission button{width:auto;height:38px;border-radius:10px;padding:0 12px;font-size:12px}
#switchMission button:disabled{opacity:.35}
#switchMission button[aria-pressed=true]{background:#a7d7b3;color:#12333c}
#switchMission strong{font-size:14px;flex:1}
#switchMission canvas{width:100%;min-height:0;flex:1;border-radius:14px;background:#173643}
#switchMission p{margin:0;font-size:12px;line-height:1.6;color:#cee1dd;background:#173b49e8;padding:7px;border-radius:10px}
#switchMission input{width:100%;accent-color:#a7d7b3}
#swFire{background:#6a9e84;color:#fff;font-weight:600}
#swFinish a{width:auto;height:auto;border-radius:12px;padding:12px 22px;font-size:16px;display:inline-flex;background:#a7d7b3;color:#12333c}
#switchOpen{position:fixed;right:12px;bottom:160px;width:auto;height:38px;border-radius:10px;font-size:12px;padding:0 12px;z-index:6}
@media(max-height:480px){#switchMission{gap:3px}#switchMission p{font-size:11px}#switchMission button{height:29px}}`;
document.head.append(css);
const root=document.createElement('section');root.id='switchMission';root.hidden=true;
root.innerHTML=`<div class="row"><strong>同時スイッチ ― ホームで同時に点灯させよう</strong><button id="swClose">駅へ ×</button></div><div class="row"><span>レベル</span><span id="swLevels"></span><span id="swDots"></span></div><canvas aria-label="前後のランプと列車の模式図"></canvas><div class="row"><span>見る立場</span><button id="swViewHome" aria-pressed="true">ホーム（判定）</button><button id="swViewTrain" aria-pressed="false">車内</button></div><div class="row"><label for="swDelay">後ろの発射を遅らせる： <strong id="swDelayVal">0.00</strong></label></div><input id="swDelay" type="range" min="0" max="${SWITCH_MAX_DELAY}" step="0.05" value="0" aria-label="後ろの発射を遅らせる量"><div class="row"><button id="swFire">発射</button><span id="swHint">中央から同時に出すと、ホームでは後ろが先に点きます。後ろをどれだけ遅らせれば、ホームで同時になる？</span></div><p id="swFeedback" aria-live="polite">レベルを選んで、ズラしを決めて発射。</p><div class="row" id="swFinish" hidden><span>全レベルクリア！ 扉が開いた先へ。</span><a href="./train-tunnel.html?v=1">収縮トンネルへ →</a></div>`;
document.body.append(root);
const openButton=document.createElement('button');openButton.id='switchOpen';openButton.textContent='同時スイッチ';openButton.hidden=true;document.body.append(openButton);
const $=id=>root.querySelector('#'+id);
const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
let view='home',time=0,playing=false,fired=false,door=0,doorTarget=0,last=0,fromEnding=false;
const delays={};SWITCH_LEVELS.forEach(b=>delays[b]=0);
const beta=()=>SWITCH_LEVELS[state.level],delay=()=>delays[beta()];
SWITCH_LEVELS.forEach((b,i)=>{const btn=document.createElement('button');btn.textContent=`Lv${i+1} β=${b.toFixed(1)}`;btn.setAttribute('aria-pressed',String(i===0));btn.onclick=()=>{if(playing)return;state.level=i;$('swDelay').value=delay();$('swDelayVal').textContent=delay().toFixed(2);resetRun();syncLevels();};$('swLevels').append(btn);});
function syncLevels(){$('swLevels').querySelectorAll('button').forEach((o,i)=>o.setAttribute('aria-pressed',String(i===state.level)));$('swDots').textContent=state.cleared.map(c=>c?'●':'○').join(' ');$('swFinish').hidden=!state.won;}
function resetRun(){time=0;playing=false;fired=false;door=0;doorTarget=0;$('swFire').disabled=false;}
function syncViewButtons(){$('swViewHome').setAttribute('aria-pressed',String(view==='home'));$('swViewTrain').setAttribute('aria-pressed',String(view==='train'));}
$('swViewHome').onclick=()=>{view='home';syncViewButtons();};
$('swViewTrain').onclick=()=>{view='train';syncViewButtons();};
$('swDelay').oninput=e=>{delays[beta()]=+e.target.value;$('swDelayVal').textContent=delay().toFixed(2);if(!playing)resetRun();};
$('swFire').onclick=()=>{if(playing)return;resetRun();playing=true;fired=true;$('swFire').disabled=true;$('swFeedback').textContent='発射！ ホームの時計で、2つのランプが点く瞬間を見よう。';};
function open(fromEndingFlag){root.hidden=false;fromEnding=!!fromEndingFlag;syncLevels();syncViewButtons();resetRun();}
function close(){root.hidden=true;playing=false;if(fromEnding){fromEnding=false;document.getElementById('continue')?.click();}}
openButton.onclick=()=>open(false);
$('swClose').onclick=close;
const endingBtn=document.getElementById('switchStart');if(endingBtn)endingBtn.onclick=()=>open(true);
const text=(s,x,y,size=12,color='#cde0dc')=>{ctx.fillStyle=color;ctx.font=`${size}px system-ui`;ctx.fillText(s,x,y);};
function draw(w,h){
 const b=beta(),d=delay(),ev=switchEvents(b,d),ft=view==='train'?time/gamma(b):time,pos=switchAt(b,d,ft,view);
 const horizon=h*.74;ctx.fillStyle=view==='train'?'#204450':'#173643';ctx.fillRect(0,0,w,h);
 const winW=9.6;let camX=-4.8;if(view==='home')camX=Math.max(-4.8,pos.centreX-winW*.45);
 const X=x=>(x-camX)/winW*w;
 ctx.strokeStyle='#63818a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,horizon+16);ctx.lineTo(w,horizon+16);ctx.stroke();
 ctx.fillStyle='#607b80';const spacing=1.4;const off=view==='train'?-((ft*b*3)%spacing):0;
 for(let i=-2;i<winW/spacing+3;i++){const wx=camX+i*spacing+(view==='train'?off:0);if(wx<camX||wx>camX+winW)continue;ctx.fillRect(X(wx),horizon+19,10,3);}
 // Train body between the walls, emitter at the centre.
 const rx=X(pos.rearWall),fx=X(pos.frontWall),cx=X(pos.centreX);
 ctx.fillStyle='#2b5a68';ctx.fillRect(rx,horizon-32,fx-rx,28);ctx.strokeStyle='#a8d6cb';ctx.lineWidth=2;ctx.strokeRect(rx,horizon-32,fx-rx,28);
 text('電車',rx+4,horizon-38,10);
 // Door at the centre of the car: slides up as `door` goes 0 -> 1.
 ctx.fillStyle='#173d49';ctx.fillRect(cx-11,horizon-30,22,26);
 if(door>0){ctx.fillStyle='#a5f6cd';ctx.fillRect(cx-11,horizon-30,22,26*door);}
 ctx.strokeStyle='#eec36b';ctx.strokeRect(cx-11,horizon-30,22,26);
 // Emitter: flashes at each emission moment.
 const emitNow=view==='train'?(ft<.12||(pos.rear.emitted&&ft-ev.emission.rear.train<.12)):(ft<.12||(pos.rear.emitted&&ft-ev.emission.rear.home<.12));
 ctx.fillStyle=emitNow?'#eec36b':'#8faeb3';ctx.beginPath();ctx.arc(cx,horizon-16,emitNow?6:4,0,Math.PI*2);ctx.fill();
 // Photons.
 for(const side of ['front','rear']){const p=pos[side];if(!p.emitted)continue;ctx.shadowColor='#a5f6cd';ctx.shadowBlur=12;ctx.fillStyle='#a5f6cd';ctx.beginPath();ctx.arc(X(p.x),horizon-16,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
 // Lamps at both walls.
 for(const side of ['front','rear']){const wallX=side==='front'?fx:rx,arr=pos[side].arrived;ctx.fillStyle=arr?'#a5f6cd':'#3c5b5b';ctx.beginPath();ctx.arc(wallX,horizon-16,7,0,Math.PI*2);ctx.fill();if(arr)text((side==='front'?'前 ':'後ろ ')+(view==='train'?ev.arrivals[side].train:ev.arrivals[side].home).toFixed(2),wallX-16,horizon+36,10,'#a5f6cd');}
 text(view==='train'?'車内から':'ホームから',12,22,13);
 text((view==='train'?'車内の時計 ':'ホームの時計 ')+ft.toFixed(2)+' 秒',w-118,22,11);
 text(`ズラし ${d.toFixed(2)}`,12,h-10,11,'#eec36b');
 if(door>.5)text('同時！ 扉が開いた',w/2-52,horizon-58,16,'#a5f6cd');
}
function finish(){playing=false;$('swFire').disabled=false;const b=beta(),d=delay(),ev=switchEvents(b,d),ok=judgeSwitch(b,d);
 if(ok){doorTarget=1;clearSwitchLevel(state,b,d);syncLevels();
  try{if(state.won)localStorage.setItem('cat-physics-switch-complete','1');}catch{}
  $('swFeedback').textContent=`ホームで同時！ 前 ${ev.arrivals.front.home.toFixed(2)} 秒 ／ 後ろ ${ev.arrivals.rear.home.toFixed(2)} 秒（差 ${Math.abs(ev.gap).toFixed(2)}）。車内では、後ろを ${d.toFixed(2)} 遅らせて出した分だけズレて点きました。${state.won?' 全レベルクリア！':' 次のレベルはもっと速い。ズラしも大きく。'}`;}
 else{const who=ev.gap>0?'後ろ':'前';$('swFeedback').textContent=`${who}が ${Math.abs(ev.gap).toFixed(2)} 秒 先に点きました（前 ${ev.arrivals.front.home.toFixed(2)} ／ 後ろ ${ev.arrivals.rear.home.toFixed(2)}）。許容は差 ${SWITCH_TOLERANCE.toFixed(2)} まで。ズラしを直してもう一度。`;}}
function frame(stamp){const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
 try{openButton.hidden=root.hidden===false||localStorage.getItem('cat-physics-simultaneity-complete')!=='1';}catch{openButton.hidden=true;}
 if(!root.hidden){
  if(playing){const dur=switchDuration(beta(),delay());time+=dt*dur/6;if(time>=dur){time=dur;finish();}}
  door+=(doorTarget-door)*(1-Math.exp(-dt*4));
  const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  if(r.width>0){if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);draw(r.width,r.height);}}
 requestAnimationFrame(frame);}
syncLevels();
requestAnimationFrame(frame);
window.catSwitch={getState:()=>({...state,time,door}),open};
