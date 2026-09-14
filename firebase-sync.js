/* Firebase persistence for Rutina de Entreno */
(()=>{
  const firebaseConfig = {
    apiKey: "AIzaSyAfn1RVDfrbNMxVRgOcgHu-8QMmGAhugik",
    authDomain: "comidassaludables.firebaseapp.com",
    projectId: "comidassaludables",
    storageBucket: "comidassaludables.firebasestorage.app",
    messagingSenderId: "528526969296",
    appId: "1:528526969296:web:00786114cf5a0f28ab91d5",
    measurementId: "G-7D62CLX8N0"
  };

  const PROFILE_ID='lucas-rutina';
  const CUSTOM_KEY='rutinaEntreno.custom.v2';
  const DONE_META_KEY='rutinaEntreno.doneMeta.v1';
  let db=null, profileRef=null, ready=false, syncing=false, lastError=null;

  function uid(prefix='r'){
    if(window.crypto&&crypto.randomUUID)return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  }
  function read(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
  function weekKey(){const d=new Date(),q=(d.getDay()+6)%7,m=new Date(d.getFullYear(),d.getMonth(),d.getDate()-q);return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}`}
  function tsValue(v){if(!v)return 0;if(typeof v==='number')return v;if(v.toMillis)return v.toMillis();const n=Date.parse(v);return Number.isFinite(n)?n:0}
  function dateIso(){return new Date().toISOString().slice(0,10)}

  function injectStatusUI(){
    if(document.getElementById('firebaseStateCard'))return;
    const target=document.querySelector('#screen-progress .form-card');
    if(!target)return;
    const card=document.createElement('div');
    card.id='firebaseStateCard';
    card.style.cssText='margin:0 0 12px;background:#fff;border-radius:22px;padding:14px 15px;box-shadow:0 1px 2px rgba(0,0,0,.05);display:flex;gap:12px;align-items:center';
    card.innerHTML='<div style="width:42px;height:42px;border-radius:13px;background:#e8f3ff;color:#007aff;display:grid;place-items:center;font-size:20px">☁️</div><div style="flex:1"><b style="display:block;font-size:14px">Guardado en Firebase</b><span id="firebaseStateText" style="display:block;font-size:12px;color:#6e6e73;margin-top:2px;line-height:1.35">Conectando…</span><small id="firebaseStateCode" style="display:none;color:#8e8e93;font-size:10px;margin-top:3px"></small></div><span id="firebaseStateDot" style="width:9px;height:9px;border-radius:50%;background:#ff9f0a;flex:0 0 auto"></span>';
    target.parentNode.insertBefore(card,target);
  }
  function setStatus(text,state='pending',code=''){
    injectStatusUI();
    const t=document.getElementById('firebaseStateText'),d=document.getElementById('firebaseStateDot'),c=document.getElementById('firebaseStateCode');
    if(t)t.textContent=text;
    if(d)d.style.background=state==='ok'?'#34c759':state==='error'?'#ff3b30':'#ff9f0a';
    if(c){c.textContent=code?`Código: ${code}`:'';c.style.display=code?'block':'none';}
  }
  function cleanCode(err){return String(err?.code||'').replace(/^firestore\//,'').replace(/^firebase\//,'')||'desconocido'}
  function describeFirebaseError(err,context='Firebase'){
    const code=cleanCode(err);
    const map={
      'permission-denied':'Firestore bloqueó el acceso. Hay que revisar las reglas de seguridad.',
      'unauthenticated':'Firestore exige iniciar sesión antes de leer o guardar.',
      'failed-precondition':'Firestore todavía no está listo o falta crear/configurar la base de datos.',
      'not-found':'No encontré la base de datos Firestore predeterminada del proyecto.',
      'unavailable':'Firebase está temporalmente inaccesible o el iPhone está sin conexión.',
      'deadline-exceeded':'Firebase tardó demasiado en responder. Volvé a intentar con conexión estable.',
      'resource-exhausted':'Firebase rechazó la operación por cuota o límite del proyecto.',
      'invalid-argument':'Firebase rechazó una operación por configuración o datos inválidos.',
      'network-request-failed':'No se pudo conectar con los servidores de Firebase.'
    };
    return `${map[code]||`${context} devolvió un error (${code}).`} Tus datos siguen guardados en este iPhone.`;
  }
  function reportError(err,context='Firebase'){
    lastError={code:cleanCode(err),message:String(err?.message||err||''),context,at:new Date().toISOString()};
    console.warn(context,err);
    setStatus(describeFirebaseError(err,context),'error',lastError.code);
  }

  function getCustom(){return read(CUSTOM_KEY,{weekKey:weekKey(),weekOff:[],dayOff:{}})}
  function stampCustom(){const s=getCustom();s._updatedAt=Date.now();write(CUSTOM_KEY,s);return s}
  function getDone(){return read((window.LOCAL_KEYS&&LOCAL_KEYS.done)||'rutinaEntreno.done.v1',{})}
  function markDoneChanged(){write(DONE_META_KEY,{updatedAt:Date.now()})}

  async function syncProfile(extra={}){
    if(!ready||!profileRef)return;
    const custom=getCustom();
    const done=getDone();
    const doneMeta=read(DONE_META_KEY,{updatedAt:0});
    try{
      await profileRef.set({
        app:'Rutina de Entreno',
        customization:custom,
        customizationUpdatedAt:Number(custom._updatedAt||0),
        doneState:done,
        doneUpdatedAt:Number(doneMeta.updatedAt||0),
        lastSeenAt:firebase.firestore.FieldValue.serverTimestamp(),
        ...extra
      },{merge:true});
      lastError=null;
      setStatus('Todo sincronizado con Firebase','ok');
    }catch(err){reportError(err,'Firebase al guardar cambios')}
  }

  function normalizeSession(x){
    const y={...x};
    y.id=y.id||uid('session');
    y.timestamp=y.timestamp||new Date().toISOString();
    y.compliance=y.total?Number(y.completed||0)/Number(y.total):0;
    return y;
  }
  function normalizeProgress(x){
    const y={...x}; y.id=y.id||uid('progress'); y.timestamp=y.timestamp||new Date().toISOString(); return y;
  }
  function mergeRecords(local,remote,normalizer){
    const map=new Map();
    [...local,...remote].forEach(item=>{const x=normalizer(item);map.set(x.id,x)});
    return [...map.values()].sort((a,b)=>tsValue(a.timestamp)-tsValue(b.timestamp)).slice(-250);
  }

  async function saveSessionCloud(payload){
    if(!ready)return;
    try{
      await profileRef.collection('sessions').doc(payload.id).set({...payload,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      await syncProfile();
    }catch(err){reportError(err,'Firebase al guardar la sesión')}
  }
  async function saveProgressCloud(payload){
    if(!ready)return;
    try{
      await profileRef.collection('progress').doc(payload.id).set({...payload,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      const extra={}; if(payload.weight!==''&&payload.weight!=null)extra.lastWeight=Number(payload.weight);
      await syncProfile(extra);
    }catch(err){reportError(err,'Firebase al guardar el peso')}
  }

  async function hydrate(){
    if(!ready||syncing)return; syncing=true; setStatus('Sincronizando con Firebase…');
    try{
      // Lecturas simples: evitamos depender de índices para el arranque de la app.
      const profile=await profileRef.get();
      const [sessions,progress]=await Promise.all([
        profileRef.collection('sessions').limit(80).get(),
        profileRef.collection('progress').limit(80).get()
      ]);
      const p=profile.exists?profile.data():{};
      const localCustom=getCustom(), cloudCustom=p.customization||null;
      if(cloudCustom&&cloudCustom.weekKey===weekKey()){
        const cloudT=Number(p.customizationUpdatedAt||cloudCustom._updatedAt||0),localT=Number(localCustom._updatedAt||0);
        if(cloudT>localT)write(CUSTOM_KEY,cloudCustom);else if(localT>cloudT)await syncProfile();
      }else if(localCustom.weekKey===weekKey()) await syncProfile();

      const localDone=getDone(), localDoneT=Number((read(DONE_META_KEY,{updatedAt:0})).updatedAt||0),cloudDoneT=Number(p.doneUpdatedAt||0);
      if(p.doneState&&cloudDoneT>localDoneT){write((window.LOCAL_KEYS&&LOCAL_KEYS.done)||'rutinaEntreno.done.v1',p.doneState);write(DONE_META_KEY,{updatedAt:cloudDoneT});}
      else if(Object.keys(localDone).length&&localDoneT>=cloudDoneT) await syncProfile();

      const rs=[];sessions.forEach(d=>rs.push({...d.data(),id:d.id,timestamp:d.data().timestamp||d.data().date||''}));
      const rp=[];progress.forEach(d=>rp.push({...d.data(),id:d.id,timestamp:d.data().timestamp||d.data().date||''}));
      const localSessions=typeof getLocalSessions==='function'?getLocalSessions():read('rutinaEntreno.sessions.v1',[]);
      const localProgress=typeof getLocalProgress==='function'?getLocalProgress():read('rutinaEntreno.progress.v1',[]);
      const mergedS=mergeRecords(localSessions,rs,normalizeSession),mergedP=mergeRecords(localProgress,rp,normalizeProgress);
      write('rutinaEntreno.sessions.v1',mergedS);write('rutinaEntreno.progress.v1',mergedP);
      if(typeof syncLocalHistory==='function')syncLocalHistory();
      if(typeof loadDoneForDay==='function')loadDoneForDay();
      if(typeof renderDay==='function')renderDay();
      if(typeof renderHistory==='function')renderHistory();
      if(typeof renderProgressHistory==='function')renderProgressHistory();
      if(typeof updateHeroWeight==='function')updateHeroWeight();
      lastError=null;
      setStatus('Todo sincronizado con Firebase','ok');
    }catch(err){
      reportError(err,'Firebase al sincronizar');
    }finally{syncing=false}
  }

  function installOverrides(){
    window.saveSession=function(){
      const items=(DATA.plan||[]).filter(x=>x.day===selectedDay);
      const payload=normalizeSession({
        id:uid('session'),date:val('sessionDate')||dateIso(),day:selectedDay,session:DAY_FOCUS[selectedDay]||selectedDay,
        completed:doneSet.size,total:items.length,rpe:+val('rpe'),calfPain:+val('calfPain'),minutes:+val('minutes'),notes:val('sessionNotes'),origin:'app'
      });
      const arr=getLocalSessions();arr.push(payload);writeLocal(LOCAL_KEYS.sessions,arr);syncLocalHistory();renderHistory();
      toast('✅ Sesión guardada'); saveSessionCloud(payload);
    };

    window.saveProgress=function(){
      const payload=normalizeProgress({id:uid('progress'),date:val('progressDate')||dateIso(),weight:val('weight'),waist:val('waist'),restingHr:val('restingHr'),note:val('progressNote'),origin:'app'});
      if(!payload.weight&&!payload.waist&&!payload.restingHr){toast('Cargá al menos una medición.');return;}
      const arr=getLocalProgress();arr.push(payload);writeLocal(LOCAL_KEYS.progress,arr);syncLocalHistory();renderProgressHistory();updateHeroWeight();
      toast(payload.weight?'⚖️ Peso actualizado y guardado':'📉 Progreso guardado'); saveProgressCloud(payload);
    };

    if(typeof window.persistDoneForDay==='function'){
      const old=window.persistDoneForDay;
      window.persistDoneForDay=function(){old();markDoneChanged();syncProfile();};
    }

    ['toggleCustomGroup','resetDayCustomization','resetWeekCustomization'].forEach(name=>{
      if(typeof window[name]==='function'){
        const old=window[name];
        window[name]=function(...args){const r=old.apply(this,args);stampCustom();syncProfile();return r;};
      }
    });
  }

  async function start(){
    injectStatusUI();
    if(!window.firebase||!firebase.firestore){setStatus('El SDK de Firebase no cargó. Tus datos siguen guardados en este iPhone.','error','sdk-no-cargado');return;}
    try{
      if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
      db=firebase.firestore(); profileRef=db.collection('rutinaEntreno').doc(PROFILE_ID);
      try{await db.enablePersistence({synchronizeTabs:true});}catch(e){if(!['failed-precondition','unimplemented'].includes(cleanCode(e)))console.warn('Persistencia Firestore',e)}
      ready=true; installOverrides(); await hydrate();
      window.addEventListener('online',()=>{setStatus('Reconectando…');hydrate();syncProfile();});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')hydrate();});
    }catch(err){reportError(err,'Firebase al iniciar')}
  }

  window.RutinaFirebase={hydrate,syncProfile,isReady:()=>ready,lastError:()=>lastError,config:()=>({...firebaseConfig,apiKey:'***'})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,50));else setTimeout(start,50);
})();