// Limited fuel training rocket. Latitude/heading penalties exaggerate the
// fuel spent reaching the mission's near-equatorial orbit, not a universal rule.
export function launchFactor(power,latitude,azimuth){const rad=Math.PI/180,l=latitude*rad,a=azimuth*rad;const engine=.78+.0012*(power-50);const rotation=.085*Math.cos(l)*Math.sin(a);const planeCost=.14*Math.abs(Math.sin(l))+.16*Math.abs(Math.cos(a));return Math.max(.3,engine+rotation-planeCost);}
