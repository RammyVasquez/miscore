// Reglas de negocio: quincenas, sobres, tarjetas y gastos recurrentes.
import { uid8, round2, pad, ymOf, lastDay, parseYM, nextOcc, daysTo, sum, monthIdx, addMonths } from './util.js';
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
export const qBase=(ym,n)=>{const q=roMonth(ym)['q'+n];if(!q)return 0;return (+q.ingreso||0)+sum(qTx(ym,n).filter(t=>t.tipo==='ingreso'),t=>t.monto)};
export function qSummary(ym,n){
  const q=getQ(ym,n),tx=qTx(ym,n);
  const extras=sum(tx.filter(t=>t.tipo==='ingreso'),t=>t.monto);
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
  return {q,tx,extras,ingreso,asignado,over,unb,libre:round2(ingreso-asignado-over-unb),gastado:sum(gastos,t=>t.monto),by};
}
export function txEffect(t,sign){
  if(t.tipo==='ingreso')return;
  const c=S.config.tarjetas.find(c=>c.id===t.medio);
  if(c){c.saldo=round2((+c.saldo||0)+sign*t.monto);touchCfg()}
}
export function cardPlan(c,ym){
  const mo=roMonth(ym);let plan=0,paid=0;
  ['q1','q2'].forEach(k=>{const q=mo[k];if(!q)return;q.allocs.forEach(a=>{if(a.kind==='tarjeta'&&a.ref===c.id){const m=allocMonto(a,qBase(ym,k==='q1'?1:2));plan+=m;if(a.done)paid+=m}})});
  return {plan,paid};
}
export const cardName=id=>{if(!id||id==='efectivo')return 'Efectivo o débito';const c=S.config.tarjetas.find(c=>c.id===id);return c?c.nombre:'Tarjeta eliminada'};
export const KIND={gasto:{l:'Gasto',c:'var(--k-gas)'},tarjeta:{l:'Tarjeta',c:'var(--k-tar)'},meta:{l:'Ahorro',c:'var(--k-met)'},diezmo:{l:'Diezmo',c:'var(--k-die)'},pago:{l:'Pago',c:'var(--k-pag)'}};
export function catTotals(ym){
  const m={};(roMonth(ym).tx||[]).forEach(t=>{if(t.tipo==='ingreso')return;m[t.cat||'Otros']=(m[t.cat||'Otros']||0)+t.monto});
  return Object.entries(m).sort((a,b)=>b[1]-a[1]);
}
export function cardInfo(c){const nc=nextOcc(+c.corte||1),nl=nextOcc(+c.limite||1);return {nc,nl,dc:daysTo(nc),dl:daysTo(nl)}}
export function fijoDue(f,ym){const c=Math.max(1,+f.cada||1);if(c===1)return true;const base=f.desde||ymOf(new Date());return (((monthIdx(ym)-monthIdx(base))%c)+c)%c===0}
export function fijoMonto(f,ym){if(!fijoDue(f,ym))return 0;const v=f.vals&&f.vals[ym];return (v!=null&&v!=='')?(+v||0):(+f.monto||0)}
export const metaObj=m=>(m.desglose&&m.desglose.length)?sum(m.desglose,d=>+d.m||0):(+m.objetivo||0);
export function revertAlloc(a){
  if(!a.done)return;
  if(a.kind==='tarjeta'){const c=S.config.tarjetas.find(c=>c.id===a.ref);if(c){c.saldo=round2((+c.saldo||0)+(+a.aplicado||0));touchCfg()}}
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
