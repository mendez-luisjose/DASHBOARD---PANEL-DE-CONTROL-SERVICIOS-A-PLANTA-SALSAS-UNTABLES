/* =========================================================
   Dashboard de servicios industriales
   Servicios generales: rondas simuladas 07:00, 11:00 y 16:00
   PTAR: datos reales del archivo local, histórico completo por variable, turnos 07:00 y 19:00
   VAPOR: datos reales del archivo local de calderas, histórico completo por variable, turnos 07:00 y 19:00
   ========================================================= */
'use strict';

const C = {agua:'#1B8A5A', vapor:'#C0451B', aire:'#1E63C8', nh3:'#B8860B', ptar:'#456B6B',
           ink:'#131A20', ok:'#1B8A5A', warn:'#C08307', crit:'#C0392B', line:'#E4E8EC', ink3:'#8B959E'};

/* ---------------------------------------------------------
   1. Rondas de lectura
   --------------------------------------------------------- */
const RONDAS = [
  {hora:'07:00', turno:'Turno A', desde:'03:00', n:17, etiq:'Arranque de líneas'},
  {hora:'11:00', turno:'Turno A', desde:'07:00', n:17, etiq:'Producción plena'},
  {hora:'16:00', turno:'Turno B', desde:'11:00', n:21, etiq:'Producción y CIP'},
];
let ronda = 1;                 // ronda mostrada (0, 1, 2)

/* ---------------------------------------------------------
   2. Variables de proceso
   dir: 'high' malo si sube · 'low' malo si baja · 'band' debe estar en rango
   sfac: factor de carga por ronda (arranque, plena, tarde)
   --------------------------------------------------------- */
const V = {
  /* --- PTAB · agua suave --- */
  'ptab.dureza':   {lbl:'Dureza del agua tratada', u:'ppm', dec:1, base:8.4, amp:2.2, nz:.5, dir:'high', warn:14, crit:17, floor:0, ceil:30, sfac:[.72,1,1.14]},
  'ptab.caudal':   {lbl:'Caudal a red', u:'m³/h', dec:1, base:41, amp:8, nz:2, dir:'band', lo:25, hi:60, m:8, floor:0, ceil:80, sfac:[.68,1,1.12]},
  'ptab.presion':  {lbl:'Presión de red', u:'bar', dec:2, base:3.6, amp:.22, nz:.06, dir:'low', warn:3.2, crit:2.8, floor:0, ceil:6},
  'ptab.nivel':    {lbl:'Nivel de cisterna', u:'%', dec:0, base:74, amp:11, nz:1.3, dir:'low', warn:45, crit:30, floor:0, ceil:100, sfac:[1.18,1,.82]},
  'ptab.cloro':    {lbl:'Cloro residual', u:'mg/L', dec:2, base:.62, amp:.14, nz:.04, dir:'band', lo:.4, hi:1.0, m:.25, floor:0, ceil:2},
  'ptab.conduct':  {lbl:'Conductividad', u:'µS/cm', dec:0, base:392, amp:44, nz:11, dir:'high', warn:520, crit:600, floor:150, ceil:800, sfac:[.9,1,1.08]},

  /* --- Vapor --- */
  'vapor.presion': {lbl:'Presión de caldera', u:'bar', dec:2, base:8.5, amp:.5, nz:.11, dir:'band', lo:7.5, hi:9.5, m:.6, floor:0, ceil:12, sfac:[.94,1,1.02]},
  'vapor.temp':    {lbl:'Temperatura de vapor', u:'°C', dec:1, base:178, amp:4.5, nz:1.1, dir:'band', lo:168, hi:188, m:8, floor:100, ceil:220},
  'vapor.gen':     {lbl:'Generación de vapor', u:'kg/h', dec:0, base:4150, amp:750, nz:160, dir:'band', lo:1500, hi:6000, m:600, floor:0, ceil:7500, sfac:[.62,1,1.16]},
  'vapor.efi':     {lbl:'Eficiencia de caldera', u:'%', dec:1, base:84.5, amp:2.6, nz:.6, dir:'low', warn:80, crit:76, floor:60, ceil:95, sfac:[.96,1,1.01]},
  'vapor.gas':     {lbl:'Consumo de gas natural', u:'m³/h', dec:0, base:312, amp:60, nz:14, dir:'high', warn:420, crit:470, floor:0, ceil:600, sfac:[.66,1,1.15]},
  'vapor.cond':    {lbl:'Retorno de condensado', u:'%', dec:1, base:68, amp:6, nz:1.4, dir:'low', warn:60, crit:52, floor:0, ceil:100},
  'vapor.tds':     {lbl:'TDS en caldera', u:'ppm', dec:0, base:2450, amp:380, nz:85, dir:'high', warn:3000, crit:3500, floor:800, ceil:4500, sfac:[.86,1,1.1]},

  /* --- Aire comprimido --- */
  'aire.presion':  {lbl:'Presión de red', u:'bar', dec:2, base:6.8, amp:.26, nz:.07, dir:'low', warn:6.2, crit:5.8, floor:0, ceil:10, sfac:[1.04,1,.97]},
  'aire.caudal':   {lbl:'Caudal entregado', u:'Nm³/min', dec:1, base:32, amp:6, nz:1.5, dir:'band', lo:15, hi:44, m:5, floor:0, ceil:55, sfac:[.6,1,1.13]},
  'aire.rocio':    {lbl:'Punto de rocío', u:'°C', dec:1, base:2.6, amp:1.4, nz:.45, dir:'high', warn:6, crit:9, floor:-20, ceil:15},
  'aire.kw':       {lbl:'Potencia consumida', u:'kW', dec:0, base:218, amp:36, nz:8, dir:'high', warn:300, crit:340, floor:0, ceil:400, sfac:[.62,1,1.14]},
  'aire.esp':      {lbl:'Consumo específico', u:'kWh/Nm³', dec:3, base:.113, amp:.012, nz:.003, dir:'high', warn:.135, crit:.15, floor:.05, ceil:.25, sfac:[1.06,1,1.02]},
  'aire.tdesc':    {lbl:'Temperatura de descarga', u:'°C', dec:1, base:78, amp:6, nz:1.5, dir:'high', warn:95, crit:105, floor:30, ceil:130, sfac:[.86,1,1.09]},
  'aire.carga':    {lbl:'Carga de compresores', u:'%', dec:0, base:73, amp:12, nz:2.8, dir:'high', warn:92, crit:97, floor:0, ceil:100, sfac:[.6,1,1.15]},
  'aire.fugas':    {lbl:'Fugas estimadas', u:'%', dec:1, base:14, amp:3, nz:.8, dir:'high', warn:18, crit:24, floor:0, ceil:40, sfac:[1.25,1,.98]},

  /* --- Refrigeración y amoníaco --- */
  'frio.tsum':     {lbl:'Agua helada · suministro', u:'°C', dec:2, base:1.8, amp:.6, nz:.16, dir:'high', warn:3.5, crit:4.5, floor:-2, ceil:10, sfac:[.85,1,1.22]},
  'frio.tret':     {lbl:'Agua helada · retorno', u:'°C', dec:2, base:7.4, amp:.9, nz:.22, dir:'high', warn:10, crit:12, floor:0, ceil:16, sfac:[.88,1,1.12]},
  'frio.psuc':     {lbl:'Presión de succión', u:'bar', dec:2, base:2.55, amp:.26, nz:.07, dir:'band', lo:2.0, hi:3.2, m:.5, floor:0, ceil:6},
  'frio.pdes':     {lbl:'Presión de descarga', u:'bar', dec:2, base:11.5, amp:.8, nz:.18, dir:'high', warn:13.5, crit:14.5, floor:6, ceil:18, sfac:[.92,1,1.07]},
  'frio.carga':    {lbl:'Carga térmica', u:'TR', dec:0, base:298, amp:52, nz:12, dir:'high', warn:400, crit:440, floor:0, ceil:480, sfac:[.7,1,1.18]},
  'frio.cop':      {lbl:'COP del sistema', u:'', dec:2, base:3.42, amp:.3, nz:.07, dir:'low', warn:2.9, crit:2.6, floor:1.5, ceil:5, sfac:[1.06,1,.94]},
  'frio.nivel':    {lbl:'Nivel en recibidor NH₃', u:'%', dec:0, base:68, amp:8, nz:1.4, dir:'low', warn:45, crit:32, floor:0, ceil:100},
  'frio.nh3':      {lbl:'NH₃ máximo detectado', u:'ppm', dec:1, base:2.2, amp:1.2, nz:.5, dir:'high', warn:25, crit:35, floor:0, ceil:200},

};

const SERVICIOS = {
  resumen:{nom:'Resumen de planta', sub:'Lectura consolidada de los servicios de planta', keys:[]},
  ptab:{nom:'PTAB · Agua suave', sub:'Planta de tratamiento de agua blanda · red de proceso y servicios',
        color:C.agua, corto:'Agua suave', kpi:'ptab.caudal',
        keys:['ptab.dureza','ptab.caudal','ptab.presion','ptab.nivel','ptab.cloro','ptab.conduct']},
  vapor:{nom:'Vapor', sub:'Sistema de generación de vapor · alimentación y control operacional de calderas',
        color:C.vapor, corto:'Vapor', kpi:null, keys:[]},
  aire:{nom:'Aire comprimido', sub:'Sala de compresores · aire de instrumentos y de proceso',
        color:C.aire, corto:'Aire comprimido', kpi:'aire.presion',
        keys:['aire.presion','aire.caudal','aire.rocio','aire.kw','aire.esp','aire.tdesc','aire.carga','aire.fugas']},
  frio:{nom:'Refrigeración y amoníaco', sub:'Sala de máquinas NH₃ · agua helada, cámaras y enfriamiento de proceso',
        color:C.nh3, corto:'Refrigeración', kpi:'frio.tsum',
        keys:['frio.tsum','frio.tret','frio.psuc','frio.pdes','frio.carga','frio.cop','frio.nivel','frio.nh3']},
  ptar:{nom:'PTAR', sub:'Planta de tratamiento de aguas residuales · control operacional por procesos',
        color:C.ptar, corto:'PTAR', kpi:null, keys:[]},
};

const KPI_TABS = {
  ptab:['ptab.dureza','ptab.caudal','ptab.presion','ptab.nivel','ptab.cloro','ptab.conduct'],
  vapor:[],
  aire:['aire.presion','aire.caudal','aire.rocio','aire.kw','aire.esp','aire.tdesc'],
  frio:['frio.tsum','frio.tret','frio.psuc','frio.pdes','frio.carga','frio.cop'],
  ptar:[],
};

/* ---------------------------------------------------------
   3. Generación de los registros de cada ronda
   Semilla fija: las lecturas no cambian al recargar.
   --------------------------------------------------------- */
function rng(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const clamp = (x,v) => Math.max(v.floor, Math.min(v.ceil, x));

const HORAS = [];   // marcas de tiempo por ronda
const DATA = [];    // DATA[ronda][clave] = arreglo de lecturas

RONDAS.forEach((R, s) => {
  const [h0, m0] = R.desde.split(':').map(Number);
  HORAS[s] = Array.from({length:R.n}, (_,i)=>{
    const t = h0*60 + m0 + i*15;
    return String(Math.floor(t/60)).padStart(2,'0') + ':' + String(t%60).padStart(2,'0');
  });
  DATA[s] = {};
  for(const k in V){
    const v = V[k], r = rng(hash(k) + s*7919);
    const f = v.sfac ? v.sfac[s] : 1;
    const base = v.base * f, ph = r()*Math.PI*2, per = 9 + r()*7;
    let drift = 0, arr = [];
    for(let i=0;i<R.n;i++){
      drift += (r()-.5) * v.nz * .8;
      drift = Math.max(-v.amp*.7, Math.min(v.amp*.7, drift));
      arr.push(clamp(base + v.amp*.45*Math.sin(ph + i/per*Math.PI*2) + drift + (r()-.5)*v.nz, v));
    }
    DATA[s][k] = arr;
  }
});

/* Eventos sembrados: así cada ronda cuenta algo distinto */
function llevar(s, k, destino, pasos){
  const a = DATA[s] && DATA[s][k];
  if(!a || !a.length) return;
  const n = Math.min(pasos || 6, a.length);
  for(let i=a.length-n;i<a.length;i++){
    const w = (i - (a.length-n) + 1) / n;
    a[i] = a[i]*(1-w) + destino*w;
  }
}
llevar(1, 'vapor.cond', 57.4);        // 11:00 · condensado bajo por trampas con fuga
llevar(2, 'aire.rocio', 7.2);         // 16:00 · secador exigido por la tarde
llevar(2, 'frio.tsum', 3.6);          // 16:00 · agua helada por encima de consigna

/* Detectores de amoníaco por ronda */
const DETECTORES = [
  {id:'AD-01', loc:'Sala de máquinas · nivel piso',        ppm:[0.4, 1.1, 2.3]},
  {id:'AD-02', loc:'Sala de máquinas · sobre compresores', ppm:[1.2, 2.4, 27.4]},
  {id:'AD-03', loc:'Cámara de producto terminado',         ppm:[0.0, 0.3, 0.6]},
  {id:'AD-04', loc:'Túnel de enfriamiento de mayonesa',    ppm:[0.7, 1.8, 3.1]},
  {id:'AD-05', loc:'Azotea · condensador evaporativo',     ppm:[1.9, 3.2, 5.8]},
  {id:'AD-06', loc:'Cuarto de tableros',                   ppm:[0.0, 0.0, 0.2]},
];
/* El máximo detectado alimenta la variable de NH₃ */
RONDAS.forEach((R,s)=>{
  const max = Math.max(...DETECTORES.map(d=>d.ppm[s]));
  llevar(s, 'frio.nh3', max, 4);
  DATA[s]['frio.nh3'][DATA[s]['frio.nh3'].length-1] = max;
});

/* ---------------------------------------------------------
   4. Consultas sobre la ronda activa
   --------------------------------------------------------- */
const win   = k => DATA[ronda][k];
const winT  = () => HORAS[ronda];
const cur   = k => { const a = DATA[ronda][k]; return a[a.length-1]; };
const previa = k => { if(ronda === 0) return null; const a = DATA[ronda-1][k]; return a[a.length-1]; };

function fmt(k, x){
  const v = V[k], n = (x == null) ? cur(k) : x;
  return n.toLocaleString('es-VE',{minimumFractionDigits:v.dec, maximumFractionDigits:v.dec});
}
function estado(k, x){
  const v = V[k], n = (x == null) ? cur(k) : x;
  if(v.dir === 'high') return n >= v.crit ? 'crit' : n >= v.warn ? 'warn' : 'ok';
  if(v.dir === 'low')  return n <= v.crit ? 'crit' : n <= v.warn ? 'warn' : 'ok';
  if(n >= v.lo && n <= v.hi) return 'ok';
  if(n >= v.lo - v.m && n <= v.hi + v.m) return 'warn';
  return 'crit';
}
const ETIQ = {ok:'Normal', warn:'Atención', crit:'Crítico'};
function rangoTexto(k){
  const v = V[k];
  if(v.dir === 'high') return 'Alarma sobre ' + fmt(k, v.crit) + (v.u ? ' '+v.u : '');
  if(v.dir === 'low')  return 'Alarma bajo ' + fmt(k, v.crit) + (v.u ? ' '+v.u : '');
  return 'Rango ' + fmt(k, v.lo) + ' – ' + fmt(k, v.hi) + (v.u ? ' '+v.u : '');
}

/* ---------------------------------------------------------
   5. Gráficas en SVG
   --------------------------------------------------------- */
const REG = [];
const reg = (tab, sel, cfg) => REG.push({tab, sel, cfg});

function scale(min,max,px0,px1){ const d = (max-min) || 1; return x => px1 - (x-min)/d*(px1-px0); }
function nice(min,max){
  const span = (max-min) || 1, step = Math.pow(10, Math.floor(Math.log10(span/4)));
  const mult = [1,2,2.5,5,10].find(m => span/4 <= step*m) || 10, s = step*mult;
  return {lo: Math.floor(min/s)*s, hi: Math.ceil(max/s)*s, s};
}
const path = pts => pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function renderLine(host, cfg){
  const W = Math.max(240, host.clientWidth), H = cfg.h || 210;
  const pad = {t:12, r:12, b:24, l:46};
  const data = cfg.series.map(s => s.get());
  const labels = winT();
  const n = data[0].length;
  let lo = cfg.min != null ? cfg.min : Math.min(...data.flat());
  let hi = cfg.max != null ? cfg.max : Math.max(...data.flat());
  if(cfg.min == null && cfg.max == null){
    const p = (hi-lo)*.18 || Math.abs(hi)*.08 || 1; lo -= p; hi += p;
  }
  const nb = nice(lo,hi); lo = nb.lo; hi = nb.hi;
  const y = scale(lo, hi, pad.t, H-pad.b);
  const x = i => pad.l + (n < 2 ? 0 : i*(W-pad.l-pad.r)/(n-1));

  let g = '';
  for(let t=lo; t<=hi+1e-9; t+=nb.s){
    const py = y(t).toFixed(1);
    g += `<line x1="${pad.l}" y1="${py}" x2="${W-pad.r}" y2="${py}" stroke="${C.line}" stroke-width="1"/>`;
    g += `<text x="${pad.l-8}" y="${+py+3.5}" text-anchor="end" font-size="10.5" fill="${C.ink3}">${(+t.toFixed(6)).toLocaleString('es-VE',{maximumFractionDigits:cfg.dec != null ? cfg.dec : 1})}</text>`;
  }
  (cfg.bands||[]).forEach(b=>{
    const y1 = y(Math.min(b.hi,hi)), y2 = y(Math.max(b.lo,lo));
    g += `<rect x="${pad.l}" y="${y1}" width="${W-pad.l-pad.r}" height="${Math.max(0,y2-y1)}" fill="${b.color}" opacity=".07"/>`;
  });
  (cfg.limits||[]).forEach(l=>{
    if(l.v < lo || l.v > hi) return;
    g += `<line x1="${pad.l}" y1="${y(l.v)}" x2="${W-pad.r}" y2="${y(l.v)}" stroke="${l.color}" stroke-width="1" stroke-dasharray="4 4" opacity=".8"/>`;
    g += `<text x="${W-pad.r}" y="${y(l.v)-5}" text-anchor="end" font-size="10.5" fill="${l.color}">${esc(l.txt)}</text>`;
  });

  const step = Math.max(1, Math.round(n/5));
  for(let i=0;i<n;i+=step){
    g += `<text x="${x(i)}" y="${H-7}" text-anchor="middle" font-size="10.5" fill="${C.ink3}">${labels[i]||''}</text>`;
  }

  data.forEach((d,si)=>{
    const s = cfg.series[si], pts = d.map((v,i)=>[x(i), y(v)]);
    if(s.area){
      const uid = 'gr' + Math.random().toString(36).slice(2,8);
      g = `<defs><linearGradient id="${uid}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${s.color}" stop-opacity=".22"/>
        <stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>` + g;
      g += `<path d="${path(pts)} L ${x(n-1)} ${H-pad.b} L ${x(0)} ${H-pad.b} Z" fill="url(#${uid})"/>`;
    }
    g += `<path d="${path(pts)}" fill="none" stroke="${s.color}" stroke-width="${s.w||1.9}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
    const last = pts[pts.length-1];
    g += `<circle cx="${last[0]}" cy="${last[1]}" r="3.4" fill="${s.color}"/>`;
  });

  host.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.aria||'gráfica')}">
       ${g}
       <line class="cross" x1="0" y1="${pad.t}" x2="0" y2="${H-pad.b}" stroke="${C.ink3}" stroke-width="1" opacity="0"/>
     </svg><div class="tip"></div>`;

  const svg = host.querySelector('svg'), tip = host.querySelector('.tip'), cross = host.querySelector('.cross');
  function move(ev){
    const r = svg.getBoundingClientRect();
    const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
    const rel = (px/r.width*W - pad.l) / ((W-pad.l-pad.r) || 1);
    const i = Math.max(0, Math.min(n-1, Math.round(rel*(n-1))));
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity','.35');
    tip.innerHTML = `<div class="t">${labels[i]||''}</div>` + cfg.series.map((s,si)=>
      `<div class="r"><span><i style="background:${s.color}"></i>${esc(s.name)}</span><b>${data[si][i].toLocaleString('es-VE',{maximumFractionDigits:cfg.dec != null ? cfg.dec : 2})}${cfg.unit ? ' '+cfg.unit : ''}</b></div>`).join('');
    tip.style.opacity = 1;
    const left = Math.max(4, Math.min(host.clientWidth - tip.offsetWidth - 4, x(i)/W*r.width - tip.offsetWidth/2));
    tip.style.left = left + 'px'; tip.style.top = '4px';
  }
  svg.addEventListener('mousemove', move);
  svg.addEventListener('touchmove', move, {passive:true});
  svg.addEventListener('mouseleave', ()=>{ tip.style.opacity = 0; cross.setAttribute('opacity','0'); });
}

function renderBar(host, cfg){
  const W = Math.max(240, host.clientWidth), H = cfg.h || 220;
  const pad = {t:10, r:10, b:34, l:44};
  const series = cfg.series.map(s => ({name:s.name, color:s.color, vals: Array.isArray(s.vals[0]) ? s.vals[ronda] : s.vals}));
  const groups = cfg.groups;
  const hi = nice(0, Math.max(...series.flatMap(s=>s.vals))).hi;
  const y = scale(0, hi, pad.t, H-pad.b);
  const gw = (W-pad.l-pad.r)/groups.length, bw = Math.min(26, (gw-14)/series.length);
  let g = '';
  const st = nice(0,hi).s;
  for(let t=0; t<=hi+1e-9; t+=st){
    g += `<line x1="${pad.l}" y1="${y(t)}" x2="${W-pad.r}" y2="${y(t)}" stroke="${C.line}"/>`;
    g += `<text x="${pad.l-8}" y="${y(t)+3.5}" text-anchor="end" font-size="10.5" fill="${C.ink3}">${(+t.toFixed(4)).toLocaleString('es-VE')}</text>`;
  }
  groups.forEach((gr,gi)=>{
    const cx = pad.l + gw*gi + gw/2, tot = bw*series.length + 3*(series.length-1);
    series.forEach((s,si)=>{
      const bx = cx - tot/2 + si*(bw+3), v = s.vals[gi], by = y(v);
      g += `<rect x="${bx}" y="${by}" width="${bw}" height="${Math.max(1, H-pad.b-by)}" rx="2.5" fill="${s.color}" opacity=".92"><title>${esc(s.name)}: ${v}</title></rect>`;
    });
    const nm = gr.length > 13 ? gr.slice(0,12)+'…' : gr;
    g += `<text x="${cx}" y="${H-12}" text-anchor="middle" font-size="11" fill="${C.ink3}">${esc(nm)}</text>`;
  });
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.aria||'barras')}">${g}</svg>`;
}

function renderGauge(host, cfg){
  const W = Math.max(200, host.clientWidth), H = cfg.h || 168;
  const cx = W/2, cy = H-30, r = Math.min(W/2-18, H-52);
  const v = cfg.get(), t = Math.max(0, Math.min(1, (v-cfg.min)/(cfg.max-cfg.min)));
  const st = cfg.st ? cfg.st() : 'ok';
  const col = st === 'crit' ? C.crit : st === 'warn' ? C.warn : (cfg.color || C.ok);
  const pol = (rr,tt)=>{ const a = (180+180*tt)*Math.PI/180; return [cx+rr*Math.cos(a), cy+rr*Math.sin(a)]; };
  const arc = (rr,t0,t1,w,c)=>{
    const p0 = pol(rr,t0), p1 = pol(rr,t1);
    /* El medidor abarca 180°, así que el arco nunca es el largo: large-arc-flag = 0 */
    return `<path d="M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${rr} ${rr} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}"
      fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  };
  host.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.label)}">
      ${arc(r,0,1,12,C.line)}
      ${t > 0.004 ? arc(r,0,t,12,col) : ''}
      <text x="${cx}" y="${cy-8}" text-anchor="middle" font-size="27" font-weight="600" fill="${C.ink}" style="font-variant-numeric:tabular-nums">${v.toLocaleString('es-VE',{maximumFractionDigits:cfg.dec != null ? cfg.dec : 0})}<tspan font-size="13" fill="#5C6873" font-weight="500"> ${esc(cfg.unit||'')}</tspan></text>
      <text x="${cx}" y="${cy+15}" text-anchor="middle" font-size="12" fill="${C.ink3}">${esc(cfg.label)}</text>
      <text x="${cx-r}" y="${cy+15}" text-anchor="middle" font-size="10.5" fill="${C.ink3}">${cfg.min}</text>
      <text x="${cx+r}" y="${cy+15}" text-anchor="middle" font-size="10.5" fill="${C.ink3}">${cfg.max}</text>
    </svg>`;
}

function sparkline(k, color){
  const d = win(k), W = 190, H = 34;
  const lo = Math.min(...d), hi = Math.max(...d);
  const y = scale(lo, hi + (hi-lo)*.15 || lo+1, 4, H-3);
  const pts = d.map((v,i)=>[i*W/(d.length-1), y(v)]);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" width="100%" height="${H}" aria-hidden="true">
    <path d="${path(pts)} L ${W} ${H} L 0 ${H} Z" fill="${color}" opacity=".08"/>
    <path d="${path(pts)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

function draw(sel, cfg){
  const host = document.querySelector(sel);
  if(!host || !host.clientWidth) return;
  if(cfg.type === 'bar') renderBar(host, cfg);
  else if(cfg.type === 'gauge') renderGauge(host, cfg);
  else renderLine(host, cfg);
}

/* ---------------------------------------------------------
   6. Gráficas de cada pestaña
   --------------------------------------------------------- */
const L = (k, name, color, extra) => Object.assign({name, color, get:()=>win(k)}, extra||{});

/* Resumen */
reg('resumen','#c-demanda',{h:236, unit:'%', dec:0, min:0, max:100, aria:'Demanda de servicios',
  series:[
    {name:'Agua suave', color:C.agua,  get:()=>win('ptab.caudal').map(v=>v/60*100)},
    {name:'Vapor',      color:C.vapor, get:()=>win('vapor.gen').map(v=>v/6000*100)},
    {name:'Aire',       color:C.aire,  get:()=>win('aire.caudal').map(v=>v/44*100)},
    {name:'Frío',       color:C.nh3,   get:()=>win('frio.carga').map(v=>v/440*100)},
  ]});
const CONSUMO_LINEA = {
  grupos:['Mayonesa','Rikesa','Salsa de tomate','CIP y servicios'],
  series:[
    {name:'Agua suave (m³/h)', color:C.agua,  vals:[[5.1,3.6,7.0,3.2],[9.8,7.2,12.4,11.1],[11.2,8.4,13.9,14.6]]},
    {name:'Vapor (100 kg/h)',  color:C.vapor, vals:[[6.4,4.1,8.2,2.0],[11.2,8.6,14.9,6.8],[12.6,9.8,16.4,9.4]]},
    {name:'Aire (Nm³/min)',    color:C.aire,  vals:[[4.6,3.2,5.8,2.1],[8.1,6.4,10.2,7.6],[9.0,7.1,11.0,8.4]]},
    {name:'Frío (10 TR)',      color:C.nh3,   vals:[[6.2,8.4,3.1,1.0],[9.4,12.1,5.2,2.4],[10.8,13.6,6.1,2.9]]},
  ]};
reg('resumen','#c-lineas',{type:'bar', h:236, groups:CONSUMO_LINEA.grupos, series:CONSUMO_LINEA.series, aria:'Consumo por línea'});

/* PTAB */
reg('ptab','#c-ptab-dureza',{h:210, unit:'ppm', dec:1, min:0, max:20, aria:'Dureza',
  series:[L('ptab.dureza','Dureza', C.agua, {area:true})],
  limits:[{v:17, color:C.crit, txt:'límite 17 ppm'},{v:14, color:C.warn, txt:'aviso 14 ppm'}]});
reg('ptab','#c-ptab-caudal',{h:210, unit:'m³/h', dec:1, aria:'Caudal',
  series:[L('ptab.caudal','Caudal', C.agua, {area:true})]});
reg('ptab','#g-ptab-nivel',{type:'gauge', min:0, max:100, unit:'%', label:'Nivel de cisterna', color:C.agua,
  get:()=>cur('ptab.nivel'), st:()=>estado('ptab.nivel')});
reg('ptab','#g-ptab-sal',{type:'gauge', min:0, max:100, unit:'%', label:'Sal en tanque de salmuera', color:C.agua,
  get:()=>[86, 58, 41][ronda], st:()=>'ok'});
reg('ptab','#c-ptab-dia',{type:'bar', h:168, groups:['Lu','Ma','Mi','Ju','Vi','Sá','Do'],
  series:[{name:'Agua tratada', color:C.agua, vals:[812, 903, 878, 941, 966, 640, 288]}], aria:'Consumo diario'});

/* Vapor */
reg('vapor','#c-vapor-presion',{h:210, unit:'bar', dec:2, min:6, max:11, aria:'Presión de caldera',
  series:[L('vapor.presion','Presión', C.vapor)], bands:[{lo:7.5, hi:9.5, color:C.ok}]});
reg('vapor','#c-vapor-gen',{h:210, unit:'kg/h', dec:0, aria:'Generación de vapor',
  series:[L('vapor.gen','Vapor generado', C.vapor, {area:true})]});
reg('vapor','#c-vapor-efi',{h:210, unit:'%', dec:1, min:40, max:100, aria:'Eficiencia y condensado',
  series:[L('vapor.efi','Eficiencia de caldera', C.vapor), L('vapor.cond','Retorno de condensado', C.ink, {dash:true})]});
reg('vapor','#c-vapor-area',{type:'bar', h:210, groups:['Mayonesa','Rikesa','Salsa','CIP','Esterilización'],
  series:[{name:'Vapor', color:C.vapor, vals:[[640,410,820,200,180],[1120,860,1490,680,410],[1260,980,1640,940,470]]}],
  aria:'Vapor por área'});

/* Aire */
reg('aire','#c-aire-presion',{h:210, unit:'bar', dec:2, min:5, max:8, aria:'Presión de red',
  series:[L('aire.presion','Presión', C.aire)], limits:[{v:6.2, color:C.warn, txt:'mínimo 6.2 bar'}]});
reg('aire','#c-aire-caudal',{h:210, unit:'Nm³/min', dec:1, aria:'Caudal de aire',
  series:[L('aire.caudal','Caudal', C.aire, {area:true})]});
reg('aire','#g-aire-carga',{type:'gauge', min:0, max:100, unit:'%', label:'Carga total', color:C.aire,
  get:()=>cur('aire.carga'), st:()=>estado('aire.carga')});
reg('aire','#g-aire-fugas',{type:'gauge', min:0, max:40, unit:'%', dec:1, label:'Del caudal generado', color:C.aire,
  get:()=>cur('aire.fugas'), st:()=>estado('aire.fugas')});
reg('aire','#c-aire-kw',{type:'bar', h:168, groups:['CA-1','CA-2','CA-3','Secador'],
  series:[{name:'Potencia', color:C.aire, vals:[[104,0,0,16],[112,88,0,18],[118,96,0,19]]}], aria:'Potencia por compresor'});

/* Refrigeración */
reg('frio','#c-frio-temp',{h:210, unit:'°C', dec:2, aria:'Temperatura de agua helada',
  series:[L('frio.tsum','Suministro', C.nh3), L('frio.tret','Retorno', C.ink, {dash:true})]});
reg('frio','#c-frio-pres',{h:210, unit:'bar', dec:2, min:0, max:16, aria:'Presiones',
  series:[L('frio.pdes','Descarga (alta)', C.crit), L('frio.psuc','Succión (baja)', C.aire)],
  limits:[{v:14.5, color:C.crit, txt:'corte 14.5 bar'}]});
reg('frio','#g-frio-carga',{type:'gauge', min:0, max:480, unit:'TR', label:'Carga térmica', color:C.nh3,
  get:()=>cur('frio.carga'), st:()=>estado('frio.carga')});
reg('frio','#g-frio-nivel',{type:'gauge', min:0, max:100, unit:'%', label:'Recibidor de alta presión', color:C.nh3,
  get:()=>cur('frio.nivel'), st:()=>estado('frio.nivel')});
reg('frio','#c-frio-area',{type:'bar', h:168, groups:['Cámaras','Túnel mayonesa','Agua helada','Proceso Rikesa'],
  series:[{name:'Demanda', color:C.nh3, vals:[[78,52,61,34],[96,74,88,52],[104,86,97,61]]}], aria:'Demanda de frío'});


/* ---------------------------------------------------------
   7. PTAR · control real desde Reporte_Control_PTAR_01-09_al_09-09-2026.xlsx
   Procesos: Pre-Tratamiento, T. Primario, Tratamiento Biológico y Lodos
   Turnos: 07:00 y 19:00
   --------------------------------------------------------- */
const PTAR_TURNOS = ['07:00','19:00'];
const PTAR_PROCESOS_DEFAULT = [{"nombre":"Pre-Tratamiento","puestos":[{"nombre":"FOSA DE ENTRADA","variables":[{"id":"pre_fosa_ph","proceso":"Pre-Tratamiento","puesto":"FOSA DE ENTRADA","variable":"pH entrada","rango":"4,0 - 12,0","unidad":"","tipo":"band","min":4.0,"max":12.0},{"id":"pre_fosa_sst","proceso":"Pre-Tratamiento","puesto":"FOSA DE ENTRADA","variable":"SST (mg/L)","rango":"< 4500","unidad":"mg/L","tipo":"max","min":null,"max":4500.0}]},{"nombre":"TQs HOMOGENEIZACIÓN","variables":[{"id":"pre_hom_nivel","proceso":"Pre-Tratamiento","puesto":"TQs HOMOGENEIZACIÓN","variable":"Nivel del tanque (%)","rango":"20% - 80%","unidad":"%","tipo":"band","min":20.0,"max":80.0},{"id":"pre_hom_ph","proceso":"Pre-Tratamiento","puesto":"TQs HOMOGENEIZACIÓN","variable":"pH","rango":"6,0 - 8,0","unidad":"","tipo":"band","min":6.0,"max":8.0},{"id":"pre_hom_caudal","proceso":"Pre-Tratamiento","puesto":"TQs HOMOGENEIZACIÓN","variable":"Caudal de salida (L/s)","rango":"5 - 17","unidad":"L/s","tipo":"band","min":5.0,"max":17.0},{"id":"pre_hom_dqo","proceso":"Pre-Tratamiento","puesto":"TQs HOMOGENEIZACIÓN","variable":"DQO (mg/L)","rango":"< 16000","unidad":"mg/L","tipo":"max","min":null,"max":16000.0},{"id":"pre_hom_sst","proceso":"Pre-Tratamiento","puesto":"TQs HOMOGENEIZACIÓN","variable":"SST (mg/L)","rango":"< 1700","unidad":"mg/L","tipo":"max","min":null,"max":1700.0},{"id":"pre_hom_nt","proceso":"Pre-Tratamiento","puesto":"TQs HOMOGENEIZACIÓN","variable":"Nitrógeno Total (mg/L)","rango":"< 85","unidad":"mg/L","tipo":"max","min":null,"max":85.0},{"id":"pre_hom_pt","proceso":"Pre-Tratamiento","puesto":"TQs HOMOGENEIZACIÓN","variable":"Fósforo Total (mg/L)","rango":"< 25","unidad":"mg/L","tipo":"max","min":null,"max":25.0}]}]},{"nombre":"T. Primario","puestos":[{"nombre":"SALIDA DAF PRIMARIO","variables":[{"id":"prim_ph","proceso":"T. Primario","puesto":"SALIDA DAF PRIMARIO","variable":"pH","rango":"6,0 - 8,0","unidad":"","tipo":"band","min":6.0,"max":8.0},{"id":"prim_dqo","proceso":"T. Primario","puesto":"SALIDA DAF PRIMARIO","variable":"DQO (mg/L)","rango":"< 1200","unidad":"mg/L","tipo":"max","min":null,"max":1200.0},{"id":"prim_sst","proceso":"T. Primario","puesto":"SALIDA DAF PRIMARIO","variable":"SST (mg/L)","rango":"< 1000","unidad":"mg/L","tipo":"max","min":null,"max":1000.0},{"id":"prim_nt","proceso":"T. Primario","puesto":"SALIDA DAF PRIMARIO","variable":"Nitrógeno Total (mg/L)","rango":"< 60","unidad":"mg/L","tipo":"max","min":null,"max":60.0},{"id":"prim_pt","proceso":"T. Primario","puesto":"SALIDA DAF PRIMARIO","variable":"Fósforo Total (mg/L)","rango":"< 25","unidad":"mg/L","tipo":"max","min":null,"max":25.0}]}]},{"nombre":"Tratamiento Biológico","puestos":[{"nombre":"REACTOR BIOLÓGICO","variables":[{"id":"bio_reactor_ph","proceso":"Tratamiento Biológico","puesto":"REACTOR BIOLÓGICO","variable":"pH","rango":"6,5 - 7,5","unidad":"","tipo":"band","min":6.5,"max":7.5},{"id":"bio_reactor_od","proceso":"Tratamiento Biológico","puesto":"REACTOR BIOLÓGICO","variable":"Oxígeno disuelto (mg/L)","rango":"0,5 - 2","unidad":"mg/L","tipo":"band","min":0.5,"max":2.0},{"id":"bio_reactor_sv30","proceso":"Tratamiento Biológico","puesto":"REACTOR BIOLÓGICO","variable":"SV'30 (mL/L)","rango":"400 - 850","unidad":"mL/L","tipo":"band","min":400.0,"max":850.0},{"id":"bio_reactor_ssvlm","proceso":"Tratamiento Biológico","puesto":"REACTOR BIOLÓGICO","variable":"SSVLM (mg/L)","rango":"1.000 - 2.500","unidad":"mg/L","tipo":"band","min":1000.0,"max":2500.0}]},{"nombre":"DAF SECUNDARIO","variables":[{"id":"bio_daf_ph","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"pH","rango":"6,0 - 9,0","unidad":"","tipo":"band","min":6.0,"max":9.0},{"id":"bio_daf_caudal","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"Caudal de salida (L/s)","rango":"5 - 17","unidad":"L/s","tipo":"band","min":5.0,"max":17.0},{"id":"bio_daf_recir","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"Caudal recirculación (L/s)","rango":"10 - 30","unidad":"L/s","tipo":"band","min":10.0,"max":30.0},{"id":"bio_daf_dqo","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"DQO (mg/L)","rango":"< 350","unidad":"mg/L","tipo":"max","min":null,"max":350.0},{"id":"bio_daf_sst","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"SST (mg/L)","rango":"< 80","unidad":"mg/L","tipo":"max","min":null,"max":80.0},{"id":"bio_daf_sed","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"S. Sedimentables (mg/L)","rango":"< 1","unidad":"mg/L","tipo":"max","min":null,"max":1.0},{"id":"bio_daf_nt","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"Nitrógeno total (mg/L)","rango":"< 10","unidad":"mg/L","tipo":"max","min":null,"max":10.0},{"id":"bio_daf_pt","proceso":"Tratamiento Biológico","puesto":"DAF SECUNDARIO","variable":"Fósforo Total (mg/L)","rango":"< 1","unidad":"mg/L","tipo":"max","min":null,"max":1.0}]}]},{"nombre":"Lodos","puestos":[{"nombre":"TQ LODO","variables":[{"id":"lodo_conc","proceso":"Lodos","puesto":"TQ LODO","variable":"Conc. Lodo graso (mg/L)","rango":"—","unidad":"mg/L","tipo":"none","min":null,"max":null},{"id":"lodo_parshall","proceso":"Lodos","puesto":"TQ LODO","variable":"FT-Canal Parshall (L/m)","rango":"—","unidad":"L/m","tipo":"none","min":null,"max":null}]},{"nombre":"LECTURAS","variables":[{"id":"lodo_hom","proceso":"Lodos","puesto":"LECTURAS","variable":"Homogenizador","rango":"—","unidad":"","tipo":"none","min":null,"max":null},{"id":"lodo_daf2","proceso":"Lodos","puesto":"LECTURAS","variable":"DAF#2","rango":"—","unidad":"","tipo":"none","min":null,"max":null}]}]}];
let PTAR_PROCESOS = Array.isArray(window.PTAR_FALLBACK_PROCESOS) ? window.PTAR_FALLBACK_PROCESOS : PTAR_PROCESOS_DEFAULT;
let PTAR_DATA = [];
let PTAR_FECHAS = Array.isArray(window.PTAR_FALLBACK_FECHAS) ? [...window.PTAR_FALLBACK_FECHAS] : [];
let PTAR_FECHA = null;
let PTAR_FUENTE = 'Reporte_Control_PTAR_01-09_al_09-09-2026.xlsx';
const PTAR_GRAFICA_VAR = {};
const PTAR_HISTORICO_SEL = {}; // '__all__' o id de una variable por proceso

const ptarVariables = p => p ? (p.puestos || []).flatMap(x => x.variables || []) : [];
const tieneLecturaPTAR = v => {
  if(v === null || v === undefined) return false;
  const s=String(v).trim();
  return !!s && !/^[-–—]+$/.test(s);
};
function ptarNumeroLocal(s){
  if(typeof s === 'number') return Number.isFinite(s) ? s : null;
  let t=String(s ?? '').trim().replace(/\s/g,'');
  if(!t || /^[-–—]+$/.test(t)) return null;
  if(t.includes(',') && t.includes('.')) t=t.replace(/\./g,'').replace(',','.');
  else if(t.includes(',')) t=t.replace(',','.');
  else if(t.includes('.')){
    const a=t.split('.');
    if(a.length===2 && a[1].length===3 && a[0] !== '0' && a[0] !== '-0') t=a.join('');
  }
  const n=Number(t);
  return Number.isFinite(n) ? n : null;
}
function ptarParseRange(rango){
  let s=String(rango ?? '').trim()
    .replace(/˂/g,'<').replace(/≤/g,'<=').replace(/≥/g,'>=')
    .replace(/[−–—]/g,'-');
  if(!s || s==='-' || s==='--') return {tipo:'none',min:null,max:null};
  const raw=s.match(/[-+]?\d[\d.,]*/g) || [];
  const nums=raw.map(ptarNumeroLocal).filter(v=>v!==null);
  if(s.includes('<=') || /(^|[^>])</.test(s)) return {tipo:'max',min:null,max:nums[0] ?? null};
  if(s.includes('>=') || s.includes('>')) return {tipo:'min',min:nums[0] ?? null,max:null};
  if(nums.length>=2 && s.includes('-')) return {tipo:'band',min:nums[0],max:nums[1]};
  return {tipo:'none',min:null,max:null};
}
function fechaISODesdeExcel(serial){
  const d=new Date(Date.UTC(1899,11,30) + Number(serial)*86400000);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0,10) : null;
}
function normalizarFechaPTAR(v){
  if(v == null || v === '') return null;
  if(typeof v === 'number' && Number.isFinite(v)) return fechaISODesdeExcel(v);
  const s = String(v).trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m){
    let y=Number(m[3]); if(y<100) y+=2000;
    return `${String(y).padStart(4,'0')}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
  }
  return null;
}
function etiquetaFechaPTAR(iso, larga=false){
  if(!iso) return 'Sin fecha';
  const [y,m,d]=iso.split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d));
  return dt.toLocaleDateString('es-VE',larga
    ? {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}
    : {day:'2-digit',month:'2-digit',timeZone:'UTC'});
}
function ptarClave(s){
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
}
function ptarTodasVariables(){
  return PTAR_PROCESOS.flatMap(p=>ptarVariables(p));
}
function ptarDefPorId(id){
  return ptarTodasVariables().find(v=>v.id===id) || null;
}
function ptarDefPorCampos(proceso,puesto,variable){
  const kp=ptarClave(proceso), kpu=ptarClave(puesto), kv=ptarClave(variable);
  return ptarTodasVariables().find(v=>ptarClave(v.proceso)===kp && ptarClave(v.puesto)===kpu && ptarClave(v.variable)===kv) || null;
}
function estadoValorPTAR(v,valor){
  if(!tieneLecturaPTAR(valor)) return 'SIN DATO';
  if(!v || v.tipo==='none') return 'INFORMATIVO';
  const n=ptarNumeroLocal(valor);
  if(n===null) return 'SIN DATO';
  if(v.min!=null && n < Number(v.min)) return 'FUERA DE RANGO';
  if(v.max!=null && n > Number(v.max)) return 'FUERA DE RANGO';
  return 'NORMAL';
}
function estadoRegistroPTAR(r){
  if(!r) return 'SIN DATO';
  return estadoValorPTAR(ptarDefPorId(r.id),r.valor);
}
function claseEstadoPTAR(st){
  if(st==='FUERA DE RANGO') return 'bad';
  if(st==='NORMAL') return 'ok';
  if(st==='INFORMATIVO') return 'info';
  return 'empty';
}
function ptarNumeroTexto(n){
  if(n == null || n === '' || !Number.isFinite(Number(n))) return '—';
  const x=Number(n);
  const dec=Math.abs(x)<10 && Math.abs(x-Math.round(x))>1e-9 ? 2 : (Math.abs(x-Math.round(x))>1e-9 ? 1 : 0);
  return x.toLocaleString('es-VE',{minimumFractionDigits:0,maximumFractionDigits:dec});
}
function valorTextoPTAR(r){
  if(!r || !tieneLecturaPTAR(r.valor)) return '—';
  const n=ptarNumeroLocal(r.valor);
  return n===null ? esc(String(r.valor)) : ptarNumeroTexto(n);
}
function registrosFechaPTAR(fecha=PTAR_FECHA, proceso=null){
  return PTAR_DATA.filter(r=>r.fecha===fecha && (!proceso || r.proceso===proceso));
}
function registroPTAR(variableId,turno,fecha=PTAR_FECHA){
  return PTAR_DATA.find(r=>r.fecha===fecha && r.turno===turno && r.id===variableId) || null;
}
function operadoresFechaPTAR(fecha=PTAR_FECHA){
  const out={};
  PTAR_TURNOS.forEach(t=>{
    const r=PTAR_DATA.find(x=>x.fecha===fecha && x.turno===t && x.operador && tieneLecturaPTAR(x.valor));
    out[t]=r ? r.operador : '';
  });
  return out;
}
function ptarStats(proceso=null, fecha=PTAR_FECHA){
  const p=proceso ? (typeof proceso==='string' ? PTAR_PROCESOS.find(x=>x.nombre===proceso) : proceso) : null;
  const vars=p ? ptarVariables(p) : PTAR_PROCESOS.flatMap(ptarVariables);
  const rows=registrosFechaPTAR(fecha,p ? p.nombre : null);
  const registradas=rows.filter(r=>tieneLecturaPTAR(r.valor));
  const controladas=registradas.filter(r=>{
    const v=ptarDefPorId(r.id);
    return v && v.tipo!=='none' && ptarNumeroLocal(r.valor)!==null;
  });
  const desviaciones=controladas.filter(r=>estadoRegistroPTAR(r)==='FUERA DE RANGO').length;
  const normales=controladas.filter(r=>estadoRegistroPTAR(r)==='NORMAL').length;
  return {
    variables:vars.length,
    registradas:registradas.length,
    controladas:controladas.length,
    desviaciones,
    normales,
    pctNormal:controladas.length ? normales/controladas.length*100 : 0
  };
}
function ptarEstado(st){
  if(!st || !st.registradas) return {st:'idle',txt:'Sin registros'};
  if(st.desviaciones) return {st:'crit',txt:`${st.desviaciones} fuera de rango`};
  if(st.controladas) return {st:'ok',txt:'Normal'};
  return {st:'idle',txt:'Informativo'};
}
function ptarVariablesGraficables(proceso){
  return ptarVariables(proceso);
}
function ptarVariableGrafica(proceso){
  const vars=ptarVariablesGraficables(proceso);
  if(!vars.length) return null;
  const id=PTAR_GRAFICA_VAR[proceso.nombre];
  if(id){ const f=vars.find(v=>v.id===id); if(f) return f; }
  const conDatoControl=vars.find(v=>v.tipo!=='none' && PTAR_TURNOS.some(t=>{
    const r=registroPTAR(v.id,t,PTAR_FECHA); return r && ptarNumeroLocal(r.valor)!==null;
  }));
  const conDato=vars.find(v=>PTAR_TURNOS.some(t=>{
    const r=registroPTAR(v.id,t,PTAR_FECHA); return r && ptarNumeroLocal(r.valor)!==null;
  }));
  const candidata=conDatoControl || conDato || vars.find(v=>v.tipo!=='none') || vars[0];
  PTAR_GRAFICA_VAR[proceso.nombre]=candidata.id;
  return candidata;
}
function ptarLimitesGrafica(v,valores){
  let nums=(valores||[]).map(ptarNumeroLocal).filter(x=>x!==null);
  if(v && v.min!=null) nums.push(Number(v.min));
  if(v && v.max!=null) nums.push(Number(v.max));
  if(!nums.length) return {lo:0,hi:1};
  let lo=Math.min(...nums), hi=Math.max(...nums);
  if(v && v.tipo==='max' && lo>=0) lo=0;
  if(lo===hi){ const p=Math.abs(lo)*.15 || 1; lo-=p; hi+=p; }
  else { const p=(hi-lo)*.12; lo-=p; hi+=p; }
  if(lo>=0) lo=Math.max(0,lo);
  return {lo,hi};
}
function ptarEjes(v,valores,W=640,H=235){
  const pad={t:18,r:18,b:38,l:62};
  const lim=ptarLimitesGrafica(v,valores), span=lim.hi-lim.lo || 1;
  const y=n=>pad.t+(lim.hi-Number(n))/span*(H-pad.t-pad.b);
  let svg='';
  for(let i=0;i<=4;i++){
    const val=lim.lo+span*i/4, yy=y(val);
    svg+=`<line x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${W-pad.r}" y2="${yy.toFixed(1)}" stroke="${C.line}" stroke-width="1"/>`;
    svg+=`<text x="${pad.l-8}" y="${(yy+3.5).toFixed(1)}" text-anchor="end" font-size="10.2" fill="${C.ink3}">${esc(ptarNumeroTexto(val))}</text>`;
  }
  if(v && v.tipo==='band' && v.min!=null && v.max!=null){
    const ya=y(v.max), yb=y(v.min);
    svg+=`<rect x="${pad.l}" y="${Math.min(ya,yb).toFixed(1)}" width="${W-pad.l-pad.r}" height="${Math.abs(yb-ya).toFixed(1)}" fill="${C.ptar}" opacity=".08"/>`;
    svg+=`<line x1="${pad.l}" y1="${ya.toFixed(1)}" x2="${W-pad.r}" y2="${ya.toFixed(1)}" stroke="${C.ptar}" stroke-width="1" stroke-dasharray="4 4" opacity=".7"/>`;
    svg+=`<line x1="${pad.l}" y1="${yb.toFixed(1)}" x2="${W-pad.r}" y2="${yb.toFixed(1)}" stroke="${C.ptar}" stroke-width="1" stroke-dasharray="4 4" opacity=".7"/>`;
  } else if(v && v.tipo==='max' && v.max!=null){
    const yy=y(v.max);
    svg+=`<line x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${W-pad.r}" y2="${yy.toFixed(1)}" stroke="${C.crit}" stroke-width="1.2" stroke-dasharray="5 4"/>`;
    svg+=`<text x="${W-pad.r-3}" y="${(yy-5).toFixed(1)}" text-anchor="end" font-size="10" fill="${C.crit}">máx. ${esc(ptarNumeroTexto(v.max))}</text>`;
  } else if(v && v.tipo==='min' && v.min!=null){
    const yy=y(v.min);
    svg+=`<line x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${W-pad.r}" y2="${yy.toFixed(1)}" stroke="${C.crit}" stroke-width="1.2" stroke-dasharray="5 4"/>`;
    svg+=`<text x="${W-pad.r-3}" y="${(yy-5).toFixed(1)}" text-anchor="end" font-size="10" fill="${C.crit}">mín. ${esc(ptarNumeroTexto(v.min))}</text>`;
  }
  return {svg,y,pad,lo:lim.lo,hi:lim.hi,W,H};
}
function renderPTARDia(host,proceso,v){
  if(!host || !v) return;
  const regs=PTAR_TURNOS.map(t=>registroPTAR(v.id,t,PTAR_FECHA));
  const vals=regs.map(r=>r ? ptarNumeroLocal(r.valor) : null).filter(x=>x!==null);
  if(!vals.length){
    host.innerHTML=`<div class="ptar-chart-empty">Sin lecturas de ${esc(v.variable)} para ${etiquetaFechaPTAR(PTAR_FECHA,true)}.</div>`;
    return;
  }
  const ax=ptarEjes(v,vals), {W,H,pad,y}=ax;
  const xs=[pad.l+90,W-pad.r-90];
  let g=ax.svg, pts=[];
  regs.forEach((r,i)=>{
    const x=xs[i];
    g+=`<text x="${x}" y="${H-10}" text-anchor="middle" font-size="10.5" fill="${C.ink3}">${PTAR_TURNOS[i]}</text>`;
    const val=r ? ptarNumeroLocal(r.valor) : null;
    if(val===null) return;
    const yy=y(val), st=estadoRegistroPTAR(r), color=st==='FUERA DE RANGO'?C.crit:C.ptar;
    pts.push([x,yy]);
    g+=`<circle cx="${x}" cy="${yy.toFixed(1)}" r="${st==='FUERA DE RANGO'?5:4}" fill="${color}" stroke="#fff" stroke-width="1.5"><title>${esc(PTAR_TURNOS[i]+' · '+ptarNumeroTexto(val)+(v.unidad?' '+v.unidad:'')+' · '+st)}</title></circle>`;
    g+=`<text x="${x}" y="${Math.max(pad.t+12,yy-8).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${color}">${esc(ptarNumeroTexto(val))}</text>`;
  });
  if(pts.length>1) g+=`<path d="M${pts[0][0]} ${pts[0][1].toFixed(1)} L${pts[1][0]} ${pts[1][1].toFixed(1)}" fill="none" stroke="${C.ptar}" stroke-width="2" opacity=".75"/>`;
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(v.variable+' del día')}">${g}</svg>`;
}
function registrosHistoricosVariablePTAR(v){
  if(!v) return [];
  const orderTurno=t=>t==='07:00'?0:(t==='19:00'?1:2);
  return PTAR_DATA
    .filter(r=>r.id===v.id && ptarNumeroLocal(r.valor)!==null)
    .slice()
    .sort((a,b)=>a.fecha.localeCompare(b.fecha) || orderTurno(a.turno)-orderTurno(b.turno));
}
function resumenDesviacionesHistoricasPTAR(v){
  const rows=registrosHistoricosVariablePTAR(v);
  const devs=rows.filter(r=>estadoRegistroPTAR(r)==='FUERA DE RANGO');
  return {rows,devs,fechas:[...new Set(rows.map(r=>r.fecha))].sort()};
}
function renderPTARHistoricoCompleto(host,v){
  if(!host || !v) return;
  const info=resumenDesviacionesHistoricasPTAR(v), rows=info.rows, fechas=info.fechas;
  const vals=rows.map(r=>ptarNumeroLocal(r.valor)).filter(x=>x!==null);
  if(!vals.length){
    host.innerHTML=`<div class="ptar-chart-empty">Sin registros históricos de ${esc(v.variable)} en el archivo.</div>`;
    return;
  }
  const W=760,H=255, ax=ptarEjes(v,vals,W,H), {pad,y}=ax;
  const x=i=>fechas.length<2 ? (pad.l+(W-pad.r))/2 : pad.l+i*(W-pad.l-pad.r)/(fechas.length-1);
  let g=ax.svg;
  const maxLabels=11, step=Math.max(1,Math.ceil(fechas.length/maxLabels));
  fechas.forEach((f,i)=>{
    if(i!==0 && i!==fechas.length-1 && i%step!==0) return;
    g+=`<text x="${x(i).toFixed(1)}" y="${H-10}" text-anchor="middle" font-size="9.4" fill="${C.ink3}">${esc(etiquetaFechaPTAR(f))}</text>`;
  });
  PTAR_TURNOS.forEach((turn,si)=>{
    const color=si===0?C.ptar:C.ink, pts=[];
    fechas.forEach((f,i)=>{
      const r=registroPTAR(v.id,turn,f), val=r?ptarNumeroLocal(r.valor):null;
      if(val===null) return;
      pts.push([x(i),y(val),r,val]);
    });
    if(pts.length>1){
      const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
      g+=`<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`;
    }
    pts.forEach(p=>{
      const st=estadoRegistroPTAR(p[2]), fuera=st==='FUERA DE RANGO', pointColor=fuera?C.crit:color;
      g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${fuera?5.2:3.6}" fill="${pointColor}" stroke="#fff" stroke-width="${fuera?1.7:1.2}"><title>${esc(etiquetaFechaPTAR(p[2].fecha,true)+' · '+turn+' · '+ptarNumeroTexto(p[3])+(v.unidad?' '+v.unidad:'')+' · '+st)}</title></circle>`;
    });
  });
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc('Histórico completo · '+v.variable)}">${g}</svg>
    <div class="ptar-chart-legend">
      <span><i style="--k:${C.ptar}"></i>07:00</span>
      <span><i style="--k:${C.ink}"></i>19:00</span>
      <span><i style="--k:${C.crit}"></i>Fuera de rango</span>
      <span class="ptar-chart-range">${esc(v.rango || 'Sin rango definido')}</span>
    </div>`;
}
function textoDesviacionesHistoricasPTAR(v,limit=4){
  const devs=resumenDesviacionesHistoricasPTAR(v).devs;
  if(!devs.length) return '';
  const partes=devs.slice(0,limit).map(r=>`${etiquetaFechaPTAR(r.fecha)} ${r.turno} · ${valorTextoPTAR(r)}${v.unidad?' '+v.unidad:''}`);
  const resto=devs.length-limit;
  return partes.join(' · ')+(resto>0?` · +${resto} más`:'');
}
function ptarSeleccionHistorico(proceso){
  const vars=ptarVariables(proceso);
  const actual=PTAR_HISTORICO_SEL[proceso.nombre] || '__all__';
  if(actual==='__all__' || vars.some(v=>v.id===actual)) return actual;
  PTAR_HISTORICO_SEL[proceso.nombre]='__all__';
  return '__all__';
}
function pintarGraficasPTAR(){
  const host=document.getElementById('ptar-graficas-procesos');
  if(!host || !PTAR_PROCESOS.length) return;
  host.innerHTML=PTAR_PROCESOS.map((p,pi)=>{
    const todas=ptarVariables(p);
    const v=ptarVariableGrafica(p);
    const opciones=todas.map(x=>`<option value="${esc(x.id)}"${x.id===v.id?' selected':''}>${esc(x.variable)} · ${esc(x.puesto)}</option>`).join('');
    const histSel=ptarSeleccionHistorico(p);
    const opcionesHistorico=`<option value="__all__"${histSel==='__all__'?' selected':''}>Todas las gráficas</option>`+
      todas.map(x=>`<option value="${esc(x.id)}"${x.id===histSel?' selected':''}>${esc(x.variable)} · ${esc(x.puesto)}</option>`).join('');
    const varsHistoricas=histSel==='__all__' ? todas : todas.filter(x=>x.id===histSel);
    const historicos=varsHistoricas.map(hv=>{
      const vi=todas.findIndex(x=>x.id===hv.id);
      const info=resumenDesviacionesHistoricasPTAR(hv), nReg=info.rows.length, nDias=info.fechas.length, nDev=info.devs.length;
      const badge=nReg
        ? (nDev
          ? `<span class="pill crit"><i></i>${nDev} fuera de rango</span>`
          : `<span class="pill ${hv.tipo==='none'?'idle':'ok'}"><i></i>${hv.tipo==='none'?'Informativo':'Sin desviaciones'}</span>`)
        : `<span class="pill idle"><i></i>Sin registros</span>`;
      const devTxt=nDev?textoDesviacionesHistoricasPTAR(hv):'';
      return `<article class="ptar-history-var-card ${nDev?'has-history-dev':''}" aria-labelledby="ptar-hist-${pi}-${vi}">
        <div class="ptar-history-var-head">
          <div class="ptar-history-var-title">
            <h5 id="ptar-hist-${pi}-${vi}">${esc(hv.variable)}</h5>
            <div class="ptar-history-var-meta">
              <span>${esc(hv.puesto || '—')}</span>
              <span>Rango: ${esc(hv.rango || '—')}</span>
              ${hv.unidad?`<span>Unidad: ${esc(hv.unidad)}</span>`:''}
              <span>${nReg} lectura${nReg===1?'':'s'} · ${nDias} día${nDias===1?'':'s'} con registro</span>
            </div>
          </div>
          ${badge}
        </div>
        <div class="ptar-process-chart ptar-history-chart" data-ptar-chart-history="${pi}-${vi}"></div>
        ${devTxt?`<div class="ptar-history-dev-note"><b>Desviaciones:</b> ${esc(devTxt)}</div>`:''}
      </article>`;
    }).join('');
    return `<section class="card ptar-chart-process-card ptar-theme ptar-process-charts" aria-labelledby="ptar-chart-${pi}">
      <div class="card-h">
        <div>
          <h3 id="ptar-chart-${pi}">${esc(p.nombre)}</h3>
          <span class="ptar-process-chart-sub">${todas.length} variables · histórico completo según días con registro</span>
        </div>
        <label class="ptar-chart-selector">Variable para lectura del día
          <select data-ptar-chart-process="${pi}" aria-label="Variable del día a graficar de ${esc(p.nombre)}">${opciones}</select>
        </label>
      </div>
      <div class="card-b">
        <div class="ptar-day-block">
          <div class="ptar-chart-meta">
            <strong>${esc(v.variable)}</strong>
            <span>${esc(v.puesto || '—')}</span>
            <span>Rango: ${esc(v.rango || '—')}</span>
            ${v.unidad?`<span>Unidad: ${esc(v.unidad)}</span>`:''}
          </div>
          <div class="ptar-chart-panel ptar-day-panel">
            <div class="ptar-chart-panel-h"><h4>Lecturas del día seleccionado</h4><span class="sub">${etiquetaFechaPTAR(PTAR_FECHA,true)} · 07:00 / 19:00</span></div>
            <div class="ptar-process-chart" data-ptar-chart-day="${pi}"></div>
          </div>
        </div>
        <div class="ptar-all-history">
          <div class="ptar-all-history-h">
            <div>
              <h4>Comportamiento histórico de todas las variables</h4>
              <p>Selecciona una gráfica específica o muestra todas las variables del proceso.</p>
            </div>
            <div class="history-toolbar">
              <label class="history-chart-selector">Gráfica a visualizar
                <select data-ptar-history-selector="${pi}" aria-label="Gráfica histórica a visualizar de ${esc(p.nombre)}">${opcionesHistorico}</select>
              </label>
              <span class="ptar-history-key"><i></i>Los puntos rojos indican lecturas fuera del rango de operación.</span>
            </div>
          </div>
          <div class="ptar-history-grid ${histSel==='__all__'?'':'is-single'}">${historicos}</div>
        </div>
      </div>
    </section>`;
  }).join('');
  PTAR_PROCESOS.forEach((p,pi)=>{
    const todas=ptarVariables(p), v=ptarVariableGrafica(p), histSel=ptarSeleccionHistorico(p);
    renderPTARDia(host.querySelector(`[data-ptar-chart-day="${pi}"]`),p,v);
    const varsHistoricas=histSel==='__all__' ? todas : todas.filter(x=>x.id===histSel);
    varsHistoricas.forEach(hv=>{
      const vi=todas.findIndex(x=>x.id===hv.id);
      renderPTARHistoricoCompleto(host.querySelector(`[data-ptar-chart-history="${pi}-${vi}"]`),hv);
    });
  });
  host.querySelectorAll('[data-ptar-chart-process]').forEach(sel=>{
    sel.addEventListener('change',()=>{
      const pi=Number(sel.dataset.ptarChartProcess), p=PTAR_PROCESOS[pi];
      if(!p) return;
      PTAR_GRAFICA_VAR[p.nombre]=sel.value;
      pintarGraficasPTAR();
    });
  });
  host.querySelectorAll('[data-ptar-history-selector]').forEach(sel=>{
    sel.addEventListener('change',()=>{
      const pi=Number(sel.dataset.ptarHistorySelector), p=PTAR_PROCESOS[pi];
      if(!p) return;
      PTAR_HISTORICO_SEL[p.nombre]=sel.value;
      pintarGraficasPTAR();
    });
  });
}
function poblarFechasPTAR(){
  const sels=[document.getElementById('ptar-date-select'),document.getElementById('ptar-summary-date-select')].filter(Boolean);
  sels.forEach(sel=>{
    sel.innerHTML=PTAR_FECHAS.map(f=>`<option value="${f}">${etiquetaFechaPTAR(f,true)}</option>`).join('');
    sel.value=PTAR_FECHA || '';
    if(!sel.dataset.bound){
      sel.dataset.bound='1';
      sel.addEventListener('change',()=>{
        PTAR_FECHA=sel.value;
        sels.forEach(s=>s.value=PTAR_FECHA);
        pintarPTAR(); pintarValores(); pintarEncabezado();
      });
    }
  });
}
function pintarDesviacionesPTAR(){
  const host=document.getElementById('ptar-desviaciones');
  const count=document.getElementById('ptar-desv-count');
  if(!host) return;
  const list=registrosFechaPTAR().filter(r=>estadoRegistroPTAR(r)==='FUERA DE RANGO');
  if(count) count.textContent=list.length?`${list.length} detectada${list.length===1?'':'s'}`:'ninguna';
  host.innerHTML=list.length ? list.map(r=>{
    const v=ptarDefPorId(r.id);
    return `<div class="ptar-dev">
      <span class="bar" style="background:${C.crit}"></span>
      <div class="body">
        <div class="title">${esc(r.variable)} · ${valorTextoPTAR(r)}${v&&v.unidad?' '+esc(v.unidad):''}</div>
        <div class="meta">${esc(r.proceso)} · ${esc(r.puesto)} · rango ${esc(r.rango || '—')}</div>
        ${r.operador?`<div class="obs">Operador: ${esc(r.operador)}</div>`:''}
        ${r.observacion?`<div class="obs">${esc(r.observacion)}</div>`:''}
      </div>
      <time>${esc(r.turno)}</time>
    </div>`;
  }).join('') : `<p class="empty">No hay variables registradas fuera de rango el ${etiquetaFechaPTAR(PTAR_FECHA,true)}.</p>`;
}
function pintarPTAR(){
  if(!PTAR_PROCESOS.length) return;
  poblarFechasPTAR();
  const total=ptarStats(), eTotal=ptarEstado(total);
  document.querySelectorAll('[data-ptar-summary-count]').forEach(el=>el.textContent=String(total.registradas));
  const sumPill=document.querySelector('[data-ptar-summary-pill]');
  if(sumPill){ sumPill.className='pill '+eTotal.st; sumPill.innerHTML='<i></i>'+esc(eTotal.txt); }
  const stripVal=document.querySelector('[data-ptar-strip-value]');
  if(stripVal) stripVal.textContent=String(total.desviaciones);
  const stripPill=document.querySelector('[data-ptar-strip-pill]');
  if(stripPill){ stripPill.className='pill '+eTotal.st; stripPill.innerHTML='<i></i>'+esc(eTotal.txt); }

  const resumen=document.getElementById('ptar-resumen-procesos');
  if(resumen){
    resumen.innerHTML=PTAR_PROCESOS.map(p=>{
      const st=ptarStats(p), e=ptarEstado(st);
      return `<div class="ptar-summary-process">
        <div class="ptar-summary-process-h"><strong>${esc(p.nombre)}</strong><span class="pill ${e.st}"><i></i>${esc(e.txt)}</span></div>
        <div class="ptar-summary-process-v"><b>${st.variables}</b> variables · ${st.registradas} lecturas · ${st.desviaciones} fuera</div>
        <div class="ptar-progress"><i style="width:${st.controladas?st.pctNormal.toFixed(1):0}%"></i></div>
      </div>`;
    }).join('');
  }
  const kpis=document.getElementById('ptar-kpis-proceso');
  if(kpis){
    kpis.innerHTML=PTAR_PROCESOS.map(p=>{
      const st=ptarStats(p), e=ptarEstado(st);
      return `<div class="kpi ptar-process-kpi">
        <div class="lbl"><span>${esc(p.nombre)}</span><span class="pill ${e.st}" style="margin-left:auto"><i></i>${esc(e.txt)}</span></div>
        <div class="v tnum">${st.registradas}<small>lecturas</small></div>
        <div class="rng">${st.variables} variables · ${st.controladas} con rango evaluadas</div>
        <div class="ptar-progress"><i style="width:${st.controladas?st.pctNormal.toFixed(1):0}%"></i></div>
      </div>`;
    }).join('');
  }
  const host=document.getElementById('ptar-procesos');
  if(host){
    const ops=operadoresFechaPTAR();
    host.innerHTML=PTAR_PROCESOS.map((p,pi)=>{
      const st=ptarStats(p), e=ptarEstado(st);
      const rows=(p.puestos||[]).map(puesto=>(puesto.variables||[]).map((v,i)=>{
        const puestoCell=i===0?`<td class="ptar-puesto" rowspan="${puesto.variables.length}">${esc(puesto.nombre)}</td>`:'';
        const regs=PTAR_TURNOS.map(t=>registroPTAR(v.id,t));
        const dev=regs.some(r=>estadoRegistroPTAR(r)==='FUERA DE RANGO');
        const celdas=regs.map(r=>{
          const est=estadoRegistroPTAR(r), cls=claseEstadoPTAR(est);
          return `<td class="num ptar-lectura ${cls}" title="${esc(est)}">${valorTextoPTAR(r)}</td>`;
        }).join('');
        return `<tr class="${dev?'has-dev':''}">${puestoCell}<td>${esc(v.variable)}</td><td class="ptar-rango tnum">${esc(v.rango || '—')}</td>${celdas}</tr>`;
      }).join('')).join('');
      return `<section class="card ptar-process-card ptar-theme" aria-labelledby="ptar-proceso-${pi}">
        <div class="card-h">
          <h3 id="ptar-proceso-${pi}">${esc(p.nombre)}</h3>
          <span class="pill ${e.st}"><i></i>${esc(e.txt)}</span>
          <span class="note">${etiquetaFechaPTAR(PTAR_FECHA,true)} · ${st.registradas} lecturas</span>
        </div>
        <div class="card-b ptar-table-wrap">
          <table class="tbl ptar-table ptar-real-table">
            <thead><tr>
              <th>Puesto de trabajo</th><th>Variable de control</th><th class="num">Rango de operación</th>
              <th class="num">07:00${ops['07:00']?`<small>${esc(ops['07:00'])}</small>`:''}</th>
              <th class="num">19:00${ops['19:00']?`<small>${esc(ops['19:00'])}</small>`:''}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
    }).join('');
  }
  pintarGraficasPTAR();
  pintarDesviacionesPTAR();
}
function normalizarFilasPTAR(rows){
  return (rows||[]).map(r=>{
    const proceso=String(r.Proceso ?? r.proceso ?? '').trim();
    const puesto=String(r['Puesto de trabajo'] ?? r.Puesto ?? r.puesto ?? '').trim();
    const variable=String(r['Variable de control'] ?? r.Variable ?? r.variable ?? '').trim();
    let id=String(r.VariableId ?? r.id ?? '').trim();
    let def=id?ptarDefPorId(id):ptarDefPorCampos(proceso,puesto,variable);
    if(!def) return null;
    id=def.id;
    const valorRaw=r.Valor ?? r.valor;
    const valorNum=ptarNumeroLocal(valorRaw);
    return {
      fecha:normalizarFechaPTAR(r.Fecha ?? r.fecha),
      turno:String(r.Turno ?? r.turno ?? '').trim(),
      operador:String(r.Operador ?? r.operador ?? '').trim(),
      proceso:def.proceso,
      puesto:def.puesto,
      variable:def.variable,
      rango:def.rango,
      valor:valorNum!==null?valorNum:(valorRaw ?? ''),
      unidad:def.unidad || String(r.Unidad ?? r.unidad ?? '').trim(),
      tipo:def.tipo,
      min:def.min,
      max:def.max,
      observacion:String(r['Nota de transcripción'] ?? r['Observación'] ?? r.Observacion ?? r.observacion ?? '').trim(),
      id
    };
  }).filter(r=>r && r.fecha && r.turno && r.id);
}
function cargarDatosPTAR(rows,fechas,procesos,fuente,tipo='fallback'){
  if(procesos && procesos.length) PTAR_PROCESOS=procesos;
  const norm=normalizarFilasPTAR(rows);
  if(!norm.length) throw new Error('El archivo no contiene registros PTAR válidos.');
  PTAR_DATA=norm;
  const dataFechas=[...new Set(norm.map(r=>r.fecha))].sort();
  PTAR_FECHAS=(fechas && fechas.length ? [...new Set(fechas)] : dataFechas).sort();
  const ultimaConDatos=dataFechas.filter(f=>registrosFechaPTAR(f).some(r=>tieneLecturaPTAR(r.valor))).slice(-1)[0] || PTAR_FECHAS[PTAR_FECHAS.length-1] || null;
  if(!PTAR_FECHA || !PTAR_FECHAS.includes(PTAR_FECHA) || !registrosFechaPTAR(PTAR_FECHA).some(r=>tieneLecturaPTAR(r.valor))) PTAR_FECHA=ultimaConDatos;
  PTAR_FUENTE=fuente || PTAR_FUENTE;
  poblarFechasPTAR();
  if(document.body && document.body.dataset.dashboardReady==='1'){
    pintarPTAR(); pintarValores(); pintarEncabezado();
  }
}

/* Lector XLSX ligero compartido con Vapor: ZIP + XML sin dependencias externas. */
function colIndexPTAR(ref){
  const m=String(ref||'').match(/^([A-Z]+)/); if(!m) return 0;
  let n=0; for(const ch of m[1]) n=n*26+ch.charCodeAt(0)-64; return n-1;
}
async function abrirZipPTAR(buffer){
  const u8=new Uint8Array(buffer), dv=new DataView(buffer); let eocd=-1;
  const min=Math.max(0,u8.length-65557);
  for(let i=u8.length-22;i>=min;i--){ if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;} }
  if(eocd<0) throw new Error('No se pudo leer la estructura ZIP del XLSX.');
  const total=dv.getUint16(eocd+10,true); let p=dv.getUint32(eocd+16,true);
  const entries=new Map(), td=new TextDecoder('utf-8');
  for(let i=0;i<total;i++){
    if(dv.getUint32(p,true)!==0x02014b50) throw new Error('Directorio ZIP inválido.');
    const method=dv.getUint16(p+10,true), compSize=dv.getUint32(p+20,true), uncompSize=dv.getUint32(p+24,true);
    const nameLen=dv.getUint16(p+28,true), extraLen=dv.getUint16(p+30,true), commentLen=dv.getUint16(p+32,true), localOffset=dv.getUint32(p+42,true);
    const name=td.decode(u8.slice(p+46,p+46+nameLen)); entries.set(name,{method,compSize,uncompSize,localOffset});
    p+=46+nameLen+extraLen+commentLen;
  }
  async function bytes(name){
    name=String(name).replace(/^\//,''); const e=entries.get(name); if(!e) throw new Error('Falta '+name+' en el XLSX.');
    const lp=e.localOffset; if(dv.getUint32(lp,true)!==0x04034b50) throw new Error('Entrada ZIP inválida: '+name);
    const nlen=dv.getUint16(lp+26,true), xlen=dv.getUint16(lp+28,true), start=lp+30+nlen+xlen;
    const comp=u8.slice(start,start+e.compSize);
    if(e.method===0) return comp;
    if(e.method===8){
      if(typeof DecompressionStream==='undefined') throw new Error('Este navegador no soporta descompresión XLSX local.');
      const ds=new DecompressionStream('deflate-raw');
      return new Uint8Array(await new Response(new Blob([comp]).stream().pipeThrough(ds)).arrayBuffer());
    }
    throw new Error('Método de compresión XLSX no soportado: '+e.method);
  }
  return {entries,text:async name=>td.decode(await bytes(name))};
}
async function leerHojaXLSXPTAR(zip,target,shared){
  const parser=new DOMParser(), shXml=parser.parseFromString(await zip.text(target),'application/xml');
  const out=[];
  [...shXml.getElementsByTagNameNS('*','row')].forEach(row=>{
    const arr=[];
    [...row.getElementsByTagNameNS('*','c')].forEach(c=>{
      const idx=colIndexPTAR(c.getAttribute('r')), t=c.getAttribute('t'); let value='';
      if(t==='inlineStr') value=[...c.getElementsByTagNameNS('*','t')].map(x=>x.textContent||'').join('');
      else {
        const ve=c.getElementsByTagNameNS('*','v')[0], raw=ve?ve.textContent:'';
        if(t==='s') value=shared[Number(raw)] ?? '';
        else if(t==='str') value=raw;
        else if(raw!==''){ const n=Number(raw); value=Number.isFinite(n)?n:raw; }
      }
      arr[idx]=value;
    });
    out.push(arr);
  });
  return out;
}
async function leerExcelPTAR(buffer){
  const zip=await abrirZipPTAR(buffer), parser=new DOMParser();
  const wbXml=parser.parseFromString(await zip.text('xl/workbook.xml'),'application/xml');
  const relXml=parser.parseFromString(await zip.text('xl/_rels/workbook.xml.rels'),'application/xml');
  const rels=[...relXml.getElementsByTagNameNS('*','Relationship')];
  let shared=[];
  if(zip.entries.has('xl/sharedStrings.xml')){
    const ssXml=parser.parseFromString(await zip.text('xl/sharedStrings.xml'),'application/xml');
    shared=[...ssXml.getElementsByTagNameNS('*','si')].map(si=>[...si.getElementsByTagNameNS('*','t')].map(t=>t.textContent||'').join(''));
  }
  const sheets=[...wbXml.getElementsByTagNameNS('*','sheet')];
  const sheet=sheets.find(s=>s.getAttribute('name')==='Control') || sheets.find(s=>s.getAttribute('name')==='Datos Dashboard');
  if(!sheet) throw new Error('No existe la hoja "Control" en el archivo PTAR.');
  const rid=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id') || sheet.getAttribute('r:id');
  const rel=rels.find(r=>r.getAttribute('Id')===rid); if(!rel) throw new Error('No se pudo resolver la hoja Control.');
  let target=rel.getAttribute('Target').replace(/^\//,''); if(!target.startsWith('xl/')) target='xl/'+target.replace(/^\.\//,'');
  const rows=await leerHojaXLSXPTAR(zip,target,shared); if(!rows.length) throw new Error('La hoja Control está vacía.');
  const headers=rows[0].map(x=>String(x??'').trim());
  const objetos=rows.slice(1).filter(r=>r.some(v=>v!=='' && v!==null && v!==undefined)).map(r=>{
    const o={}; headers.forEach((h,i)=>{if(h)o[h]=r[i]??'';}); return o;
  });
  return objetos;
}
async function cargarExcelPTARArchivo(file,origen='archivo seleccionado'){
  const rows=await leerExcelPTAR(await file.arrayBuffer());
  cargarDatosPTAR(rows,[],PTAR_PROCESOS,`${file.name} · ${rows.length} filas de control · ${origen}`,'excel');
}
async function cargarPTARAutomatico(){
  if(location.protocol==='file:') return;
  try{
    const resp=await fetch('Reporte_Control_PTAR_01-09_al_09-09-2026.xlsx',{cache:'no-store'});
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const rows=await leerExcelPTAR(await resp.arrayBuffer());
    cargarDatosPTAR(rows,[],PTAR_PROCESOS,`Reporte_Control_PTAR_01-09_al_09-09-2026.xlsx · ${rows.length} filas de control · carga automática`,'excel');
  }catch(err){ /* fallback precargado permanece visible */ }
}
function inicializarPTARExcel(){
  const input=document.getElementById('ptar-excel-input');
  if(input && !input.dataset.bound){
    input.dataset.bound='1';
    input.addEventListener('change',async()=>{
      const file=input.files && input.files[0]; if(!file) return;
      try{ await cargarExcelPTARArchivo(file); }
      catch(err){ alert('No se pudo leer el Excel de PTAR: '+err.message); }
      finally{ input.value=''; }
    });
  }
  cargarPTARAutomatico();
}
if(window.PTAR_FALLBACK_DATA && window.PTAR_FALLBACK_DATA.length){
  cargarDatosPTAR(
    window.PTAR_FALLBACK_DATA,
    window.PTAR_FALLBACK_FECHAS || [],
    window.PTAR_FALLBACK_PROCESOS || PTAR_PROCESOS_DEFAULT,
    'Reporte_Control_PTAR_01-09_al_09-09-2026.xlsx · datos precargados para apertura local',
    'fallback'
  );
}

/* ---------------------------------------------------------
   8. VAPOR · control real desde Reporte Control Generacion de Vapor.xlsx
   Procesos: Alimentación Calderas + Calderas N°1 a N°5
   Turnos: 07:00 y 19:00
   --------------------------------------------------------- */
const VAPOR_TURNOS = ['07:00','19:00'];
let VAPOR_PROCESOS = Array.isArray(window.VAPOR_FALLBACK_PROCESOS) ? window.VAPOR_FALLBACK_PROCESOS : [];
let VAPOR_DATA = [];
let VAPOR_FECHAS = Array.isArray(window.VAPOR_FALLBACK_FECHAS) ? [...window.VAPOR_FALLBACK_FECHAS] : [];
let VAPOR_FECHA = null;
let VAPOR_FUENTE = 'Reporte Control Generacion de Vapor.xlsx';
const VAPOR_GRAFICA_VAR = {};
const VAPOR_HISTORICO_SEL = {}; // '__all__' o id de una variable por proceso

const vaporVariables = p => p ? (p.variables || []) : [];
const tieneLecturaVapor = v => v !== null && v !== undefined && String(v).trim() !== '';

function vaporNumeroLocal(s){
  if(typeof s === 'number') return Number.isFinite(s) ? s : null;
  let t=String(s ?? '').trim().replace(/\s/g,'');
  if(!t) return null;
  if(t.includes(',') && t.includes('.')) t=t.replace(/\./g,'').replace(',','.');
  else if(t.includes(',')) t=t.replace(',','.');
  else if(t.includes('.')){
    const a=t.split('.');
    if(a.length === 2 && a[1].length === 3 && a[0] !== '0' && a[0] !== '-0') t=a.join('');
  }
  const n=Number(t);
  return Number.isFinite(n) ? n : null;
}
function vaporParseRange(rango){
  let s=String(rango ?? '').trim()
    .replace(/˂/g,'<').replace(/≤/g,'<=').replace(/≥/g,'>=')
    .replace(/[−–—]/g,'-');
  if(!s || s === '-' || s === '--') return {tipo:'none',min:null,max:null};
  const raw=s.match(/[-+]?\d[\d.,]*/g) || [];
  const nums=raw.map(vaporNumeroLocal).filter(v=>v !== null);
  if(s.includes('<=') || /(^|[^>])</.test(s)) return {tipo:'max',min:null,max:nums[0] ?? null};
  if(s.includes('>=') || s.includes('>')) return {tipo:'min',min:nums[0] ?? null,max:null};
  if(nums.length >= 2 && s.includes('-')) return {tipo:'band',min:nums[0],max:nums[1]};
  return {tipo:'none',min:null,max:null};
}
function vaporUnidad(rango, variable){
  const s=(String(rango ?? '')+' '+String(variable ?? '')).toLowerCase();
  if(s.includes('mg/l')) return 'mg/L';
  if(s.includes('°c')) return '°C';
  if(s.includes('us/cm')) return 'µS/cm';
  return '';
}
function normalizarFechaVapor(v){
  if(v == null || v === '') return '';
  if(typeof v === 'number' && Number.isFinite(v)){
    const d=new Date(Date.UTC(1899,11,30) + v*86400000);
    return d.toISOString().slice(0,10);
  }
  const s=String(v).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if(m){
    let y=Number(m[3]); if(y < 100) y += 2000;
    return `${String(y).padStart(4,'0')}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
  }
  return '';
}
function vaporFechaDesdeNombre(nombre){
  const m=String(nombre || '').match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if(!m) return '';
  return `20${m[3]}-${m[2]}-${m[1]}`;
}
function etiquetaFechaVapor(iso, larga=false){
  if(!iso) return 'Sin fecha';
  const [y,m,d]=iso.split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d));
  return dt.toLocaleDateString('es-VE', larga
    ? {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}
    : {day:'2-digit',month:'2-digit',timeZone:'UTC'});
}
function vaporDefPorId(id){
  for(const p of VAPOR_PROCESOS){
    const v=(p.variables||[]).find(x=>x.id===id);
    if(v) return v;
  }
  return null;
}
function estadoValorVapor(v, valor){
  if(!tieneLecturaVapor(valor)) return 'SIN DATO';
  if(!v || v.tipo === 'none') return 'INFORMATIVO';
  const n=Number(valor);
  if(!Number.isFinite(n)) return 'SIN DATO';
  if(v.min != null && n < Number(v.min)) return 'FUERA DE RANGO';
  if(v.max != null && n > Number(v.max)) return 'FUERA DE RANGO';
  return 'NORMAL';
}
function estadoRegistroVapor(r){
  if(!r) return 'SIN DATO';
  const v=vaporDefPorId(r.id);
  return estadoValorVapor(v,r.valor);
}
function claseEstadoVapor(st){
  if(st === 'FUERA DE RANGO') return 'bad';
  if(st === 'NORMAL') return 'ok';
  if(st === 'INFORMATIVO') return 'info';
  return 'empty';
}
function vaporNumeroTexto(n){
  if(n == null || n === '' || !Number.isFinite(Number(n))) return '—';
  const x=Number(n);
  const dec=Math.abs(x) < 10 && Math.abs(x-Math.round(x)) > 1e-9 ? 2 : (Math.abs(x-Math.round(x)) > 1e-9 ? 1 : 0);
  return x.toLocaleString('es-VE',{minimumFractionDigits:0,maximumFractionDigits:dec});
}
function valorTextoVapor(r){
  if(!r || !tieneLecturaVapor(r.valor)) return '—';
  return vaporNumeroTexto(Number(r.valor));
}
function registrosFechaVapor(fecha=VAPOR_FECHA, proceso=null){
  return VAPOR_DATA.filter(r=>r.fecha===fecha && (!proceso || r.proceso===proceso));
}
function registroVapor(variableId, turno, fecha=VAPOR_FECHA){
  return VAPOR_DATA.find(r=>r.fecha===fecha && r.turno===turno && r.id===variableId) || null;
}
function operadoresFechaVapor(fecha=VAPOR_FECHA){
  const out={};
  VAPOR_TURNOS.forEach(t=>{
    const r=VAPOR_DATA.find(x=>x.fecha===fecha && x.turno===t && x.operador);
    out[t]=r ? r.operador : '';
  });
  return out;
}
function vaporStats(proceso=null, fecha=VAPOR_FECHA){
  const p=proceso ? (typeof proceso==='string' ? VAPOR_PROCESOS.find(x=>x.nombre===proceso) : proceso) : null;
  const vars=p ? vaporVariables(p) : VAPOR_PROCESOS.flatMap(vaporVariables);
  const rows=registrosFechaVapor(fecha,p ? p.nombre : null);
  const controladas=rows.filter(r=>{
    const v=vaporDefPorId(r.id);
    return v && v.tipo !== 'none' && tieneLecturaVapor(r.valor);
  });
  const desviaciones=controladas.filter(r=>estadoRegistroVapor(r)==='FUERA DE RANGO').length;
  const normales=controladas.filter(r=>estadoRegistroVapor(r)==='NORMAL').length;
  return {
    variables:vars.length,
    registradas:rows.filter(r=>tieneLecturaVapor(r.valor)).length,
    controladas:controladas.length,
    desviaciones,
    normales,
    pctNormal:controladas.length ? normales/controladas.length*100 : 0
  };
}
function vaporEstado(st){
  if(!st || !st.registradas) return {st:'idle',txt:'Sin registros'};
  if(st.desviaciones) return {st:'crit',txt:`${st.desviaciones} fuera de rango`};
  if(st.controladas) return {st:'ok',txt:'Normal'};
  return {st:'idle',txt:'Informativo'};
}
function vaporVentana7Dias(){
  if(!VAPOR_FECHAS.length) return [];
  const idx=Math.max(0,VAPOR_FECHAS.indexOf(VAPOR_FECHA));
  return VAPOR_FECHAS.slice(Math.max(0,idx-6),idx+1);
}
function vaporVariableGrafica(proceso){
  const vars=vaporVariables(proceso);
  if(!vars.length) return null;
  const id=VAPOR_GRAFICA_VAR[proceso.nombre];
  if(id){
    const f=vars.find(v=>v.id===id);
    if(f) return f;
  }
  const conDato=vars.find(v=>v.frecuencia==='Diaria' && v.tipo!=='none' &&
    VAPOR_TURNOS.some(t=>registroVapor(v.id,t,VAPOR_FECHA)));
  const candidata=conDato || vars.find(v=>v.frecuencia==='Diaria' && v.tipo!=='none') || vars.find(v=>v.tipo!=='none') || vars[0];
  VAPOR_GRAFICA_VAR[proceso.nombre]=candidata.id;
  return candidata;
}
function vaporLimitesGrafica(v,valores){
  let nums=valores.filter(x=>Number.isFinite(Number(x))).map(Number);
  if(v.min != null) nums.push(Number(v.min));
  if(v.max != null) nums.push(Number(v.max));
  if(!nums.length) return {lo:0,hi:1};
  let lo=Math.min(...nums), hi=Math.max(...nums);
  if(lo===hi){ const p=Math.abs(lo)*.12 || 1; lo-=p; hi+=p; }
  const p=(hi-lo)*.15 || 1;
  lo-=p; hi+=p;
  if(lo>=0 && lo-p<0) lo=0;
  return {lo,hi};
}
function vaporEjes(v,valores,W=640,H=235){
  const pad={l:55,r:18,t:14,b:34};
  const lim=vaporLimitesGrafica(v,valores);
  const y=n=>pad.t + (lim.hi-Number(n))/(lim.hi-lim.lo)*(H-pad.t-pad.b);
  let svg='';
  for(let i=0;i<=4;i++){
    const val=lim.lo+(lim.hi-lim.lo)*i/4;
    const yy=y(val);
    svg+=`<line x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${W-pad.r}" y2="${yy.toFixed(1)}" stroke="${C.line}" stroke-width="1"/>`;
    svg+=`<text x="${pad.l-8}" y="${(yy+4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="${C.ink3}">${esc(vaporNumeroTexto(val))}</text>`;
  }
  const left=pad.l,right=W-pad.r,top=pad.t,bottom=H-pad.b;
  if(v.tipo==='band' && v.min!=null && v.max!=null){
    const y1=y(v.min), y2=y(v.max);
    svg+=`<rect x="${left}" y="${Math.min(y1,y2).toFixed(1)}" width="${right-left}" height="${Math.abs(y2-y1).toFixed(1)}" fill="${C.vapor}" opacity=".08"/>`;
    [v.min,v.max].forEach(n=>{
      const yy=y(n);
      svg+=`<line x1="${left}" y1="${yy.toFixed(1)}" x2="${right}" y2="${yy.toFixed(1)}" stroke="${C.crit}" stroke-width="1" stroke-dasharray="5 4" opacity=".72"/>`;
    });
  } else if(v.tipo==='max' && v.max!=null){
    const yy=y(v.max);
    svg+=`<line x1="${left}" y1="${yy.toFixed(1)}" x2="${right}" y2="${yy.toFixed(1)}" stroke="${C.crit}" stroke-width="1.2" stroke-dasharray="5 4"/>`;
    svg+=`<text x="${right-3}" y="${(yy-5).toFixed(1)}" text-anchor="end" font-size="10" fill="${C.crit}">máx. ${esc(vaporNumeroTexto(v.max))}</text>`;
  } else if(v.tipo==='min' && v.min!=null){
    const yy=y(v.min);
    svg+=`<line x1="${left}" y1="${yy.toFixed(1)}" x2="${right}" y2="${yy.toFixed(1)}" stroke="${C.crit}" stroke-width="1.2" stroke-dasharray="5 4"/>`;
    svg+=`<text x="${right-3}" y="${(yy-5).toFixed(1)}" text-anchor="end" font-size="10" fill="${C.crit}">mín. ${esc(vaporNumeroTexto(v.min))}</text>`;
  }
  return {svg,y,pad,lo:lim.lo,hi:lim.hi,W,H};
}
function renderVaporDia(host,proceso,v){
  if(!host || !v) return;
  const regs=VAPOR_TURNOS.map(t=>registroVapor(v.id,t,VAPOR_FECHA));
  const vals=regs.filter(Boolean).map(r=>Number(r.valor)).filter(Number.isFinite);
  if(!vals.length){
    host.innerHTML=`<div class="ptar-chart-empty">Sin lecturas de ${esc(v.variable)} para ${etiquetaFechaVapor(VAPOR_FECHA,true)}.</div>`;
    return;
  }
  const ax=vaporEjes(v,vals), {W,H,pad,y}=ax;
  const xs=[pad.l+90,W-pad.r-90];
  let g=ax.svg;
  const pts=[];
  regs.forEach((r,i)=>{
    const x=xs[i];
    g+=`<text x="${x}" y="${H-10}" text-anchor="middle" font-size="10.5" fill="${C.ink3}">${VAPOR_TURNOS[i]}</text>`;
    if(!r || !Number.isFinite(Number(r.valor))) return;
    const yy=y(Number(r.valor)), st=estadoRegistroVapor(r);
    const color=st==='FUERA DE RANGO' ? C.crit : C.vapor;
    pts.push([x,yy]);
    g+=`<circle cx="${x}" cy="${yy.toFixed(1)}" r="${st==='FUERA DE RANGO'?5:4}" fill="${color}" stroke="#fff" stroke-width="1.5"><title>${esc(VAPOR_TURNOS[i]+' · '+valorTextoVapor(r)+(v.unidad?' '+v.unidad:'')+' · '+st)}</title></circle>`;
    g+=`<text x="${x}" y="${(yy-10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="${color}">${esc(valorTextoVapor(r))}</text>`;
  });
  if(pts.length===2){
    g+=`<line x1="${pts[0][0]}" y1="${pts[0][1].toFixed(1)}" x2="${pts[1][0]}" y2="${pts[1][1].toFixed(1)}" stroke="${C.vapor}" stroke-width="2" opacity=".55"/>`;
  }
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(v.variable+' del día')}">${g}</svg>`;
}
function registrosHistoricosVariableVapor(v){
  if(!v) return [];
  const orderTurno=t=>t==='07:00'?0:(t==='19:00'?1:2);
  return VAPOR_DATA
    .filter(r=>r.id===v.id && Number.isFinite(Number(r.valor)))
    .slice()
    .sort((a,b)=> a.fecha.localeCompare(b.fecha) || orderTurno(a.turno)-orderTurno(b.turno));
}
function fechasHistoricasVariableVapor(v){
  return [...new Set(registrosHistoricosVariableVapor(v).map(r=>r.fecha))].sort();
}
function resumenDesviacionesHistoricasVapor(v){
  const rows=registrosHistoricosVariableVapor(v);
  const devs=rows.filter(r=>estadoRegistroVapor(r)==='FUERA DE RANGO');
  return {rows,devs,fechas:[...new Set(rows.map(r=>r.fecha))].sort()};
}
function renderVaporHistoricoCompleto(host,v){
  if(!host || !v) return;
  const info=resumenDesviacionesHistoricasVapor(v);
  const rows=info.rows;
  const fechas=info.fechas;
  const vals=rows.map(r=>Number(r.valor)).filter(Number.isFinite);
  if(!vals.length){
    host.innerHTML=`<div class="ptar-chart-empty">Sin registros históricos de ${esc(v.variable)} en el archivo.</div>`;
    return;
  }

  const W=760,H=255;
  const ax=vaporEjes(v,vals,W,H), {pad,y}=ax;
  const x=i=> fechas.length<2
    ? (pad.l + (W-pad.r))/2
    : pad.l + i*(W-pad.l-pad.r)/(fechas.length-1);

  let g=ax.svg;
  const maxLabels=11;
  const step=Math.max(1,Math.ceil(fechas.length/maxLabels));
  fechas.forEach((f,i)=>{
    if(i!==0 && i!==fechas.length-1 && i%step!==0) return;
    g+=`<text x="${x(i).toFixed(1)}" y="${H-10}" text-anchor="middle" font-size="9.4" fill="${C.ink3}">${esc(etiquetaFechaVapor(f))}</text>`;
  });

  VAPOR_TURNOS.forEach((turn,si)=>{
    const color=si===0 ? C.vapor : C.ink;
    const pts=[];
    fechas.forEach((f,i)=>{
      const r=registroVapor(v.id,turn,f);
      if(!r || !Number.isFinite(Number(r.valor))) return;
      pts.push([x(i),y(Number(r.valor)),r]);
    });

    if(pts.length>1){
      const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
      g+=`<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`;
    }

    pts.forEach(p=>{
      const st=estadoRegistroVapor(p[2]);
      const fuera=st==='FUERA DE RANGO';
      const pointColor=fuera ? C.crit : color;
      g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${fuera?5.2:3.6}" fill="${pointColor}" stroke="#fff" stroke-width="${fuera?1.7:1.2}">
        <title>${esc(etiquetaFechaVapor(p[2].fecha,true)+' · '+turn+' · '+valorTextoVapor(p[2])+(v.unidad?' '+v.unidad:'')+' · '+st)}</title>
      </circle>`;
    });
  });

  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc('Histórico completo · '+v.variable)}">${g}</svg>
    <div class="ptar-chart-legend">
      <span><i style="--k:${C.vapor}"></i>07:00</span>
      <span><i style="--k:${C.ink}"></i>19:00</span>
      <span><i style="--k:${C.crit}"></i>Fuera de rango</span>
      <span class="ptar-chart-range">${esc(v.rango || 'Sin rango definido')}</span>
    </div>`;
}
function textoDesviacionesHistoricasVapor(v,limit=4){
  const devs=resumenDesviacionesHistoricasVapor(v).devs;
  if(!devs.length) return '';
  const partes=devs.slice(0,limit).map(r=>`${etiquetaFechaVapor(r.fecha)} ${r.turno} · ${valorTextoVapor(r)}${v.unidad?' '+v.unidad:''}`);
  const resto=devs.length-limit;
  return partes.join(' · ')+(resto>0?` · +${resto} más`:'');
}
function vaporSeleccionHistorico(proceso){
  const vars=vaporVariables(proceso);
  const actual=VAPOR_HISTORICO_SEL[proceso.nombre] || '__all__';
  if(actual==='__all__' || vars.some(v=>v.id===actual)) return actual;
  VAPOR_HISTORICO_SEL[proceso.nombre]='__all__';
  return '__all__';
}
function pintarGraficasVapor(){
  const host=document.getElementById('vapor-graficas-procesos');
  if(!host || !VAPOR_PROCESOS.length) return;

  host.innerHTML=VAPOR_PROCESOS.map((p,pi)=>{
    const todas=vaporVariables(p);
    const v=vaporVariableGrafica(p);
    const opciones=todas.map(x=>
      `<option value="${esc(x.id)}"${x.id===v.id?' selected':''}>${esc(x.variable)} · ${esc(x.frecuencia)}</option>`
    ).join('');
    const histSel=vaporSeleccionHistorico(p);
    const opcionesHistorico=`<option value="__all__"${histSel==='__all__'?' selected':''}>Todas las gráficas</option>`+
      todas.map(x=>`<option value="${esc(x.id)}"${x.id===histSel?' selected':''}>${esc(x.variable)} · ${esc(x.frecuencia)}</option>`).join('');
    const varsHistoricas=histSel==='__all__' ? todas : todas.filter(x=>x.id===histSel);

    const historicos=varsHistoricas.map(hv=>{
      const vi=todas.findIndex(x=>x.id===hv.id);
      const info=resumenDesviacionesHistoricasVapor(hv);
      const nReg=info.rows.length;
      const nDias=info.fechas.length;
      const nDev=info.devs.length;
      const badge=nReg
        ? (nDev
            ? `<span class="pill crit"><i></i>${nDev} fuera de rango</span>`
            : `<span class="pill ${hv.tipo==='none'?'idle':'ok'}"><i></i>${hv.tipo==='none'?'Informativo':'Sin desviaciones'}</span>`)
        : `<span class="pill idle"><i></i>Sin registros</span>`;
      const devTxt=nDev ? textoDesviacionesHistoricasVapor(hv) : '';

      return `<article class="vapor-history-var-card ${nDev?'has-history-dev':''}" aria-labelledby="vapor-hist-${pi}-${vi}">
        <div class="vapor-history-var-head">
          <div class="vapor-history-var-title">
            <h5 id="vapor-hist-${pi}-${vi}">${esc(hv.variable)}</h5>
            <div class="vapor-history-var-meta">
              <span>${esc(hv.frecuencia || '—')}</span>
              <span>Rango: ${esc(hv.rango || '—')}</span>
              ${hv.unidad?`<span>Unidad: ${esc(hv.unidad)}</span>`:''}
              <span>${nReg} lectura${nReg===1?'':'s'} · ${nDias} día${nDias===1?'':'s'} con registro</span>
            </div>
          </div>
          ${badge}
        </div>
        <div class="ptar-process-chart vapor-history-chart" data-vapor-chart-history="${pi}-${vi}"></div>
        ${devTxt?`<div class="vapor-history-dev-note"><b>Desviaciones:</b> ${esc(devTxt)}</div>`:''}
      </article>`;
    }).join('');

    return `<section class="card ptar-chart-process-card vapor-theme vapor-process-charts" aria-labelledby="vapor-chart-${pi}">
      <div class="card-h">
        <div>
          <h3 id="vapor-chart-${pi}">${esc(p.nombre)}</h3>
          <span class="vapor-process-chart-sub">${todas.length} variables · histórico completo según días con registro</span>
        </div>
        <label class="ptar-chart-selector">Variable para lectura del día
          <select data-vapor-chart-process="${pi}" aria-label="Variable del día a graficar de ${esc(p.nombre)}">${opciones}</select>
        </label>
      </div>

      <div class="card-b">
        <div class="vapor-day-block">
          <div class="ptar-chart-meta">
            <strong>${esc(v.variable)}</strong>
            <span>${esc(v.frecuencia)}</span>
            <span>Rango: ${esc(v.rango || '—')}</span>
            ${v.unidad ? `<span>Unidad: ${esc(v.unidad)}</span>` : ''}
          </div>
          <div class="ptar-chart-panel vapor-day-panel">
            <div class="ptar-chart-panel-h">
              <h4>Lecturas del día seleccionado</h4>
              <span class="sub">${etiquetaFechaVapor(VAPOR_FECHA,true)} · 07:00 / 19:00</span>
            </div>
            <div class="ptar-process-chart" data-vapor-chart-day="${pi}"></div>
          </div>
        </div>

        <div class="vapor-all-history">
          <div class="vapor-all-history-h">
            <div>
              <h4>Comportamiento histórico de todas las variables</h4>
              <p>Selecciona una gráfica específica o muestra todas las variables del proceso.</p>
            </div>
            <div class="history-toolbar">
              <label class="history-chart-selector">Gráfica a visualizar
                <select data-vapor-history-selector="${pi}" aria-label="Gráfica histórica a visualizar de ${esc(p.nombre)}">${opcionesHistorico}</select>
              </label>
              <span class="vapor-history-key"><i></i>Los puntos rojos indican lecturas fuera del rango de operación.</span>
            </div>
          </div>
          <div class="vapor-history-grid ${histSel==='__all__'?'':'is-single'}">${historicos}</div>
        </div>
      </div>
    </section>`;
  }).join('');

  VAPOR_PROCESOS.forEach((p,pi)=>{
    const todas=vaporVariables(p), v=vaporVariableGrafica(p), histSel=vaporSeleccionHistorico(p);
    renderVaporDia(host.querySelector(`[data-vapor-chart-day="${pi}"]`),p,v);
    const varsHistoricas=histSel==='__all__' ? todas : todas.filter(x=>x.id===histSel);
    varsHistoricas.forEach(hv=>{
      const vi=todas.findIndex(x=>x.id===hv.id);
      renderVaporHistoricoCompleto(
        host.querySelector(`[data-vapor-chart-history="${pi}-${vi}"]`),
        hv
      );
    });
  });

  host.querySelectorAll('[data-vapor-chart-process]').forEach(sel=>{
    sel.addEventListener('change',()=>{
      const pi=Number(sel.dataset.vaporChartProcess), p=VAPOR_PROCESOS[pi];
      if(!p) return;
      VAPOR_GRAFICA_VAR[p.nombre]=sel.value;
      pintarGraficasVapor();
    });
  });
  host.querySelectorAll('[data-vapor-history-selector]').forEach(sel=>{
    sel.addEventListener('change',()=>{
      const pi=Number(sel.dataset.vaporHistorySelector), p=VAPOR_PROCESOS[pi];
      if(!p) return;
      VAPOR_HISTORICO_SEL[p.nombre]=sel.value;
      pintarGraficasVapor();
    });
  });
}
function poblarFechasVapor(){
  const sels=[document.getElementById('vapor-date-select'),document.getElementById('vapor-summary-date-select')].filter(Boolean);
  sels.forEach(sel=>{
    sel.innerHTML=VAPOR_FECHAS.map(f=>`<option value="${f}">${etiquetaFechaVapor(f,true)}</option>`).join('');
    sel.value=VAPOR_FECHA || '';
    if(!sel.dataset.bound){
      sel.dataset.bound='1';
      sel.addEventListener('change',()=>{
        VAPOR_FECHA=sel.value;
        sels.forEach(s=>s.value=VAPOR_FECHA);
        pintarVapor();
        pintarValores();
        pintarEncabezado();
      });
    }
  });
}
function vaporVentanaHistorial(){
  return vaporVentana7Dias();
}
function pintarHistorialVapor(){
  const host=document.getElementById('vapor-historial');
  if(!host) return;
  const fechas=vaporVentanaHistorial();
  host.innerHTML=`<div class="ptar-history">${fechas.map(f=>{
    const st=vaporStats(null,f), pct=st.controladas?st.pctNormal:0;
    const meta=st.registradas ? `${st.controladas ? pct.toFixed(1)+'%' : '—'} · ${st.desviaciones} fuera` : 'Sin registros';
    return `<div class="ptar-history-row ${f===VAPOR_FECHA?'is-selected':''}">
      <span class="ptar-history-date">${etiquetaFechaVapor(f)}</span>
      <span class="ptar-history-meter"><i style="width:${pct.toFixed(1)}%"></i></span>
      <span class="ptar-history-meta"><b>${st.controladas?pct.toFixed(1)+'%':'—'}</b> · ${esc(meta.split(' · ').slice(1).join(' · ') || meta)}</span>
    </div>`;
  }).join('')}</div>`;
}
function pintarDesviacionesVapor(){
  const host=document.getElementById('vapor-desviaciones');
  const count=document.getElementById('vapor-desv-count');
  if(!host) return;
  const list=registrosFechaVapor().filter(r=>estadoRegistroVapor(r)==='FUERA DE RANGO');
  if(count) count.textContent=list.length ? `${list.length} detectada${list.length===1?'':'s'}` : 'ninguna';
  host.innerHTML=list.length ? list.map(r=>{
    const v=vaporDefPorId(r.id);
    return `<div class="ptar-dev">
      <span class="bar" style="background:${C.crit}"></span>
      <div class="body">
        <div class="title">${esc(r.variable)} · ${valorTextoVapor(r)}${v && v.unidad?' '+esc(v.unidad):''}</div>
        <div class="meta">${esc(r.proceso)} · ${esc(r.frecuencia)} · rango ${esc(r.rango || '—')}</div>
        ${r.operador?`<div class="obs">Operador: ${esc(r.operador)}</div>`:''}
      </div>
      <time>${esc(r.turno)}</time>
    </div>`;
  }).join('') : `<p class="empty">No hay variables registradas fuera de rango el ${etiquetaFechaVapor(VAPOR_FECHA,true)}.</p>`;
}
function pintarVapor(){
  if(!VAPOR_PROCESOS.length) return;
  poblarFechasVapor();
  const total=vaporStats();
  const eTotal=vaporEstado(total);

  document.querySelectorAll('[data-vapor-summary-count]').forEach(el=>el.textContent=String(total.registradas));
  const sumPill=document.querySelector('[data-vapor-summary-pill]');
  if(sumPill){
    sumPill.className='pill '+eTotal.st;
    sumPill.innerHTML='<i></i>'+esc(eTotal.txt);
  }
  const stripVal=document.querySelector('[data-vapor-strip-value]');
  if(stripVal) stripVal.textContent=String(total.desviaciones);
  const stripPill=document.querySelector('[data-vapor-strip-pill]');
  if(stripPill){
    stripPill.className='pill '+eTotal.st;
    stripPill.innerHTML='<i></i>'+esc(eTotal.txt);
  }

  const resumen=document.getElementById('vapor-resumen-procesos');
  if(resumen){
    resumen.innerHTML=VAPOR_PROCESOS.map(p=>{
      const st=vaporStats(p), e=vaporEstado(st);
      return `<div class="ptar-summary-process">
        <div class="ptar-summary-process-h"><strong>${esc(p.nombre)}</strong><span class="pill ${e.st}"><i></i>${esc(e.txt)}</span></div>
        <div class="ptar-summary-process-v"><b>${st.variables}</b> variables · ${st.registradas} lecturas · ${st.desviaciones} fuera</div>
        <div class="ptar-progress"><i style="width:${st.controladas?st.pctNormal.toFixed(1):0}%"></i></div>
      </div>`;
    }).join('');
  }

  const kpis=document.getElementById('vapor-kpis-proceso');
  if(kpis){
    kpis.innerHTML=VAPOR_PROCESOS.map(p=>{
      const st=vaporStats(p), e=vaporEstado(st);
      return `<div class="kpi vapor-process-kpi">
        <div class="lbl"><span>${esc(p.nombre)}</span><span class="pill ${e.st}" style="margin-left:auto"><i></i>${esc(e.txt)}</span></div>
        <div class="v tnum">${st.registradas}<small>lecturas</small></div>
        <div class="rng">${st.variables} variables · ${st.controladas} con rango evaluadas</div>
        <div class="ptar-progress"><i style="width:${st.controladas?st.pctNormal.toFixed(1):0}%"></i></div>
      </div>`;
    }).join('');
  }

  const host=document.getElementById('vapor-procesos');
  if(host){
    const ops=operadoresFechaVapor();
    host.innerHTML=VAPOR_PROCESOS.map((p,pi)=>{
      const st=vaporStats(p), e=vaporEstado(st);
      const rows=vaporVariables(p).map(v=>{
        const regs=VAPOR_TURNOS.map(t=>registroVapor(v.id,t));
        const dev=regs.some(r=>estadoRegistroVapor(r)==='FUERA DE RANGO');
        const celdas=regs.map(r=>{
          const est=estadoRegistroVapor(r), cls=claseEstadoVapor(est);
          return `<td class="num ptar-lectura ${cls}" title="${esc(est)}">${valorTextoVapor(r)}</td>`;
        }).join('');
        return `<tr class="${dev?'has-dev':''}">
          <td>${esc(v.variable)}</td>
          <td>${esc(v.frecuencia)}</td>
          <td class="ptar-rango tnum">${esc(v.rango || '—')}</td>
          ${celdas}
        </tr>`;
      }).join('');
      return `<section class="card ptar-process-card vapor-theme" aria-labelledby="vapor-proceso-${pi}">
        <div class="card-h">
          <h3 id="vapor-proceso-${pi}">${esc(p.nombre)}</h3>
          <span class="pill ${e.st}"><i></i>${esc(e.txt)}</span>
          <span class="note">${etiquetaFechaVapor(VAPOR_FECHA,true)} · ${st.registradas} lecturas</span>
        </div>
        <div class="card-b ptar-table-wrap">
          <table class="tbl ptar-table vapor-table">
            <thead><tr>
              <th>Variable de control</th>
              <th>Frecuencia</th>
              <th>Rango de operación</th>
              <th class="num">07:00${ops['07:00']?`<small>${esc(ops['07:00'])}</small>`:''}</th>
              <th class="num">19:00${ops['19:00']?`<small>${esc(ops['19:00'])}</small>`:''}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
    }).join('');
  }

  pintarGraficasVapor();
  pintarHistorialVapor();
  pintarDesviacionesVapor();
}
function normalizarFilasVapor(rows){
  return (rows||[]).map(r=>{
    const fecha=normalizarFechaVapor(r.Fecha ?? r.fecha);
    const valorRaw=r.Valor ?? r.valor;
    const valor=vaporNumeroLocal(valorRaw);
    return {
      fecha,
      turno:String(r.Turno ?? r.turno ?? '').trim(),
      operador:String(r.Operador ?? r.operador ?? '').trim(),
      proceso:String(r.Proceso ?? r.proceso ?? '').trim(),
      variable:String(r['Variable de control'] ?? r.variable ?? '').trim(),
      frecuencia:String(r.Frecuencia ?? r.frecuencia ?? '').trim(),
      rango:String(r['Rango Operación'] ?? r.Rango ?? r.rango ?? '').trim(),
      valor,
      unidad:String(r.Unidad ?? r.unidad ?? '').trim(),
      tipo:String(r['Tipo Rango'] ?? r.tipo ?? '').trim(),
      min:vaporNumeroLocal(r['Mínimo'] ?? r.min),
      max:vaporNumeroLocal(r['Máximo'] ?? r.max),
      id:String(r.VariableId ?? r.id ?? '').trim()
    };
  }).filter(r=>r.fecha && r.turno && r.id && r.valor !== null);
}
function cargarDatosVapor(rows,fechas,procesos,fuente,tipo='fallback'){
  const norm=normalizarFilasVapor(rows);
  if(procesos && procesos.length) VAPOR_PROCESOS=procesos;
  VAPOR_DATA=norm;
  const dataFechas=[...new Set(norm.map(r=>r.fecha))].sort();
  VAPOR_FECHAS=(fechas && fechas.length ? [...new Set(fechas)] : dataFechas).sort();
  const ultimaConDatos=dataFechas[dataFechas.length-1] || VAPOR_FECHAS[VAPOR_FECHAS.length-1] || null;
  if(!VAPOR_FECHA || !VAPOR_FECHAS.includes(VAPOR_FECHA) || !registrosFechaVapor(VAPOR_FECHA).length) VAPOR_FECHA=ultimaConDatos;
  VAPOR_FUENTE=fuente || VAPOR_FUENTE;
  poblarFechasVapor();
  if(document.body && document.body.dataset.dashboardReady==='1'){
    pintarVapor();
    pintarValores();
    pintarEncabezado();
  }
}
async function leerHojaXLSXVapor(zip,target,shared){
  const parser=new DOMParser();
  const shXml=parser.parseFromString(await zip.text(target),'application/xml');
  const out=new Map();
  [...shXml.getElementsByTagNameNS('*','row')].forEach(row=>{
    const rn=Number(row.getAttribute('r'));
    const arr=[];
    [...row.getElementsByTagNameNS('*','c')].forEach(c=>{
      const idx=colIndexPTAR(c.getAttribute('r'));
      const t=c.getAttribute('t');
      let value='';
      if(t==='inlineStr'){
        value=[...c.getElementsByTagNameNS('*','t')].map(x=>x.textContent||'').join('');
      }else{
        const ve=c.getElementsByTagNameNS('*','v')[0];
        const raw=ve?ve.textContent:'';
        if(t==='s') value=shared[Number(raw)] ?? '';
        else if(t==='str') value=raw;
        else if(raw!==''){
          const n=Number(raw); value=Number.isFinite(n)?n:raw;
        }
      }
      arr[idx]=value;
    });
    out.set(rn,arr);
  });
  return out;
}
async function leerExcelVapor(buffer){
  const zip=await abrirZipPTAR(buffer);
  const parser=new DOMParser();
  const wbXml=parser.parseFromString(await zip.text('xl/workbook.xml'),'application/xml');
  const relXml=parser.parseFromString(await zip.text('xl/_rels/workbook.xml.rels'),'application/xml');
  const rels=[...relXml.getElementsByTagNameNS('*','Relationship')];
  let shared=[];
  if(zip.entries.has('xl/sharedStrings.xml')){
    const ssXml=parser.parseFromString(await zip.text('xl/sharedStrings.xml'),'application/xml');
    shared=[...ssXml.getElementsByTagNameNS('*','si')].map(si=>[...si.getElementsByTagNameNS('*','t')].map(t=>t.textContent||'').join(''));
  }
  const sheets=[...wbXml.getElementsByTagNameNS('*','sheet')].filter(s=>/^\d{2}-\d{2}-\d{2}$/.test(s.getAttribute('name')||''));
  if(!sheets.length) throw new Error('No se encontraron las planillas diarias de calderas.');
  const hojas=[];
  for(const s of sheets){
    const name=s.getAttribute('name');
    const rid=s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id') || s.getAttribute('r:id');
    const rel=rels.find(r=>r.getAttribute('Id')===rid);
    if(!rel) continue;
    let target=rel.getAttribute('Target').replace(/^\//,'');
    if(!target.startsWith('xl/')) target='xl/'+target.replace(/^\.\//,'');
    const rows=await leerHojaXLSXVapor(zip,target,shared);
    hojas.push({name,rows});
  }
  if(!hojas.length) throw new Error('No se pudieron leer las hojas diarias de calderas.');

  const primera=hojas[0].rows;
  const procesos=[], procMap=new Map();
  let procesoActual='';
  let ordinal=0;
  for(let rn=14;rn<=76;rn++){
    const row=primera.get(rn)||[];
    if(tieneLecturaVapor(row[0])) procesoActual=String(row[0]).trim();
    if(!tieneLecturaVapor(row[1])) continue;
    ordinal++;
    const variable=String(row[1]).trim();
    const frecuencia=String(row[2]??'').trim();
    const rango=String(row[3]??'').trim();
    const pr=vaporParseRange(rango);
    const v={id:`vapor_${String(ordinal).padStart(2,'0')}`,fila:rn,proceso:procesoActual,variable,frecuencia,rango,unidad:vaporUnidad(rango,variable),tipo:pr.tipo,min:pr.min,max:pr.max};
    if(!procMap.has(procesoActual)){
      const p={nombre:procesoActual,variables:[]}; procMap.set(procesoActual,p); procesos.push(p);
    }
    procMap.get(procesoActual).variables.push(v);
  }
  const defByRow=new Map(procesos.flatMap(p=>p.variables).map(v=>[v.fila,v]));
  const registros=[], fechas=[];
  for(const h of hojas){
    const r11=h.rows.get(11)||[];
    let fecha=normalizarFechaVapor(r11[1]);
    if(!fecha) fecha=vaporFechaDesdeNombre(h.name);
    if(!fecha) continue;
    fechas.push(fecha);
    const op07=tieneLecturaVapor(r11[4])?String(r11[4]).trim():'';
    const op19=tieneLecturaVapor(r11[5])?String(r11[5]).trim():'';
    for(const [rn,v] of defByRow.entries()){
      const row=h.rows.get(rn)||[];
      [[ '07:00',row[4],op07 ],[ '19:00',row[5],op19 ]].forEach(([turno,raw,operador])=>{
        if(!tieneLecturaVapor(raw)) return;
        const valor=vaporNumeroLocal(raw);
        if(valor===null) return;
        registros.push({
          Fecha:fecha,Turno:turno,Operador:operador,Proceso:v.proceso,'Variable de control':v.variable,
          Frecuencia:v.frecuencia,'Rango Operación':v.rango,Valor:valor,Unidad:v.unidad,'Tipo Rango':v.tipo,
          'Mínimo':v.min,'Máximo':v.max,VariableId:v.id,Hoja:h.name
        });
      });
    }
  }
  return {rows:registros,fechas:[...new Set(fechas)].sort(),procesos};
}
async function cargarExcelVaporArchivo(file,origen='archivo seleccionado'){
  const r=await leerExcelVapor(await file.arrayBuffer());
  cargarDatosVapor(r.rows,r.fechas,r.procesos,`${file.name} · ${r.rows.length} lecturas · ${origen}`,'excel');
}
async function cargarVaporAutomatico(){
  if(location.protocol === 'file:') return;
  try{
    const resp=await fetch('Reporte Control Generacion de Vapor.xlsx',{cache:'no-store'});
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const r=await leerExcelVapor(await resp.arrayBuffer());
    cargarDatosVapor(r.rows,r.fechas,r.procesos,`Reporte Control Generacion de Vapor.xlsx · ${r.rows.length} lecturas · carga automática`,'excel');
  }catch(err){
    // Al abrir con doble clic, el navegador bloquea fetch local. Los datos precargados siguen visibles.
  }
}
function inicializarVaporExcel(){
  const input=document.getElementById('vapor-excel-input');
  if(input && !input.dataset.bound){
    input.dataset.bound='1';
    input.addEventListener('change',async()=>{
      const file=input.files && input.files[0];
      if(!file) return;
      try{ await cargarExcelVaporArchivo(file); }
      catch(err){ alert('No se pudo leer el Excel de Vapor: '+err.message); }
      finally{ input.value=''; }
    });
  }
  cargarVaporAutomatico();
}

if(window.VAPOR_FALLBACK_DATA && window.VAPOR_FALLBACK_DATA.length){
  cargarDatosVapor(
    window.VAPOR_FALLBACK_DATA,
    window.VAPOR_FALLBACK_FECHAS || [],
    window.VAPOR_FALLBACK_PROCESOS || [],
    'Reporte Control Generacion de Vapor.xlsx · datos precargados para apertura local',
    'fallback'
  );
}


/* ---------------------------------------------------------
   8. Tablas de equipos (valores por ronda)
   Una celda puede ser texto fijo, un arreglo de tres lecturas
   o una píldora de estado.
   --------------------------------------------------------- */
const P = (st, txt) => ({pill:true, st, txt});
const pick = (x) => Array.isArray(x) ? x[ronda] : x;

const TABLAS = {
  'tb-ptab':{
    cols:['Equipo','Estado','Volumen tratado','Dureza salida','Próxima regeneración'],
    rows:[
      ['Suavizador S-1', P('ok','En servicio'), ['128 m³','311 m³','486 m³'], ['5.9 ppm','6.8 ppm','8.1 ppm'], ['en 372 m³','en 189 m³','en 14 m³']],
      ['Suavizador S-2', P('ok','En servicio'), ['96 m³','338 m³','502 m³'], ['6.1 ppm','7.4 ppm','8.6 ppm'], ['en 404 m³','en 162 m³','pendiente']],
      ['Suavizador S-3', P(['ok','warn','ok'],['En servicio','Regenerando','En servicio']), ['440 m³','500 m³','122 m³'], ['7.8 ppm','—','5.4 ppm'], ['en 60 m³','en curso · 22 min','en 378 m³']],
      ['Filtro multimedia F-1', P(['warn','ok','ok'],['Retrolavando','En servicio','En servicio']), ['—','420 m³','1 240 m³'], '—', ['en curso','retrolavado 22:00','retrolavado 22:00']],
      ['Bomba de red B-101', P(['ok','ok','idle'],['Marcha','Marcha','Reserva']), ['2 106 h','2 110 h','2 118 h'], '—', '—'],
      ['Bomba de red B-102', P(['idle','idle','ok'],['Reserva','Reserva','Marcha']), ['1 903 h','1 903 h','1 909 h'], '—', '—'],
    ]},
  'tb-vapor':{
    cols:['Equipo','Estado','Carga','Horas','Observación'],
    rows:[
      ['Caldera C-1 · 400 BHP', P('ok','Marcha'), ['52 %','78 %','84 %'], ['14 604 h','14 612 h','14 620 h'], ['arranque en frío 05:40','purga automática activa','purga automática activa']],
      ['Caldera C-2 · 250 BHP', P(['idle','idle','ok'],['Reserva','Reserva','Marcha']), ['0 %','0 %','38 %'], ['9 415 h','9 415 h','9 421 h'], ['lista para arranque','lista para arranque','apoyo por pico de CIP']],
      ['Tanque de condensados', P('ok','Normal'), ['58 %','71 %','66 %'], '—', ['retorno a 79 °C','retorno a 84 °C','retorno a 86 °C']],
      ['Desaireador', P('ok','Normal'), '—', '—', ['O₂ 0.008 mg/L','O₂ 0.006 mg/L','O₂ 0.005 mg/L']],
      ['Trampas de vapor', P(['ok','warn','warn'],['Sin novedad','3 con fuga','3 con fuga']), '—', '—', ['revisión programada 09:00','TV-14, TV-27, TV-31','TV-14, TV-27, TV-31']],
    ]},
  'tb-aire':{
    cols:['Equipo','Estado','Carga','Horas','Mantenimiento'],
    rows:[
      ['Compresor CA-1 · tornillo', P('ok','Carga'), ['61 %','82 %','88 %'], ['21 472 h','21 480 h','21 489 h'], ['en 528 h','en 520 h','en 511 h']],
      ['Compresor CA-2 · tornillo', P(['idle','ok','ok'],['Detenido','Carga','Carga']), ['0 %','64 %','71 %'], ['18 894 h','18 902 h','18 911 h'], ['en 1 106 h','en 1 098 h','en 1 089 h']],
      ['Compresor CA-3 · respaldo', P('idle','Detenido'), '0 %', '7 331 h', 'en 2 669 h'],
      ['Secador refrigerativo SD-1', P(['ok','ok','warn'],['Normal','Normal','Exigido']), '—', '—', ['filtro en 15 d','filtro en 14 d','revisar condensador']],
      ['Tanque pulmón · 3 000 L', P('ok','Normal'), '—', '—', 'purga cada 30 min'],
    ]},
  'tb-frio':{
    cols:['Equipo','Estado','Succión','Descarga','Horas'],
    rows:[
      ['Compresor CR-1 · tornillo', P('ok','Marcha'), ['2.4 bar','2.6 bar','2.7 bar'], ['10.8 bar','11.4 bar','12.1 bar'], ['32 102 h','32 110 h','32 119 h']],
      ['Compresor CR-2 · tornillo', P(['idle','ok','ok'],['Detenido','Marcha','Marcha']), ['—','2.5 bar','2.6 bar'], ['—','11.6 bar','12.3 bar'], ['29 736 h','29 744 h','29 753 h']],
      ['Compresor CR-3 · pistón', P('idle','Detenido'), '—', '—', '12 088 h'],
      ['Condensador evaporativo CE-1', P('ok','Marcha'), '—', '—', ['purga 1.8 m³/h','purga 2.1 m³/h','purga 2.4 m³/h']],
      ['Bomba de amoníaco BA-1', P('ok','Marcha'), '—', '—', ['18 252 h','18 260 h','18 269 h']],
    ]},
  'tb-ptar':{
    cols:['Etapa','Estado','Variable','Lectura','Límite'],
    rows:[
      ['Cribado y desarenador', P('ok','Normal'), 'sólidos retirados', ['12 kg','26 kg','38 kg'], '—'],
      ['Trampa de grasas · DAF', P(['ok','ok','warn'],['Normal','Normal','Atención']), 'grasas y aceites', ['38 mg/L','49 mg/L','62 mg/L'], '75 mg/L'],
      ['Tanque de homogeneización', P('ok','Normal'), 'nivel', ['48 %','64 %','77 %'], '—'],
      ['Reactor biológico', P('ok','Normal'), 'SSLM', ['3 180 mg/L','3 240 mg/L','3 310 mg/L'], '2 500 – 4 000'],
      ['Sedimentador secundario', P(['ok','ok','warn'],['Normal','Normal','Atención']), 'SST salida', ['29 mg/L','41 mg/L','68 mg/L'], '75 mg/L'],
      ['Soplador SB-1', P('ok','Marcha'), 'caudal de aire', ['360 Nm³/h','410 Nm³/h','455 Nm³/h'], '—'],
      ['Filtro prensa de lodos', P(['idle','ok','ok'],['Fuera de turno','Marcha','Marcha']), 'sequedad de torta', ['—','21 %','22 %'], '—'],
    ]},
};

function pintarTablas(){
  for(const id in TABLAS){
    const host = document.getElementById(id);
    if(!host) continue;
    const t = TABLAS[id];
    const head = t.cols.map((c,i)=>`<th${i > 1 ? ' class="num"' : ''}>${esc(c)}</th>`).join('');
    const body = t.rows.map(r=>'<tr>' + r.map((cell,i)=>{
      if(cell && cell.pill){
        const st = pick(cell.st), txt = pick(cell.txt);
        return `<td><span class="pill ${st}"><i></i>${esc(txt)}</span></td>`;
      }
      const val = esc(pick(cell));
      return i === 0 ? `<td>${val}</td>` : `<td class="num">${val}</td>`;
    }).join('') + '</tr>').join('');
    host.innerHTML = `<table class="tbl"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }
}

/* ---------------------------------------------------------
   9. Construcción de la interfaz
   --------------------------------------------------------- */
const LINEAS = [
  {n:'Mayonesa',        prog:[12, 45, 78], tasa:['1 900 kg/h','4 200 kg/h','4 600 kg/h']},
  {n:'Rikesa',          prog:[4, 31, 54],  tasa:['1 200 kg/h','2 800 kg/h','3 100 kg/h']},
  {n:'Salsa de tomate', prog:[28, 58, 91], tasa:['2 400 kg/h','5 100 kg/h','5 400 kg/h']},
];

function buildKPIs(){
  document.querySelectorAll('[data-kpis]').forEach(box=>{
    box.innerHTML = KPI_TABS[box.dataset.kpis].map(k=>
      `<div class="kpi">
         <div class="lbl"><span>${esc(V[k].lbl)}</span><span class="pill ok" data-st="${k}" style="margin-left:auto"><i></i>Normal</span></div>
         <div class="v tnum"><span data-v="${k}">—</span>${V[k].u ? `<small>${esc(V[k].u)}</small>` : ''}</div>
         <div class="rng">${esc(rangoTexto(k))}</div>
         <div class="delta" data-d="${k}"></div>
       </div>`).join('');
  });
}
function buildStrip(){
  document.getElementById('strip').innerHTML = ['ptab','vapor','aire','frio','ptar'].map(id=>{
    const s = SERVICIOS[id];
    if(id === 'vapor'){
      return `<button class="svc" data-goto="vapor" style="--k:${s.color}">
        <div class="n"><span>${esc(s.corto)}</span><span class="pill idle" data-vapor-strip-pill style="margin-left:auto"><i></i>Sin registros</span></div>
        <p class="lbl">Control de calderas · 6 procesos · 58 variables</p>
        <div class="v tnum"><span data-vapor-strip-value>—</span><small>fuera de rango</small></div>
        <div class="svc-meta">Turnos 07:00 · 19:00</div>
      </button>`;
    }
    if(id === 'ptar'){
      return `<button class="svc" data-goto="ptar" style="--k:${s.color}">
        <div class="n"><span>${esc(s.corto)}</span><span class="pill idle" data-ptar-strip-pill style="margin-left:auto"><i></i>Sin registros</span></div>
        <p class="lbl">Control operacional · 4 procesos · 30 variables</p>
        <div class="v tnum"><span data-ptar-strip-value>—</span><small>fuera de rango</small></div>
        <div class="svc-meta">Turnos 07:00 · 19:00</div>
      </button>`;
    }
    const k = s.kpi;
    return `<button class="svc" data-goto="${id}" style="--k:${s.color}">
      <div class="n"><span>${esc(s.corto)}</span><span class="pill ok" data-st="${k}" style="margin-left:auto"><i></i>Normal</span></div>
      <p class="lbl">${esc(V[k].lbl)}</p>
      <div class="v tnum"><span data-v="${k}">—</span>${V[k].u ? `<small>${esc(V[k].u)}</small>` : ''}</div>
      <div class="spark" data-spark="${k}" data-color="${s.color}"></div>
    </button>`;
  }).join('');
}
function buildLegends(){
  const find = sel => REG.find(r => r.sel === sel).cfg.series;
  const put = (sel, series) => {
    const el = document.querySelector(sel);
    if(el) el.innerHTML = series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
  };
  put('#l-demanda', find('#c-demanda'));
  put('#l-lineas', CONSUMO_LINEA.series);
  put('#l-vapor', find('#c-vapor-efi'));
  put('#l-frio-temp', find('#c-frio-temp'));
  put('#l-frio-pres', find('#c-frio-pres'));
}
function pintarLineas(){
  document.getElementById('lineas-prod').innerHTML = LINEAS.map(l=>
    `<div class="line-row">
       <span class="nm">${esc(l.n)}</span>
       <span class="meter"><i style="width:${l.prog[ronda]}%"></i></span>
       <span class="pc tnum">${l.prog[ronda]} %</span>
     </div>`).join('') +
    `<p class="thr">Ritmo a las ${RONDAS[ronda].hora}: ${LINEAS.map(l=>esc(l.n)+' ' + l.tasa[ronda]).join(' · ')}</p>`;
}

function alarmas(){
  const out = [];
  for(const svc in SERVICIOS){
    const s = SERVICIOS[svc];
    if(!s.keys || !s.keys.length) continue;
    s.keys.forEach(k=>{
      if(k === 'frio.nh3') return;          // lo reporta el detector, con su ubicación
      const st = estado(k);
      if(st === 'ok') return;
      out.push({st, msg:`${V[k].lbl} en ${fmt(k)} ${V[k].u}`.trim(), meta:`${s.corto} · ${rangoTexto(k)}`});
    });
  }
  DETECTORES.forEach(d=>{
    const p = d.ppm[ronda];
    if(p >= 25) out.push({st: p >= 35 ? 'crit' : 'warn',
      msg:`Amoníaco en ${d.loc}: ${p.toFixed(1)} ppm`, meta:`Detector ${d.id} · aviso desde 25 ppm`});
  });
  return out.sort((a,b)=> (a.st === 'crit' ? 0 : 1) - (b.st === 'crit' ? 0 : 1));
}
function pintarAlarmas(){
  const box = document.getElementById('alarmas'), list = alarmas();
  document.getElementById('alarm-count').textContent = list.length ? `${list.length} sin atender` : 'ninguna';
  box.innerHTML = list.length ? list.slice(0,7).map(a=>
    `<div class="alarm" style="--k:${a.st === 'crit' ? C.crit : C.warn}">
       <span class="bar"></span>
       <div><div class="msg">${esc(a.msg)}</div><div class="meta">${esc(a.meta)}</div></div>
       <time>${RONDAS[ronda].hora}</time>
     </div>`).join('')
    : `<p class="empty">Sin desviaciones en la ronda de las ${RONDAS[ronda].hora}.</p>`;
}
function pintarDetectores(){
  document.getElementById('detectores').innerHTML = DETECTORES.map(d=>{
    const p = d.ppm[ronda], st = p >= 35 ? 'crit' : p >= 25 ? 'warn' : 'ok';
    return `<div class="sensor ${st}">
      <div class="n"><strong>${d.id}</strong><span class="pill ${st}" style="margin-left:auto"><i></i>${ETIQ[st]}</span></div>
      <div class="loc">${esc(d.loc)}</div>
      <div class="ppm tnum">${p.toFixed(1)}<small>ppm</small></div>
      <div class="bar"><i style="width:${Math.min(100, p/50*100)}%"></i></div>
    </div>`;
  }).join('');
}

/* ---------------------------------------------------------
   10. Repintado
   --------------------------------------------------------- */
let activa = 'resumen';

function pintarValores(){
  document.querySelectorAll('[data-v]').forEach(el=>{ el.textContent = fmt(el.dataset.v); });
  document.querySelectorAll('[data-st]').forEach(el=>{
    const st = estado(el.dataset.st);
    el.className = 'pill ' + st;
    el.innerHTML = '<i></i>' + ETIQ[st];
  });
  document.querySelectorAll('[data-spark]').forEach(el=>{
    el.innerHTML = sparkline(el.dataset.spark, el.dataset.color);
  });
  document.querySelectorAll('[data-d]').forEach(el=>{
    const k = el.dataset.d, ant = previa(k);
    if(ant == null){ el.className = 'delta'; el.textContent = 'Primera lectura del día'; return; }
    const d = cur(k) - ant, dir = Math.abs(d) < Math.pow(10, -V[k].dec)/2 ? '' : (d > 0 ? 'up' : 'down');
    el.className = 'delta ' + dir;
    el.innerHTML = dir === ''
      ? `Sin cambio respecto a las ${RONDAS[ronda-1].hora}`
      : `<b>${d > 0 ? '▲' : '▼'} ${fmt(k, Math.abs(d))}</b> respecto a las ${RONDAS[ronda-1].hora}`;
  });
  for(const svc in SERVICIOS){
    const s = SERVICIOS[svc], dot = document.querySelector(`[data-tabst="${svc}"]`);
    if(!dot) continue;
    let st = 'ok';
    if(svc === 'resumen'){
      const all = alarmas();
      const desvVapor = typeof vaporStats === 'function' ? vaporStats().desviaciones : 0;
      const desvPTAR = typeof ptarStats === 'function' ? ptarStats().desviaciones : 0;
      st = all.some(a=>a.st === 'crit') ? 'crit' : (all.length || desvVapor || desvPTAR) ? 'warn' : 'ok';
    } else if(svc === 'vapor'){
      st = vaporEstado(vaporStats()).st;
    } else if(svc === 'ptar'){
      st = ptarEstado(ptarStats()).st;
    } else {
      s.keys.forEach(k=>{
        const e = estado(k);
        if(e === 'crit') st = 'crit';
        else if(e === 'warn' && st !== 'crit') st = 'warn';
      });
    }
    dot.className = 'st ' + (st === 'ok' ? '' : st);
  }
}
function pintarGraficas(){
  REG.filter(r => r.tab === activa).forEach(r => draw(r.sel, r.cfg));
}
function refrescar(){
  pintarValores();
  pintarAlarmas();
  pintarDetectores();
  pintarLineas();
  pintarTablas();
  pintarVapor();
  pintarPTAR();
  pintarGraficas();
}

/* Encabezado */
const FECHA = new Date().toLocaleDateString('es-VE',{day:'numeric', month:'long', year:'numeric'});
function pintarEncabezado(){
  const R = RONDAS[ronda];
  const rondas = document.querySelector('.rondas');
  document.getElementById('view-title').textContent = SERVICIOS[activa].nom;
  if(activa === 'vapor'){
    document.getElementById('view-sub').textContent = `${SERVICIOS.vapor.sub} · ${etiquetaFechaVapor(VAPOR_FECHA,true)} · lecturas 07:00 y 19:00`;
    document.getElementById('stamp').textContent = `${VAPOR_FECHAS.length || 0} días en archivo · ${VAPOR_FUENTE}`;
    if(rondas) rondas.hidden = true;
    return;
  }
  if(activa === 'ptar'){
    document.getElementById('view-sub').textContent = `${SERVICIOS.ptar.sub} · ${etiquetaFechaPTAR(PTAR_FECHA,true)} · lecturas 07:00 y 19:00`;
    document.getElementById('stamp').textContent = `${PTAR_FECHAS.length || 0} días cargados · ${PTAR_FUENTE}`;
    if(rondas) rondas.hidden = true;
    return;
  }
  if(rondas) rondas.hidden = false;
  document.getElementById('view-sub').textContent = `${SERVICIOS[activa].sub} · lectura de las ${R.hora}`;
  document.getElementById('stamp').textContent = `${R.turno} · ${R.etiq} · ${FECHA}`;
  document.querySelectorAll('[data-ronda]').forEach(b=>
    b.setAttribute('aria-pressed', String(+b.dataset.ronda === ronda)));
}

/* Navegación entre servicios */
function ir(id){
  activa = id;
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
  document.querySelectorAll('.view').forEach(v => { v.hidden = (v.id !== 'v-' + id); });
  pintarEncabezado();
  window.scrollTo(0, 0);
  if(id === 'vapor') pintarVapor();
  else if(id === 'ptar') pintarPTAR();
  else pintarGraficas();
}
document.querySelectorAll('.tab').forEach(b=>{
  b.addEventListener('click', ()=>ir(b.dataset.tab));
  b.addEventListener('keydown', e=>{
    const tabs = Array.from(document.querySelectorAll('.tab')), i = tabs.indexOf(b);
    if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); tabs[(i+1)%tabs.length].focus(); }
    if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); tabs[(i-1+tabs.length)%tabs.length].focus(); }
  });
});
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-goto]');
  if(b) ir(b.dataset.goto);
});

/* Cambio de ronda */
document.querySelectorAll('[data-ronda]').forEach(b=>{
  b.addEventListener('click', ()=>{
    ronda = +b.dataset.ronda;
    pintarEncabezado();
    refrescar();
  });
});

/* Redibujo al cambiar el tamaño de la ventana */
let rt;
window.addEventListener('resize', ()=>{
  clearTimeout(rt);
  rt = setTimeout(()=>{
    if(activa === 'vapor') pintarGraficasVapor();
    else if(activa === 'ptar') pintarGraficasPTAR();
    else pintarGraficas();
  },140);
});

/* Arranque */
buildKPIs();
buildStrip();
buildLegends();
pintarEncabezado();
refrescar();
document.body.dataset.dashboardReady = '1';
inicializarPTARExcel();
inicializarVaporExcel();
