const SPREADSHEET_ID = '13-7Ja8JDz_8kG_Ls4-iWLcpgFLcQKf_3S5zw6rAkmlI';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  let data;
  if (action === 'ping') {
    data = { ok: true, spreadsheetId: SPREADSHEET_ID, time: new Date().toISOString() };
  } else if (action === 'bootstrap') {
    data = getBootstrap_();
  } else {
    data = { ok: false, error: 'Acción no reconocida' };
  }
  return respond_(data, e && e.parameter && e.parameter.callback);
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    const event = JSON.parse(raw);
    saveEvent_(event);
    return respond_({ ok: true });
  } catch (err) {
    return respond_({ ok: false, error: String(err && err.message || err) });
  }
}

function saveEvent_(event) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date();
  const type = String(event.type || 'event');
  const payload = event.payload || {};
  sheet_(ss, 'Eventos').appendRow([now, type, JSON.stringify(payload), event.origin || 'app']);

  if (type === 'session') {
    sheet_(ss, 'Sesiones').appendRow([
      event.id || Utilities.getUuid(), now, payload.date || '', payload.day || '',
      num_(payload.minutes), num_(payload.rpe), num_(payload.calfPain), payload.notes || '',
      num_(payload.completed), num_(payload.total), event.origin || 'app'
    ]);
  }
  if (type === 'progress') {
    sheet_(ss, 'Progreso').appendRow([
      event.id || Utilities.getUuid(), now, payload.date || '', numOrBlank_(payload.weight),
      numOrBlank_(payload.waist), numOrBlank_(payload.restingHr), payload.note || '', event.origin || 'app'
    ]);
  }
  if (type === 'customization') {
    const state = payload.state || {};
    sheet_(ss, 'Personalizacion').appendRow([
      event.id || Utilities.getUuid(), now, state.weekKey || '', 'snapshot', payload.day || '',
      JSON.stringify({weekOff:state.weekOff||[],dayOff:state.dayOff||{}}), true, event.origin || 'app'
    ]);
  }
}

function getBootstrap_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return {
    ok: true,
    sessions: recentObjects_(sheet_(ss,'Sesiones'), ['id','timestamp','date','day','minutes','rpe','calfPain','notes','completed','total','origin'], 30),
    progress: recentObjects_(sheet_(ss,'Progreso'), ['id','timestamp','date','weight','waist','restingHr','note','origin'], 30)
  };
}

function recentObjects_(sh, keys, limit) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const start = Math.max(2, last - limit + 1);
  const values = sh.getRange(start, 1, last - start + 1, keys.length).getValues();
  return values.reverse().map(row => {
    const o = {}; keys.forEach((k,i) => o[k] = row[i] instanceof Date ? row[i].toISOString() : row[i]); return o;
  });
}

function sheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Falta la pestaña '+name);
  return sh;
}
function num_(v){ const n=Number(v); return Number.isFinite(n)?n:0; }
function numOrBlank_(v){ if(v===''||v===null||v===undefined)return ''; const n=Number(v); return Number.isFinite(n)?n:''; }

function respond_(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${json});`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
