// Pantalla: resumen.
import { esc, money, ymOf, MESES, parseYM, inDays, fdate, sum } from '../util.js';
import { S } from '../state.js';
import { qBounds, qSummary, catTotals, cardInfo, fijoMonto, metaObj } from '../logic.js';
import { hbars } from '../components.js';

export function vResumen(){
  const now=new Date(),ym=ymOf(now),n=now.getDate()<=15?1:2;
  const s=qSummary(ym,n),p=parseYM(ym),b=qBounds(ym,n);
  const left=Math.max(1,+b[1].slice(8)-now.getDate()+1);
  const neg=s.libre<0;
  let h='<section class="hero'+(neg?' neg':'')+'"><div class="lbl">Libre en la '+(n===1?'1ª':'2ª')+' quincena de '+MESES[p.m-1]+'</div><div class="big">'+money(s.libre)+'</div>';
  h+='<div class="sub">'+(neg?'Te pasaste de lo planeado. Revisa tus sobres.':(left===1?'Hoy es el último día de la quincena.':'Quedan '+left+' días'+(s.libre>0?' · unos '+money(s.libre/left)+' por día':'')))+'</div>';
  h+='<dl><div><dt>Ingreso</dt><dd>'+money(s.ingreso)+'</dd></div><div><dt>Asignado</dt><dd>'+money(s.asignado)+'</dd></div><div><dt>Gasto fuera de sobre</dt><dd>'+money(s.over+s.unb)+'</dd></div></dl></section>';
  const cards=S.config.tarjetas.filter(c=>+c.saldo>0).map(c=>({c,i:cardInfo(c)})).sort((a,b)=>a.i.dl-b.i.dl);
  h+='<div class="cols two"><div>';
  h+='<div class="panel"><div class="head"><h2>Próximos pagos</h2><button class="btn ghost sm" data-act="go" data-r="tarjetas">Ver tarjetas</button></div>';
  h+=cards.length?cards.map(x=>'<div class="row" data-act="go" data-r="tarjetas"><div class="grow"><div class="nm">'+esc(x.c.nombre)+'</div><div class="sb'+(x.i.dl<=5?' due-soon':'')+'">Pagar antes del '+fdate(x.i.nl)+' · '+inDays(x.i.dl)+'</div></div><div class="amt">'+money(x.c.saldo)+'</div></div>').join(''):'<div class="empty">Sin saldos pendientes en tarjetas.</div>';
  h+='</div>';
  const tc=catTotals(ym).slice(0,5);
  h+='<div class="panel"><div class="head"><h2>Gastos de '+MESES[p.m-1]+'</h2><button class="btn ghost sm" data-act="go" data-r="gastos">Ver todo</button></div>'+(tc.length?hbars(tc):'<div class="empty">Aún no registras gastos este mes.</div>')+'</div>';
  h+='</div><div>';
  h+='<div class="panel"><div class="head"><h2>Metas</h2><button class="btn ghost sm" data-act="go" data-r="metas">Ver metas</button></div>';
  h+=S.config.metas.length?S.config.metas.map(m=>{const o=metaObj(m);return '<div class="row" data-act="go" data-r="metas"><div class="grow"><div class="nm">'+esc(m.nombre)+'</div>'+(o?'<div class="bar ok"><i style="width:'+Math.min(100,Math.round((m.ahorrado||0)/o*100))+'%"></i></div>':'')+'</div><div class="amt">'+money(m.ahorrado||0)+(o?'<span class="mut" style="font-weight:500;font-size:13px"> de '+money(o)+'</span>':'')+'</div></div>'}).join(''):'<div class="empty">Crea tu primera meta de ahorro.</div>';
  h+='</div>';
  const deuda=sum(S.config.tarjetas,c=>+c.saldo||0),fij=sum(S.config.fijos,f=>fijoMonto(f,ym));
  h+='<div class="panel"><h2>Panorama</h2><div class="row" data-act="go" data-r="tarjetas"><div class="grow nm">Deuda total en tarjetas</div><div class="amt">'+money(deuda)+'</div></div><div class="row" data-act="go" data-r="fijos"><div class="grow nm">Gastos fijos y suscripciones al mes</div><div class="amt">'+money(fij)+'</div></div></div>';
  h+='</div></div>';
  return h;
}
