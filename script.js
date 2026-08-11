const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const root=document.documentElement;

// Cinematic boot sequence
const boot=$('#boot'),bootLine=$('#bootLine'),bootStatus=$('#bootStatus');
const bootSteps=[['Loading UI kernel…',22],['Connecting modules…',48],['Calibrating motion system…',73],['Interface online.',100]];
let bootIndex=0;
function nextBoot(){if(bootIndex>=bootSteps.length){setTimeout(()=>boot.classList.add('hidden'),350);return}const [text,pct]=bootSteps[bootIndex++];bootStatus.textContent=text;bootLine.style.width=pct+'%';setTimeout(nextBoot,280)}
setTimeout(nextBoot,180);

// Clock
function updateClock(){const d=new Date();$('#clock').textContent=[d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,'0')).join(' : ')}
updateClock();setInterval(updateClock,1000);

// Smooth reveal observer
const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
$$('.reveal').forEach(el=>revealObserver.observe(el));

// Mouse, inertial cursor and particle field
const cursor=$('#cursor'),dot=$('#cursorDot'),canvas=$('#fx'),ctx=canvas.getContext('2d');
let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my,px=mx,py=my,lastX=mx,lastY=my,velocity=0;
let particles=[];
function resize(){const dpr=Math.min(devicePixelRatio,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}resize();addEventListener('resize',resize);
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;velocity=Math.min(35,Math.hypot(mx-lastX,my-lastY));lastX=mx;lastY=my;root.style.setProperty('--mx',mx+'px');root.style.setProperty('--my',my+'px');$('#coordX').textContent='X '+String(Math.round(mx)).padStart(4,'0');$('#coordY').textContent='Y '+String(Math.round(my)).padStart(4,'0');if(velocity>12&&Math.random()>.45)particles.push({x:mx,y:my,vx:(Math.random()-.5)*1.4-((mx-px)*.04),vy:(Math.random()-.5)*1.4-((my-py)*.04),life:1,size:Math.random()*2+1});px=mx;py=my});
function animate(){cx+=(mx-cx)*.13;cy+=(my-cy)*.13;cursor.style.transform=`translate(${cx-19}px,${cy-19}px)`;dot.style.transform=`translate(${mx-2}px,${my-2}px)`;ctx.clearRect(0,0,innerWidth,innerHeight);particles=particles.filter(p=>p.life>.03);for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.life*=.94;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fillStyle=`rgba(166,126,255,${p.life*.5})`;ctx.fill()}requestAnimationFrame(animate)}animate();
$$('a,button,input,select').forEach(el=>{el.addEventListener('pointerenter',()=>cursor.classList.add('active'));el.addEventListener('pointerleave',()=>cursor.classList.remove('active'))});

// Click shockwaves
addEventListener('pointerdown',e=>{const ring=document.createElement('i');ring.style.cssText=`position:fixed;z-index:119;pointer-events:none;left:${e.clientX}px;top:${e.clientY}px;width:10px;height:10px;border:1px solid rgba(155,108,255,.8);border-radius:50%;transform:translate(-50%,-50%);transition:.65s ease-out;`;document.body.appendChild(ring);requestAnimationFrame(()=>{ring.style.width='180px';ring.style.height='180px';ring.style.opacity='0'});setTimeout(()=>ring.remove(),700)});

// Magnetic controls
$$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;el.style.transform=`translate(${x*.13}px,${y*.18}px)`});el.addEventListener('pointerleave',()=>el.style.transform='')});

// Tilt cards
$$('.tilt-card').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5,amt=Number(el.dataset.tilt||8);el.style.transform=`translateY(-50%) perspective(700px) rotateY(${x*amt}deg) rotateX(${-y*amt}deg)`});el.addEventListener('pointerleave',()=>el.style.transform='translateY(-50%)')});

// Scroll parallax
let scrollY=0,ticking=false;addEventListener('scroll',()=>{scrollY=scrollY||window.scrollY;if(!ticking){requestAnimationFrame(()=>{const y=window.scrollY;$$('[data-parallax]').forEach(el=>{const r=el.closest('.section').getBoundingClientRect();const amt=Number(el.dataset.parallax);el.style.translate=`0 ${(-r.top*amt).toFixed(1)}px`});const hero=$('.hero__content');if(hero&&y<innerHeight*1.2){const p=Math.min(1,y/innerHeight);hero.style.filter=`blur(${p*5}px)`;hero.style.opacity=1-p*.75;hero.style.scale=1-p*.12}ticking=false});ticking=true}});

// Scroll controls
$$('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));

// Architecture inspector
const details={core:['Framework Kernel','The central orchestration layer keeps modules independent while exposing a predictable interface to the game.'],navigation:['Navigation','Directional focus, input routing and screen transitions remain predictable across keyboard, controller and gamepad.'],state:['Reactive State','UI reacts to explicit state changes instead of scattering logic across visual widgets.'],widgets:['Reusable Widgets','Composable views share behavior and styling without becoming tightly coupled to one screen.'],events:['Event Routing','Signals move between systems without forcing widgets to know about every other implementation.']};
$$('.arch-node').forEach(node=>node.addEventListener('mouseenter',()=>{const key=node.dataset.node,[title,copy]=details[key];$$('.arch-node').forEach(n=>n.classList.toggle('active',n===node));$('#archDetail').innerHTML=`<small>INSPECTING / ${key.toUpperCase()}</small><h3>${title}</h3><p>${copy}</p>`}));

// Hero module interaction
$$('.module-row').forEach((row,i)=>row.addEventListener('mouseenter',()=>{$$('.module-row').forEach(r=>r.classList.remove('active'));row.classList.add('active');$('.hero__sigil').style.transform=`rotate(${30+i*22}deg) scale(${1+i*.035})`}));

// Interface Lab
const preview=$('#previewObject');
const templates={button:`<button class="lab-demo-button" id="labDemoButton"><span>LAUNCH SYSTEM</span><i>↗</i></button>`,modal:`<div style="width:min(330px,65vw);padding:22px;border:1px solid rgba(155,108,255,.55);border-radius:16px;background:rgba(9,9,13,.92);box-shadow:0 0 50px rgba(155,108,255,.14)"><small style="font:9px 'Space Mono';color:#9b6cff">SYSTEM / MODAL</small><h3 style="margin:12px 0 6px">Confirm action</h3><p style="color:#8f8a99;font-size:12px;line-height:1.6">A reusable modal assembled from the framework state.</p><button class="lab-demo-button" style="min-width:0;width:100%;margin-top:10px"><span>CONFIRM</span><i>→</i></button></div>`,hud:`<div style="width:min(390px,68vw);display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><div style="padding:18px;border:1px solid rgba(155,108,255,.45);border-radius:12px"><small style="color:#8f8a99">HEALTH</small><b style="display:block;font-size:26px;margin-top:7px">100</b></div><div style="padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:12px"><small style="color:#8f8a99">ARMOR</small><b style="display:block;font-size:26px;margin-top:7px">75</b></div><div style="padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:12px"><small style="color:#8f8a99">ENERGY</small><b style="display:block;font-size:26px;margin-top:7px">92</b></div></div>`};
function setComponent(type){preview.style.opacity='0';preview.style.transform='scale(.88)';setTimeout(()=>{preview.innerHTML=templates[type];preview.style.transition='.45s cubic-bezier(.2,.9,.2,1)';preview.style.opacity='1';preview.style.transform='scale(1)'},180)}
$$('.lab-item').forEach(item=>item.addEventListener('click',()=>{$$('.lab-item').forEach(i=>i.classList.remove('active'));item.classList.add('active');setComponent(item.dataset.component)}));
const intensity=$('#intensity'),scale=$('#scale'),pulse=$('#pulseToggle'),motion=$('#motionSelect');
function applyLab(){const iv=intensity.value,sv=(scale.value/100).toFixed(2);root.style.setProperty('--lab-intensity',iv);root.style.setProperty('--lab-scale',sv);$('#intensityValue').value=iv;$('#scaleValue').value=sv;const obj=preview.firstElementChild;if(obj){obj.style.animation=pulse.checked?'labPulse 1.8s ease-in-out infinite':'none';obj.style.transition=motion.value==='snappy'?'.15s cubic-bezier(.2,1.7,.4,1)':motion.value==='smooth'?'.8s ease':'.4s cubic-bezier(.2,.9,.2,1)'}}
[intensity,scale,pulse,motion].forEach(el=>el.addEventListener('input',applyLab));
$('#replayMotion').addEventListener('click',()=>{preview.animate([{transform:'scale(.75) rotate(-3deg)',filter:'blur(5px)'},{transform:'scale(1.08) rotate(1deg)',filter:'blur(0)'},{transform:'scale(1)',filter:'blur(0)'}],{duration:650,easing:'cubic-bezier(.2,.9,.2,1)'})});
const labStyle=document.createElement('style');labStyle.textContent='@keyframes labPulse{0%,100%{filter:drop-shadow(0 0 0 rgba(155,108,255,0))}50%{filter:drop-shadow(0 0 24px rgba(155,108,255,.35))}}';document.head.appendChild(labStyle);applyLab();

// Debug mode
const debug=$('#debugGrid'),debugBtn=$('#debugToggle');function toggleDebug(force){const active=typeof force==='boolean'?force:!debug.classList.contains('active');debug.classList.toggle('active',active);debugBtn.setAttribute('aria-pressed',String(active));debugBtn.querySelector('b').textContent=active?'ON':'OFF'}debugBtn.addEventListener('click',()=>toggleDebug());

// Command palette
const overlay=$('#commandOverlay'),commandInput=$('#commandInput');function setCommand(open){overlay.classList.toggle('open',open);overlay.setAttribute('aria-hidden',String(!open));if(open)setTimeout(()=>commandInput.focus(),30)}
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommand(!overlay.classList.contains('open'))}if(e.key==='Escape')setCommand(false)});overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)setCommand(false)});
$$('[data-command]').forEach(btn=>btn.addEventListener('click',()=>{const cmd=btn.dataset.command;if(cmd==='debug')toggleDebug();else $('#'+cmd)?.scrollIntoView({behavior:'smooth'});setCommand(false)}));
commandInput.addEventListener('input',()=>{const q=commandInput.value.toLowerCase();$$('[data-command]').forEach(b=>b.style.display=b.textContent.toLowerCase().includes(q)?'flex':'none')});

// Sound synthesizer: opt-in, no audio files
let audioCtx=null,soundOn=false;const soundBtn=$('#soundToggle');function tone(freq=320,duration=.05,vol=.025){if(!soundOn)return;if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}
soundBtn.addEventListener('click',()=>{soundOn=!soundOn;soundBtn.setAttribute('aria-pressed',String(soundOn));soundBtn.querySelector('b').textContent=soundOn?'ON':'OFF';if(soundOn){audioCtx=new (window.AudioContext||window.webkitAudioContext)();tone(440,.08,.035)}});$$('button,a').forEach(el=>el.addEventListener('pointerenter',()=>tone(520,.025,.012)));addEventListener('pointerdown',()=>tone(220,.035,.018));

// Easter egg: five logo clicks unlock debug mode
let logoClicks=0,logoTimer;$('.brand').addEventListener('click',e=>{logoClicks++;clearTimeout(logoTimer);logoTimer=setTimeout(()=>logoClicks=0,1600);if(logoClicks>=5){e.preventDefault();toggleDebug(true);logoClicks=0;const toast=document.createElement('div');toast.textContent='DEVELOPER MODE UNLOCKED';toast.style.cssText='position:fixed;z-index:150;left:50%;top:110px;transform:translateX(-50%);padding:12px 18px;border:1px solid #9b6cff;background:#08080c;color:#fff;border-radius:999px;font:10px Space Mono;letter-spacing:.15em;box-shadow:0 0 35px rgba(155,108,255,.25)';document.body.appendChild(toast);setTimeout(()=>toast.remove(),1800)}});
