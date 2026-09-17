/**
 * BACKEND GOOGLE DRIVE / GOOGLE SHEETS
 * Dashboard Servicios Industriales
 *
 * La base central debe ser un Google Sheet (no un XLSX binario) con 4 hojas:
 * PTAB, PTAR, VAPOR y SUAVIZADORES.
 *
 * Script Properties:
 * MASTER_SHEET_ID = ID del Google Sheet Base_Maestra_Dashboard
 * WRITE_KEY       = clave compartida para autorizar cargas del operador
 */
const AREA_SHEETS = {ptab:'PTAB', ptar:'PTAR', vapor:'VAPOR', suav:'SUAVIZADORES'};
const AREA_VALUE_HEADERS = {
  ptab:['Valor','Valor original turno'],
  ptar:['Valor'],
  vapor:['Valor'],
  suav:['Valor numérico / promedio','Valor original']
};

function readMasterPayload_(){
  const ss=openMaster_(), data={};
  Object.keys(AREA_SHEETS).forEach(function(area){
    data[AREA_SHEETS[area]]=readSheetObjects_(ss,AREA_SHEETS[area]);
  });
  return {ok:true,data:data,updatedAt:new Date().toISOString(),spreadsheetId:ss.getId(),spreadsheetName:ss.getName()};
}

function doGet(e){
  const p=(e&&e.parameter)||{};
  const callback=String(p.callback||'').trim();
  const transport=String(p.transport||'').trim().toLowerCase();
  const nonce=String(p.nonce||'').trim();
  const parentOrigin=String(p.parentOrigin||'').trim();
  let payload;
  try{
    const action=String(p.action||'read_master');
    if(action==='health') payload={ok:true,service:'Dashboard Servicios · Google Drive',time:new Date().toISOString()};
    else if(action==='read_master') payload=readMasterPayload_();
    else payload={ok:false,error:'Acción GET no soportada.'};
  }catch(err){
    payload={ok:false,error:String(err&&err.message||err)};
  }
  if(transport==='iframe') return iframeResponse_(payload,nonce,parentOrigin);
  return callback ? jsonp_(payload,callback) : json_(payload);
}
function doPost(e){
  try{
    const body=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');

    // La lectura usa el mismo canal POST que la escritura. Esto evita diferencias
    // de caché/redirecciones entre GET y POST en GitHub Pages + Apps Script.
    if(body.action==='read_master') return json_(readMasterPayload_());

    if(body.action!=='append_rows') return json_({ok:false,error:'Acción POST no soportada.'});
    authorize_(body.key);
    const area=String(body.area||'').toLowerCase(), sheetName=AREA_SHEETS[area];
    if(!sheetName) return json_({ok:false,error:'Área no válida.'});
    const rows=Array.isArray(body.rows)?body.rows:[];
    if(!rows.length) return json_({ok:false,error:'La planilla no contiene registros válidos para añadir.'});
    const ss=openMaster_();
    const result=mergeRows_(ss,sheetName,area,rows);

    // La misma respuesta de la escritura devuelve la base ya actualizada.
    // Así el dashboard no depende de una segunda petición para mostrar la fecha nueva.
    const payload=readMasterPayload_();
    payload.area=area;
    payload.sheet=sheetName;
    payload.added=result.added;
    payload.filled=result.filled;
    payload.kept=result.kept;
    payload.total=result.total;
    return json_(payload);
  }catch(err){return json_({ok:false,code:err&&err.code||'',error:String(err&&err.message||err)});}
}

function openMaster_(){
  const id=PropertiesService.getScriptProperties().getProperty('MASTER_SHEET_ID');
  if(!id) throw new Error('Falta Script Property MASTER_SHEET_ID.');
  return SpreadsheetApp.openById(id);
}
function authorize_(key){
  const expected=PropertiesService.getScriptProperties().getProperty('WRITE_KEY')||'';
  if(!expected) throw new Error('Falta Script Property WRITE_KEY.');
  if(String(key||'')!==expected){const er=new Error('Clave de actualización incorrecta.');er.code='AUTH';throw er;}
}
function readSheetObjects_(ss,name){
  const sh=ss.getSheetByName(name); if(!sh) throw new Error('No existe la hoja '+name+'.');
  const lr=sh.getLastRow(), lc=sh.getLastColumn(); if(lr<2||lc<1) return [];
  const vals=sh.getRange(1,1,lr,lc).getDisplayValues(), h=vals[0].map(function(x){return String(x||'').trim();});
  return vals.slice(1).filter(function(r){return r.some(function(v){return String(v||'').trim()!=='';});}).map(function(r){const o={};h.forEach(function(k,i){if(k)o[k]=r[i]===undefined?'':r[i];});return o;});
}
function meaningful_(v){const s=String(v===null||v===undefined?'':v).trim();return s!==''&&s!=='—'&&s!=='-'&&s!=='--'&&s!=='/';}
function normDate_(v){
  if(Object.prototype.toString.call(v)==='[object Date]'&&!isNaN(v)) return Utilities.formatDate(v,Session.getScriptTimeZone()||'America/Caracas','yyyy-MM-dd');
  let s=String(v||'').trim(); const m=s.match(/^(\d{4})[-\/]([01]?\d)[-\/]([0-3]?\d)$/); if(m)return m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2); return s;
}
function mergeRows_(ss,sheetName,area,incoming){
  const sh=ss.getSheetByName(sheetName); if(!sh) throw new Error('No existe la hoja '+sheetName+'.');
  const lc=sh.getLastColumn(), lr=Math.max(sh.getLastRow(),1), headers=sh.getRange(1,1,1,lc).getDisplayValues()[0].map(function(x){return String(x||'').trim();});
  const idx={};headers.forEach(function(h,i){idx[h]=i;});
  ['Fecha','Turno','VariableId'].forEach(function(h){if(idx[h]===undefined)throw new Error('La hoja '+sheetName+' no contiene la columna '+h+'.');});
  const existing=lr>1?sh.getRange(2,1,lr-1,lc).getValues():[], map=new Map();
  existing.forEach(function(r,i){const key=[normDate_(r[idx.Fecha]),String(r[idx.Turno]||'').trim(),String(r[idx.VariableId]||'').trim()].join('|');if(key!=='||')map.set(key,i);});
  const valueHeads=AREA_VALUE_HEADERS[area]||['Valor']; let addedRows=[], added=0,filled=0,kept=0;
  incoming.forEach(function(obj){
    const key=[normDate_(obj.Fecha),String(obj.Turno||'').trim(),String(obj.VariableId||'').trim()].join('|'); if(key==='||')return;
    const row=headers.map(function(h){let v=obj[h];if(h==='Fecha')v=normDate_(v);return v===undefined||v===null?'':v;});
    if(!map.has(key)){addedRows.push(row);map.set(key,existing.length+addedRows.length-1);added++;return;}
    const ei=map.get(key), current=ei<existing.length?existing[ei]:addedRows[ei-existing.length];
    let oldVal='',newVal='';
    valueHeads.some(function(h){if(idx[h]!==undefined&&meaningful_(current[idx[h]])){oldVal=current[idx[h]];return true;}return false;});
    valueHeads.some(function(h){if(idx[h]!==undefined&&meaningful_(row[idx[h]])){newVal=row[idx[h]];return true;}return false;});
    if(!meaningful_(oldVal)&&meaningful_(newVal)){
      if(ei<existing.length){sh.getRange(ei+2,1,1,lc).setValues([row]);existing[ei]=row;}else{addedRows[ei-existing.length]=row;}
      filled++;
    }else kept++;
  });
  if(addedRows.length) sh.getRange(sh.getLastRow()+1,1,addedRows.length,lc).setValues(addedRows);
  SpreadsheetApp.flush();
  return {added:added,filled:filled,kept:kept,total:Math.max(sh.getLastRow()-1,0)};
}
function iframeResponse_(obj,nonce,parentOrigin){
  const origin=/^https?:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(String(parentOrigin||'')) ? String(parentOrigin) : '*';
  const envelope={type:'POLAR_DRIVE_RESPONSE',nonce:String(nonce||''),payload:obj};
  const data=JSON.stringify(envelope).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const target=JSON.stringify(origin);
  const html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>try{parent.postMessage('+data+','+target+');}catch(e){parent.postMessage('+data+',"*");}<\\/script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function jsonp_(obj,callback){
  const cb=String(callback||'').trim();
  if(!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(cb)) return json_({ok:false,error:'Callback JSONP inválido.'});
  return ContentService.createTextOutput(cb+'('+JSON.stringify(obj)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
