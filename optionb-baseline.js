/* Peso inicial 109,8 kg + Opción B como ejercicio principal visible */
(()=>{
'use strict';

const START_WEIGHT=109.8;
const START_DATE='2026-09-14';
const PROGRESS_KEY='rutinaEntreno.progress.v1';
const BASELINE_ID='weight-start-2026-09-14';

const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const enc=s=>encodeURIComponent(String(s||''));

function injectStyles(){
  if(document.getElementById('optionBPrimaryStyles'))return;
  const s=document.createElement('style');
  s.id='optionBPrimaryStyles';
  s.textContent=`
    .exercise.option-b-primary{border:1px solid rgba(103,93,246,.22)!important;background:linear-gradient(180deg,#fff,#F4F5FF)!important;box-shadow:0 15px 34px rgba(79,94,196,.14)!important}
    .option-b-primary-badge{display:inline-flex;align-items:center;gap:5px;margin:6px 0 2px;padding:5px 8px;border-radius:999px;background:linear-gradient(135deg,#526FF3,#7658F5);color:#fff;font-size:9px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
    .exercise.option-b-primary .option-b-toggle{margin-top:4px;background:#EEF1FF!important;color:#4E62D8!important}
    .exercise.option-b-primary .option-b-toggle span{color:#5368EB!important}
    .exercise.option-b-primary .option-b-toggle b{color:#6A56E8!important}
    .exercise.option-b-primary .option-b-panel{background:#F8F8FF!important}
    .exercise.option-b-primary .rx.load{background:linear-gradient(180deg,#F3EEFF,#EAE5FF)!important}
  `;
  document.head.appendChild(s);
}

function progressRecords(){const a=read(PROGRESS_KEY,[]);return Array.isArray(a)?a:[]}
function hasRealWeight(a){return a.some(x=>Number(x?.weight)>0 && x.id!==BASELINE_ID)}
function ensureStartWeight(){
  const input=document.getElementById('weight');
  if(input)input.placeholder='109,8';
  const hero=document.getElementById('heroWeight');
  const arr=progressRecords();
  const hasAny=arr.some(x=>Number(x?.weight)>0);
  if(hero&&!hasAny)hero.textContent='109,8 kg';

  // Mantiene 109,8 kg como punto de partida sin pisar pesajes reales ya cargados.
  if(!arr.some(x=>x?.id===BASELINE_ID)){
    const baseline={
      id:BASELINE_ID,
      date:START_DATE,
      weight:START_WEIGHT,
      waist:'',
      restingHr:'',
      note:'Peso inicial',
      origin:'baseline',
      timestamp:'2026-09-14T00:00:00-03:00'
    };
    arr.push(baseline);
    write(PROGRESS_KEY,arr);
    try{if(typeof syncLocalHistory==='function')syncLocalHistory()}catch{}
    try{if(typeof renderProgressHistory==='function')renderProgressHistory()}catch{}
  }

  syncStartWeightCloud();
}

async function syncStartWeightCloud(){
  for(let i=0;i<30;i++){
    try{
      if(window.firebase&&firebase.apps?.length&&firebase.firestore){
        const db=firebase.firestore();
        const ref=db.collection('rutinaEntreno').doc('lucas-rutina');
        await ref.collection('progress').doc(BASELINE_ID).set({
          id:BASELINE_ID,
          date:START_DATE,
          weight:START_WEIGHT,
          waist:'',
          restingHr:'',
          note:'Peso inicial',
          origin:'baseline',
          timestamp:'2026-09-14T00:00:00-03:00',
          updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        },{merge:true});
        await ref.set({startWeight:START_WEIGHT,startWeightDate:START_DATE},{merge:true});
        try{await window.RutinaFirebase?.syncProfile?.({startWeight:START_WEIGHT,startWeightDate:START_DATE})}catch{}
        return;
      }
    }catch(e){console.warn('baseline weight sync',e);return}
    await new Promise(r=>setTimeout(r,250));
  }
}

function originalName(card){
  const title=card.querySelector('.exercise-name');
  if(!title)return'';
  if(!card.dataset.optionBOriginalName)card.dataset.optionBOriginalName=title.textContent.trim();
  return card.dataset.optionBOriginalName;
}
function storeOriginals(card){
  const title=card.querySelector('.exercise-name');
  const works=card.querySelector('.works span:not(.material-symbols-rounded)');
  const load=card.querySelector('.rx.load b');
  const learn=card.querySelector('.learn-btn');
  originalName(card);
  if(works&&!card.dataset.optionBOriginalWorks)card.dataset.optionBOriginalWorks=works.textContent.trim();
  if(load&&!card.dataset.optionBOriginalLoad)card.dataset.optionBOriginalLoad=load.textContent.trim();
  if(learn&&!card.dataset.optionBOriginalLearnHtml)card.dataset.optionBOriginalLearnHtml=learn.innerHTML;
  if(learn&&!card.dataset.optionBOriginalLearnOnclick)card.dataset.optionBOriginalLearnOnclick=learn.getAttribute('onclick')||'';
}
function altData(card){
  const panel=card.querySelector('.option-b-panel');
  if(!panel)return null;
  const meta=panel.querySelectorAll('.option-b-meta span');
  return {
    name:panel.querySelector('.option-b-name')?.textContent.trim()||'',
    equipment:meta[0]?.textContent.trim()||'Alternativa',
    works:meta[1]?.textContent.trim()||'Mismos grupos musculares',
    how:panel.querySelector('p')?.textContent.trim()||'',
    note:panel.querySelector('.option-b-note')?.textContent.trim()||''
  };
}
function isSelected(card){return /ACTIVA/i.test(card.querySelector('.option-b-toggle b')?.textContent||'')}

function restorePrimary(card){
  if(!card.dataset.optionBOriginalName)return;
  const title=card.querySelector('.exercise-name');
  const works=card.querySelector('.works span:not(.material-symbols-rounded)');
  const load=card.querySelector('.rx.load b');
  const learn=card.querySelector('.learn-btn');
  if(title)title.textContent=card.dataset.optionBOriginalName;
  if(works&&card.dataset.optionBOriginalWorks)works.textContent=card.dataset.optionBOriginalWorks;
  if(load&&card.dataset.optionBOriginalLoad)load.textContent=card.dataset.optionBOriginalLoad;
  if(learn){
    if(card.dataset.optionBOriginalLearnHtml)learn.innerHTML=card.dataset.optionBOriginalLearnHtml;
    const oc=card.dataset.optionBOriginalLearnOnclick||'';
    if(oc)learn.setAttribute('onclick',oc);else learn.removeAttribute('onclick');
  }
  card.querySelector('.option-b-primary-badge')?.remove();
  card.classList.remove('option-b-primary');
  card.dataset.optionBPromoted='0';
}

function promoteCard(card){
  const wrap=card.querySelector('.option-b-wrap');
  if(!wrap)return;
  storeOriginals(card);
  if(!isSelected(card)){
    if(card.dataset.optionBPromoted==='1')restorePrimary(card);
    return;
  }
  if(card.dataset.optionBPromoted==='1')return;
  const a=altData(card);if(!a||!a.name)return;
  const original=originalName(card);
  const title=card.querySelector('.exercise-name');
  const works=card.querySelector('.works span:not(.material-symbols-rounded)');
  const load=card.querySelector('.rx.load b');
  const learn=card.querySelector('.learn-btn');
  if(title){title.textContent=a.name;const badge=document.createElement('div');badge.className='option-b-primary-badge';badge.textContent='✓ Alternativa elegida';title.insertAdjacentElement('afterend',badge)}
  if(works)works.textContent=a.works;
  if(load)load.textContent=a.equipment;
  if(learn){
    learn.innerHTML='<span class="material-symbols-rounded">play_circle</span>Cómo hacerlo';
    learn.setAttribute('onclick',`openOptionBAnimation('${enc(original)}')`);
  }
  const toggle=card.querySelector('.option-b-toggle');
  if(toggle){
    const sp=toggle.querySelector('span'),sm=toggle.querySelector('small'),b=toggle.querySelector('b');
    if(sp)sp.textContent='Alternativa activa';
    if(sm)sm.textContent=`Original: ${original}`;
    if(b)b.textContent='CAMBIAR';
  }
  card.classList.add('option-b-primary');
  card.dataset.optionBPromoted='1';

  // Rehace el dibujo corporal usando el texto de la alternativa visible.
  card.querySelector('.bodymap-mini')?.remove();
}

function promoteAll(){document.querySelectorAll('#exerciseList .exercise').forEach(promoteCard)}

function installOptionBPrimary(){
  injectStyles();
  // Al volver de B a A, restauramos el título antes de que alternatives.js vuelva a decorar la tarjeta.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('.option-b-use');if(!btn)return;
    const card=btn.closest('.exercise');if(card?.classList.contains('option-b-primary'))restorePrimary(card);
  },true);
  const root=document.getElementById('exerciseList');
  if(root)new MutationObserver(()=>requestAnimationFrame(promoteAll)).observe(root,{childList:true,subtree:true,characterData:true});
  setInterval(promoteAll,900);
  promoteAll();
}

function boot(){ensureStartWeight();installOptionBPrimary();setTimeout(ensureStartWeight,1200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,180));else setTimeout(boot,180);
})();
