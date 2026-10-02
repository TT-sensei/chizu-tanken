const placePrefix='chizu-tanken:progress:';
const discoveryKey='chizu-tanken:discoveries';

function placeKey(base){
  return placePrefix+base.latitude.toFixed(5)+':'+base.longitude.toFixed(5);
}

function readPlace(base){
  try{
    return JSON.parse(localStorage.getItem(placeKey(base)))||{memo:''};
  }catch{
    return{memo:''};
  }
}

function readDiscoveries(){
  try{
    const data=JSON.parse(localStorage.getItem(discoveryKey));
    return data&&typeof data==='object'?data:{};
  }catch{
    return{};
  }
}

function writePlace(base,value){
  try{localStorage.setItem(placeKey(base),JSON.stringify(value))}catch{}
}

function writeDiscoveries(value){
  try{localStorage.setItem(discoveryKey,JSON.stringify(value))}catch{}
}

export function getProgress(base){
  const discoveries=readDiscoveries();
  return{
    found:new Set(Object.keys(discoveries)),
    discoveries,
    memo:String(readPlace(base).memo||'')
  };
}

export function markFound(item){
  if(!item?.id)return readDiscoveries();
  const discoveries=readDiscoveries();

  if(!discoveries[item.id]){
    discoveries[item.id]={
      name:String(item.name||''),
      group:String(item.group||'その他'),
      latitude:Number(item.latitude),
      longitude:Number(item.longitude)
    };
    writeDiscoveries(discoveries);
  }

  return discoveries;
}

export function setMemo(base,memo){
  const place=readPlace(base);
  writePlace(base,{...place,memo});
}
