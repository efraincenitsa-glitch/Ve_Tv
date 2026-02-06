
// ===== Estado global =====
const state = {
  channels: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem('favorites')||'[]')),
  groups: new Set(),
  countries: new Set(),
  classifications: new Set(),
  showFavs: false,
  current: null
};

// ===== Config =====
const ADULT_PIN = '1975';
const ADULT_TTL_MIN = 30; // minutos
let showAdult = false; // oculto por defecto

// ===== Elements =====
const groupFilter = document.getElementById('groupFilter');
const countryFilter = document.getElementById('countryFilter');
const classFilter = document.getElementById('classFilter');
const searchBox = document.getElementById('search');
const btnFavs = document.getElementById('btnFavs');
const btnImport = document.getElementById('btnImport');
const fileInput = document.getElementById('fileInput');
const videoEl = document.getElementById('player');

// ===== Utils =====
function escapeHTML(s){return (s||'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function extAttr(line, key){const re=new RegExp(`${key}="([^"]*)"`,'i');const m=line?.match(re);return m?m[1]:''}
const NORMALIZE = {
  'news':'Noticias','noticias':'Noticias','business':'Negocios','finance':'Negocios',
  'sports':'Deportes','sport':'Deportes','kids':'Infantil','children':'Infantil',
  'culture':'Cultural','cultural':'Cultural','documentary':'Documentales','documentaries':'Documentales',
  'education':'Educativo','educational':'Educativo','music':'Música','regional':'Regional',
  'general':'General','legislative':'Legislativo','science':'Ciencia','technology':'Tecnología',
  'movies':'Películas','series':'Series','lifestyle':'Estilo de vida','religion':'Religión',
  'international':'Internacional','history':'Historia','arts':'Arte','nature':'Naturaleza',
  'adulto':'Adulto','adult':'Adulto','18+':'Adulto','+18':'Adulto','mature':'Adulto',
  'nocturno':'Nocturno'
};
function normTag(t){const key=(t||'').trim().toLowerCase();return NORMALIZE[key]||(t||'').trim().replace(/\s+/g,' ').replace(/^./,c=>c.toUpperCase())}
const ADULT_TAGS = new Set(['Adulto','18+']);
const ADULT_RATINGS = [/^\s*18\+\s*$/i,/\badult/i,/\bmature/i,/\+18\b/i];
function hasAdultTags(tags=[]) {return tags.some(t=>ADULT_TAGS.has(t));}
function hasAdultRating(r=''){return ADULT_RATINGS.some(rx=>rx.test(r));}

function adultUnlocked(){const until=parseInt(localStorage.getItem('adult_pin_unlocked_until')||'0',10);return Number.isFinite(until)&&until>Date.now()}
function lockAdultUntil(ttlMin=ADULT_TTL_MIN){const until=Date.now()+ttlMin*60*1000;localStorage.setItem('adult_pin_unlocked_until',String(until))}
async function requireAdultPin(){if(adultUnlocked())return true;const pin=window.prompt('Contenido para adultos. Ingresa la contraseña:');if(pin===ADULT_PIN){lockAdultUntil();return true}if(pin!==null)alert('Contraseña incorrecta.');return false}

// ===== Parser M3U =====
function parseM3U(text){
  const lines=text.split(/\r?\n/);const channels=[];let last=null;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim(); if(!line||line.startsWith('#EXTM3U')) continue;
    if(line.startsWith('#EXTINF')){ last=line }
    else if(!line.startsWith('#')){
      const url=line; const name=(last?.split(',').slice(1).join(',').trim())||url;
      const tvgId=extAttr(last||'','tvg-id')||''; const logo=extAttr(last||'','tvg-logo')||'';
      const country=extAttr(last||'','tvg-country')||''; const lang=extAttr(last||'','tvg-language')||'';
      const groupRaw=extAttr(last||'','group-title')||'Otros';
      const rawTags=groupRaw.split(/[;,/]/).map(x=>x.trim()).filter(Boolean);
      const tags=[...new Set(rawTags.map(normTag))]; const group=tags[0]||normTag(groupRaw)||'Otros';
      const isWeb=(extAttr(last||'','x-web')||'').toLowerCase()==='true'; const site=extAttr(last||'','x-site')||'';
      const rating=extAttr(last||'','tvg-rating')||''; const xAdult=(extAttr(last||'','x-adult')||'').toLowerCase()==='true';
      const adult=xAdult||hasAdultTags(tags)||hasAdultRating(rating);
      channels.push({name,url,tvgId,logo,country,lang,group,tags,web:isWeb,site,rating,adult});
      last=null;
    }
  }
  return channels;
}

// ===== Catalog builders =====
function rebuildGroups(){
  state.groups=new Set(state.channels.map(c=>c.group||'Otros'));
  groupFilter.innerHTML='<option value="">Todos los grupos</option>'+[...state.groups].sort().map(g=>`<option>${escapeHTML(g)}</option>`).join('');
}
function rebuildCountries(){
  state.countries=new Set(state.channels.map(c=>c.country||'').filter(Boolean));
  countryFilter.innerHTML='<option value="">Todos los países</option>'+[...state.countries].sort().map(cc=>`<option>${escapeHTML(cc)}</option>`).join('');
}
function rebuildClassifications(){
  const all=new Set(); state.channels.forEach(c=>(c.tags||[]).forEach(t=>all.add(t)));
  state.classifications=all;
  classFilter.innerHTML='<option value="">Todas las clasificaciones</option>'+[...all].sort().map(t=>`<option>${escapeHTML(t)}</option>`).join('');
}

// ===== Filters =====
function applyFilters(){
  const q=searchBox.value.toLowerCase();
  const group=groupFilter.value; const country=countryFilter.value; const klass=classFilter.value;
  state.filtered = state.channels.filter(c=>{
    if(!showAdult && c.adult) return false;
    if(state.showFavs && !state.favorites.has(c.url)) return false;
    if(group && c.group!==group) return false;
    if(country && c.country!==country) return false;
    if(klass && !(c.tags||[]).includes(klass)) return false;
    if(q && !(`${c.name} ${c.group} ${c.tvgId} ${c.country} ${(c.tags||[]).join(' ')}`.toLowerCase().includes(q))) return false;
    return true;
  });
  renderList();
}

// ===== Render =====
function renderList(){
  const list=document.getElementById('channelList'); list.innerHTML='';
  let lastGroup=null;
  state.filtered.forEach(c=>{
    if(c.group!==lastGroup){
      lastGroup=c.group; const gt=document.createElement('div'); gt.className='groupTitle'; gt.textContent=lastGroup||'Otros'; list.appendChild(gt);
    }
    const item=document.createElement('div'); item.className='channel'+(c.adult?' locked':'');
    const tagsHTML=(c.tags||[]).map(t=>`<span class="chip">${escapeHTML(t)}</span>`).join(' ');
    const logo = c.logo ? `<img src="${escapeHTML(c.logo)}" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover;"/>` : `<div class="logo">${escapeHTML(c.name?.[0]?.toUpperCase()||'TV')}</div>`;
    item.innerHTML=`
      ${logo}
      <div class="meta" style="flex:1">
        <div class="name">${escapeHTML(c.name||'Canal')}</div>
        <div class="small">${tagsHTML} ${c.country?`· ${escapeHTML(c.country)}`:''} ${c.web?`<span class="chip">WEB</span>`:''} ${c.adult?`<span class="chip danger">🔒 Adulto</span>`:''}</div>
      </div>
      <div class="small">${state.favorites.has(c.url)?'⭐':''}</div>`;
    item.onclick=async()=>{
      if(c.adult){ const ok=await requireAdultPin(); if(!ok) return; showAdult=true; }
      playChannel(c);
    };
    list.appendChild(item);
  });
}

// ===== Player =====
async function playChannel(c){
  state.current=c;
  if(c.web || !/\.m3u8(\?|$)/i.test(c.url)){
    const target=c.site||c.url; if(target) window.open(target,'_blank','noopener');
    return;
  }
  try{ videoEl.src=c.url; videoEl.play().catch(()=>{}); }
  catch(err){ alert('No se pudo reproducir este canal. Intenta abrir en su sitio oficial.'); }
}

// ===== Favorites toggle =====
btnFavs.onclick=()=>{ state.showFavs=!state.showFavs; btnFavs.textContent = state.showFavs? '⭐ Favoritos (ON)' : '⭐ Favoritos'; applyFilters(); };

// ===== Import M3U =====
btnImport.onclick=()=>fileInput.click();
fileInput.onchange=()=>{
  const file=fileInput.files[0]; if(!file) return;
  const reader=new FileReader(); reader.onload=()=>{ mergeChannels(parseM3U(String(reader.result))); };
  reader.readAsText(file);
};

function mergeChannels(newCh){
  const key = o=> (o.name||'')+'|'+(o.url||'');
  const map = new Map(state.channels.map(c=>[key(c),c]));
  newCh.forEach(c=>map.set(key(c),c));
  state.channels=[...map.values()];
  rebuildGroups(); rebuildCountries(); rebuildClassifications(); applyFilters();
}

// ===== Nocturnal mode (22:00–06:00) auto-filter to Documentales =====
const NOCT_START=22, NOCT_END=6;
function isNocturnalNow(d=new Date()){ const h=d.getHours(); return (h>=NOCT_START || h<NOCT_END); }
function applyNocturnalModeIfNeeded(){
  if(isNocturnalNow()){
    const hasDocs=[...classFilter.options].some(o=>o.value==='Documentales');
    if(hasDocs) classFilter.value='Documentales';
  }
  applyFilters();
}
setInterval(applyNocturnalModeIfNeeded, 10*60*1000);

// ===== Adult buttons =====
document.getElementById('btnUnlockAdult').onclick=async()=>{ const ok=await requireAdultPin(); if(!ok) return; showAdult=true; applyFilters(); };
document.getElementById('btnLockAdult').onclick=()=>{ localStorage.removeItem('adult_pin_unlocked_until'); showAdult=false; applyFilters(); };

// ===== Init: load bundled lists =====
async function loadBundled(){
  const files=['./lists/mx_regionales.m3u','./lists/mx_documentales_nocturnos.m3u','./lists/intl_publicos.m3u'];
  const parts = await Promise.all(files.map(p=>fetch(p).then(r=>r.text()).catch(()=>'')));
  const all = parts.map(parseM3U).flat();
  state.channels = all;
  rebuildGroups(); rebuildCountries(); rebuildClassifications();
  applyNocturnalModeIfNeeded();
}

searchBox.addEventListener('input', applyFilters);
groupFilter.addEventListener('change', applyFilters);
countryFilter.addEventListener('change', applyFilters);
classFilter.addEventListener('change', applyFilters);

window.addEventListener('load', loadBundled);
