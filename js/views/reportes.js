// Pantalla: reportes.
import { money, ymOf, MESES, MES3, cap, parseYM, addMonths, sum } from '../util.js';
import { roMonth, catTotals } from '../logic.js';
import { hbars } from '../components.js';
import { ui } from '../ui.js';

export function chart6(){
  const base=ymOf(new Date()),months=[];for(let i=5;i>=0;i--)months.push(addMonths(base,-i));
  const data=months.map(ym=>{const mo=roMonth(ym);let ing=0,aho=0,gas=0;['q1','q2'].forEach(k=>{const q=mo[k];if(q){ing+=+q.ingreso||0;q.allocs.forEach(a=>{if(a.kind==='meta'&&a.done)aho+=+a.aplicado||0})}});(mo.tx||[]).forEach(t=>{if(t.tipo==='ingreso')ing+=t.monto;else gas+=t.monto});return {ym,ing,gas,aho}});
  const max=Math.max.apply(null,data.map(d=>Math.max(d.ing,d.gas,d.aho)).concat([1]));
  if(max<=1)return '<div class="empty">Cuando tengas algunas quincenas registradas, verás aquí la comparación mensual.</div>';
  const W=640,H=230,pl=8,pb=28,pt2=12,gw=(W-pl*2)/6,bw=Math.min(22,gw/4);
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="c6" role="img" aria-label="Ingresos, gastos y ahorro de los últimos seis meses"><line x1="0" x2="'+W+'" y1="'+(H-pb)+'" y2="'+(H-pb)+'" stroke="var(--line)"/>';
  data.forEach((d,i)=>{const x0=pl+i*gw+gw/2-bw*1.6;[['ing',d.ing],['gas',d.gas],['aho',d.aho]].forEach((e,j)=>{const hh=(H-pb-pt2)*e[1]/max;s+='<rect class="b-'+e[0]+'" x="'+(x0+j*(bw+3))+'" y="'+(H-pb-hh)+'" width="'+bw+'" height="'+(e[1]>0?Math.max(hh,2):0)+'" rx="3"/>'});s+='<text x="'+(pl+i*gw+gw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+MES3[parseYM(d.ym).m-1]+'</text>'});
  return s+'</svg><div class="legend"><span><i style="background:var(--pri)"></i>Ingresos</span><span><i style="background:var(--bad)"></i>Gastos registrados</span><span><i style="background:var(--ok)"></i>Ahorro aplicado</span></div>';
}
export function vReportes(){
  const ym=ui.rym,p=parseYM(ym),mo=roMonth(ym),ct=catTotals(ym);
  let ing=0,aho=0;['q1','q2'].forEach(k=>{const q=mo[k];if(q){ing+=+q.ingreso||0;q.allocs.forEach(a=>{if(a.kind==='meta'&&a.done)aho+=+a.aplicado||0})}});
  (mo.tx||[]).forEach(t=>{if(t.tipo==='ingreso')ing+=t.monto});
  const gas=sum(ct,c=>c[1]);
  let h='<div class="qnav"><button class="icon" data-act="r-prev" aria-label="Mes anterior">‹</button><div><b>'+cap(MESES[p.m-1])+' '+p.y+'</b><span class="mut">Ingresos '+money(ing)+' · Gastos '+money(gas)+'</span></div><button class="icon" data-act="r-next" aria-label="Mes siguiente">›</button></div>';
  h+='<div class="cols two"><div class="panel"><h2>Gasto por categoría</h2>'+(ct.length?hbars(ct):'<div class="empty">Sin gastos registrados en este mes.</div>')+'</div>';
  h+='<div class="panel"><h2>Ahorro del mes</h2><div class="row" style="cursor:default"><div class="grow nm">Ahorro aplicado</div><div class="amt">'+money(aho)+'</div></div><div class="row" style="cursor:default"><div class="grow nm">Del ingreso</div><div class="amt">'+(ing>0?Math.round(aho/ing*100)+'%':'—')+'</div></div></div></div>';
  h+='<div class="panel"><h2>Últimos seis meses</h2>'+chart6()+'</div>';
  return h;
}
