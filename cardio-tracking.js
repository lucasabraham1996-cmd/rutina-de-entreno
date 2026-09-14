/* Reinicio diario + registro de cardio + progreso */
(()=>{
'use strict';

const PROFILE='lucas-rutina';
const PLANNER_KEY='rutinaEntreno.planner.v2';
const CUSTOM_KEY='rutinaEntreno.custom.v2';
const OPTION_KEY='rutinaEntreno.optionB.v2';
const CARDIO_KEY='rutinaEntreno.cardio.v1';
const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAY_INDEX={Lunes:0,Martes:1,'Miércoles':2,Jueves:3,Viernes:4,'Sábado':5,Domingo:6};
const ACTIVITIES={
  bike_indoor:{label:'Bicicleta fija',icon:'🚴',short:'Bici fija'},
  bike_outdoor:{label:'Bicicleta afuera',icon:'🚲',short:'Bici afuera'},
  treadmill_run:{label:'Cinta · correr',icon:'🏃',short:'Cinta correr'},
  treadmill_walk:{label:'Cinta · caminar',icon:'🚶',short:'Cinta caminar'}
};

const read=(key,fallback)=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const toastMsg=m=>{if(typeof toast==='function')toast(m);else console.log(m)};
const currentDay=()=>{try{return selectedDay||'Lunes'}catch{return 'Lunes'}};
const weekKey=()=>{const d=new Date(),q=(d.getDay()+6)%7,m=new Date(d.getFullYear(),d.getMonth(),d.getDate()-q);return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}`;};
const uid=()=>window.crypto?.randomUUID?`cardio-${crypto.randomUUID()}`:`cardio-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

function monday(){const d=new Date(),q=(d.getDay()+6)%7;return new Date(d.getFullYear(),d.getMonth(),d.getDate()-q)}
function dateForDay(day=currentDay()){const m=monday(),d=new Date(m);d.setDate(m.getDate()+(DAY_INDEX[day]??0));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function planner(){const p=read(PLANNER_KEY,{weekKey:weekKey(),days:{},updatedAt:0});if(p.weekKey!==weekKey())return{weekKey:weekKey(),days:{},updatedAt:0};p.days=p.days||{};return p}
function planFor(day=currentDay()){return planner().days?.[day]||{type:null,exclude:[]}}
function cardioRecords(){const a=read(CARDIO_KEY,[]);return Array.isArray(a)?a:[]}
function saveRecords(a){write(CARDIO_KEY,a.slice().sort((x,y)=>String(x.timestamp||x.date).localeCompare(String(y.timestamp||y.date))).slice(-500))}
function num(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0}
function speed(r){const m=num(r.minutes),k=num(r.distanceKm);return m>0&&k>0?k/(m/60):0}
function pace(r){const m=num(r.minutes),k=num(r.distanceKm);return k>0?m/k:0}
function fmt(n,d=1){return Number(n||0).toFixed(d).replace('.',',')}
function prettyDate(s){if(!s)return'';const [y,m,d]=s.split('-');return `${d}/${m}`}

function injectStyles(){
  if(document.getElementById('cardioTrackingStyles'))return;
  const s=document.createElement('style');s.id='cardioTrackingStyles';s.textContent=`
  .day-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.14)}
  .cardio-base-chip{font-size:11px;font-weight:750;color:rgba(255,255,255,.92);display:flex;align-items:center;gap:5px}
  .reset-day-btn{border:1px solid rgba(255,255,255,.20)!important;background:rgba(255,255,255,.12)!important;color:#fff!important;border-radius:999px!important;padding:8px 11px!important;min-height:38px!important;font-size:11px!important;font-weight:800!important;display:inline-flex!important;align-items:center!important;gap:5px!important;backdrop-filter:blur(10px)}
  .reset-day-btn[hidden]{display:none!important}
  .cardio-card{margin:12px 0;background:rgba(255,255,255,.86);border:1px solid rgba(99,113,255,.11);border-radius:26px;padding:15px;box-shadow:0 14px 34px rgba(76,91,180,.11);backdrop-filter:blur(14px)}
  .cardio-card[hidden]{display:none!important}.cardio-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.cardio-title{display:flex;align-items:center;gap:10px}.cardio-icon{width:43px;height:43px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#E9F0FF,#F2ECFF);font-size:21px}.cardio-title b{display:block;font-size:16px;color:#111827}.cardio-title span{display:block;font-size:11px;color:#667085;margin-top:2px;line-height:1.3}.cardio-min{background:linear-gradient(135deg,#526FF3,#7658F5);color:#fff;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800;white-space:nowrap}
  .cardio-form{display:grid;grid-template-columns:1.35fr .8fr .8fr;gap:8px;margin-top:13px}.cardio-field label{display:block;font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:#76839A;font-weight:800;margin:0 0 5px 2px}.cardio-field select,.cardio-field input{width:100%;min-height:44px;border:1px solid rgba(99,113,255,.10);border-radius:14px;background:#F6F8FF;color:#1F2937;padding:9px 10px;outline:none;font:inherit}.cardio-date-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px}.cardio-date-row input{width:100%;min-height:44px;border:1px solid rgba(99,113,255,.10);border-radius:14px;background:#F6F8FF;padding:9px 10px}.cardio-save{border:0;border-radius:14px;background:linear-gradient(135deg,#4F7CFF,#7457F5);color:white;padding:10px 14px;font-weight:800;min-height:44px;box-shadow:0 10px 20px rgba(88,101,226,.20)}
  .cardio-live{font-size:11px;color:#64748B;margin-top:8px;min-height:16px}.cardio-today{margin-top:10px;display:grid;gap:6px}.cardio-mini{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#F3F6FF;border-radius:13px;padding:9px 10px;font-size:11px}.cardio-mini b{color:#26324A}.cardio-mini span{color:#667085}.cardio-mini button{border:0;background:transparent;color:#8A5CF6;min-height:30px;padding:2px 5px;font-weight:800}
  .cardio-progress-wrap{margin-top:16px}.cardio-progress-title{display:flex;justify-content:space-between;align-items:end;margin:18px 3px 9px}.cardio-progress-title h3{margin:0;font-size:18px;letter-spacing:-.02em}.cardio-progress-title span{font-size:11px;color:#64748B}.cardio-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:9px}.cardio-stat{background:linear-gradient(180deg,#F7F9FF,#EEF3FF);border:1px solid rgba(99,113,255,.09);border-radius:17px;padding:10px;text-align:center}.cardio-stat small{display:block;font-size:9px;color:#7A869A;text-transform:uppercase;letter-spacing:.06em}.cardio-stat b{display:block;font-size:17px;color:#35415A;margin-top:3px}.cardio-history{display:grid;gap:8px}.cardio-entry{background:rgba(255,255,255,.86);border:1px solid rgba(99,113,255,.10);border-radius:19px;padding:12px;box-shadow:0 8px 22px rgba(76,91,180,.07)}.cardio-entry-top{display:flex;justify-content:space-between;gap:10px}.cardio-entry-title{font-weight:800;color:#1F2937}.cardio-entry-date{font-size:10px;color:#7A869A}.cardio-metrics{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.cardio-metric{background:#F2F5FF;border-radius:999px;padding:5px 8px;font-size:10px;color:#516076;font-weight:700}.cardio-trend{font-size:10px;margin-top:7px;font-weight:750;color:#607087}.cardio-trend.up{color:#26844A}.cardio-trend.down{color:#A85555}.cardio-delete{border:0;background:#F1EDFF;color:#7658F5;border-radius:999px;padding:6px 8px;min-height:30px;font-size:10px;font-weight:800}.mandatory-cardio-row{opacity:.72}.mandatory-cardio-row .ios-switch{pointer-events:none}.mandatory-cardio-note{font-size:9px;color:#5E6DEE;margin-top:2px;font-weight:700}
  @media(max-width:420px){.cardio-form{grid-template-columns:1fr 1fr}.cardio-field:first-child{grid-column:1/-1}.cardio-stats{grid-template-columns:repeat(3,1fr)}.cardio-stat b{font-size:15px}.day-tools{align-items:center}.cardio-base-chip{font-size:10px}}
  @media(max-width:350px){.cardio-stats{grid-template-columns:1fr}.cardio-form{grid-template-columns:1fr}.cardio-field:first-child{grid-column:auto}}
  `;document.head.appendChild(s);
}

function syncPlanner(p){try{window.RutinaFirebase?.syncProfile?.({plannerState:p,plannerUpdatedAt:p.updatedAt})}catch{}}
function syncCustom(c){try{window.RutinaFirebase?.syncProfile?.({customization:c,customizationUpdatedAt:c._updatedAt||Date.now()})}catch{}}
function syncOptions(o){try{window.RutinaFirebase?.syncProfile?.({optionBState:o,optionBUpdatedAt:o.updatedAt})}catch{}}

function cleanupMandatoryCardio(){
  let p=planner(),pc=false;
  Object.values(p.days||{}).forEach(d=>{if(Array.isArray(d.exclude)&&d.exclude.includes('cardio')){d.exclude=d.exclude.filter(x=>x!=='cardio');d.updatedAt=Date.now();pc=true}});
  if(pc){p.updatedAt=Date.now();write(PLANNER_KEY,p);syncPlanner(p)}
  const c=read(CUSTOM_KEY,null);let cc=false;
  if(c&&c.weekKey===weekKey()){
    if(Array.isArray(c.weekOff)&&c.weekOff.includes('cardio')){c.weekOff=c.weekOff.filter(x=>x!=='cardio');cc=true}
    Object.keys(c.dayOff||{}).forEach(d=>{if(Array.isArray(c.dayOff[d])&&c.dayOff[d].includes('cardio')){c.dayOff[d]=c.dayOff[d].filter(x=>x!=='cardio');cc=true}});
    if(cc){c._updatedAt=Date.now();write(CUSTOM_KEY,c);syncCustom(c)}
  }
}

function resetDay(){
  const day=currentDay();
  if(!window.confirm(`¿Reiniciar ${day}? Se borra la elección de rutina, las excepciones y los ejercicios marcados de este día. El historial ya guardado no se borra.`))return;
  const p=planner();delete p.days[day];p.updatedAt=Date.now();write(PLANNER_KEY,p);syncPlanner(p);
  const c=read(CUSTOM_KEY,null);if(c&&c.weekKey===weekKey()){c.dayOff=c.dayOff||{};c.dayOff[day]=[];c._updatedAt=Date.now();write(CUSTOM_KEY,c);syncCustom(c)}
  const o=read(OPTION_KEY,{weekKey:weekKey(),choices:{},updatedAt:0});if(o.weekKey===weekKey()){o.choices=o.choices||{};Object.keys(o.choices).forEach(k=>{if(k.startsWith(day+'|'))delete o.choices[k]});o.updatedAt=Date.now();write(OPTION_KEY,o);syncOptions(o)}
  try{doneSet.clear();if(typeof persistDoneForDay==='function')persistDoneForDay()}catch{}
  const notes=document.getElementById('sessionNotes');if(notes)notes.value='';const mins=document.getElementById('minutes');if(mins)mins.value='45';
  const rc=document.getElementById('routineCurrent');if(rc)rc.innerHTML='<span>Sin rutina elegida para este día</span>';
  if(typeof renderDay==='function')renderDay();refreshUI();toastMsg('↻ Día reiniciado. Elegí de nuevo qué querés entrenar.');
}
window.resetSelectedTrainingDay=resetDay;

function ensureDayTools(){
  const builder=document.getElementById('routineBuilder');if(!builder)return;
  let bar=document.getElementById('dayTools');
  if(!bar){bar=document.createElement('div');bar.id='dayTools';bar.className='day-tools';bar.innerHTML=`<div class="cardio-base-chip"><span>♥︎</span><span>Cardio base · mínimo 5 min</span></div><button id="resetDayBtn" class="reset-day-btn" type="button" onclick="resetSelectedTrainingDay()"><span class="material-symbols-rounded" style="font-size:16px">restart_alt</span>Reiniciar día</button>`;builder.appendChild(bar)}
  const btn=document.getElementById('resetDayBtn'),p=planFor();if(btn)btn.hidden=!p.type;
}

function disableCardioExclusionUI(){
  document.querySelectorAll('#excludeChips .exclude-chip').forEach(b=>{if(/cardio/i.test(b.textContent||'')){b.disabled=true;b.classList.remove('off');b.title='El cardio base de 5 minutos se mantiene siempre.';b.style.opacity='.58'}});
  document.querySelectorAll('#weekGroupControls .custom-row,#dayGroupControls .custom-row').forEach(row=>{if(/cardio/i.test(row.textContent||'')){row.classList.add('mandatory-cardio-row');const btn=row.querySelector('.ios-switch');if(btn)btn.disabled=true;if(!row.querySelector('.mandatory-cardio-note')){const copy=row.querySelector('.custom-row-main>div:last-child');if(copy){const n=document.createElement('div');n.className='mandatory-cardio-note';n.textContent='Se mantiene siempre un mínimo de 5 min';copy.appendChild(n)}}}});
}

function installCardioGuards(){
  if(window.__cardioGuardsInstalled)return;window.__cardioGuardsInstalled=true;
  cleanupMandatoryCardio();
  if(typeof window.toggleRoutineExclude==='function'){
    const old=window.toggleRoutineExclude;window.toggleRoutineExclude=function(id){if(id==='cardio'){toastMsg('♥︎ El cardio base de 5 min queda siempre incluido.');return;}return old.apply(this,arguments)};
  }
  if(typeof window.toggleCustomGroup==='function'){
    const old=window.toggleCustomGroup;window.toggleCustomGroup=function(scope,id){if(id==='cardio'){toastMsg('♥︎ El cardio base de 5 min queda siempre incluido.');return;}return old.apply(this,arguments)};
  }
  if(typeof window.openRoutineBuilder==='function'){
    const old=window.openRoutineBuilder;window.openRoutineBuilder=function(){cleanupMandatoryCardio();const r=old.apply(this,arguments);setTimeout(disableCardioExclusionUI,0);return r};
  }
}

function cardioCard(){
  let card=document.getElementById('cardioLogCard');if(card)return card;
  const builder=document.getElementById('routineBuilder');if(!builder)return null;
  card=document.createElement('section');card.id='cardioLogCard';card.className='cardio-card';card.innerHTML=`
    <div class="cardio-head"><div class="cardio-title"><div class="cardio-icon">♥︎</div><div><b id="cardioCardTitle">Cardio del día</b><span id="cardioCardSubtitle">Registrá el resultado real de bici o cinta.</span></div></div><div class="cardio-min">mín. 5 min</div></div>
    <div class="cardio-form">
      <div class="cardio-field"><label>Actividad</label><select id="cardioActivity">${Object.entries(ACTIVITIES).map(([k,a])=>`<option value="${k}">${a.icon} ${a.label}</option>`).join('')}</select></div>
      <div class="cardio-field"><label>Tiempo</label><input id="cardioMinutes" type="number" min="5" step="1" inputmode="numeric" placeholder="5"></div>
      <div class="cardio-field"><label>Kilómetros</label><input id="cardioKm" type="number" min="0.1" step="0.01" inputmode="decimal" placeholder="0,0"></div>
    </div>
    <div class="cardio-date-row"><input id="cardioDate" type="date"><button class="cardio-save" type="button" onclick="saveCardioEntry()">Guardar cardio</button></div>
    <div id="cardioLive" class="cardio-live"></div><div id="cardioToday" class="cardio-today"></div>`;
  builder.insertAdjacentElement('afterend',card);
  ['cardioMinutes','cardioKm','cardioActivity'].forEach(id=>card.querySelector('#'+id)?.addEventListener('input',updateLive));
  return card;
}

function updateCardioCard(){
  const card=cardioCard();if(!card)return;
  const p=planFor(),active=!!p.type&&p.type!=='rest';card.hidden=!active;if(!active)return;
  const isMain=p.type==='cardio',title=document.getElementById('cardioCardTitle'),sub=document.getElementById('cardioCardSubtitle'),mins=document.getElementById('cardioMinutes'),date=document.getElementById('cardioDate');
  if(title)title.textContent=isMain?'Cardio principal':'Cardio base del entrenamiento';
  if(sub)sub.textContent=isMain?'Hoy elegiste cardio: cargá el tiempo y los km reales de bici o cinta.':'Siempre dejamos al menos 5 minutos. También podés registrar más si hiciste bici o cinta.';
  if(mins&&!mins.dataset.touched){mins.value=isMain?'30':'5'}
  if(mins&&!mins.dataset.bound){mins.dataset.bound='1';mins.addEventListener('input',()=>mins.dataset.touched='1')}
  if(date)date.value=dateForDay();renderToday();updateLive();
}

function updateLive(){
  const m=num(document.getElementById('cardioMinutes')?.value),k=num(document.getElementById('cardioKm')?.value),out=document.getElementById('cardioLive');if(!out)return;
  if(m>0&&k>0){const sp=k/(m/60),pc=m/k;out.textContent=`Velocidad media: ${fmt(sp)} km/h · Ritmo: ${fmt(pc)} min/km`}
  else out.textContent='Cargá tiempo y kilómetros para calcular velocidad y ritmo.';
}

async function saveCardioCloud(rec){
  try{if(!window.firebase||!firebase.apps?.length)throw new Error('Firebase aún no está listo');const db=firebase.firestore(),ref=db.collection('rutinaEntreno').doc(PROFILE).collection('cardio').doc(rec.id);await ref.set({...rec,synced:true,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});const a=cardioRecords(),i=a.findIndex(x=>x.id===rec.id);if(i>=0){a[i].synced=true;saveRecords(a)};window.RutinaFirebase?.syncProfile?.({lastCardioAt:firebase.firestore.FieldValue.serverTimestamp()});return true}catch(e){console.warn('cardio cloud',e);return false}
}
async function deleteCardioCloud(id){try{if(window.firebase&&firebase.apps?.length)await firebase.firestore().collection('rutinaEntreno').doc(PROFILE).collection('cardio').doc(id).delete()}catch(e){console.warn('delete cardio cloud',e)}}

window.saveCardioEntry=async()=>{
  const activity=document.getElementById('cardioActivity')?.value||'bike_indoor',minutes=num(document.getElementById('cardioMinutes')?.value),km=num(document.getElementById('cardioKm')?.value),date=document.getElementById('cardioDate')?.value||dateForDay();
  if(minutes<5){toastMsg('El cardio debe durar al menos 5 minutos.');return}
  if(km<=0){toastMsg('Cargá los kilómetros para poder medir tu progreso.');return}
  const rec={id:uid(),date,day:currentDay(),activity,minutes,distanceKm:Number(km.toFixed(2)),timestamp:new Date().toISOString(),synced:false};const a=cardioRecords();a.push(rec);saveRecords(a);renderToday();renderProgress();const ok=await saveCardioCloud(rec);toastMsg(ok?'♥︎ Cardio guardado y sincronizado':'♥︎ Cardio guardado en el iPhone; Firebase queda pendiente');
};
window.deleteCardioEntry=async id=>{if(!confirm('¿Eliminar este registro de cardio?'))return;saveRecords(cardioRecords().filter(x=>x.id!==id));renderToday();renderProgress();await deleteCardioCloud(id);toastMsg('Registro de cardio eliminado')};

function renderToday(){
  const root=document.getElementById('cardioToday');if(!root)return;const date=document.getElementById('cardioDate')?.value||dateForDay(),rows=cardioRecords().filter(x=>x.date===date).sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp)));
  if(!rows.length){root.innerHTML='';return}
  const tm=rows.reduce((s,x)=>s+num(x.minutes),0),tk=rows.reduce((s,x)=>s+num(x.distanceKm),0);
  root.innerHTML=`<div class="cardio-mini"><div><b>Hoy: ${tm} min · ${fmt(tk,2)} km</b><span> ${rows.length} registro${rows.length===1?'':'s'}</span></div></div>`+rows.map(x=>`<div class="cardio-mini"><div><b>${ACTIVITIES[x.activity]?.icon||'♥︎'} ${esc(ACTIVITIES[x.activity]?.short||x.activity)}</b><span> · ${x.minutes} min · ${fmt(x.distanceKm,2)} km</span></div><button onclick="deleteCardioEntry('${x.id}')">Eliminar</button></div>`).join('');
}

function previousSame(record,sortedAsc){let prev=null;for(const x of sortedAsc){if(x.id===record.id)break;if(x.activity===record.activity)prev=x}return prev}
function trendFor(r,sortedAsc){const p=previousSame(r,sortedAsc);if(!p)return'';const dk=num(r.distanceKm)-num(p.distanceKm),ds=speed(r)-speed(p);const parts=[];if(Math.abs(dk)>=.05)parts.push(`${dk>0?'↑':'↓'} ${dk>0?'+':''}${fmt(dk,2)} km vs anterior`);if(Math.abs(ds)>=.1)parts.push(`${ds>0?'↑':'↓'} ${ds>0?'+':''}${fmt(ds)} km/h`);return parts.join(' · ')}
function progressHost(){
  let wrap=document.getElementById('cardioProgressWrap');if(wrap)return wrap;const hist=document.getElementById('progressHistory');if(!hist)return null;wrap=document.createElement('section');wrap.id='cardioProgressWrap';wrap.className='cardio-progress-wrap';wrap.innerHTML=`<div class="cardio-progress-title"><h3>Progreso de cardio</h3><span>tiempo · km · velocidad</span></div><div id="cardioStats" class="cardio-stats"></div><div id="cardioHistory" class="cardio-history"></div>`;hist.insertAdjacentElement('afterend',wrap);return wrap;
}
function renderProgress(){
  if(!progressHost())return;const all=cardioRecords().slice().sort((a,b)=>String(a.timestamp||a.date).localeCompare(String(b.timestamp||b.date))),desc=all.slice().reverse(),seven=new Date();seven.setDate(seven.getDate()-6);seven.setHours(0,0,0,0);const recent=all.filter(x=>{const d=new Date(x.date+'T00:00:00');return d>=seven}),mins=recent.reduce((s,x)=>s+num(x.minutes),0),km=recent.reduce((s,x)=>s+num(x.distanceKm),0),stats=document.getElementById('cardioStats'),hist=document.getElementById('cardioHistory');if(stats)stats.innerHTML=`<div class="cardio-stat"><small>7 días</small><b>${recent.length}</b><span>sesiones</span></div><div class="cardio-stat"><small>Tiempo</small><b>${mins}</b><span>min</span></div><div class="cardio-stat"><small>Distancia</small><b>${fmt(km,1)}</b><span>km</span></div>`;if(!hist)return;if(!desc.length){hist.innerHTML='<div class="empty">Todavía no hay cardio registrado.</div>';return}hist.innerHTML=desc.slice(0,20).map(r=>{const sp=speed(r),pc=pace(r),tr=trendFor(r,all),act=ACTIVITIES[r.activity]||{label:r.activity,icon:'♥︎'};return `<article class="cardio-entry"><div class="cardio-entry-top"><div><div class="cardio-entry-title">${act.icon} ${esc(act.label)}</div><div class="cardio-entry-date">${prettyDate(r.date)} · ${esc(r.day||'')}</div></div><button class="cardio-delete" onclick="deleteCardioEntry('${r.id}')">Eliminar</button></div><div class="cardio-metrics"><span class="cardio-metric">${r.minutes} min</span><span class="cardio-metric">${fmt(r.distanceKm,2)} km</span>${sp?`<span class="cardio-metric">${fmt(sp)} km/h</span>`:''}${pc?`<span class="cardio-metric">${fmt(pc)} min/km</span>`:''}</div>${tr?`<div class="cardio-trend ${tr.includes('↑')?'up':tr.includes('↓')?'down':''}">${esc(tr)}</div>`:''}</article>`}).join('');
}

async function hydrateCardio(){
  for(let i=0;i<30;i++){
    try{if(window.firebase&&firebase.apps?.length){const snap=await firebase.firestore().collection('rutinaEntreno').doc(PROFILE).collection('cardio').limit(150).get(),map=new Map();cardioRecords().forEach(x=>map.set(x.id,x));snap.forEach(d=>{const x=d.data();map.set(d.id,{id:d.id,date:x.date||'',day:x.day||'',activity:x.activity||'bike_indoor',minutes:num(x.minutes),distanceKm:num(x.distanceKm),timestamp:x.timestamp||x.date||'',synced:true})});saveRecords([...map.values()]);renderToday();renderProgress();await syncPending();return}}catch(e){console.warn('hydrate cardio',e);return}await new Promise(r=>setTimeout(r,300));
  }
}
async function syncPending(){for(const r of cardioRecords().filter(x=>!x.synced))await saveCardioCloud(r)}

function refreshUI(){cleanupMandatoryCardio();ensureDayTools();disableCardioExclusionUI();updateCardioCard();renderProgress()}
function wrapRender(){if(window.__cardioRenderWrapped)return;window.__cardioRenderWrapped=true;if(typeof window.renderDay==='function'){const old=window.renderDay;window.renderDay=function(){const r=old.apply(this,arguments);setTimeout(refreshUI,0);return r}}if(typeof window.saveRoutineBuilder==='function'){const old=window.saveRoutineBuilder;window.saveRoutineBuilder=function(){const r=old.apply(this,arguments);setTimeout(refreshUI,20);return r}}}

function boot(){injectStyles();installCardioGuards();wrapRender();ensureDayTools();cardioCard();progressHost();refreshUI();hydrateCardio();window.addEventListener('online',syncPending);const observer=new MutationObserver(()=>{disableCardioExclusionUI();ensureDayTools()});observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,220));else setTimeout(boot,220);
})();
