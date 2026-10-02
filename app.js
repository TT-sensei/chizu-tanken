import{C}from'./config.js';
import{store}from'./state/store.js';
import{suggestions,places,nearby,clearCache}from'./data/poi-service.js';
import{MapView}from'./ui/map.js';

const $=s=>document.querySelector(s);

const state={
  base:store.get('place',C.place),
  items:[],
  filter:'すべて',
  selected:null,
  found:new Set(store.get('found',[])),
  facilitiesOpen:true,
  mapExpanded:false
};

let map=null;

document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>start(b.dataset.start));

$('#home').onclick=()=>{
  $('#app').classList.remove('active');
  $('#top').classList.add('active');
  closeMapExpanded();
};

function start(m){
  $('#top').classList.remove('active');
  $('#app').classList.add('active');
  if(!map)map=new MapView($('#map'),select);
  mode(m);
  load();
}

function mode(m){
  state.mode=m;
  $('#explore').hidden=m==='quiz';
  $('#quiz').hidden=m!=='quiz';
  $('#switch').textContent=m==='quiz'?'地図で探す':'地図からクイズ';
  if(m==='quiz'&&state.items.length)beginQuiz();
}

$('#switch').onclick=()=>{
  load();
};

async function load(){
  status('施設を調べています…');
  $('#baseName').textContent=state.base.name;
  try{
    const r=await nearby(state.base);
    state.items=r.items;
    state.selected=null;
    status(`${r.items.length}件見つかりました${r.cached?'（保存データ）':''}`);
    render();
    }catch(e){
    console.error(e);
    state.items=[];
    status('施設の情報を取得できませんでした。もう一度試してみよう。');
    render();
  }
}

function visibleForMap(v){
  const sorted=[...v].sort((a,b)=>a.distance-b.distance);
  const chosen=sorted.slice(0,C.allMapMarkerLimit);
  if(state.selected){
    const selected=state.items.find(x=>x.id===state.selected);
    if(selected&&!chosen.some(x=>x.id===selected.id))chosen.push(selected);
  }
  return chosen.map(x=>({...x,selected:x.id===state.selected}));
}

function render(){
  const v=state.items.filter(x=>state.filter==='すべて'||x.group===state.filter);
  map?.set(state.base,visibleForMap(v),{showLabels:false});
  $('#count').textContent=v.length+'件';

  const l=$('#list');
  l.replaceChildren();

  const ordered=[...v].sort((a,b)=>{
    if(state.selected===a.id)return -1;
    if(state.selected===b.id)return 1;
    return a.distance-b.distance;
  });

  for(const p of ordered){
    const d=document.createElement('div');
    d.className='facility'+(state.selected===p.id?' selected':'');
    const b=document.createElement('button');
    b.innerHTML=`<span><b>${esc(p.name)}</b><small>${p.group}・約${p.distance}m・${p.direction}</small></span><span>${p.icon}</span>`;
    b.onclick=()=>select(p.id);

    const f=document.createElement('label');
    f.className='found';
    f.innerHTML=`<input type="checkbox" ${state.found.has(p.id)?'checked':''}>見つけた！`;
    f.querySelector('input').onchange=()=>{
      state.found.has(p.id)?state.found.delete(p.id):state.found.add(p.id);
      store.set('found',[...state.found]);
    };

    d.append(b,f);
    l.append(d);
  }

  if(!v.length)l.innerHTML='<p>表示できる施設がありません。</p>';
  filters();

  const a=[...new Set(state.items.flatMap(x=>x.attributions))].slice(0,5);
  $('#attr').textContent=a.length?'施設データ出典：'+a.join(' ／ '):'';
}

function filters(){
  const e=$('#filters');
  e.replaceChildren();
  for(const g of C.groups){
    const b=document.createElement('button');
    b.textContent=g;
    b.className=state.filter===g?'on':'';
    b.onclick=()=>{
      state.filter=g;
      render();
    };
    e.append(b);
  }
}

function select(id){
  state.selected=id;
  const p=state.items.find(x=>x.id===id);
  if(p)map?.focus(p);
  render();
}

let timer;
$('#q').oninput=()=>{
  clearTimeout(timer);
  timer=setTimeout(async()=>{
    try{showSuggestions(await suggestions($('#q').value,state.base))}catch{}
  },350);
};

$('#search').onclick=async()=>{
  const q=$('#q').value.trim();
  if(!q)return;
  status('場所を探しています…');
  try{
    const x=await places(q,state.base);
    showSuggestions(x);
    status(x.length?'候補を選んでください':'候補が見つかりませんでした');
  }catch{
    status('場所を検索できませんでした。もう一度試してみよう。');
  }
};

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

document.querySelectorAll('#quick button').forEach(b=>b.onclick=()=>{
  $('#q').value=b.textContent;
  $('#search').click();
});

$('#reload').onclick=()=>{
  clearCache(state.base);
  load();
};

$('#reset').onclick=()=>map?.reset();

document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{
  const actions={
    zin:()=>map?.zoom(1),
    zout:()=>map?.zoom(-1)
  };
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

function closeMapExpanded(){
  state.mapExpanded=false;
  $('.layout').classList.remove('map-expanded');
  $('#mapExpand').setAttribute('aria-expanded','false');
  $('#mapExpand').textContent='地図をひろげる';
}

$('#memo').value=store.get('memo','');
$('#memo').oninput=e=>store.set('memo',e.target.value);

function status(x){$('#status').textContent=x}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

filters();