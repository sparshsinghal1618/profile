/* SPARSH.S — editable website interactions
   Owner-provided email and social links are configured. */
const CONFIG = {
  email: "sparshsinghal.vca@gmail.com",
  socials: [
    { label: "GitHub", url: "https://github.com/sparshsinghal1618" },
    { label: "Reddit", url: "https://www.reddit.com/user/Sparsh1618/" },
    { label: "Spotify", url: "https://open.spotify.com/user/31ufnhvckajf4tfvqnn2nmhuv2ve?si=7da161593fa44149" }
  ],
  discord: "sparsh_haha",
  introEnabled: true
};

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Intro: skip immediately; don't replay after the first visit in this tab.
const intro = $("#intro");
function closeIntro() {
  if (!intro) return;
  intro.classList.add("hidden");
  try { sessionStorage.setItem("sparshIntroSeen", "1"); } catch (_) {}
}
if (!CONFIG.introEnabled || reducedMotion || (()=>{try{return sessionStorage.getItem("sparshIntroSeen")==="1"}catch(_){return false}})()) closeIntro();
else window.setTimeout(closeIntro, 1900);
$("#skipIntro")?.addEventListener("click", closeIntro);

// Navigation
const header = $(".site-header"), menuToggle = $("#menuToggle"), nav = $("#navLinks");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 30), {passive:true});
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
});
$$(".nav-links a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false");
}));
const sectionLinks = $$(".nav-links a");
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) sectionLinks.forEach(link => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
}), {rootMargin:"-35% 0px -55% 0px"});
["work","motion","playground","about","contact"].forEach(id => {const el=document.getElementById(id); if(el)sectionObserver.observe(el)});

// Local time labels
function updateTime(){
  const now = new Date();
  const time = new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit",hour12:false}).format(now);
  $$("[data-local-time]").forEach(el => el.textContent = `LOCAL TIME — ${time}`);
}
updateTime(); window.setInterval(updateTime, 30000);
$("#year").textContent = new Date().getFullYear();

// Project filtering
const filterButtons = $$(".filter"), projects = $$(".project");
const categoryLabels = {web:"WEB EXPERIENCE · DEMO CONCEPT",motion:"MOTION · DEMO CONCEPT",design:"VISUAL DESIGN · DEMO CONCEPT",experiments:"CREATIVE CODE · DEMO CONCEPT"};
filterButtons.forEach(button => button.addEventListener("click", () => {
  filterButtons.forEach(b => b.classList.toggle("active", b === button));
  const category = button.dataset.filter;
  projects.forEach(project => {
    project.hidden = category !== "all" && project.dataset.category !== category;
  });
  const count = projects.filter(p=>!p.hidden).length;
  const allLabel = filterButtons.find(b=>b.dataset.filter==="all");
  allLabel.querySelector("span").textContent = String(count).padStart(2,"0");
}));

// Project detail dialog — clearly labels demo entries.
const dialog = $("#projectDialog");
function openProject(project) {
  $("#dialogTitle").textContent = $(".project-meta h3", project).textContent;
  $("#dialogCategory").textContent = categoryLabels[project.dataset.category] || "DEMO CONCEPT";
  $("#dialogDescription").textContent = $(".project-desc", project).textContent;
  dialog.classList.add("open"); dialog.setAttribute("aria-hidden","false"); document.body.classList.add("locked");
  $("#projectDialogClose").focus();
}
function closeProject(){dialog.classList.remove("open");dialog.setAttribute("aria-hidden","true");document.body.classList.remove("locked")}
projects.forEach(project => {
  project.addEventListener("click", () => openProject(project));
  project.addEventListener("keydown", e => {if(e.key==="Enter"||e.key===" "){e.preventDefault();openProject(project)}});
});
$("#projectDialogClose").addEventListener("click",closeProject);
dialog.addEventListener("click",e=>{if(e.target===dialog)closeProject()});

// Artwork lightbox
const artworkData = [
  {title:"STAY CURIOUS.",sub:"A MIND IN MOTION",className:"art-tile-one",bg:"#c8ff48",color:"#14170d"},
  {title:"LESS BUT BETTER.",sub:"FORM STUDY / 02",className:"art-tile-two",bg:"#e4e0d7",color:"#161717"},
  {title:"MAKE ROOM FOR WONDER.",sub:"COMPOSITION EXERCISE",className:"art-tile-three",bg:"#29233c",color:"#f1efff"}
];
let currentArtwork=0;
const lightbox=$("#lightbox"), lightboxContent=$("#lightboxContent");
function renderArtwork(index){
  currentArtwork=(index+artworkData.length)%artworkData.length;
  const art=artworkData[currentArtwork];
  lightboxContent.style.background=art.bg;lightboxContent.style.color=art.color;
  lightboxContent.innerHTML=`<span class="tile-number">ARTWORK / ${String(currentArtwork+1).padStart(3,"0")}</span><strong>${art.title.replace(" ","<br>")}</strong><span class="tile-foot">${art.sub}</span>`;
  $("#lightboxCaption").textContent=`${String(currentArtwork+1).padStart(3,"0")} / 00${artworkData.length} — ${art.sub}`;
}
function openLightbox(index){renderArtwork(index);lightbox.classList.add("open");lightbox.setAttribute("aria-hidden","false");document.body.classList.add("locked");$("#lightboxClose").focus()}
function closeLightbox(){lightbox.classList.remove("open");lightbox.setAttribute("aria-hidden","true");document.body.classList.remove("locked")}
$$("[data-art]").forEach(button=>button.addEventListener("click",()=>openLightbox(Number(button.dataset.art))));
$("#lightboxClose").addEventListener("click",closeLightbox);
$("#lightboxPrev").addEventListener("click",()=>renderArtwork(currentArtwork-1));
$("#lightboxNext").addEventListener("click",()=>renderArtwork(currentArtwork+1));
lightbox.addEventListener("click",e=>{if(e.target===lightbox)closeLightbox()});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeLightbox();closeProject()}
  if(lightbox.classList.contains("open")&&e.key==="ArrowRight")renderArtwork(currentArtwork+1);
  if(lightbox.classList.contains("open")&&e.key==="ArrowLeft")renderArtwork(currentArtwork-1);
});

// Hero object reacts subtly to pointer; disabled for reduced motion and touch.
const heroObject=$("#heroObject");
if(!reducedMotion && matchMedia("(pointer:fine)").matches){
  $("#hero").addEventListener("pointermove",e=>{
    const rect=e.currentTarget.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width-.5, y=(e.clientY-rect.top)/rect.height-.5;
    heroObject.style.transform=`translate(${x*12}px,${y*10}px) rotateX(${-10-y*10}deg) rotateY(${18+x*18}deg)`;
  });
  $("#hero").addEventListener("pointerleave",()=>heroObject.style.transform="");
}
heroObject.addEventListener("click",()=>{heroObject.animate([{filter:"brightness(1)"},{filter:"brightness(1.65) hue-rotate(15deg)"},{filter:"brightness(1)"}],{duration:600,easing:"ease-out"})});

// Color Lab
const accentPicker=$("#accentPicker"), accentValue=$("#accentValue"), colorPreview=$("#colorPreview");
function setAccent(value){document.documentElement.style.setProperty("--lime",value);accentPicker.value=value;accentValue.value=value.toUpperCase();colorPreview.style.background=value}
accentPicker.addEventListener("input",e=>setAccent(e.target.value));
$("#resetColor").addEventListener("click",()=>setAccent("#c8ff48"));

// Generative poster
const posterPalettes=[["#ff9b72","#321d39","#ff4f87"],["#fa6686","#fff0d7","#ffb14e"],["#ffb36d","#40253f","#f66c77"],["#f5a4a0","#31213d","#ffd0a3"],["#3b2448","#ffe7c9","#fa6b80"],["#ff784f","#fff1dc","#d83f73"],["#f4c0a8","#3b2342","#ff6d7d"],["#ed5c78","#fff0d7","#ff9e63"]];
let posterIndex=0;
const posterPhrases=[["MAKE","IT","MATTER."],["STAY","A LITTLE","STRANGE."],["FIND","YOUR","SIGNAL."],["LESS","BUT","BETTER."],["THINK","BEYOND","THE FRAME."],["GOOD","THINGS","TAKE TIME."],["MAKE ROOM","FOR","WONDER."],["CREATE","YOUR OWN","SUNSET."]];
function applyPoster(){
  const [bg,fg,orb]=posterPalettes[posterIndex],out=$("#posterOutput");
  out.style.background=`linear-gradient(${115+posterIndex*11}deg,${bg},${orb})`;out.style.color=fg;
  const circle=$(".poster-circle",out);circle.style.background=`radial-gradient(circle at 30% 25%,${fg},${orb} 24%,${bg} 72%)`;
  circle.style.transform=`translate(${(posterIndex%3-1)*12}px,${(posterIndex%4-1.5)*10}px) rotate(${posterIndex*27}deg) scale(${1+(posterIndex%3)*.12})`;
  const custom=$("#posterTitle")?.value.trim();
  const words=custom?custom.toUpperCase().split(/\s+/).slice(0,7):posterPhrases[posterIndex];
  const lines=custom?[words.slice(0,Math.ceil(words.length/2)).join(" "),words.slice(Math.ceil(words.length/2)).join(" ")].filter(Boolean):words;
  $(".poster-output strong").innerHTML=lines.map(x=>x.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))).join("<br>");
  $("#posterVariantLabel").textContent=`GENERATIVE TYPE / ${String(posterIndex+1).padStart(3,"0")}`;
  out.style.setProperty("--poster-tilt",`${(posterIndex%7-3)*1.5}deg`);
}
function regeneratePoster(){posterIndex=(posterIndex+1)%posterPalettes.length;$("#posterTitle").value=posterPhrases[posterIndex].join(" ");applyPoster();}
$("#regenPoster").addEventListener("click",regeneratePoster);
$("#posterTitle").addEventListener("input",applyPoster);
$("#exportPoster").addEventListener("click",()=>{
  const [bg,fg,orb]=posterPalettes[posterIndex],title=$("#posterTitle").value.trim()||"MAKE IT MATTER.";
  const c=document.createElement("canvas");c.width=1200;c.height=1500;const x=c.getContext("2d");
  const grad=x.createLinearGradient(0,0,1200,1500);grad.addColorStop(0,bg);grad.addColorStop(1,orb);x.fillStyle=grad;x.fillRect(0,0,c.width,c.height);
  x.globalAlpha=.65;x.fillStyle=orb;x.beginPath();x.arc(890,450,300,0,Math.PI*2);x.fill();x.globalAlpha=1;
  x.strokeStyle=fg+"55";x.lineWidth=2;x.strokeRect(60,60,1080,1380);
  x.fillStyle=fg;x.font="22px monospace";x.fillText("SPARSH.S  /  VISUAL EXPERIMENT",90,125);
  const lines=title.toUpperCase().split(/\s+/);let rows=[],row="";lines.forEach(w=>{if((row+" "+w).trim().length>11){rows.push(row);row=w}else row=(row+" "+w).trim()});if(row)rows.push(row);
  x.font="bold 118px Georgia, serif";let yy=650-((rows.length-1)*65);rows.forEach(t=>{x.fillText(t,90,yy);yy+=135});
  x.font="20px monospace";x.fillText("GENERATED IN THE SPARSH.S POSTER LAB",90,1360);
  const a=document.createElement("a");a.download=`sparsh-poster-${String(posterIndex+1).padStart(3,"0")}.png`;a.href=c.toDataURL("image/png");a.click();
});
applyPoster();

// Glitch typography
const glitchInput=$("#glitchText"),glitchWord=$("#glitchWord"),glitchRange=$("#glitchRange");
function updateGlitch(){const value=(glitchInput.value||"TYPE").slice(0,18).toUpperCase();glitchWord.textContent=value;glitchWord.dataset.text=value;glitchWord.style.setProperty("--distortion",glitchRange.value);$("#glitchAmount").value=glitchRange.value}
glitchInput.addEventListener("input",updateGlitch);glitchRange.addEventListener("input",updateGlitch);
$("#resetGlitch").addEventListener("click",()=>{glitchInput.value="FUTURE";glitchRange.value=4;updateGlitch()});

// Lightweight canvas particle field
const canvas=$("#particleCanvas"),ctx=canvas.getContext("2d");
let particles=[], pointer={x:-1000,y:-1000},raf=0,canvasVisible=true;
function initParticles(){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5);
  canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
  const count=Math.min(window.innerWidth<620?52:95,Math.floor(rect.width/7));
  particles=Array.from({length:count},()=>({x:Math.random()*rect.width,y:Math.random()*rect.height,ox:0,oy:0,vx:0,vy:0,r:Math.random()*1.3+.5}));
  particles.forEach(p=>{p.ox=p.x;p.oy=p.y});
}
function drawParticles(){
  if(!canvasVisible||document.hidden)return;
  const rect=canvas.getBoundingClientRect();ctx.clearRect(0,0,rect.width,rect.height);
  particles.forEach(p=>{
    const dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<90&&dist>0){const force=(90-dist)/90;p.vx+=(dx/dist)*force*.65;p.vy+=(dy/dist)*force*.65}
    p.vx+=(p.ox-p.x)*.012;p.vy+=(p.oy-p.y)*.012;p.vx*=.92;p.vy*=.92;p.x+=p.vx;p.y+=p.vy;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle="rgba(200,255,72,.7)";ctx.fill();
    if(dist<125){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.strokeStyle=`rgba(76,141,255,${(1-dist/125)*.22})`;ctx.lineWidth=.6;ctx.stroke()}
  });
  if(!reducedMotion)raf=requestAnimationFrame(drawParticles);
}
canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top}});
canvas.addEventListener("pointerleave",()=>{pointer={x:-1000,y:-1000}});
$("#resetParticles").addEventListener("click",()=>{initParticles();pointer={x:-1000,y:-1000};if(reducedMotion)drawParticles()});
const canvasObserver=new IntersectionObserver(entries=>{canvasVisible=entries[0].isIntersecting;if(canvasVisible){if(raf)cancelAnimationFrame(raf);drawParticles()}else if(raf)cancelAnimationFrame(raf)});
canvasObserver.observe(canvas);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){if(raf)cancelAnimationFrame(raf);drawParticles()}});
window.addEventListener("resize",()=>{initParticles();if(reducedMotion)drawParticles()});
initParticles();
if(reducedMotion){drawParticles()}else{drawParticles()}

// Reveal effects only when motion is allowed
if(!reducedMotion && "IntersectionObserver" in window){
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");revealObserver.unobserve(entry.target)}}),{threshold:.12});
  $$(".section-heading,.chapter-index,.dev-layout,.motion-head,.playground-head,.about-layout,.toolkit-head,.contact-content,.work-head,.now-head,.process-head").forEach(el=>{el.classList.add("reveal");revealObserver.observe(el)});
}

// Contact configuration warning + actual mailto link
function configureEmail(){
  const valid=CONFIG.email && CONFIG.email.includes("@");
  const link=$("#emailLink"),warning=$("#emailWarning");
  if(valid){link.href=`mailto:${CONFIG.email}?subject=${encodeURIComponent("Let's make something")}`;if(warning)warning.hidden=true}
  else{link.href="#";link.addEventListener("click",e=>{e.preventDefault();if(warning){warning.textContent="Add your email address in script.js to activate this link.";warning.style.color="#f0b77b"}})}
}
configureEmail();


// Discord handles do not have a universal public profile URL; copy the supplied handle.
const discordCopy = $("#discordCopy");
if (discordCopy) {
  discordCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.discord);
      const original = discordCopy.textContent;
      discordCopy.textContent = "DISCORD USERNAME COPIED ✓";
      window.setTimeout(() => { discordCopy.textContent = original; }, 1800);
    } catch (_) {
      window.prompt("Copy your Discord username:", CONFIG.discord);
    }
  });
}


// Scroll-driven cinematic build-up: progress, chapter depth, and subtle parallax.
const progressBar=$("#scrollProgress");
let scrollTick=false;
function updateScrollStory(){
  const max=document.documentElement.scrollHeight-window.innerHeight;
  const progress=max>0?window.scrollY/max:0;
  if(progressBar)progressBar.style.transform=`scaleX(${progress})`;
  document.documentElement.style.setProperty("--scroll-progress",progress.toFixed(4));
  $$(".hero-copy h1, .orbital-stage, .film-frame, .poster-output").forEach((el,i)=>{
    const r=el.getBoundingClientRect();const center=(r.top+r.height/2-window.innerHeight/2)/(window.innerHeight/2);
    if(!reducedMotion && Math.abs(center)<2.2){el.style.setProperty("--scroll-depth",String(Math.max(-1,Math.min(1,center))));}
  });
  scrollTick=false;
}
window.addEventListener("scroll",()=>{if(!scrollTick){requestAnimationFrame(updateScrollStory);scrollTick=true}},{passive:true});
updateScrollStory();
if(!reducedMotion && "IntersectionObserver" in window){
  const cinematicObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in-scene");else e.target.classList.remove("in-scene")}),{threshold:.16});
  $$(".intro-note,.dev-section,.motion-section,.repos-section,.playground-section,.about-section,.now-section,.process-section,.toolkit-section,.contact-section").forEach(el=>cinematicObserver.observe(el));
}

// Live age counter, calculated from the supplied birth date (8 March 2011).
function updateAgeCounter(){
  const now=new Date(),birth=new Date(2011,2,8,0,0,0),years=now.getFullYear()-birth.getFullYear();
  let completedYears=years;if(new Date(now.getFullYear(),2,8)>now)completedYears--;
  const lastBirthday=new Date(now.getFullYear()-(new Date(now.getFullYear(),2,8)>now?1:0),2,8,0,0,0);
  let months=(now.getFullYear()-lastBirthday.getFullYear())*12+now.getMonth()-lastBirthday.getMonth();
  if(now.getDate()<lastBirthday.getDate())months--;
  const monthStart=new Date(lastBirthday.getFullYear(),lastBirthday.getMonth()+Math.max(0,months),lastBirthday.getDate());
  const days=Math.floor((now-monthStart)/86400000),hours=Math.floor((now-monthStart)/3600000)%24,minutes=Math.floor((now-monthStart)/60000)%60,seconds=Math.floor((now-monthStart)/1000)%60;
  const values={ageYears:completedYears,ageMonths:Math.max(0,months),ageDays:Math.max(0,days),ageHours:String(hours).padStart(2,"0"),ageMinutes:String(minutes).padStart(2,"0"),ageSeconds:String(seconds).padStart(2,"0")};
  Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value});
}
updateAgeCounter();window.setInterval(updateAgeCounter,1000);

// Dynamic public GitHub repository gallery; README images become clickable covers.
(async function(){const grid=document.getElementById('repoGrid'),status=document.getElementById('repoStatus');if(!grid||!status)return;const owner='sparshsinghal1618';const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const safe=v=>{try{let u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}};function imgs(md,name){let a=[];const add=x=>{if(!x)return;x=x.trim().replace(/^<|>$/g,'').replace(/&amp;/g,'&');if(x.startsWith('//'))x='https:'+x;if(x.startsWith('/'))x='https://github.com'+x;if(x.startsWith('./')||x.startsWith('../'))x='https://raw.githubusercontent.com/'+owner+'/'+name+'/HEAD/'+x.replace(/^\.\//,'');if(x.startsWith('http')&&!/shields\.io|badge|visitor-badge/i.test(x)){x=safe(x);if(x)a.push(x)}};for(let m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g))add(m[1]);for(let m of md.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi))add(m[1]);return [...new Set(a)]}try{status.textContent='FETCHING PUBLIC REPOSITORIES…';let res=await fetch('https://api.github.com/users/'+owner+'/repos?per_page=100&sort=updated&type=owner');if(!res.ok)throw Error();let repos=(await res.json()).filter(r=>!r.private);status.textContent=repos.length+' PUBLIC REPOSITORIES · CLICK ANY COVER TO OPEN';let cards=await Promise.all(repos.map(async r=>{let shot='';try{let q=await fetch('https://api.github.com/repos/'+owner+'/'+encodeURIComponent(r.name)+'/readme',{headers:{Accept:'application/vnd.github.raw+json'}});if(q.ok){let ct=q.headers.get('content-type')||'',md='';if(ct.includes('json')){let d=await q.json();md=atob((d.content||'').replace(/\n/g,''))}else md=await q.text();let aa=imgs(md,r.name);shot=aa.find(x=>/screenshot|preview|demo|screen|assets|images/i.test(x))||aa[0]||''}}catch(_){}let target=safe(r.homepage)||r.html_url;let cover=shot?`<img class="repo-cover" src="${esc(shot)}" alt="${esc(r.name)} README screenshot" loading="lazy" onerror="this.outerHTML='<div class=&quot;repo-cover repo-cover-fallback&quot;>${esc(r.name.slice(0,2).toUpperCase())}</div>'">`:`<div class="repo-cover repo-cover-fallback">${esc(r.name.slice(0,2).toUpperCase())}</div>`;return `<a class="repo-card" href="${esc(target)}" target="_blank" rel="noopener noreferrer">${cover}<div class="repo-card-body"><div class="repo-card-title"><h3>${esc(r.name)}</h3><span class="repo-arrow">↗</span></div><p>${esc(r.description||'Open-source project by Sparsh.')}</p><div class="repo-meta"><span>${esc(r.language||'Project')}</span><span>★ ${r.stargazers_count}</span><span>⑂ ${r.forks_count}</span></div></div></a>`}));grid.innerHTML=cards.join('');if(!reducedMotion&&'IntersectionObserver'in window){let io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'ease-out',fill:'both'});io.unobserve(e.target)}}),{threshold:.08});grid.querySelectorAll('.repo-card').forEach(c=>io.observe(c))}}catch(_){status.innerHTML='Could not load repositories. <a href="https://github.com/'+owner+'?tab=repositories" target="_blank" rel="noopener">Open all repositories on GitHub ↗</a>';status.classList.add('repo-error')}})();
