const ANIMUS_API='https://animus-api.intelpol.workers.dev';
const ANIMUS_DISCORD='https://discord.gg/RMP6gGHpKK';
const ANIMUS_LOADER='https://pixeldrain.com/u/HKKVZccd';
const ANIMUS_HERO_VIDEO='/media/branding/3709ed447f3e797ca72515794bfc56d1a59b159f115c4f02.mp4';

function assetUrl(path,fallback='/assets/placeholders/cover-generic.svg'){
  const value=path||fallback;
  if(/^https?:\/\//i.test(value)) return value;
  return ANIMUS_API+(value.startsWith('/')?value:'/'+value);
}
function esc(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function initChrome(){
  const y=document.querySelectorAll('[data-year]');
  y.forEach(el=>el.textContent=new Date().getFullYear());
  const toggle=document.querySelector('.mobile-toggle');
  const menu=document.querySelector('.mobile-menu');
  if(toggle&&menu) toggle.addEventListener('click',()=>menu.classList.toggle('open'));
  document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>menu?.classList.remove('open')));
  document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('reveal'));
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  document.querySelectorAll('.faq-btn').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.faq-item')?.classList.toggle('open')));
}
async function getPublicGames(){
  const r=await fetch(ANIMUS_API+'/api/public/games',{headers:{Accept:'application/json'}});
  if(!r.ok) throw new Error('HTTP '+r.status);
  const j=await r.json();
  if(!j.ok||!Array.isArray(j.data)) throw new Error('Geçersiz katalog');
  return j.data;
}
async function loadBrandingFallback(video,poster){
  try{
    const r=await fetch(ANIMUS_API+'/api/loader/config',{headers:{Accept:'application/json'}});
    const j=await r.json();
    const data=j?.data||{};
    const login=data?.branding?.login_background||{};
    const library=data?.branding?.library_background||{};
    const videoSrc=login.video_url||library.video_url||null;
    const imageSrc=login.image_url||login.fallback_url||library.image_url||library.fallback_url||data.banner_url||'/2x.png';
    if(poster) poster.src=assetUrl(imageSrc,'/2x.png');
    if(video&&videoSrc){
      video.onerror=null;
      video.src=assetUrl(videoSrc);
      video.poster=assetUrl(imageSrc,'/2x.png');
      video.load();
      video.play().catch(()=>{});
    }else if(video){
      video.style.display='none';
    }
  }catch(e){
    if(video) video.style.display='none';
    if(poster) poster.src=ANIMUS_API+'/2x.png';
  }
}
async function initHeroVideo(){
  const video=document.querySelector('[data-hero-video]');
  const poster=document.querySelector('[data-hero-poster]');
  if(!video&&!poster)return;
  if(poster) poster.src=ANIMUS_API+'/2x.png';
  if(!video){return;}

  let switched=false;
  const fallback=()=>{
    if(switched)return;
    switched=true;
    loadBrandingFallback(video,poster);
  };

  video.muted=true;
  video.loop=true;
  video.playsInline=true;
  video.autoplay=true;
  video.onerror=fallback;
  video.src=assetUrl(ANIMUS_HERO_VIDEO);
  video.load();
  try{
    await video.play();
  }catch(e){
    const once=()=>{video.play().catch(()=>{});document.removeEventListener('pointerdown',once)};
    document.addEventListener('pointerdown',once,{once:true});
  }
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
    for(const g of games){if(picks.length>=3)break;if(!picks.includes(g))picks.push(g)}
    if(deck){
      deck.innerHTML='<div class="deck-glow"></div>'+picks.slice(0,3).map(g=>`<div class="deck-card"><img src="${esc(assetUrl(g.cover_path))}" alt="${esc(g.name)}"><strong>${esc(g.name)}</strong></div>`).join('')+`<div class="deck-badge"><small>Canlı kütüphane</small><b>${games.length} oyun</b></div>`;
    }
    if(featured){
      featured.innerHTML=picks.slice(0,3).map(g=>{const pct=Math.max(0,Math.min(100,Number(g.translation_percent)||0));return `<article class="project-card"><div class="project-art"><img loading="lazy" src="${esc(assetUrl(g.banner_path||g.cover_path))}" alt="${esc(g.name)}"><span class="project-tag">${g.access_type==='premium'?'PREMIUM':'ÜCRETSİZ'}</span></div><div class="project-content"><h3>${esc(g.name)}</h3><p>${esc(g.short_description||'Animus Türkçe yama projesi.')}</p><div class="project-foot"><span class="status">%${pct} ÇEVİRİ</span><a class="text-link" href="./kutuphane.html">Kütüphanede gör →</a></div></div></article>`}).join('');
    }
  }catch(e){
    if(featured)featured.innerHTML='<div class="error">Oyun kataloğu şu anda yüklenemedi.</div>';
  }
}

document.addEventListener('DOMContentLoaded',()=>{initChrome();initHeroVideo();initHomeCatalog();});
