import{C}from'../config.js';
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const pick=(a,n=1)=>shuffle(a).slice(0,n);
const join=a=>a.map(x=>x.name).join(' → ');
const Q=(key,question,choices,answer,explanation,evidence,optionIds)=>({key,question,choices,answer,explanation,evidence,optionIds:optionIds||evidence});

export function generate(all){
  const ps=all.filter(x=>x.distance<=C.radius);
  // 「地図を見れば考えられる」問題を優先。方向・並び順は初期版では外す。
  const makers=[closest,within,count];
  const out=[];
  for(let k=0;k<12&&out.length<5;k++){
    for(const f of shuffle(makers)){
      const q=f(ps);
      if(valid(q)&&!out.some(x=>x.key===q.key)){
        out.push(q);
        if(out.length===5)break;
      }
    }
  }
  return out;
}

function closest(ps){
  const s=[...ps].sort((a,b)=>a.distance-b.distance);
  if(s.length<3||s[1].distance-s[0].distance<C.closestGap)return null;
  const a=s[0],o=pick(s.slice(1).filter(x=>x.name!==a.name),2);
  if(o.length<2)return null;
  const options=[a,...o];
  return Q(
    'c'+a.id,
    '基準地点から一番近い施設はどれ？',
    shuffle(options).map(x=>x.name),
    a.name,
    `${a.name}は基準地点から約${a.distance}mです。地図の位置と距離を見て確かめよう。`,
    [a.id],
    options.map(x=>x.id)
  );
}

function within(ps){
  const a=pick(ps.filter(x=>x.distance<=C.circle))[0];
  const o=pick(ps.filter(x=>x.distance>C.circle&&x.name!==a?.name),2);
  if(!a||o.length<2)return null;
  const options=[a,...o];
  return Q(
    'w'+a.id,
    '500mの円の中にある施設はどれ？',
    shuffle(options).map(x=>x.name),
    a.name,
    `${a.name}は約${a.distance}mで、500mの円の内側です。地図で円と場所を見比べよう。`,
    [a.id],
    options.map(x=>x.id)
  );
}

function count(ps){
  for(const g of shuffle([...new Set(ps.map(x=>x.group))].filter(x=>x!=='その他'))){
    const ids=ps.filter(x=>x.group===g&&x.distance<=500).map(x=>x.id);
    const n=ids.length;
    const v=[n,n-1,n+1].filter(x=>x>=0);
    if(n&&new Set(v).size===3){
      return Q(
        'n'+g,
        `500mの円の中にある「${g}」は何こ？`,
        shuffle(v).map(String),
        String(n),
        `地図データでは${n}こです。円の中を見ながら数えてみよう。実際の総数とは限りません。`,
        ids,
        ids
      );
    }
  }
  return null;
}

function valid(q){
  return q&&q.choices.length===3&&new Set(q.choices).size===3&&q.choices.includes(q.answer)&&q.evidence.length;
}
