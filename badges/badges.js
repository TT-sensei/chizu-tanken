const BASE='https://tt-sensei.github.io/edu-assets/assets/web/badges/social/';

export const BADGES=[
  {
    id:'first',
    title:'はじめての探検',
    description:'3か所の施設を見つけた',
    image:`${BASE}find-features/badge.webp`,
    condition:p=>p.foundCount>=3
  },
  {
    id:'finder',
    title:'地図さがし名人',
    description:'10か所の施設を見つけた',
    image:`${BASE}map-reader/badge.webp`,
    condition:p=>p.foundCount>=10
  },
  {
    id:'variety',
    title:'まちを見わたす',
    description:'5種類の施設を見つけた',
    image:`${BASE}local-explorer/badge.webp`,
    condition:p=>p.groupCount>=5
  },
  {
    id:'all',
    title:'地域探検マスター',
    description:'表示された施設をすべて見つけた',
    image:`${BASE}spatial-pattern/badge.webp`,
    condition:p=>p.total>0&&p.foundCount>=p.total
  }
];

export function badgeState(items,found){
  const relevant=items.filter(x=>found.has(x.id));
  const groups=new Set(relevant.map(x=>x.group).filter(x=>x&&x!=='その他'));
  const total=items.length;
  const foundCount=relevant.length;
  return BADGES.map(b=>({...b,unlocked:b.condition({foundCount,groupCount:groups.size,total})}));
}
