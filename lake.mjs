// The same outline drives rendered water, shore height and movement.
export const LAKE_ISLAND={x:-37,z:-16,r:1.8};
const lobes=[[-33,-18,8,7],[-39,-24,7,5],[-41,-13,7,6],[-33,-10,5,5]];
export function lakeValue(x,z){return Math.min(...lobes.map(([cx,cz,rx,rz])=>((x-cx)/rx)**2+((z-cz)/rz)**2));}
export function islandAt(x,z){return Math.hypot(x-LAKE_ISLAND.x,z-LAKE_ISLAND.z)<LAKE_ISLAND.r;}
export function lakeContains(x,z){return lakeValue(x,z)<1;}
export function lakeWater(x,z){return lakeContains(x,z)&&!islandAt(x,z);}
export function lakeHeight(x,z,h){const v=lakeValue(x,z);if(v>=1.3)return h;if(islandAt(x,z))return .35;const t=Math.max(0,Math.min(1,(v-.9)/.4));return -.35*(1-t)+h*t;}
