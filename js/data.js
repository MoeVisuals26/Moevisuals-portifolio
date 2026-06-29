/* Loads project data from 4 separate files — one per category —
   that Mohamed's admin panel (at /admin) edits as 4 clearly labeled
   sections (Campaigns, Reels, Documentaries, AI Shoots) instead of
   one giant mixed list. Which file a project lives in IS its
   category — we tag it here on load, overriding anything that
   might be in the JSON itself, so a project can never end up
   miscategorized. */

const CATEGORY_LABELS = {
  campaigns:     'Campaigns',
  documentaries: 'Documentaries',
  'ai-shoots':   'AI Shoots',
};

const CATEGORY_FILES = {
  campaigns:     'content/campaigns.json',
  documentaries: 'content/documentaries.json',
  'ai-shoots':   'content/ai-shoots.json',
};

let _projectsCache = null;

async function loadProjects(){
  if (_projectsCache) return _projectsCache;
  const categories = Object.keys(CATEGORY_FILES);
  const results = await Promise.all(categories.map(async cat => {
    try {
      const res = await fetch(CATEGORY_FILES[cat], { cache: 'no-store' });
      const data = await res.json();
      return (data.items || []).map(p => ({ ...p, category: cat }));
    } catch (e) {
      console.warn(`Could not load ${CATEGORY_FILES[cat]}`, e);
      return [];
    }
  }));
  _projectsCache = results.flat();
  try { sessionStorage.setItem('moe_projects', JSON.stringify(_projectsCache)); } catch(e) {}
  return _projectsCache;
}

async function getProjectBySlug(slug){
  try {
    const cached = sessionStorage.getItem('moe_projects');
    if (cached) {
      const found = JSON.parse(cached).find(p => p.slug === slug);
      if (found) return found;
    }
  } catch(e) {}
  const all = await loadProjects();
  return all.find(p => p.slug === slug);
}

/* Card used in grids — links to the project's own detail page.
   Shows a real cover image if Mohamed uploaded one, otherwise the
   placeholder box.

   useCustomRatio: pass true on the Reels/Campaigns/Documentaries/
   AI Shoots pages to let Mohamed's per-project "Card Shape" choice
   apply. Leave false (or omit) on the Home page so it always stays
   the same fixed shape no matter what he picked for that project. */
function renderCard(p, useCustomRatio){
  const thumb = p.thumbnail
    ? `<img src="${p.thumbnail}" alt="${p.title}" loading="lazy" data-fallback="card" onerror="handleImgError(this)"/>`
    : `<div class="card-placeholder"><span>Thumbnail</span></div>`;
  const ratioStyle = (useCustomRatio && p.cardRatio)
    ? ` style="aspect-ratio:${p.cardRatio.replace(':', '/')}"`
    : '';
  return `
    <a href="project.html" class="card" data-slug="${p.slug || ''}" data-cat="${p.category || ''}">
      <div class="card-thumb"${ratioStyle}>
        ${thumb}
        <div class="card-overlay"><span>View</span></div>
      </div>
      <div class="card-title">${p.title}</div>
    </a>`;
}

async function getProjects(category, limit){
  const all = await loadProjects();
  let list = category ? all.filter(p => p.category === category) : all;
  if (limit) list = list.slice(0, limit);
  return list;
}

/* Converts a plain YouTube/Vimeo URL into an embeddable iframe URL.
   Returns null if there's no video yet (shows a placeholder instead). */
function embedUrl(url){
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`;
  return url; // assume already an embed-ready URL
}

/* Returns a normalized list of videos for a project, in order:
   [{ type:'file', src, caption }, { type:'embed', src, caption }, ...]

   Supports two shapes so old, already-published projects keep
   working without being re-edited:
   - NEW: p.videos = [{ file, link, caption }, ...]  (the list field)
   - LEGACY: a single p.videoFile and/or p.video on the project
     itself, from before multiple videos were supported. */
function getVideoList(p){
  const list = [];
  if (Array.isArray(p.videos)) {
    p.videos.forEach(v => {
      if (!v) return;
      if (v.file) list.push({ type: 'file', src: v.file, caption: v.caption || '' });
      else if (v.link) {
        const embed = embedUrl(v.link);
        if (embed) list.push({ type: 'embed', src: embed, caption: v.caption || '' });
      }
    });
  }
  // Legacy single-video fields — only used if the new list is empty,
  // so an old project still shows its video without needing an edit.
  if (!list.length) {
    if (p.videoFile) list.push({ type: 'file', src: p.videoFile, caption: '' });
    else if (p.video) {
      const embed = embedUrl(p.video);
      if (embed) list.push({ type: 'embed', src: embed, caption: '' });
    }
  }
  return list;
}
