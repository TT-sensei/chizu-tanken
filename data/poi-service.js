import{C}from'../config.js';
import{distance,bearing,dir8}from'../geo/geo.js';
import{classify}from'./category-map.js';

const prefix='chizu-tanken:poi:';
const cacheKey=b=>prefix+b.latitude.toFixed(3)+':'+b.longitude.toFixed(3);

export function clearCache(b){
  localStorage.removeItem(cacheKey(b));
}

async function get(path,params){
  const u=new URL(C.api+path);
  Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
  const r=await fetch(u);
  if(!r.ok)throw Error(String(r.status));
  return r.json();
}

export async function suggestions(q,b){
  if(!q.trim())return[];
  const j=await get('/v1/suggest',{
    q,
    center:`${b.longitude},${b.latitude}`,
    radius:50000,
    limit:8,
    fields:'minimal'
  });
  return j.suggestions||[];
}

export async function places(q,b){
  const j=await get('/v1/search',{
    q,
    center:`${b.longitude},${b.latitude}`,
    radius:50000,
    limit:20
  });
  return j.results||[];
}

export async function nearby(b){
  try{
    const c=JSON.parse(localStorage.getItem(cacheKey(b)));
    if(c&&Date.now()-c.time<C.cacheMs)return{items:c.items,cached:true};
  }catch{}

  const j=await get('/v1/search',{
    center:`${b.longitude},${b.latitude}`,
    radius:C.radius,
    limit:200
  });

  let items=(j.results||[])
    .map((x)=>normal(x,b))
    .filter(Boolean)
    .filter(x=>x.distance<=C.maxDistance);

  items=dedupe(items).sort((a,b)=>a.distance-b.distance);

  try{
    localStorage.setItem(cacheKey(b),JSON.stringify({time:Date.now(),items}));
  }catch{}

  return{items,cached:false};
}

function normal(x,b){
  const latitude=Number(x.lat);
  const longitude=Number(x.lng);
  const name=String(x.name||'').trim();

  if(
    !name||
    !Number.isFinite(latitude)||
    !Number.isFinite(longitude)||
    Math.abs(latitude)>90||
    Math.abs(longitude)>180
  )return null;

  const c=classify(x);
  const source=x.source||'OpenPOI';
  const id=[
    source,
    normalizeId(name),
    latitude.toFixed(5),
    longitude.toFixed(5)
  ].join(':');

  const o={
    id,
    name,
    latitude,
    longitude,
    category:x.category||'unknown',
    source,
    group:c.group,
    icon:c.icon,
    mapSymbol:c.mapSymbol,
    hasMapSymbol:c.hasMapSymbol,
    attributions:x.attributions||[]
  };

  o.distance=Math.round(distance(b,o));
  o.bearing=bearing(b,o);
  o.direction=dir8(o.bearing);
  return o;
}

function dedupe(items){
  const out=[];
  for(const p of items){
    if(!out.some(x=>normalizeId(x.name)===normalizeId(p.name)&&distance(x,p)<=C.dedupe)){
      out.push(p);
    }
  }
  return out;
}

function normalizeId(s){
  return String(s).normalize('NFKC').toLowerCase().replace(/\s/g,'').replace(/[:\\/]/g,'_');
}