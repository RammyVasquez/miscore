// Reglas de negocio: quincenas, apartados, tarjetas y gastos recurrentes.
import { uid8, round2, pad, ymd, ymOf, lastDay, parseYM, nextOcc, nextOccAfter, daysTo, sum, monthIdx, addMonths, norm } from './util.js';
import { S, touchCfg, touchMonth } from './state.js';

export const getMonth=ym=>{if(!S.months[ym])S.months[ym]={tx:[]};if(!S.months[ym].tx)S.months[ym].tx=[];return S.months[ym]};
export const roMonth=ym=>S.months[ym]||{tx:[]};
export function getQ(ym,n){
  const mo=getMonth(ym),k='q'+n;
  if(!mo[k]){mo[k]={ingreso:S.config.ingresoQ||0,allocs:S.config.plantilla.map(p=>Object.assign({},p,{id:uid8(),done:false}))};touchMonth(ym)}
  return mo[k];
}
export const qBounds=(ym,n)=>{const p=parseYM(ym);return n===1?[ym+'-01',ym+'-15']:[ym+'-16',ym+'-'+pad(lastDay(p.y,p.m))]};
export const qTx=(ym,n)=>{const b=qBounds(ym,n);return (roMonth(ym).tx||[]).filter(t=>t.f>=b[0]&&t.f<=b[1])};
export const allocMonto=(a,base)=>(+a.pct>0)?round2((+base||0)*a.pct/100):(+a.monto||0);
export const qBase=(ym,n)=>{const q=roMonth(ym)['q'+n];if(!q)return 0;return (+q.ingreso||0)+sum(qTx(ym,n).filter(t=>t.tipo==='ingreso'),t=>t.monto)+sum(recsQ(ym,n),x=>x.m)};
export function qSummary(ym,n){
  const q=getQ(ym,n),tx=qTx(ym,n);
  const recs=recsQ(ym,n);
  const extras=sum(tx.filter(t=>t.tipo==='ingreso'),t=>t.monto)+sum(recs,x=>x.m);
  const gastos=tx.filter(t=>t.tipo!=='ingreso');
  const cash=gastos.filter(t=>t.medio==='efectivo'||!t.medio);
  const ingreso=(+q.ingreso||0)+extras;
  let asignado=0,over=0;const by={},cats=new Set();
  q.allocs.forEach(a=>{
    const m=allocMonto(a,ingreso);asignado+=m;
    if(a.kind==='gasto'&&a.cat){cats.add(a.cat);const sp=sum(cash.filter(t=>t.cat===a.cat),t=>t.monto);by[a.id]={plan:m,spent:sp};over+=Math.max(0,sp-m)}
    else by[a.id]={plan:m};
  });
  const unb=sum(cash.filter(t=>!cats.has(t.cat)),t=>t.monto);
  return {q,tx,recs,extras,ingreso,asignado,over,unb,libre:round2(ingreso-asignado-over-unb),gastado:sum(gastos,t=>t.monto),by};
}
export function txEffect(t,sign){
  if(t.tipo==='ingreso')return;
  const c=S.config.tarjetas.find(c=>c.id===t.medio);
  if(c){c.total=round2(cardTotal(c)+sign*t.monto);touchCfg()}
}
export function cardPlan(c,ym){
  const mo=roMonth(ym);let plan=0,paid=0;
  ['q1','q2'].forEach(k=>{const q=mo[k];if(!q)return;q.allocs.forEach(a=>{if(a.kind==='tarjeta'&&a.ref===c.id){const m=allocMonto(a,qBase(ym,k==='q1'?1:2));plan+=m;if(a.done)paid+=m}})});
  return {plan,paid};
}
export const cardName=id=>{if(!id||id==='efectivo')return 'Efectivo o débito';const c=S.config.tarjetas.find(c=>c.id===id);if(c)return c.nombre;const v=(S.config.vales||[]).find(v=>v.id===id);return v?v.nombre:'Tarjeta eliminada'};
export const KIND={gasto:{l:'Gasto',c:'var(--k-gas)'},tarjeta:{l:'Tarjeta',c:'var(--k-tar)'},meta:{l:'Ahorro',c:'var(--k-met)'},diezmo:{l:'Diezmo',c:'var(--k-die)'},pago:{l:'Pago',c:'var(--k-pag)'}};
export function catTotals(ym){
  const m={};(roMonth(ym).tx||[]).forEach(t=>{if(t.tipo==='ingreso')return;m[t.cat||'Otros']=(m[t.cat||'Otros']||0)+t.monto});
  return Object.entries(m).sort((a,b)=>b[1]-a[1]);
}
export function cardInfo(c){const nc=nextOcc(+c.corte||1),nl=nextOcc(+c.limite||1);return {nc,nl,dc:daysTo(nc),dl:daysTo(nl)}}
export function fijoDue(f,ym){if(f.porQ)return true;const c=Math.max(1,+f.cada||1);if(c===1)return true;const base=f.desde||ymOf(new Date());return (((monthIdx(ym)-monthIdx(base))%c)+c)%c===0}
// Lo que toca pagar de un gasto en una quincena concreta (n = 1 o 2).
// Un gasto "cada quincena" toca en las dos; uno mensual toca solo en la quincena que se le asignó.
export function fijoMontoQ(f,ym,n){
  if(f.porQ){const v=f.vals&&f.vals[ym+'-'+n];return (v!=null&&v!=='')?(+v||0):(+f.monto||0)}
  if(+f.q!==n)return 0;
  return fijoMonto(f,ym);
}
// Total del mes (un gasto "cada quincena" suma sus dos quincenas)
export function fijoMonto(f,ym){
  if(f.porQ)return round2(fijoMontoQ(f,ym,1)+fijoMontoQ(f,ym,2));
  if(!fijoDue(f,ym))return 0;
  const v=f.vals&&f.vals[ym];return (v!=null&&v!=='')?(+v||0):(+f.monto||0)
}
export const esDirecto=f=>!f.medio||f.medio==='efectivo';
export const fijosQ=(ym,n)=>S.config.fijos.map(f=>({f:f,m:fijoMontoQ(f,ym,n)})).filter(x=>x.m>0);
// Gastos del mes que pagas directo y todavía no tienen quincena asignada
export const fijosSinQ=ym=>S.config.fijos.filter(f=>!f.porQ&&!(+f.q>0)&&esDirecto(f)&&fijoDue(f,ym)&&fijoMonto(f,ym)>0&&!enApartados(ym,1,f.nombre)&&!enApartados(ym,2,f.nombre));
export const metaObj=m=>(m.desglose&&m.desglose.length)?sum(m.desglose,d=>+d.m||0):(+m.objetivo||0);
export function revertAlloc(a){
  if(!a.done)return;
  if(a.kind==='tarjeta'){const c=S.config.tarjetas.find(c=>c.id===a.ref);if(c){c.saldo=round2((+c.saldo||0)+(+a.aplicado||0));if(a.aplT){c.total=round2((+c.total||0)+a.aplT)}touchCfg()}delete a.aplT}
  if(a.kind==='meta'){const m=S.config.metas.find(c=>c.id===a.ref);if(m){m.ahorrado=round2((+m.ahorrado||0)-(+a.aplicado||0));touchCfg()}}
}

// ---- Compras a meses (meses sin intereses u otros planes de pago) ----
// Cada compra guarda en qué mes se cobró la 1ª mensualidad (`desde`); de ahí se sabe cuál toca cada mes.
export function msiInfo(m, ym) {
  const n = Math.max(1, Math.round(+m.meses || 1));
  const monto = (+m.mensualidad > 0) ? +m.mensualidad : round2((+m.total || 0) / n);
  const desde = m.desde || ym;
  const cur = monthIdx(ym) - monthIdx(desde) + 1;                  // número de mensualidad que toca en ese mes
  const estado = cur < 1 ? 'futura' : cur > n ? 'terminada' : 'activa';
  const faltan = estado === 'activa' ? n - cur + 1 : estado === 'futura' ? n : 0;   // incluye la de este mes
  return { n: n, monto: monto, cur: cur, estado: estado, faltan: faltan, faltaTotal: round2(monto * faltan), pagadas: n - faltan, fin: addMonths(desde, n - 1), inicio: desde };
}
export const msiDeTarjeta = id => (S.config.msi || []).filter(m => m.tarjeta === id);
export const msiMes = (id, ym) => sum(msiDeTarjeta(id).filter(m => msiInfo(m, ym).estado === 'activa'), m => msiInfo(m, ym).monto);

// ---- Tarjetas: pago para no generar intereses (saldo) y saldo total ----
export const cardTotal=c=>Math.max(+c.total||0,+c.saldo||0);
export const cardPorVencer=c=>round2(Math.max(0,cardTotal(c)-(+c.saldo||0)));
// Lo que se vería en el pago de la siguiente fecha de corte: mensualidades a meses + cargos fijos de esa tarjeta
export function cardEstimado(c){
  const i=cardInfo(c),ymE=ymOf(i.nc);
  const msi=msiMes(c.id,ymE),fij=round2(sum(S.config.fijos.filter(f=>f.medio===c.id),f=>fijoMonto(f,ymE)));
  return {ym:ymE,corte:i.nc,limite:nextOccAfter(+c.limite||1,i.nc),msi:msi,fij:fij,total:round2(msi+fij)};
}

// ---- Ingresos extra que se repiten (bono mensual, etc.) ----
export const recActivo=(r,ym)=>ym>=(r.desde||ym)&&(!r.hasta||ym<=r.hasta);
export function recMonto(r,ym,n){
  if(!recActivo(r,ym))return 0;
  if(r.cada!=='q'&&+r.q!==n)return 0;
  const v=(r.cada!=='q'&&r.vals)?r.vals[ym]:null;
  return (v!=null&&v!=='')?(+v||0):(+r.monto||0);
}
export const recsQ=(ym,n)=>(S.config.ingresosRec||[]).map(r=>({r:r,m:recMonto(r,ym,n)})).filter(x=>x.m>0);

// ---- Vales (despensa, gasolina…): no son sueldo; se pagan "con vales" al registrar un gasto ----
export const valeTx=id=>{const out=[];Object.keys(S.months).forEach(k=>(S.months[k].tx||[]).forEach(t=>{if(t.medio===id&&t.tipo!=='ingreso')out.push(t)}));return out};
export function valeSaldo(v,hoy){
  hoy=hoy||new Date();const end=ymd(hoy),f0=v.fecha0||end;
  let rec=0;
  if(+v.recarga>0){
    let y=+f0.slice(0,4),m=+f0.slice(5,7);
    for(let i=0;i<600;i++){
      const d=Math.min(Math.max(1,Math.round(+v.dia)||1),lastDay(y,m)),date=y+'-'+pad(m)+'-'+pad(d);
      if(date>end)break;if(date>f0)rec++;m++;if(m>12){m=1;y++}
    }
  }
  const gasto=sum(valeTx(v.id).filter(t=>t.ts?t.ts>(+v.ts0||0):t.f>f0),t=>t.monto);
  return round2((+v.saldo0||0)+rec*(+v.recarga||0)-gasto);
}
export function valeProx(v,hoy){
  if(!(+v.recarga>0))return null;
  hoy=hoy||new Date();const d=nextOccAfter(Math.round(+v.dia)||1,new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()));
  return {fecha:d,dias:daysTo(d)};
}
export const valeGastoMes=(v,ym)=>sum(valeTx(v.id).filter(t=>t.f.slice(0,7)===ym),t=>t.monto);

// ---- Apartados que ya existen con el mismo nombre que un gasto fijo (para no contarlos dos veces) ----
export const enApartados=(ym,n,nombre)=>{const q=roMonth(ym)['q'+n];return !!q&&q.allocs.some(a=>norm(a.nombre)===norm(nombre))};

// ---- Proyecciones (¿qué pasaría si…?). Nada de esto modifica tus datos. ----
// Sueldo de las dos quincenas del mes + lo que se repite (bono)
export function ingresoMensual(ym) {
  const mo = roMonth(ym), b = +S.config.ingresoQ || 0;
  const a = (mo.q1 && +mo.q1.ingreso) || b, c = (mo.q2 && +mo.q2.ingreso) || b;
  return { sueldo: round2(a + c), extra: round2(sum(recsQ(ym, 1), x => x.m) + sum(recsQ(ym, 2), x => x.m)) };
}
const esValeId = id => (S.config.vales || []).some(v => v.id === id);
// Gastos fijos del mes que salen del sueldo (los que se pagan con vales no cuentan)
export const fijosDeSueldo = ym => round2(sum(S.config.fijos.filter(f => !esValeId(f.medio)), f => fijoMonto(f, ym)));
export const msiTotalMes = ym => round2(sum(S.config.msi || [], m => { const i = msiInfo(m, ym); return i.estado === 'activa' ? i.monto : 0; }));
// Lo que sobra después de tus apartados de las dos quincenas
export function planLibreMes(ym) { let s = 0; [1, 2].forEach(n => { const r = qSummary(ym, n); s += r.ingreso - r.asignado; }); return round2(s); }
const esRenta = nombre => norm(nombre).indexOf('renta') >= 0;
export const rentaApartados = ym => round2([1, 2].reduce((s, n) => { const q = getQ(ym, n), base = qBase(ym, n); return s + sum(q.allocs.filter(a => esRenta(a.nombre)), a => allocMonto(a, base)); }, 0));
export const rentaFijos = ym => round2(sum(S.config.fijos.filter(f => esRenta(f.nombre)), f => fijoMonto(f, ym)));
// Mensualidad de una compra a meses (tasa anual en %; 0 = meses sin intereses)
export function pmt(P, tasaAnual, n) { const r = (+tasaAnual || 0) / 100 / 12; return round2(r > 0 ? P * r / (1 - Math.pow(1 + r, -n)) : P / n); }
// Sueldo − gastos fijos − mensualidades − renta, mes por mes
export function serieLibre(ym0, n) {
  const rA = rentaApartados(ym0), rF = rentaFijos(ym0), extraRenta = rF > 0 ? 0 : rA, out = [];
  for (let i = 0; i < n; i++) {
    const ym = addMonths(ym0, i), ing = ingresoMensual(ym);
    out.push({ ym: ym, val: round2(ing.sueldo + ing.extra - fijosDeSueldo(ym) - msiTotalMes(ym) - extraRenta) });
  }
  return out;
}
// Compras a meses que terminan pronto (liberan dinero al mes siguiente)
export function msiLiberan(ym0, horizonte) {
  return (S.config.msi || []).map(m => { const i = msiInfo(m, ym0); return { nombre: m.nombre, mes: addMonths(i.fin, 1), monto: i.monto, estado: i.estado }; })
    .filter(x => x.estado === 'activa' && monthIdx(x.mes) - monthIdx(ym0) <= horizonte)
    .sort((a, b) => a.mes.localeCompare(b.mes));
}
