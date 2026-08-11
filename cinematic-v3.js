(() => {
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const root=document.documentElement;
  const body=document.body;
  const hero=document.querySelector('#hero');
  const frame=document.querySelector('.hero__frame');
  const content=document.querySelector('.hero__content');
  const title=document.querySelector('.hero__title');
  const modulePanel=document.querySelector('.module-panel');
  const demoPanel=document.querySelector('.demo-panel');
  const status=document.querySelector('.status-chip');
  const time=document.querySelector('.time-chip');
  const architecture=document.querySelector('#architecture');
  const archStage=document.querySelector('#architectureStage');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(frame&&!document.querySelector('.transition-gate')){
    const gate=document.createElement('div');
    gate.className='transition-gate';
    gate.setAttribute('aria-hidden','true');
    frame.appendChild(gate);
  }

  let lastY=scrollY,lastT=performance.now(),speed=0,raf=0;
  function update(){
    raf=0;
    const now=performance.now();
    const y=scrollY;
    const dt=Math.max(16,now-lastT);
    speed=Math.min(80,Math.abs(y-lastY)/dt*16.67);
    root.style.setProperty('--scroll-velocity',speed.toFixed(2));
    body.classList.toggle('fast-scroll',speed>10);
    lastY=y;lastT=now;

    if(hero){
      const r=hero.getBoundingClientRect();
      const travel=Math.max(1,hero.offsetHeight-innerHeight*.7);
      const p=clamp(-r.top/travel,0,1);
      root.style.setProperty('--hero-progress',p.toFixed(4));
      if(!reduce){
        if(frame) frame.style.transform=`perspective(1400px) translateZ(${-p*170}px) scale(${1-p*.075}) rotateX(${p*2.2}deg)`;
        if(content){
          content.style.opacity=String(1-p*.78);
          content.style.filter=`blur(${p*7}px)`;
          content.style.transform=`translate(-50%,calc(-50% - ${p*48}px)) scale(${1-p*.17}) translateZ(${-p*80}px)`;
        }
        if(title) title.style.textShadow=`0 2px 0 #fff,0 ${14+p*24}px ${40+p*45}px rgba(155,108,255,${.18+p*.12})`;
        if(modulePanel){modulePanel.style.opacity=String(1-p*.88);modulePanel.style.transform=`translateY(-50%) translateX(${-p*110}px) rotateY(${p*9}deg) scale(${1-p*.08})`;}
        if(demoPanel){demoPanel.style.opacity=String(1-p*.88);demoPanel.style.transform=`translateY(-50%) translateX(${p*110}px) rotateY(${-p*9}deg) scale(${1-p*.08})`;}
        if(status){status.style.opacity=String(1-p*1.1);status.style.transform=`translateY(${-p*24}px)`;}
        if(time){time.style.opacity=String(1-p*1.1);time.style.transform=`translateY(${-p*24}px)`;}
      }
    }

    if(architecture){
      const r=architecture.getBoundingClientRect();
      const p=clamp((innerHeight-r.top)/(innerHeight*.88),0,1);
      root.style.setProperty('--arch-enter',p.toFixed(4));
      if(archStage&&!reduce){
        const tilt=(1-p)*8;
        const scale=.9+p*.1;
        archStage.style.transform=`perspective(1400px) rotateX(${tilt}deg) translateY(${(1-p)*70}px) scale(${scale})`;
        archStage.style.filter=`blur(${(1-p)*4}px)`;
        archStage.style.opacity=String(.22+p*.78);
      }
    }
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update)}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  requestAnimationFrame(update);
})();
