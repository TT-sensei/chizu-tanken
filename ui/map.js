import{C}from'../config.js';import{world,unworld}from'../geo/geo.js';

export class MapView{
  constructor(el,select){
    this.el=el;this.tiles=el.querySelector('#tiles');this.svg=el.querySelector('#marks');
    this.z=C.zoom;this.base=C.place;this.center=C.place;this.items=[];this.select=select;
    this.drag=null;this.pointers=new Map();this.pinch=null;this.showLabels=false;
    el.onpointerdown=e=>{
      if(e.target.closest?.('button,.mark'))return;
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      el.setPointerCapture?.(e.pointerId);
      if(this.pointers.size===2){
        const[a,b]=[...this.pointers.values()];
        this.pinch={distance:Math.hypot(a.x-b.x,a.y-b.y)};
        this.drag=null;el.classList.remove('dragging');return;
      }
      this.drag={x:e.clientX,y:e.clientY};el.classList.add('dragging');
    };
    el.onpointermove=e=>{
      if(!this.pointers.has(e.pointerId))return;
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size>=2){
        const[a,b]=[...this.pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
        if(this.pinch){
          const delta=distance-this.pinch.distance;
          if(Math.abs(delta)>=18){this.zoomAt((a.x+b.x)/2,(a.y+b.y)/2,delta>0?1:-1);this.pinch={distance};}
          else this.pinch.distance=distance;
        }return;
      }
      if(!this.drag)return;
      const dx=this.drag.x-e.clientX,dy=this.drag.y-e.clientY;
      if(Math.abs(dx)+Math.abs(dy)<C.dragThreshold)return;
      this.pan(dx,dy);this.drag.x=e.clientX;this.drag.y=e.clientY;
    };
    const end=e=>{
      this.pointers.delete(e.pointerId);
      try{el.releasePointerCapture?.(e.pointerId)}catch{}
      if(this.pointers.size<2)this.pinch=null;
      if(!this.pointers.size){this.drag=null;el.classList.remove('dragging');}
    };
    el.onpointerup=end;el.onpointercancel=end;
    new ResizeObserver(()=>this.draw()).observe(el);
  }

  set(base,items,options={}){
    if(base.latitude!==this.base.latitude||base.longitude!==this.base.longitude){this.center=base;this.z=C.zoom;}
    this.base=base;this.items=items;this.showLabels=!!options.showLabels;this.draw();
  }
  reset(){this.center=this.base;this.z=C.zoom;this.draw()}
  focus(p){this.center=p;this.draw()}
  zoom(d){this.z=Math.max(C.minZoom,Math.min(C.maxZoom,this.z+d));this.draw()}
  zoomAt(x,y,d){
    const old=this.z,next=Math.max(C.minZoom,Math.min(C.maxZoom,old+d));if(next===old)return;
    const w=this.el.clientWidth,h=this.el.clientHeight,c=world(this.center.latitude,this.center.longitude,old);
    const before={x:c.x+(x-w/2),y:c.y+(y-h/2)},geo=unworld(before.x,before.y,old);
    this.z=next;const q=world(geo.latitude,geo.longitude,next);
    this.center=unworld(q.x-(x-w/2),q.y-(y-h/2),next);this.draw();
  }
  pan(dx,dy){
    const p=world(this.center.latitude,this.center.longitude,this.z);
    this.center=unworld(p.x+dx,p.y+dy,this.z);this.draw();
  }
  draw(){
    const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;
    const c=world(this.center.latitude,this.center.longitude,this.z),x0=c.x-w/2,y0=c.y-h/2;
    this.tiles.replaceChildren();
    for(let x=Math.floor(x0/256);x<=Math.floor((x0+w)/256);x++)for(let y=Math.floor(y0/256);y<=Math.floor((y0+h)/256);y++){
      const i=new Image;i.className='tile';i.alt='';i.src=C.tile(this.z,x,y);i.style.left=x*256-x0+'px';i.style.top=y*256-y0+'px';this.tiles.append(i);
    }
    this.svg.replaceChildren();
    const pos=p=>{const q=world(p.latitude,p.longitude,this.z);return{x:q.x-x0,y:q.y-y0}};
    const b=pos(this.base),mpp=156543.03392*Math.cos(this.base.latitude*Math.PI/180)/2**this.z;
    this.circle(b,C.circle/mpp);this.mark(b,'base','#d43c32',null,20,true,'基準地点');
    for(const p of this.items){
      const q=pos(p);
      if(q.x>-40&&q.x<w+40&&q.y>-40&&q.y<h+40)this.mark(q,p.mapSymbol||'other','#0b6b57',p.id,p.selected?19:15,!!p.selected,p.label,p.hasMapSymbol);
    }
  }
  circle(p,r){
    const e=document.createElementNS('http://www.w3.org/2000/svg','circle');
    for(const[k,v]of Object.entries({cx:p.x,cy:p.y,r,fill:'#20a47d22',stroke:'#0b6b57','stroke-width':3,'stroke-dasharray':'7 5'}))e.setAttribute(k,v);this.svg.append(e);
  }
  mark(p,symbol,color,id,size,selected=false,label='',hasGsiSymbol=false){
    const n='http://www.w3.org/2000/svg',g=document.createElementNS(n,'g');
    g.classList.add('mark');g.setAttribute('transform',`translate(${p.x} ${p.y})`);
    const ring=document.createElementNS(n,'circle');
    for(const[k,v]of Object.entries({r:size+5,fill:selected?'#fff8df66':'transparent',stroke:selected?'#d9961a':'#0b6b5755','stroke-width':selected?4:2}))ring.setAttribute(k,v);
    g.append(ring);
    if(!hasGsiSymbol)this.symbol(g,symbol,color,selected);
    if(this.showLabels&&label){
      const bg=document.createElementNS(n,'rect');
      bg.setAttribute('x',size+10);bg.setAttribute('y',-13);bg.setAttribute('rx',7);
      bg.setAttribute('width',Math.min(170,Math.max(70,label.length*14)));bg.setAttribute('height',26);
      bg.setAttribute('fill','white');bg.setAttribute('stroke','#78978e');
      const lt=document.createElementNS(n,'text');lt.textContent=label;lt.setAttribute('x',size+17);lt.setAttribute('y',5);
      lt.setAttribute('font-size','12');lt.setAttribute('font-weight','800');lt.setAttribute('fill','#183a32');g.append(bg,lt);
    }
    if(id)g.onclick=()=>this.select(id);
    this.svg.append(g);
  }


  symbol(g,type,color,selected){
    const n='http://www.w3.org/2000/svg',ink=selected?'#d9961a':color;
    if(type==='base'){const t=document.createElementNS(n,'text');t.textContent='◎';t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','central');t.setAttribute('font-size','24');t.setAttribute('font-weight','900');t.setAttribute('fill',ink);g.append(t);return}
    const t=document.createElementNS(n,'text');t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','central');t.setAttribute('font-weight','900');t.setAttribute('font-size','17');t.setAttribute('fill',ink);
    const labels={post:'〒',school:'文',hospital:'✚',library:'図',office:'役',station:'駅',shrine:'⛩',temple:'卍',park:'P',pharmacy:'薬',university:'大',shop:'店',other:'・'};
    if(type==='police'||type==='koban'||type==='fire'){
      const a=document.createElementNS(n,'line'),b=document.createElementNS(n,'line');
      for(const line of [a,b]){line.setAttribute('x1',-7);line.setAttribute('y1',-7);line.setAttribute('x2',7);line.setAttribute('y2',7);line.setAttribute('stroke',ink);line.setAttribute('stroke-width',2.5);line.setAttribute('stroke-linecap','round')}
      if(type==='koban'){a.setAttribute('x1',-7);a.setAttribute('y1',7);a.setAttribute('x2',7);a.setAttribute('y2',-7)}
      if(type==='police'){
        const c=document.createElementNS(n,'circle');c.setAttribute('r',10);c.setAttribute('fill','none');c.setAttribute('stroke',ink);c.setAttribute('stroke-width',2);g.append(c);
      }
      if(type==='fire'){a.setAttribute('y1',-8);a.setAttribute('y2',8);b.setAttribute('y1',-8);b.setAttribute('y2',8)}
      g.append(a,b);return;
    }
    t.textContent=labels[type]||'・';g.append(t);
  }
}
