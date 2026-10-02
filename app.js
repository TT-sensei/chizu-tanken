import{C}from'./config.js';
import{store}from'./state/store.js';
import{getProgress,markFound,setMemo}from'./state/progress.js';
import{BADGES,badgeState}from'./badges/badges.js';
import{suggestions,places,nearby,clearCache}from'./data/poi-service.js';
import{MapView}from'./ui/map.js';

const $=s=>document.querySelector(s);

const state={
  base:store.get('place',C.place),
  items:[],
  filter:'すべて',
  selected:null,
  circle:1000,
  found:new Set(),
  discoveries:{},
  memo:'',
  facilitiesOpen:true,
  mapExpanded:false
};

let map=null;
let timer;

const initialProgress=getProgress(state.base);
state.found=initialProgress.found;
state.discoveries=initialProgress.discoveries;
state.memo=initialProgress.memo;

document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>start());
renderBadgeBook();

$('#home').onclick=()=>{
  $('#app').classList.remove('active');
  $('#top').classList.add('active');
  closeMapExpanded();
};

function start(){
  $('#top').classList.remove('active');
  $('#app').classList.add('active');
  if(!map)map=new MapView($('#map'),select);
  load();
}

async function load(){
  const p=getProgress(state.base);
  state.found=p.found;
  state.discoveries=p.discoveries;
  state.memo=p.memo;
  state.selected=null;
  $('#memo').value=state.memo;
  $('#baseName').textContent=state.base.name;
  status('施設を調べています…');

  try{
    const r=await nearby(state.base);
    state.items=r.items;
    status(`${r.items.length}件の施設が見つかりました${r.cached?'（保存データ）':''}`);
    render();
  }catch(e){
    console.error(e);
    state.items=[];
    status('施設の情報を取得できませんでした。もう一度試してみよう。');
    render();
  }
}

function visibleForMap(v){
  const sorted=[...v].sort((a,b)=>{
    const ap=a.mapSymbol&&!['other','park','shop','local'].includes(a.mapSymbol)?0:1;
    const bp=b.mapSymbol&&!['other','park','shop','local'].includes(b.mapSymbol)?0:1;
    return ap-bp||a.distance-b.distance;
  });
  const chosen=sorted.slice(0,C.allMapMarkerLimit);
  if(state.selected){
    const selected=state.items.find(x=>x.id===state.selected);
    if(selected&&!chosen.some(x=>x.id===selected.id))chosen.push(selected);
  }
  return chosen.map(x=>({...x,selected:x.id===state.selected}));
}

function render(){
  const v=state.items.filter(x=>state.filter==='すべて'||x.group===state.filter);

  map?.set(state.base,visibleForMap(v),{showLabels:false,circle:state.circle});

  const foundCount=state.items.filter(x=>state.found.has(x.id)).length;
  $('#foundCount').textContent=`この地図で発見 ${foundCount} / ${state.items.length}`;

  renderBadgeBook();
  renderFilters();
  renderList(v);
  renderAttributions();
}

function renderList(v){
  const l=$('#list');
  l.replaceChildren();

  const ordered=[...v].sort((a,b)=>{
    if(state.selected===a.id)return -1;
    if(state.selected===b.id)return 1;
    return a.distance-b.distance;
  });

  for(const p of ordered){
    const d=document.createElement('div');
    d.className='facility'+(state.selected===p.id?' selected':'')+(state.found.has(p.id)?' found-item':'');

    const b=document.createElement('div');
    b.className='facilityTarget';
    b.innerHTML=`<span><b>${esc(p.name)}</b><small>${esc(p.group)}・約${p.distance}m・${esc(p.direction)}</small></span><span class="facilityIcon">${esc(p.icon)}</span>`;

    const f=document.createElement('div');
    f.className='found'+(state.found.has(p.id)?' isFound':'');
    f.textContent=state.found.has(p.id)?'✓ 地図で発見':'地図で見つけよう';

    d.append(b,f);
    l.append(d);
  }

  if(!v.length)l.innerHTML='<p>表示できる施設がありません。</p>';
}

function renderFilters(){
  const e=$('#filters');
  e.replaceChildren();
  for(const g of C.groups){
    const b=document.createElement('button');
    b.textContent=g;
    b.className=state.filter===g?'on':'';
    b.onclick=()=>{
      state.filter=g;
      state.selected=null;
      render();
    };
    e.append(b);
  }
}

function renderAttributions(){
  const a=[...new Set(state.items.flatMap(x=>x.attributions))].slice(0,5);
  $('#attr').textContent=a.length?'施設データ出典：'+a.join(' ／ '):'';
}

function select(id){
  state.selected=id;
  const p=state.items.find(x=>x.id===id);
  if(!p)return;
  if(!state.found.has(id)){
    state.discoveries=markFound(p);
    state.found=new Set(Object.keys(state.discoveries));
  }
  render();
}

function renderBadgeBook(){
  const e=$('#badgeBook');
  if(!e)return;
  e.replaceChildren();
  const badges=badgeState(state.discoveries);
  for(const b of badges){
    const d=document.createElement('div');
    d.className='bookBadge '+(b.unlocked?'unlocked':'locked');
    d.innerHTML=`<img src="${esc(b.image)}" alt="${esc(b.title)}"><span>${esc(b.title)}</span>`;
    e.append(d);
  }
}

$('#q').oninput=()=>{
  clearTimeout(timer);
  timer=setTimeout(async()=>{
    try{showSuggestions(await suggestions($('#q').value,state.base))}catch{}
  },350);
};

$('#search').onclick=searchPlace;
$('#q').onkeydown=e=>{
  if(e.key==='Enter')searchPlace();
};

async function searchPlace(){
  const q=$('#q').value.trim();
  if(!q)return;

  status('場所を探しています…');
  try{
    const xs=await places(q,state.base);
    showSuggestions(xs);
    status(xs.length?'候補から場所を選んでください':'候補が見つかりませんでした');
  }catch{
    status('場所を検索できませんでした。もう一度試してみよう。');
  }
}

function showSuggestions(xs){
  const e=$('#suggest');
  e.replaceChildren();

  for(const x of xs){
    const b=document.createElement('button');
    b.textContent=x.name+(x.address?'｜'+x.address:'');
    b.onclick=()=>{
      state.base={name:x.name,latitude:Number(x.lat),longitude:Number(x.lng)};
      store.set('place',state.base);
      e.replaceChildren();
      $('#q').value='';
      load();
    };
    e.append(b);
  }
}

document.querySelectorAll('[data-circle]').forEach(b=>b.onclick=()=>{
  state.circle=Number(b.dataset.circle);
  document.querySelectorAll('[data-circle]').forEach(x=>x.classList.toggle('on',x===b));
  render();
});

document.querySelectorAll('#quick button').forEach(b=>b.onclick=()=>{
  $('#q').value=b.textContent;
  searchPlace();
});

$('#reload').onclick=()=>{
  clearCache(state.base);
  load();
};

$('#reset').onclick=()=>map?.reset();

document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{
  const actions={zin:()=>map?.zoom(1),zout:()=>map?.zoom(-1)};
  actions[b.dataset.m]?.();
});

$('#mapExpand').onclick=()=>{
  state.mapExpanded=!state.mapExpanded;
  $('#mapExpand').setAttribute('aria-expanded',String(state.mapExpanded));
  $('#mapExpand').textContent=state.mapExpanded?'地図をもどす':'地図をひろげる';
  $('.layout').classList.toggle('map-expanded',state.mapExpanded);
  requestAnimationFrame(()=>map?.draw());
};

$('#facilityToggle').onclick=()=>{
  state.facilitiesOpen=!state.facilitiesOpen;
  $('#facilityToggle').setAttribute('aria-expanded',String(state.facilitiesOpen));
  $('#facilityToggle').textContent=state.facilitiesOpen?'一覧をしまう':'一覧をひらく';
  $('#facilityBody').hidden=!state.facilitiesOpen;
};

$('#memo').oninput=e=>{
  state.memo=e.target.value;
  setMemo(state.base,state.memo);
};

function closeMapExpanded(){
  state.mapExpanded=false;
  $('.layout').classList.remove('map-expanded');
  $('#mapExpand').setAttribute('aria-expanded','false');
  $('#mapExpand').textContent='地図をひろげる';
}

function status(x){$('#status').textContent=x}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

renderBadges();
renderFilters();
