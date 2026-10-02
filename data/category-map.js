const R=[
  ['公共施設',/市役所|区役所|町役場|村役場|公民館|図書館|消防|警察|交番|郵便/,'公'],
  ['健康・福祉',/病院|医院|診療所|クリニック|薬局|福祉|高齢者/,'病'],
  ['教育',/小学校|中学校|高校|高等学校|幼稚園|保育園|学校|大学/,'文'],
  ['地域',/公園|駅|神社|寺|park|station|shrine|temple/,'●'],
  ['くらし',/スーパー|コンビニ|商店|食堂|レストラン|カフェ|restaurant|grocery|shop/,'店']
];

export function classify(x){
  const s=`${x.name||''} ${x.category||''} ${x.business_type||''}`;
  for(const[group,re,icon]of R){
    if(re.test(s)){
      let mapSymbol=icon;
      if(/郵便/.test(s))mapSymbol='〒';
      else if(/交番/.test(s))mapSymbol='交';
      else if(/警察/.test(s))mapSymbol='警';
      else if(/消防/.test(s))mapSymbol='消';
      else if(/図書館/.test(s))mapSymbol='図';
      else if(/市役所|区役所|町役場|村役場/.test(s))mapSymbol='役';
      else if(/病院|医院|診療所|クリニック/.test(s))mapSymbol='病';
      else if(/学校|幼稚園|保育園|大学/.test(s))mapSymbol='文';
      else if(/駅|station/.test(s))mapSymbol='駅';
      else if(/神社|shrine/.test(s))mapSymbol='⛩';
      else if(/寺|temple/.test(s))mapSymbol='卍';
      else if(/公園|park/.test(s))mapSymbol='P';
      return{group,icon,mapSymbol};
    }
  }
  return{group:'その他',icon:'・',mapSymbol:'・'};
}
