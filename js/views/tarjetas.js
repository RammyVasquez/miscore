// Pantalla: tarjetas.
import { esc, money, ymOf, inDays, fdate, sum } from '../util.js';
import { S } from '../state.js';
import { cardPlan, cardInfo, fijoMonto } from '../logic.js';

export function vTarjetas(){
  const ym=ymOf(new Date());
  let h='<div class="btns" style="margin:0 0 14px"><button class="btn" data-act="add-card">Agregar tarjeta</button></div>';
  if(!S.config.tarjetas.length)return h+'<div class="panel empty">Agrega tus tarjetas con su saldo, día de corte y fecha límite de pago.</div>';
  S.config.tarjetas.forEach(c=>{
    const i=cardInfo(c),pl=cardPlan(c,ym),fijo=sum(S.config.fijos.filter(f=>f.medio===c.id),f=>fijoMonto(f,ym));
    h+='<div class="panel card-row" style="border-left-color:'+esc(c.color||'#1D4ED8')+'"><div class="head"><h2>'+esc(c.nombre)+'</h2><div class="amt" style="font-size:24px">'+money(c.saldo)+'</div></div>';
    h+='<div class="kv"><span>Corte: <b>'+fdate(i.nc)+'</b> ('+inDays(i.dc)+')</span><span class="'+(i.dl<=5&&+c.saldo>0?'due-soon':'')+'">Pagar antes del: <b>'+fdate(i.nl)+'</b> ('+inDays(i.dl)+')</span></div>';
    h+='<div class="kv"><span>Plan de pago este mes: <b>'+money(pl.plan)+'</b></span><span>Ya pagado: <b>'+money(pl.paid)+'</b></span>'+(fijo?'<span>Cargos fijos de este mes: <b>'+money(fijo)+'</b></span>':'')+'</div>';
    if(pl.plan>0)h+='<div class="bar ok"><i style="width:'+Math.min(100,Math.round(pl.paid/pl.plan*100))+'%"></i></div>';
    h+='<div class="btns"><button class="btn sm" data-act="card-charge" data-id="'+c.id+'">Agregar cargo</button><button class="btn ghost sm" data-act="edit-card" data-id="'+c.id+'">Editar</button></div></div>';
  });
  h+='<div class="panel"><div class="row" style="cursor:default"><div class="grow nm">Deuda total</div><div class="amt">'+money(sum(S.config.tarjetas,c=>+c.saldo||0))+'</div></div></div>';
  return h;
}
