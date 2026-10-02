const prefix='chizu-tanken:progress:';

function placeKey(base){
  return `${base.latitude.toFixed(5)}:${base.longitude.toFixed(5)}`;
}

function read(base){
  try{
    return JSON.parse(localStorage.getItem(prefix+placeKey(base)))||{found:[],memo:''};
  }catch{
    return{found:[],memo:''};
  }
}

function write(base,value){
  try{localStorage.setItem(prefix+placeKey(base),JSON.stringify(value))}catch{}
}

export function getProgress(base){
  const p=read(base);
  return{found:new Set(p.found||[]),memo:String(p.memo||'')};
}

export function setFound(base,found){
  const p=read(base);
  write(base,{...p,found:[...found]});
}

export function setMemo(base,memo){
  const p=read(base);
  write(base,{...p,memo});
}
