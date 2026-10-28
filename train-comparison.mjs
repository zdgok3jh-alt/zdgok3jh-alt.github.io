// Relativity of simultaneity: one emission at the train centre, arrivals at both ends.
// Model units match train-missions (L=3, c=3), so the in-train one-way time is exactly 1.
// Event times come straight from the Lorentz transform t = gamma * (t' + beta * x' / c).
export const SIM_L=3,SIM_C=3;
export function simultaneityEvents(beta,L=SIM_L){
 const g=1/Math.sqrt(1-beta*beta),inside=L/SIM_C;
 const rear=g*inside*(1-beta),front=g*inside*(1+beta);
 return{beta,gamma:g,emission:{train:0,home:0},arrivals:{rear:{train:inside,home:rear},front:{train:inside,home:front}},gap:front-rear};
}
// Photon positions relative to the train centre at model time t.
// In the home frame the walls sit at +/-L/gamma (length contraction) and each photon
// still moves at SIM_C, so the rear photon closes on its wall at SIM_C*(1+beta).
export function photonPairAt(beta,t,view='home'){
 const ev=simultaneityEvents(beta),time=Math.max(0,t);
 if(view==='train'){const d=Math.min(SIM_L,SIM_C*time);return{rear:{x:-d,arrived:time>=ev.arrivals.rear.train},front:{x:d,arrived:time>=ev.arrivals.front.train},rearWall:-SIM_L,frontWall:SIM_L};}
 const wall=SIM_L/ev.gamma,dR=Math.min(wall,SIM_C*(1+beta)*time),dF=Math.min(wall,SIM_C*(1-beta)*time);
 return{rear:{x:-dR,arrived:time>=ev.arrivals.rear.home},front:{x:dF,arrived:time>=ev.arrivals.front.home},rearWall:-wall,frontWall:wall};
}
// Inertial-frame event transforms, c=1. Ball travels in a frictionless tube.
export function compareEvent(beta,t,kind,mode){
 const g=1/Math.sqrt(1-beta*beta),u=kind==='light'?1:.45;
 if(mode==='forward'){const speed=(u+beta)/(1+u*beta),x=speed*t;return{x,y:0,insideX:g*(x-beta*t),insideT:g*(t-beta*x),speed,insideSpeed:u};}
 const proper=t/g,travel=u*proper,gap=.8,d=travel%(2*gap),y=d<=gap?d:2*gap-d;
 return{x:beta*t,y,insideX:0,insideT:proper,speed:Math.hypot(beta,u/g),insideSpeed:u};
}
export function createComparison({state,onSeen,onOpen}){
 const style=document.createElement('style');style.textContent=`
 #comparison{position:fixed;inset:0;z-index:30;background:#102c39;display:flex;flex-direction:column;color:#edf4e9;padding:max(12px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));gap:8px}#comparison[hidden]{display:none}#comparison .bar{display:flex;gap:7px;align-items:center;flex-wrap:wrap}#comparison button{width:auto;height:36px;border-radius:9px;padding:0 12px;font-size:12px}#comparison button[aria-pressed=true]{background:#a7d7b3;color:#12333c}#comparison strong{font-size:14px;flex:1}#comparison canvas{width:100%;min-height:0;flex:1;border-radius:14px}#comparison p{margin:0;font-size:12px;line-height:1.6;color:#cee1dd}#compareOpen{position:fixed;right:12px;bottom:115px;width:auto;height:38px;border-radius:10px;font-size:12px;padding:0 12px;z-index:6}#comparison input{width:100%;accent-color:#a7d7b3}#comparison .legend{display:flex;justify-content:space-between;font-size:12px;color:#b8d4d6}@media(max-height:480px){#comparison{gap:3px}#comparison p{font-size:10px}#comparison button{height:29px}}`;
 document.head.append(style);const root=document.createElement('section');root.id='comparison';root.hidden=true;root.innerHTML=`<div class="bar"><strong>同じ発射を、2つの視点で</strong><button id="cmpClose">駅へ戻る ×</button></div><div class="bar"><button data-mode="vertical" aria-pressed="true">↕ 上下に往復</button><button data-mode="forward" aria-pressed="false">→ 前へ発射</button><button id="cmpPlay">一時停止</button><button id="cmpReset">↻ 最初から</button></div><div class="legend"><span>● オレンジ：ボール</span><span>● ミント：光</span></div><canvas aria-label="上段は車内、下段はホーム。左はボール、右は光の同時比較"></canvas><input id="cmpTime" aria-label="実験の時間" type="range" min="0" max="6" step="0.01" value="0"><p id="cmpNote"></p><p>光速を縮めた模型。ボールは重力のない管の中で往復。実際の列車では時間差はごく小さい。</p>`;document.body.append(root);
 const openButton=document.createElement('button');openButton.id='compareOpen';openButton.textContent='光とボールを比較';document.body.append(openButton);
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=root.querySelector('input');let mode='vertical',time=0,playing=true,last=0,openedRun=false,wasCruise=false;
 const open=()=>{root.hidden=false;onOpen();onSeen();time=0;playing=true;root.querySelector('#cmpPlay').textContent='一時停止';};openButton.onclick=open;root.querySelector('#cmpClose').onclick=()=>{root.hidden=true;};
 root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;time=0;root.querySelectorAll('[data-mode]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));});
 root.querySelector('#cmpPlay').onclick=e=>{playing=!playing;e.target.textContent=playing?'一時停止':'再生';};root.querySelector('#cmpReset').onclick=()=>{time=0;};slider.oninput=()=>{time=+slider.value;playing=false;root.querySelector('#cmpPlay').textContent='再生';};
 const text=(s,x,y,size=12,color='#cde0dc')=>{ctx.fillStyle=color;ctx.font=`${size}px system-ui`;ctx.fillText(s,x,y);};
 function panel(x,y,w,h,inside,kind,beta){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle=inside?'#204450':'#173643';ctx.fillRect(x,y,w,h);const color=kind==='light'?'#a5f6cd':'#ffc17b',event=compareEvent(beta,time,kind,mode);text(inside?'車内から':'ホームから',x+12,y+22,13);text(kind==='light'?'光':'ボール',x+w-50,y+22,12,color);
 const horizon=y+h*.76,scale=mode==='vertical'?Math.max(12,Math.min(w/6.8,(h-80)/1.1)):w/7.8,origin=x+22,shift=inside?0:beta*time*scale,source=origin+shift;
 // Stationary sleepers reveal which frame the drawing uses.
 ctx.strokeStyle='#63818a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,horizon+20);ctx.lineTo(x+w,horizon+20);ctx.stroke();for(let i=-20;i<40;i++){const px=x+i*35-(inside?beta*time*scale:0);ctx.fillStyle='#607b80';ctx.fillRect(px,horizon+23,14,3);}
 ctx.strokeStyle='#8faeb3';ctx.lineWidth=2;ctx.strokeRect(source-9,y+45,Math.max(35,scale*1.3),horizon-y-40);text('→ 電車',source-2,horizon+14,10);
 const point=t=>{const e=compareEvent(beta,t,kind,mode);return[origin+(inside?e.insideX:e.x)*scale,horizon-e.y*scale];};
 ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=300;i++){const p=point(time*i/300);i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.stroke();const p=point(time);ctx.shadowColor=color;ctx.shadowBlur=14;ctx.fillStyle=color;ctx.beginPath();ctx.arc(...p,kind==='light'?5:7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 text(`速さ ${(inside?event.insideSpeed:event.speed).toFixed(2)} c`,x+12,y+h-10,12,color);ctx.restore();}
 function draw(stamp){const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;const cruise=state.phase==='cruise';if(cruise&&!wasCruise){openedRun=false;}if(cruise&&!openedRun){openedRun=true;open();}wasCruise=cruise;openButton.hidden=!state.installed.every(Boolean);if(!root.hidden){onSeen();if(playing)time=Math.min(6,time+dt*.65);if(time===6&&playing){playing=false;root.querySelector('#cmpPlay').textContent='再生';}slider.value=time;
 const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);const w=(r.width-6)/2,h=(r.height-6)/2,beta=cruise||['review','complete'].includes(state.phase)?state.runBeta:state.beta;for(let row=0;row<2;row++)for(let col=0;col<2;col++)panel(col*(w+6),row*(h+6),w,h,row===0,col?'light':'ball',beta);
 root.querySelector('#cmpNote').textContent=mode==='vertical'?'上は真っすぐ、下は斜め。光は道が長くなっても速さは同じ → 外から見ると、車内の時計はゆっくり進む。':'ボールの速さは視点で変わる。光はどちらも 1.00 c。高速ではボールも単純な足し算ではなく、光速を超えない。';}
 requestAnimationFrame(draw);}
 requestAnimationFrame(draw);return{open};
}
