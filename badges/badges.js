const BASE='https://tt-sensei.github.io/edu-assets/assets/web/badges/social/';

export const BADGES=[
  {
    id:'step1',
    title:'はじめの一歩',
    description:'1か所の施設を見つけた',
    image:`${BASE}local-explorer/badge.webp`,
    condition:p=>p.foundCount>=1
  },
  {
    id:'step3',
    title:'発見スタート',
    description:'3か所の施設を見つけた',
    image:`${BASE}find-features/badge.webp`,
    condition:p=>p.foundCount>=3
  },
  {
    id:'step5',
    title:'地図さがし名人',
    description:'5か所の施設を見つけた',
    image:`${BASE}map-reader/badge.webp`,
    condition:p=>p.foundCount>=5
  },
  {
    id:'step10',
    title:'どんどん探検',
    description:'10か所の施設を見つけた',
    image:`${BASE}location-thinking/badge.webp`,
    condition:p=>p.foundCount>=10
  },
  {
    id:'step20',
    title:'じっくり探検',
    description:'20か所の施設を見つけた',
    image:`${BASE}spatial-pattern/badge.webp`,
    condition:p=>p.foundCount>=20
  },
  {
    id:'types3',
    title:'いろいろ発見',
    description:'3種類の施設を見つけた',
    image:`${BASE}social-discovery/badge.webp`,
    condition:p=>p.groupCount>=3
  },
  {
    id:'types5',
    title:'まちを見わたす',
    description:'5種類の施設を見つけた',
    image:`${BASE}compare-society/badge.webp`,
    condition:p=>p.groupCount>=5
  },
  {
    id:'public',
    title:'公共施設を発見',
    description:'公共施設を1か所見つけた',
    image:`${BASE}government/badge.webp`,
    condition:p=>p.groups.has('公共施設')
  },
  {
    id:'local',
    title:'地域の発見者',
    description:'地域の施設を1か所見つけた',
    image:`${BASE}social-investigator/badge.webp`,
    condition:p=>p.groups.has('地域')
  },
  {
    id:'shop',
    title:'くらしを発見',
    description:'くらしに関わる施設を1か所見つけた',
    image:`${BASE}citizens/badge.webp`,
    condition:p=>p.groups.has('くらし')
  }
];

export function badgeState(discoveries){
  const relevant=Object.values(discoveries||{});
  const groups=new Set(relevant.map(x=>x.group).filter(Boolean));
  const foundCount=relevant.length;
  return BADGES.map(b=>({...b,unlocked:b.condition({foundCount,groupCount:[...groups].filter(x=>x!=='その他').length,groups})}));
}
