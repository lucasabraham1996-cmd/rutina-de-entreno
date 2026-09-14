/* Body map + mobile sheet fixes */
(()=>{
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function groups(card){
  const s=norm(card.textContent||'');
  const g=new Set();
  if(/pecho|pectoral|flexion|press de pecho/.test(s))g.add('chest');
  if(/hombro|deltoide|elevacion lateral|press de hombro/.test(s))g.add('shoulders');
  if(/biceps|curl|antebrazo|braquial/.test(s))g.add('biceps');
  if(/triceps/.test(s))g.add('triceps');
  if(/espalda|dorsal|romboide|remo/.test(s))g.add('back');
  if(/core|abdomen|oblicuo|plancha|dead bug|pallof/.test(s))g.add('core');
  if(/glute/.test(s))g.add('glutes');
  if(/cuadriceps|sentadilla|pierna|zancada/.test(s))g.add('quads');
  if(/isquio|femoral|peso muerto|rumano/.test(s))g.add('hamstrings');
  if(/gemelo|soleo|pantorrilla|tibial|talon|aquiles/.test(s))g.add('calves');
  if(/cardio|bicicleta|bici|camin|trote|marcha|partido|futbol|aceleracion/.test(s))g.add('cardio');
  return g;
}
const fill=(set,key,alt=false)=>set.has(key)?(alt?'#FF9F0A':'#8B5CF6'):'#E8E4EC';
function figure(set){
  return `<svg viewBox="0 0 112 120" aria-hidden="true">
  <g transform="translate(4 3)">
    <circle cx="25" cy="9" r="7" fill="#DDD8E3"/>
    <rect x="19" y="18" width="12" height="20" rx="6" fill="${fill(set,'chest')}"/>
    <rect x="17" y="35" width="16" height="16" rx="7" fill="${fill(set,'core')}"/>
    <rect x="9" y="20" width="8" height="12" rx="4" fill="${fill(set,'shoulders')}"/><rect x="33" y="20" width="8" height="12" rx="4" fill="${fill(set,'shoulders')}"/>
    <rect x="7" y="31" width="7" height="18" rx="3.5" fill="${fill(set,'biceps')}"/><rect x="36" y="31" width="7" height="18" rx="3.5" fill="${fill(set,'biceps')}"/>
    <rect x="17" y="51" width="7" height="24" rx="3.5" fill="${fill(set,'quads')}"/><rect x="26" y="51" width="7" height="24" rx="3.5" fill="${fill(set,'quads')}"/>
    <rect x="17" y="75" width="7" height="23" rx="3.5" fill="${fill(set,'calves',true)}"/><rect x="26" y="75" width="7" height="23" rx="3.5" fill="${fill(set,'calves',true)}"/>
    <circle cx="21" cy="103" r="3" fill="#D8D2DE"/><circle cx="29" cy="103" r="3" fill="#D8D2DE"/>
  </g>
  <g transform="translate(58 3)">
    <circle cx="25" cy="9" r="7" fill="#DDD8E3"/>
    <rect x="19" y="18" width="12" height="24" rx="6" fill="${fill(set,'back')}"/>
    <rect x="9" y="20" width="8" height="12" rx="4" fill="${fill(set,'shoulders')}"/><rect x="33" y="20" width="8" height="12" rx="4" fill="${fill(set,'shoulders')}"/>
    <rect x="7" y="31" width="7" height="18" rx="3.5" fill="${fill(set,'triceps')}"/><rect x="36" y="31" width="7" height="18" rx="3.5" fill="${fill(set,'triceps')}"/>
    <ellipse cx="21" cy="48" rx="5" ry="6" fill="${fill(set,'glutes',true)}"/><ellipse cx="29" cy="48" rx="5" ry="6" fill="${fill(set,'glutes',true)}"/>
    <rect x="17" y="54" width="7" height="22" rx="3.5" fill="${fill(set,'hamstrings')}"/><rect x="26" y="54" width="7" height="22" rx="3.5" fill="${fill(set,'hamstrings')}"/>
    <rect x="17" y="76" width="7" height="22" rx="3.5" fill="${fill(set,'calves',true)}"/><rect x="26" y="76" width="7" height="22" rx="3.5" fill="${fill(set,'calves',true)}"/>
    <circle cx="21" cy="103" r="3" fill="#D8D2DE"/><circle cx="29" cy="103" r="3" fill="#D8D2DE"/>
  </g>
  </svg>`;
}
function labelFor(set){
  const labels=[];
  const map=[['chest','Pecho'],['back','Espalda'],['shoulders','Hombros'],['biceps','Bíceps'],['triceps','Tríceps'],['core','Core'],['glutes','Glúteos'],['quads','Cuádriceps'],['hamstrings','Isquios'],['calves','Gemelos']];
  map.forEach(([k,l])=>{if(set.has(k))labels.push(l)});
  if(!labels.length&&set.has('cardio'))return 'Cardio';
  return labels.slice(0,2).join(' + ')||'General';
}
function decorateCard(card){
  if(card.querySelector('.bodymap-mini'))return;
  const body=card.querySelector('.exercise-body');if(!body)return;
  const set=groups(card);
  const el=document.createElement('div');el.className='bodymap-mini';el.innerHTML=figure(set)+`<div class="bodymap-label">Trabaja</div><div class="bodymap-legend">${labelFor(set)}</div>`;
  body.appendChild(el);
}
function decorate(){document.querySelectorAll('#exerciseList .exercise').forEach(decorateCard)}
function fixSheets(){
  const r=document.getElementById('routineSheet');if(r&&r.parentElement!==document.body)document.body.appendChild(r);
  const t=document.getElementById('tutorialModal');if(t&&t.parentElement!==document.body)document.body.appendChild(t);
}
function install(){fixSheets();decorate();
  const root=document.getElementById('exerciseList');if(root)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(root,{childList:true,subtree:true});
  new MutationObserver(()=>fixSheets()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',fixSheets,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(fixSheets,150),{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,80));else setTimeout(install,80);
})();
