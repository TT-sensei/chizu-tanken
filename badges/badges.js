export const BADGES=[
  {id:'first',title:'はじめての探検',condition:p=>p.foundCount>=3,description:'3か所の施設を見つけた'},
  {id:'finder',title:'地図さがし名人',condition:p=>p.foundCount>=10,description:'10か所の施設を見つけた'},
  {id:'variety',title:'まちを見わたす',condition:p=>p.groupCount>=5,description:'5種類の施設を見つけた'},
  {id:'all',title:'地域探検マスター',condition:p=>p.total>0&&p.foundCount>=p.total,description:'表示された施設をすべて見つけた'}
];

export function badgeState(items,found){
  const relevant=items.filter(x=>found.has(x.id));
  const groups=new Set(relevant.map(x=>x.group).filter(x=>x&&x!=='その他'));
  const total=items.length;
  const foundCount=relevant.length;
  return BADGES.map(b=>({...b,unlocked:b.condition({foundCount,groupCount:groups.size,total})}));
}
