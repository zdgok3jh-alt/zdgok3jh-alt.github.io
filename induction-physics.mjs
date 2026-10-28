// Qualitative Faraday model: emf = -d(flux)/dt. Charge powers a latching bridge.
export function newInduction(){return {magnetZ:2.3,current:0,charge:0,bridgeOpen:false,installed:false,connected:false,won:false};}
export function flux(z){return Math.exp(-z*z/1.5);}
export function moveMagnet(s,z,dt){const next=Math.max(-2.3,Math.min(2.3,z));s.current=s.installed&&s.connected?Math.max(-1,Math.min(1,-(flux(next)-flux(s.magnetZ))/Math.max(.016,dt)*.6)):0;s.magnetZ=next;}
export function stepInduction(s,dt,moving=false){if(!moving)s.current*=Math.exp(-dt*18);if(s.installed&&s.connected)s.charge=Math.min(1,s.charge+Math.abs(s.current)*dt*.42);if(s.charge>=1)s.bridgeOpen=true;}
export function canWalk(x,z,open){return Math.abs(x)<13.3&&z<13.3&&z>-23.3&&(z>-3.6||z<-10.4||(open&&Math.abs(x)<1.65));}
