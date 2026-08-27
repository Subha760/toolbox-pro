/* Toolidea UX & interaction enhancements - loaded after app.js */
(function(){
  'use strict';

  const STYLE_ID = 'toolidea-vibrant-enhancements';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      :root{--ti-pink:#ff4ecd;--ti-orange:#ff9f43;--ti-green:#25e0a3;--ti-blue:#36b9ff;--ti-purple:#7c5cff}
      body{background:#f7f8ff;color:#17213b;position:relative;isolation:isolate}
      body::before{content:"";position:fixed;inset:0;z-index:-3;background:radial-gradient(circle at 15% 10%,rgba(124,92,255,.22),transparent 28%),radial-gradient(circle at 85% 15%,rgba(54,185,255,.18),transparent 30%),radial-gradient(circle at 50% 90%,rgba(255,78,205,.15),transparent 32%),linear-gradient(135deg,#f8fbff,#f4f1ff 48%,#fff7fb);animation:tiBg 16s ease-in-out infinite alternate}
      @keyframes tiBg{0%{filter:hue-rotate(0deg);transform:scale(1)}100%{filter:hue-rotate(12deg);transform:scale(1.04)}}
      #tiAmbient{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-2;opacity:.6}
      .site-header{background:rgba(255,255,255,.78)!important;border-bottom:1px solid rgba(76,62,150,.12)!important;box-shadow:0 8px 30px rgba(65,52,140,.08)}
      .brand-text strong,.tool-header h1{color:#17213b!important;-webkit-text-fill-color:initial!important;background:none!important}
      .brand-text span,.tool-header p{color:#63708d!important}
      .header-search,.tool-content,.ad-slot,.sidebar,.result-box{background:rgba(255,255,255,.72)!important;border-color:rgba(91,78,180,.15)!important;box-shadow:0 14px 45px rgba(71,55,140,.08)}
      .header-search input,.tool-content input,.tool-content textarea,.tool-content select{color:#17213b!important;background:rgba(255,255,255,.85)!important;border-color:rgba(91,78,180,.18)!important}
      .tool-content label,.sidebar ul li{color:#4d5872!important}.sidebar{background:rgba(255,255,255,.7)!important}
      .sidebar ul li.active{background:linear-gradient(135deg,rgba(124,92,255,.18),rgba(54,185,255,.14));color:#3d2d91!important}
      .btn{background:linear-gradient(135deg,#7c5cff,#36b9ff)!important;box-shadow:0 10px 25px rgba(92,79,205,.25)!important}
      .btn:hover{box-shadow:0 16px 34px rgba(54,185,255,.28)!important}
      .ad-slot{min-height:90px!important}
      .ti-tool-enter{animation:tiEnter .38s cubic-bezier(.2,.8,.2,1)}
      @keyframes tiEnter{from{opacity:0;transform:translateY(12px) scale(.99)}to{opacity:1;transform:none}}
      .ti-result-pop{animation:tiPop .42s cubic-bezier(.2,.8,.2,1)}
      @keyframes tiPop{0%{opacity:0;transform:scale(.96)}70%{transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
      .coin-stage{width:180px;height:180px;margin:10px auto 18px;display:grid;place-items:center;perspective:900px}
      .coin{width:132px;height:132px;position:relative;transform-style:preserve-3d;will-change:transform;filter:drop-shadow(0 16px 18px rgba(42,38,90,.22))}
      .coin-face{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center;font-size:3.2rem;font-weight:800;backface-visibility:hidden;border:7px solid #f2b84b;background:radial-gradient(circle at 32% 28%,#fff2a7,#ffc84e 44%,#e29a24 100%);box-shadow:inset 0 0 0 5px rgba(255,255,255,.3),inset 0 -8px 12px rgba(132,76,0,.18)}
      .coin-tail{transform:rotateY(180deg)}
      .coin.flipping{animation:coinFlip 1.55s cubic-bezier(.18,.8,.18,1)}
      @keyframes coinFlip{0%{transform:rotateY(0) translateY(0)}25%{transform:rotateY(540deg) translateY(-25px)}55%{transform:rotateY(1260deg) translateY(-46px)}100%{transform:rotateY(1800deg) translateY(0)}}
      .coin-result{font-size:1.05rem;font-weight:800;text-align:center;color:#273052;margin-bottom:6px}
      .bmi-card{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.bmi-stat{padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(124,92,255,.08),rgba(54,185,255,.08));border:1px solid rgba(92,79,205,.12)}.bmi-stat strong{display:block;font-size:1.15rem;color:#26345b}.bmi-stat span{font-size:.78rem;color:#6d7894}.bmi-status{margin-top:14px;padding:16px;border-radius:18px;font-weight:800;background:linear-gradient(135deg,rgba(37,224,163,.12),rgba(54,185,255,.1));color:#164c43}.bmi-note{font-size:.75rem;color:#71809d;margin-top:12px;line-height:1.5}
      @media(max-width:640px){.bmi-card{grid-template-columns:1fr}.coin-stage{width:150px;height:150px}.coin{width:112px;height:112px}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}
    `;
    document.head.appendChild(s);
  }

  function addAmbientCanvas(){
    if(document.getElementById('tiAmbient')) return;
    const canvas=document.createElement('canvas'); canvas.id='tiAmbient'; document.body.prepend(canvas);
    const ctx=canvas.getContext('2d'); let w=0,h=0,dots=[];
    function resize(){w=canvas.width=innerWidth*devicePixelRatio;h=canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';dots=Array.from({length:Math.min(70,Math.max(25,innerWidth/18))},()=>({x:Math.random()*w,y:Math.random()*h,r:(1+Math.random()*2)*devicePixelRatio,vx:(Math.random()-.5)*.18*devicePixelRatio,vy:(Math.random()-.5)*.18*devicePixelRatio,a:.15+Math.random()*.25}))}
    function frame(){ctx.clearRect(0,0,w,h);for(const p of dots){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(124,92,255,'+p.a+')';ctx.fill()}requestAnimationFrame(frame)}
    addEventListener('resize',resize,{passive:true}); resize(); frame();
  }

  let audioCtx=null;
  function beep(freq=520,dur=.07,type='sine',gain=.035){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.stop(audioCtx.currentTime+dur)}catch(e){}}
  function coinSound(){beep(250,.07,'square',.035);setTimeout(()=>beep(480,.08,'square',.025),85);setTimeout(()=>beep(760,.09,'sine',.02),170)}

  function installBMI(){
    if(!window.TOOLS||!TOOLS.bmi)return;
    TOOLS.bmi={name:'BMI & Healthy Weight Calculator',desc:'Check BMI category and see the estimated weight range and change needed to reach the adult healthy BMI range.',render:function(c){
      c.innerHTML=`<div class="row"><label style="flex:1;min-width:180px;">Weight (kg)<input type="number" id="bmW" value="70" min="1" step="0.1"></label><label style="flex:1;min-width:180px;">Height (cm)<input type="number" id="bmH" value="175" min="50" max="250" step="0.1"></label></div><button class="btn" id="bmBtn">Calculate BMI</button><div id="bmOut" class="result-box">Enter your details and calculate.</div><div id="bmDetails"></div><div class="bmi-note">For adults, BMI is a screening measure, not a diagnosis. Pregnancy, children/teens, athletes and some medical conditions need different assessment.</div>`;
      const bmW=c.querySelector('#bmW'),bmH=c.querySelector('#bmH'),bmOut=c.querySelector('#bmOut'),bmDetails=c.querySelector('#bmDetails');
      function calc(){const w=parseFloat(bmW.value),cm=parseFloat(bmH.value);if(!isFinite(w)||!isFinite(cm)||w<=0||cm<=0)return;const h=cm/100,bmi=w/(h*h),lo=18.5*h*h,hi=24.9*h*h;let cat,action;if(bmi<18.5){cat='Less weight / Underweight';action=`Estimated gain needed to reach BMI 18.5: <strong>${(lo-w).toFixed(1)} kg</strong>`}else if(bmi<25){cat='Normal / Healthy range';action=`You are within the adult healthy BMI range. Estimated healthy weight range: <strong>${lo.toFixed(1)}–${hi.toFixed(1)} kg</strong>`}else if(bmi<30){cat='Overweight';action=`Estimated loss to reach BMI 24.9: <strong>${(w-hi).toFixed(1)} kg</strong>`}else{cat='Obesity range';action=`Estimated loss to reach BMI 24.9: <strong>${(w-hi).toFixed(1)} kg</strong>`}bmOut.innerHTML=`<strong>BMI: ${bmi.toFixed(1)}</strong> — ${cat}`;bmDetails.innerHTML=`<div class="bmi-card"><div class="bmi-stat"><strong>${lo.toFixed(1)} kg</strong><span>Lower healthy-weight estimate</span></div><div class="bmi-stat"><strong>${hi.toFixed(1)} kg</strong><span>Upper healthy-weight estimate</span></div></div><div class="bmi-status">${action}</div>`;bmOut.classList.add('ti-result-pop');bmDetails.classList.add('ti-result-pop');beep(620,.05,'sine',.018)}
      c.querySelector('#bmBtn').addEventListener('click',calc);[bmW,bmH].forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter')calc()}));
    }};
  }

  function installCoin(){
    if(!window.TOOLS||!TOOLS.coin)return;
    TOOLS.coin={name:'Animated Coin Flip',desc:'Flip a realistic animated coin with sound and randomized Heads/Tails result.',render:function(c){
      c.innerHTML=`<div class="coin-stage"><div class="coin" id="coinVisual"><div class="coin-face coin-head">H</div><div class="coin-face coin-tail">T</div></div></div><div id="cfRes" class="coin-result">Ready to flip</div><button class="btn" id="cfFlip">🪙 Flip Coin</button><p class="note" style="text-align:center">Sound starts after your first tap because mobile browsers block automatic audio.</p>`;
      const coin=c.querySelector('#coinVisual'),res=c.querySelector('#cfRes'),btn=c.querySelector('#cfFlip');let busy=false;
      btn.addEventListener('click',()=>{if(busy)return;busy=true;btn.disabled=true;res.textContent='Flipping…';coin.classList.remove('flipping');void coin.offsetWidth;coin.classList.add('flipping');coinSound();setTimeout(()=>{const heads=Math.random()<.5;coin.style.transform=heads?'rotateY(1800deg)':'rotateY(1980deg)';res.textContent=heads?'🪙 Heads':'🪙 Tails';res.classList.add('ti-result-pop');beep(heads?760:430,.1,'sine',.025);btn.disabled=false;busy=false},1550)});
    }};
  }

  function installGlobalInteractions(){
    const original=window.handleRoute;
    if(typeof original==='function'){
      window.handleRoute=function(){original.apply(this,arguments);const box=document.getElementById('toolContainer');if(box){box.classList.remove('ti-tool-enter');void box.offsetWidth;box.classList.add('ti-tool-enter')}};
    }
    document.addEventListener('click',e=>{const b=e.target.closest('.btn');if(b&&!b.disabled)beep(540,.035,'sine',.012)});
  }

  addAmbientCanvas();
  installBMI();
  installCoin();
  installGlobalInteractions();
})();
