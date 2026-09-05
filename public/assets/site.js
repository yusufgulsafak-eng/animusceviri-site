const ANIMUS_API='https://animus-api.intelpol.workers.dev';
const ANIMUS_DISCORD='https://discord.gg/RMP6gGHpKK';
const ANIMUS_LOADER='https://pixeldrain.com/u/HKKVZccd';
const HERO_VIDEO_CANDIDATES=[
  '/media/branding/3709ed447f3e797ca72515794bfc56d1a59b159f115c4f02.mp4',
  '/media/branding/7feca53e9c19e906a76577ff0bcb3c629ddcc492ef4a973b.mp4'
];

function assetUrl(path,fallback='/assets/placeholders/cover-generic.svg'){
  const value=path||fallback;
  if(/^https?:\/\//i.test(value)) return value;
  return ANIMUS_API+(value.startsWith('/')?value:'/'+value);
}
function esc(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function discordIcon(){return '<svg class="discord-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.54 5.34A16.3 16.3 0 0 0 15.44 4l-.5 1.02a15.1 15.1 0 0 0-5.87 0L8.55 4A16.5 16.5 0 0 0 4.46 5.35C1.87 9.2 1.17 12.96 1.52 16.67a16.63 16.63 0 0 0 5.02 2.54l1.21-1.65a10.75 10.75 0 0 1-1.9-.92l.47-.36c3.67 1.7 7.65 1.7 11.27 0l.48.36c-.61.36-1.25.67-1.91.92l1.2 1.65a16.58 16.58 0 0 0 5.02-2.54c.42-4.3-.72-8.02-2.84-11.33ZM8.85 14.4c-1.1 0-2-1.02-2-2.27 0-1.25.88-2.27 2-2.27s2.02 1.03 2 2.27c0 1.25-.89 2.27-2 2.27Zm6.3 0c-1.1 0-2-1.02-2-2.27 0-1.25.88-2.27 2-2.27 1.12 0 2.02 1.03 2 2.27 0 1.25-.88 2.27-2 2.27Z"/></svg>'}
function initChrome(){
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const toggle=document.querySelector('.mobile-toggle');
  const menu=document.querySelector('.mobile-menu');
  if(toggle&&menu)toggle.addEventListener('click',()=>menu.classList.toggle('open'));
  document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>menu?.classList.remove('open')));
  document.querySelectorAll('.faq-btn').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.faq-item')?.classList.toggle('open')));
  document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('reveal'));
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  document.querySelectorAll('a[href^="https://discord.gg/"]').forEach(a=>{if(!a.querySelector('svg'))a.insertAdjacentHTML('afterbegin',discordIcon())});
}
async function getPublicGames(){
  const r=await fetch(ANIMUS_API+'/api/public/games',{headers:{Accept:'application/json'},cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const j=await r.json();
  if(!j.ok||!Array.isArray(j.data))throw new Error('Geçersiz katalog');
  return j.data;
}
function waitForVideo(video,timeout=7000){
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(ok)=>{if(done)return;done=true;clearTimeout(timer);video.removeEventListener('canplay',onCanPlay);video.removeEventListener('loadeddata',onCanPlay);video.removeEventListener('error',onError);ok?resolve():reject(new Error('video'))};
    const onCanPlay=()=>finish(true),onError=()=>finish(false);
    const timer=setTimeout(()=>finish(false),timeout);
    video.addEventListener('canplay',onCanPlay,{once:true});
    video.addEventListener('loadeddata',onCanPlay,{once:true});
    video.addEventListener('error',onError,{once:true});
  });
}
async function tryVideoSource(video,src){
  video.classList.remove('ready');
  video.pause();
  video.src=assetUrl(src);
  video.muted=true;video.loop=true;video.playsInline=true;video.autoplay=true;video.preload='auto';
  video.load();
  await waitForVideo(video);
  try{await video.play()}catch(e){}
  video.classList.add('ready');
  return true;
}
async function initHeroVideo(){
  const video=document.querySelector('[data-hero-video]');
  if(!video)return;
  video.style.display='block';
  video.style.opacity='0';
  let loaded=false;
  for(const src of HERO_VIDEO_CANDIDATES){
    try{await tryVideoSource(video,src);loaded=true;break}catch(e){console.warn('Video açılamadı:',src)}
  }
  if(!loaded){
    video.style.display='none';
    return;
  }
  requestAnimationFrame(()=>{video.style.opacity='1'});
  const retry=()=>{if(video.paused)video.play().catch(()=>{})};
  document.addEventListener('pointerdown',retry,{once:true});
  document.addEventListener('keydown',retry,{once:true});
}
function initDeck(deck,games){
  const list=games.slice(0,Math.min(games.length,8));
  if(!list.length){deck.innerHTML='';return}
  let index=0,timer;
  deck.innerHTML=`<div class="deck-glow"></div><div class="deck-stage"></div><div class="deck-badge"><small>Canlı kütüphane</small><b>${games.length} oyun</b></div><div class="deck-controls"><button class="deck-arrow prev" aria-label="Önceki">‹</button><div class="deck-dots"></div><button class="deck-arrow next" aria-label="Sonraki">›</button></div>`;
  const stage=deck.querySelector('.deck-stage'),dots=deck.querySelector('.deck-dots');
  function itemAt(offset){return list[(index+offset+list.length)%list.length]}
  function draw(){
    const positions=[['left',-1],['center',0],['right',1]];
    stage.innerHTML=positions.map(([pos,off])=>{const g=itemAt(off);return `<div class="deck-card" data-pos="${pos}"><img src="${esc(assetUrl(g.cover_path))}" alt="${esc(g.name)}"><strong>${esc(g.name)}</strong></div>`}).join('');
    dots.innerHTML=list.slice(0,Math.min(list.length,6)).map((_,i)=>`<button class="deck-dot ${i===index%Math.min(list.length,6)?'active':''}" data-i="${i}" aria-label="Oyun ${i+1}"></button>`).join('');
    dots.querySelectorAll('.deck-dot').forEach(b=>b.onclick=()=>{index=Number(b.dataset.i);draw();restart()});
  }
  function step(n){index=(index+n+list.length)%list.length;draw()}
  function restart(){clearInterval(timer);timer=setInterval(()=>step(1),4800)}
  deck.querySelector('.prev').onclick=()=>{step(-1);restart()};
  deck.querySelector('.next').onclick=()=>{step(1);restart()};
  draw();restart();
}
async function initHomeCatalog(){
  const featured=document.querySelector('[data-featured-grid]');
  const deck=document.querySelector('[data-feature-deck]');
  const total=document.querySelector('[data-total-games]');
  const completed=document.querySelector('[data-completed-games]');
  if(!featured&&!deck&&!total&&!completed)return;
  try{
    const games=await getPublicGames();
    if(total)total.textContent=games.length;
    if(completed)completed.textContent=games.filter(g=>Number(g.translation_percent)===100).length;
    const preferred=['assassins-creed-iv-black-flag','far-cry-5','bloodrayne-2-terminal-cut'];
    let picks=preferred.map(slug=>games.find(g=>g.slug===slug)).filter(Boolean);
    for(const g of games){if(picks.length>=6)break;if(!picks.includes(g))picks.push(g)}
    if(deck)initDeck(deck,games);
    if(featured){
      featured.innerHTML=picks.slice(0,3).map(g=>{const pct=Math.max(0,Math.min(100,Number(g.translation_percent)||0));return `<article class="project-card"><div class="project-art"><img loading="lazy" src="${esc(assetUrl(g.banner_path||g.cover_path))}" alt="${esc(g.name)}"><span class="project-tag">${g.access_type==='premium'?'PREMIUM':'ÜCRETSİZ'}</span></div><div class="project-content"><h3>${esc(g.name)}</h3><p>${esc(g.short_description||'Animus Türkçe yama projesi.')}</p><div class="project-foot"><span class="status">%${pct} ÇEVİRİ</span><a class="text-link" href="./kutuphane.html">Kütüphanede gör →</a></div></div></article>`}).join('');
    }
  }catch(e){
    console.error(e);
    if(featured)featured.innerHTML='<div class="error">Oyun kataloğu şu anda yüklenemedi.</div>';
  }
}
document.addEventListener('DOMContentLoaded',()=>{initChrome();initHeroVideo();initHomeCatalog();});
