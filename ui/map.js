import{C}from'../config.js';import{world,unworld}from'../geo/geo.js';

export class MapView{
  constructor(el,select){
    this.el=el;
    this.tiles=el.querySelector('#tiles');
    this.svg=el.querySelector('#marks');
    this.z=C.zoom;
    this.base=C.place;
    this.center=C.place;
    this.items=[];
    this.select=select;
    this.drag=null;
    this.pointers=new Map();
    this.pinch=null;

    el.onpointerdown=e=>{
      if(e.target.closest?.('button,.mark'))return;
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      el.setPointerCapture?.(e.pointerId);

      if(this.pointers.size===2){
        const [a,b]=[...this.pointers.values()];
        this.pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),midX:(a.x+b.x)/2,midY:(a.y+b.y)/2};
        this.drag=null;
        el.classList.remove('dragging');
        return;
      }

      this.drag={x:e.clientX,y:e.clientY,moved:false};
      el.classList.add('dragging');
    };

    el.onpointermove=e=>{
      if(!this.pointers.has(e.pointerId))return;
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

      if(this.pointers.size>=2){
        const [a,b]=[...this.pointers.values()];
        const distance=Math.hypot(a.x-b.x,a.y-b.y);
        const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;
        if(this.pinch){
          const delta=distance-this.pinch.distance;
          if(Math.abs(delta)>=18){
            this.zoomAt(midX,midY,delta>0?1:-1);
            this.pinch={distance,midX,midY};
          }else{
            this.pinch={...this.pinch,distance,midX,midY};
          }
        }
        return;
      }

      if(!this.drag)return;
      const dx=this.drag.x-e.clientX,dy=this.drag.y-e.clientY;
      if(Math.abs(dx)+Math.abs(dy)<C.dragThreshold)return;
      this.drag.moved=true;
      this.pan(dx,dy);
      this.drag.x=e.clientX;
      this.drag.y=e.clientY;
    };

    const end=e=>{
      this.pointers.delete(e.pointerId);
      try{el.releasePointerCapture?.(e.pointerId)}catch{}
      if(this.pointers.size<2)this.pinch=null;
      if(this.pointers.size===0){
        this.drag=null;
        el.classList.remove('dragging');
      }
    };
    el.onpointerup=end;
    el.onpointercancel=end;

    new ResizeObserver(()=>this.draw()).observe(el);
  }

  set(base,items){
    if(base.latitude!==this.base.latitude||base.longitude!==this.base.longitude){
      this.center=base;
      this.z=C.zoom;
    }
    this.base=base;
    this.items=items;
    this.draw();
  }

  reset(){this.center=this.base;this.z=C.zoom;this.draw()}
  focus(p){this.center=p;this.draw()}
  zoom(d){this.z=Math.max(C.minZoom,Math.min(C.maxZoom,this.z+d));this.draw()}

  zoomAt(x,y,d){
    const old=this.z;
    const next=Math.max(C.minZoom,Math.min(C.maxZoom,old+d));
    if(next===old)return;
    const w=this.el.clientWidth,h=this.el.clientHeight;
    const c=world(this.center.latitude,this.center.longitude,old);
    const before={x:c.x+(x-w/2),y:c.y+(y-h/2)};
    const after=unworld(before.x,before.y,old);
    this.z=next;
    const q=world(after.latitude,after.longitude,next);
    const target={x:q.x-(x-w/2),y:q.y-(y-h/2)};
    this.center=unworld(target.x,target.y,next);
    this.draw();
  }

  pan(dx,dy){
    const p=world(this.center.latitude,this.center.longitude,this.z);
    this.center=unworld(p.x+dx,p.y+dy,this.z);
    this.draw();
  }

  draw(){
    const w=this.el.clientWidth,h=this.el.clientHeight;
    if(!w||!h)return;
    const c=world(this.center.latitude,this.center.longitude,this.z);
    const x0=c.x-w/2,y0=c.y-h/2;
    this.tiles.replaceChildren();

    for(let x=Math.floor(x0/256);x<=Math.floor((x0+w)/256);x++){
      for(let y=Math.floor(y0/256);y<=Math.floor((y0+h)/256);y++){
        const i=new Image;
        i.className='tile';
        i.alt='';
        i.src=C.tile(this.z,x,y);
        i.style.left=x*256-x0+'px';
        i.style.top=y*256-y0+'px';
        this.tiles.append(i);
      }
    }

    this.svg.replaceChildren();
    const pos=p=>{
      const q=world(p.latitude,p.longitude,this.z);
      return{x:q.x-x0,y:q.y-y0};
    };
    const b=pos(this.base);
    const mpp=156543.03392*Math.cos(this.base.latitude*Math.PI/180)/2**this.z;
    this.circle(b,C.circle/mpp);
    this.mark(b,'◎','#d43c32',null,20,true);

    for(const p of this.items){
      const q=pos(p);
      if(q.x>-30&&q.x<w+30&&q.y>-30&&q.y<h+30){
        this.mark(q,p.icon,'#0b6b57',p.id,p.selected?19:15,!!p.selected);
      }
    }
  }

  circle(p,r){
    const e=document.createElementNS('http://www.w3.org/2000/svg','circle');
    for(const[k,v]of Object.entries({cx:p.x,cy:p.y,r,fill:'#20a47d22',stroke:'#0b6b57','stroke-width':3,'stroke-dasharray':'7 5'}))e.setAttribute(k,v);
    this.svg.append(e);
  }

  mark(p,text,color,id,size,selected=false){
    const n='http://www.w3.org/2000/svg';
    const g=document.createElementNS(n,'g');
    g.classList.add('mark');
    g.setAttribute('transform',`translate(${p.x} ${p.y})`);
    if(selected)g.setAttribute('data-selected','true');

    const c=document.createElementNS(n,'circle');
    for(const[k,v]of Object.entries({r:size,fill:selected?'#fff8df':'white',stroke:color,'stroke-width':selected?5:4}))c.setAttribute(k,v);

    const t=document.createElementNS(n,'text');
    t.textContent=text;
    t.setAttribute('text-anchor','middle');
    t.setAttribute('dominant-baseline','central');
    t.setAttribute('font-weight','900');
    t.setAttribute('font-size',selected?'1.05em':'1em');

    g.append(c,t);
    if(id)g.onclick=()=>this.select(id);
    this.svg.append(g);
  }
}