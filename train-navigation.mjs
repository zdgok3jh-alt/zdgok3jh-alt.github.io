// Shared, testable collision and routing for the laboratory's two floors.
export const CAT_RADIUS=.48;
export function clearAt(x,z,y,obstacles){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(x< -6.6||x>6.6||z< -2.6||z>2.6)return false;
 return !obstacles.some(o=>y<o.y+o.h-.04&&y+1.85>o.y+.04&&x>o.x-o.w/2-CAT_RADIUS&&x<o.x+o.w/2+CAT_RADIUS&&z>o.z-o.d/2-CAT_RADIUS&&z<o.z+o.d/2+CAT_RADIUS);
}
export function clearSegment(a,b,y,obstacles){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let i=1;i<=n;i++)if(!clearAt(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,y,obstacles))return false;return true;}
export function route(start,end,y,obstacles){
 if(!clearAt(end.x,end.z,y,obstacles))return [];
 if(clearSegment(start,end,y,obstacles))return [{...end}];
 const step=.4,key=(x,z)=>x+','+z,pt=n=>({x:n.x*step,z:n.z*step});
 const first={x:Math.round(start.x/step),z:Math.round(start.z/step),g:0,parent:null};
 if(!clearSegment(start,pt(first),y,obstacles))return [];
 const open=[first],seen=new Map([[key(first.x,first.z),0]]);let found=null;
 for(let iteration=0;open.length&&iteration<7000;iteration++){
  open.sort((a,b)=>(b.g+Math.hypot(b.x*step-end.x,b.z*step-end.z))-(a.g+Math.hypot(a.x*step-end.x,a.z*step-end.z)));
  const n=open.pop(),p=pt(n);
  if(Math.hypot(p.x-end.x,p.z-end.z)<.65&&clearSegment(p,end,y,obstacles)){found=n;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const q={x:n.x+dx,z:n.z+dz,g:n.g+Math.hypot(dx,dz)*step,parent:n},k=key(q.x,q.z);
   if(q.g>=(seen.get(k)??Infinity)||!clearSegment(p,pt(q),y,obstacles))continue;
   seen.set(k,q.g);open.push(q);
  }
 }
 if(!found)return [];
 const path=[{...end}];for(let n=found;n;n=n.parent)path.unshift(pt(n));
 // Keep only necessary bends while retaining collision clearance.
 const result=[];let from=start,i=0;while(i<path.length){let j=i;while(j+1<path.length&&clearSegment(from,path[j+1],y,obstacles))j++;result.push(path[j]);from=path[j];i=j+1;}return result;
}
export function moveWithCollision(cat,dx,dz,y,obstacles){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
 for(let i=0;i<steps;i++){if(clearAt(cat.x+dx/steps,cat.z,y,obstacles))cat.x+=dx/steps;if(clearAt(cat.x,cat.z+dz/steps,y,obstacles))cat.z+=dz/steps;}
}
export const clampZoom=v=>Math.max(.18,Math.min(4,v));
export function stickAxis(dx,dy){const d=Math.hypot(dx,dy),k=Math.min(1,42/(d||1));return{x:dx*k/42,z:dy*k/42};}
// Dropped props may sit against a bench, wall or bank. Approach from any free side.
export function approachItem(start,item,y,obstacles){
 if(Math.abs(item.y-y)>2.1)return [];
 if(Math.hypot(start.x-item.x,start.z-item.z)<=1.85&&clearAt(start.x,start.z,y,obstacles))return [{x:start.x,z:start.z}];
 const angle=Math.atan2(start.z-item.z,start.x-item.x),candidates=[];
 for(const radius of [1,1.4,1.8])for(let i=0;i<16;i++){const a=angle+i*Math.PI/8,x=item.x+Math.cos(a)*radius,z=item.z+Math.sin(a)*radius;if(clearAt(x,z,y,obstacles))candidates.push({x,z});}
 candidates.sort((a,b)=>Math.hypot(start.x-a.x,start.z-a.z)-Math.hypot(start.x-b.x,start.z-b.z));
 for(const point of candidates){const path=route(start,point,y,obstacles);if(path.length)return path;}
 return [];
}
