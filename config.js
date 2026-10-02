export const C=Object.freeze({
  api:'https://api.openpoiapi.com',
  radius:1000,
  circle:500,
  circleModes:[500,1000,0],
  maxDistance:1200,
  cacheMs:86400000,
  dedupe:25,
  zoom:16,
  minZoom:5,
  maxZoom:18,
  allMapMarkerLimit:60,
  dragThreshold:3,
  place:{name:'茨城大学教育学部附属小学校',latitude:36.3744278,longitude:140.4794},
  groups:['すべて','公共施設','くらし','健康・福祉','教育','地域','その他'],
  tile:(z,x,y)=>`https://cyberjapandata.gsi.go.jp/xyz/pale/${z}/${x}/${y}.png`
});