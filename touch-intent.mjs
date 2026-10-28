// One-finger drag moves. A second nearby tap reserves the finger for looking.
export function createTapIntent(){let tap=null;return{
 begin(x,y,now,eligible=true){const move=!!(eligible&&tap&&now-tap.at<=340&&Math.hypot(x-tap.x,y-tap.y)<=44);tap=null;return move?'look':'move';},
 end(p,now,cancel=false){if(!cancel&&p.mode==='move'&&!p.moved&&!p.long&&!p.heldTriggered&&p.eligible&&now-p.at<340)tap={x:p.x,y:p.y,at:now};else tap=null;},
 reset(){tap=null;}
};}
export const isCarryAction=a=>['magnet','plug','gear','box','ball','padPart','facilityWeight'].includes(a)||a?.startsWith('part:');
export function nearbyPick(pick,x,y,isItem){const direct=pick(x,y);if(isItem(direct?.object.userData.action))return direct;const action=direct?.object.userData.action;if(action&&!['ground','facilityGround','water'].includes(action))return direct;
 for(const [dx,dy] of [[-12,0],[12,0],[0,-12],[0,12],[-9,-9],[9,-9],[-9,9],[9,9]]){const h=pick(x+dx,y+dy);if(h&&isItem(h.object.userData.action)){pick(x,y);return h;}}
 pick(x,y);return direct;
}
