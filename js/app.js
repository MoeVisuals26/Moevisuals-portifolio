/* Simple, no surprises. */

/* Iris diaphragm breathing with scroll. Each of the 8 blades is a
   simple triangle: two points fixed on the outer rim (so the rim
   is always a clean circle, exactly like the reference photo) and
   one point near the centre. As you scroll, that single inner
   point moves toward/away from the centre — shrinking or growing
   the pinwheel-shaped hole, exactly like the reference's 3 states.
   This recomputes the actual path shape on scroll (not a rotation
   trick), so there's no CSS transform-origin ambiguity at all. */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const blades = document.querySelectorAll('.iris-blade');
  if (!blades.length) return;

  const N = 8, cx = 200, cy = 200, Router = 170, twist = 20;
  const R_OPEN = 150;    // inner point near the rim — thin blades, big hole
  const R_CLOSED = 10;   // inner point near the centre — thick blades, tiny hole
  const CLOSE_DISTANCE = 1000;
  let queued = false;

  function buildPaths(Rinner){
    const paths = [];
    for (let k = 0; k < N; k++) {
      const a0 = (360 / N) * k;
      const a1 = a0 + (360 / N);
      const aMid = a0 + (360 / N) / 2 + twist;
      const r0 = a0 * Math.PI / 180, r1 = a1 * Math.PI / 180, rM = aMid * Math.PI / 180;
      const p1x = (cx + Router * Math.cos(r0)).toFixed(2), p1y = (cy + Router * Math.sin(r0)).toFixed(2);
      const p2x = (cx + Router * Math.cos(r1)).toFixed(2), p2y = (cy + Router * Math.sin(r1)).toFixed(2);
      const p3x = (cx + Rinner * Math.cos(rM)).toFixed(2), p3y = (cy + Rinner * Math.sin(rM)).toFixed(2);
      paths.push(`M ${p1x},${p1y} L ${p2x},${p2y} L ${p3x},${p3y} Z`);
    }
    return paths;
  }

  function update(){
    const progress = Math.min(1, Math.max(0, window.scrollY / CLOSE_DISTANCE));
    const Rinner = R_OPEN - (R_OPEN - R_CLOSED) * progress;
    const paths = buildPaths(Rinner);
    blades.forEach((b, i) => b.setAttribute('d', paths[i]));
    queued = false;
  }
  window.addEventListener('scroll', ()=>{
    if(!queued){ queued = true; requestAnimationFrame(update); }
  }, { passive:true });
  update();
})();

/* Scroll reveal — opacity + transform only, no filters/blend-modes */
(function(){
  const els = document.querySelectorAll('[data-reveal]');
  if(!els.length || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
})();

/* Hamburger menu */
(function(){
  const btn = document.getElementById('hamburger');
  const links = document.querySelector('.nav-links');
  if(!btn || !links) return;
  btn.addEventListener('click', ()=> links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> links.classList.remove('open'));
  });
})();

/* Card click — navigate to project page using data attributes (not href query params,
   which get mangled by HTML entity parsing in some browsers) */
document.addEventListener('click', function(e){
  const card = e.target.closest('.card[data-slug]');
  if (!card) return;
  const slug = card.dataset.slug;
  const cat  = card.dataset.cat;
  if (!slug) return;
  e.preventDefault();
  window.location.href = 'project.html?slug=' + encodeURIComponent(slug) + '&cat=' + encodeURIComponent(cat);
});

/* Video hover on cards */
function initVideoHover(){
  document.querySelectorAll('.card').forEach(card=>{
    const vid = card.querySelector('video');
    if(!vid) return;
    card.addEventListener('mouseenter', ()=> vid.play().catch(()=>{}));
    card.addEventListener('mouseleave', ()=>{ vid.pause(); vid.currentTime = 0; });
  });
}

/* ── Broken media fallbacks ──────────────────────────────────
   If Mohamed's cover photo, snapshot, or uploaded video file is
   ever missing or 404s (wrong path, deleted upload, a stray bad
   reference like we hit once before), these swap the broken
   element for a clean placeholder INSTEAD of a broken-image icon
   or a dead video player. Called via onerror="" attributes set in
   js/data.js and project.html — global so those inline handlers
   can reach them. */
function handleImgError(img){
  const kind = img.dataset.fallback || 'card';
  let html;
  if (kind === 'gallery') html = '<span>Snapshot</span>';
  else if (kind === 'cover') html = '<div class="video-placeholder"><span>Image Unavailable</span></div>';
  else html = '<div class="card-placeholder"><span>Thumbnail</span></div>';
  img.outerHTML = html;
}

function handleVideoError(video){
  video.outerHTML = '<div class="video-placeholder"><span>Video Unavailable</span></div>';
}
