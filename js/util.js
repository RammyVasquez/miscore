// Utilidades puras: formato de dinero y fechas, iconos.

export const $=s=>document.querySelector(s);
export const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid8=()=>Math.random().toString(36).slice(2,9);
export const round2=x=>Math.round((+x||0)*100)/100;
export const num=v=>{const n=parseFloat(String(v==null?'':v).replace(/[^0-9.,\-]/g,'').replace(',','.'));return isNaN(n)?0:n};
export const MX0=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0,maximumFractionDigits:0});
export const MX2=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2});
// Modo privado: oculta todos los montos de las pantallas (se recuerda en este dispositivo)
export const privacy = { hidden: false };
try { privacy.hidden = localStorage.getItem('mf-hide') === '1'; } catch (e) {}
export function setHidden(v) { privacy.hidden = !!v; try { localStorage.setItem('mf-hide', v ? '1' : '0'); } catch (e) {} }
export const money=n=>{if(privacy.hidden)return '•••••';n=+n||0;return Math.abs(n%1)<0.005?MX0.format(Math.round(n)):MX2.format(n)};
export const shortMoney=n=>{if(privacy.hidden)return '•';n=+n||0;const a=Math.abs(n);return (n<0?'-':'')+'$'+(a>=1000?(Math.round(a/100)/10).toString().replace(/\.0$/,'')+'k':Math.round(a))};
export const pad=n=>String(n).padStart(2,'0');
export const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
export const ymOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1);
export const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const MES3=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
export const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
export const lastDay=(y,m)=>new Date(y,m,0).getDate();
export const parseYM=ym=>{const p=ym.split('-').map(Number);return {y:p[0],m:p[1]}};
export const addMonths=(ym,n)=>{const p=parseYM(ym);return ymOf(new Date(p.y,p.m-1+n,1))};
export const fmtDate=s=>{const p=s.split('-').map(Number);return p[2]+' '+MES3[p[1]-1]};
export const stable=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
export const clean=o=>JSON.parse(JSON.stringify(o));
export function midnight(){const t=new Date();t.setHours(0,0,0,0);return t}
export function nextOcc(day){const t=midnight();let y=t.getFullYear(),m=t.getMonth();for(let i=0;i<4;i++){const d=Math.min(day,lastDay(y,m+1));const c=new Date(y,m,d);if(c>=t)return c;m++;if(m>11){m=0;y++}}return t}
export const daysTo=d=>Math.round((d-midnight())/86400000);
export const inDays=d=>d===0?'hoy':d===1?'mañana':'en '+d+' días';
export const fdate=d=>d.getDate()+' '+MES3[d.getMonth()];
export const ICONS={
  resumen:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  quincena:'<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  gastos:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  tarjetas:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
  metas:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  fijos:'<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 014-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 01-4 4H4"/>',
  reportes:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  ajustes:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  mas:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  proyecciones:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  vales:'<path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 3"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9"/><path d="M6.6 6.7C3.9 8.4 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>'
};
export const ic=n=>'<svg class="i" viewBox="0 0 24 24" aria-hidden="true">'+ICONS[n]+'</svg>';
export const sum=(arr,f)=>arr.reduce((s,x)=>s+f(x),0);
export const monthIdx=ym=>{const p=parseYM(ym);return p.y*12+p.m};
// Primer día con ese número de día del mes que sea DESPUÉS de la fecha dada
export function nextOccAfter(day,date){let y=date.getFullYear(),m=date.getMonth();for(let i=0;i<14;i++){const d=Math.min(day,lastDay(y,m+1));const c=new Date(y,m,d);if(c>date)return c;m++;if(m>11){m=0;y++}}return date}
export const norm=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
// "1ª quincena de octubre"
export const qLabel=(ym,n)=>(n===1?'1ª':'2ª')+' quincena de '+MESES[parseYM(ym).m-1];
