const R=[
  ['公共施設',/市役所|区役所|町役場|村役場|公民館|図書館|消防|警察|交番|郵便/,'public'],
  ['健康・福祉',/病院|医院|診療所|クリニック|薬局|福祉|高齢者/,'health'],
  ['教育',/小学校|中学校|高校|高等学校|幼稚園|保育園|学校|大学/,'education'],
  ['地域',/公園|駅|神社|寺|park|station|shrine|temple/,'local'],
  ['くらし',/スーパー|コンビニ|商店|食堂|レストラン|カフェ|restaurant|grocery|shop/,'shop']
];

const SYMBOLS=new Set([
  'post',
  'koban',
  'police',
  'fire',
  'library',
  'office',
  'school',
  'hospital',
  'station',
  'shrine',
  'temple'
]);

export function classify(x){
  const s=`${x.name||''} ${x.category||''} ${x.business_type||''}`;

  for(const[group,re,icon]of R){
    if(!re.test(s))continue;

    let mapSymbol=null;
    if(/郵便/.test(s))mapSymbol='post';
    else if(/交番/.test(s))mapSymbol='koban';
    else if(/警察/.test(s))mapSymbol='police';
    else if(/消防/.test(s))mapSymbol='fire';
    else if(/図書館/.test(s))mapSymbol='library';
    else if(/市役所|区役所|町役場|村役場/.test(s))mapSymbol='office';
    else if(/病院|医院|診療所|クリニック/.test(s))mapSymbol='hospital';
    else if(/学校|幼稚園|保育園/.test(s))mapSymbol='school';
    else if(/大学/.test(s))mapSymbol=null;
    else if(/駅|station/.test(s))mapSymbol='station';
    else if(/神社|shrine/.test(s))mapSymbol='shrine';
    else if(/寺|temple/.test(s))mapSymbol='temple';
    else if(/薬局/.test(s))mapSymbol=null;

    return{
      group,
      icon,
      mapSymbol,
      hasMapSymbol:mapSymbol?SYMBOLS.has(mapSymbol):false
    };
  }

  return{
    group:'その他',
    icon:'・',
    mapSymbol:null,
    hasMapSymbol:false
  };
}