import{C}from'./config.js';
import{store}from'./state/store.js';
import{suggestions,places,nearby,clearCache}from'./data/poi-service.js';
import{generate}from'./quiz/generator.js';
import{MapView}from'./ui/map.js';

const $=s=>document.querySelector(s);

const state={
  base:store.get('place',C.place),
  items:[],
  filter:'すべて',
  selected:null,
  found:new Set(store.get('found',[])),
  mode:'explore',
  questions:[],
  qi:0,
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
  const m=state.mode==='quiz'?'explore':'quiz';
  mode(m);
  if(m==='quiz'&&!state.items.length)load();
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
    if(state.mode==='quiz')beginQuiz();
  }catch(e){
    console.error(e);
    state.items=[];
    status('施設の情報を取得できませんでした。もう一度試してみよう。');
    render();
  }
}

function visibleForMap(v){
  const limit=state.filter==='すべて'?C.allMapMarkerLimit:C.mapMarkerLimit;
  const sorted=[...v].sort((a,b)=>a.distance-b.distance);
  const chosen=sorted.slice(0,limit);
  if(state.selected){
    const selected=state.items.find(x=>x.id===state.selected);
    if(selected&&!chosen.some(x=>x.id===selected.id))chosen.push(selected);
  }
  return chosen.map(x=>({...x,selected:x.id===state.selected}));
}

function quizMapItems(q){
  if(!q)return[];
  const ids=new Set(q.optionIds||q.evidence);
  return state.items.filter(x=>ids.has(x.id)).map(x=>({...x,label:x.name,selected:x.id===state.selected}));
}

function render(){
  const v=state.items.filter(x=>state.filter==='すべて'||x.group===state.filter);
  const q=state.mode==='quiz'?state.questions[state.qi]:null;
  if(state.mode==='quiz'){
    map?.set(state.base,quizMapItems(q),{showLabels:true});
  }else{
    map?.set(state.base,visibleForMap(v),{showLabels:false});
  }
  $('#count').textContent=v.length+'件';

  const l=$('#list');
  l.replaceChildren();

  for(const p of v){
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

function beginQuiz(){
  state.questions=generate(state.items);
  state.qi=0;
  showQuiz();
}

function showQuiz(){
  const e=$('#quizView'),q=state.questions[state.qi];
  e.replaceChildren();

  if(!q){
    e.innerHTML='<p>安全に作れる問題がありません。別の場所を選ぶか、施設を読み直してみよう。</p>';
    return;
  }

  e.innerHTML=`<small>問題 ${state.qi+1} / ${state.questions.length}</small><p class="question">${esc(q.question)}</p><div class="quizHint">地図を動かしたり、拡大したりしながら探してみよう。</div><div class="choices"></div>`;
  const c=e.querySelector('.choices');

  for(const x of q.choices){
    const b=document.createElement('button');
    b.textContent=x;
    b.onclick=()=>{
      [...c.children].forEach(y=>y.disabled=true);
      const ok=x===q.answer;
      const f=document.createElement('div');
      f.className='feedback '+(ok?'ok':'');
      f.innerHTML=`<b>${ok?'正解！':'地図でもう一度確かめよう。'}</b><p>${esc(q.explanation)}</p><p>地図でも確認してみよう。</p>`;

      const n=document.createElement('button');
      n.textContent=state.qi+1<state.questions.length?'次の問題':'最初から';
      n.onclick=()=>{state.qi=(state.qi+1)%state.questions.length;showQuiz()};
      f.append(n);
      e.append(f);

      const p=state.items.find(y=>y.id===q.evidence[0]);
      if(p){
        state.selected=p.id;
        map?.focus(p);
      }

      const h=store.get('history',[]);
      h.push({at:new Date().toISOString(),ok});
      store.set('history',h.slice(-50));
    };
    c.append(b);
  }
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