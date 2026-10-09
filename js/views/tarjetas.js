// Pantalla: tarjetas.
import { esc, money, ymOf, inDays, fdate, sum, ic, MES3, parseYM } from '../util.js';
import { S } from '../state.js';
import { cardPlan, cardInfo, fijoMonto, msiInfo, msiDeTarjeta, msiMes } from '../logic.js';

const mesAnio=ym=>{const p=parseYM(ym);return MES3[p.m-1]+' '+p.y};
function msiRow(x){
  const m=x.m,i=x.i;
  let sub,right;
  if(i.estado==='terminada'){sub='Ya la terminaste de pagar';right='<div class="amt">Lista</div>'}
  else if(i.estado==='futura'){sub='Empieza en '+mesAnio(i.inicio)+' · '+money(i.monto)+' al mes';right='<div class="amt">'+money(i.faltaTotal)+'</div><div class="sb">por pagar</div>'}
  else{sub='Mensualidad '+i.cur+' de '+i.n+' · '+money(i.monto)+' al mes';right='<div class="amt">'+money(i.faltaTotal)+'</div><div class="sb">por pagar</div>'}
  const pct=Math.round(i.pagadas/i.n*100);
  return '<div class="row'+(i.estado==='terminada'?' done':'')+'" data-act="edit-msi" data-id="'+m.id+'"><div class="grow"><div class="nm">'+esc(m.nombre)+'</div><div class="sb">'+sub+'</div>'
    +(i.estado==='activa'?'<div class="bar ok"><i style="width:'+pct+'%"></i></div><div class="sb">Faltan '+i.faltan+(i.faltan===1?' mensualidad':' mensualidades')+' · termina en '+mesAnio(i.fin)+'</div>':'')
    +'</div><div style="text-align:right">'+right+'</div><span class="pen">'+ic('edit')+'</span></div>';
}

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
    const ms=msiDeTarjeta(c.id).map(m=>({m:m,i:msiInfo(m,ym)})).sort((a,b)=>((a.i.estado==='terminada')-(b.i.estado==='terminada'))||(a.i.faltan-b.i.faltan));
    if(ms.length){
      const mes=msiMes(c.id,ym),falta=sum(ms,x=>x.i.faltaTotal);
      h+='<div class="msi"><div class="msi-h"><b>Compras a meses</b><span>Este mes: <b>'+money(mes)+'</b> · Por pagar: <b>'+money(falta)+'</b></span></div>'+ms.map(msiRow).join('')+'</div>';
    }
    h+='<div class="btns"><button class="btn sm" data-act="card-charge" data-id="'+c.id+'">Agregar cargo</button><button class="btn sm" data-act="add-msi" data-id="'+c.id+'">Compra a meses</button><button class="btn ghost sm" data-act="edit-card" data-id="'+c.id+'">Editar</button></div></div>';
  });
  const todas=(S.config.msi||[]).map(m=>msiInfo(m,ym)),mesTot=sum(todas.filter(i=>i.estado==='activa'),i=>i.monto),faltaTot=sum(todas,i=>i.faltaTotal);
  h+='<div class="panel"><div class="row" style="cursor:default"><div class="grow nm">Deuda total (saldos)</div><div class="amt">'+money(sum(S.config.tarjetas,c=>+c.saldo||0))+'</div></div>'
    +(todas.length?'<div class="row" style="cursor:default"><div class="grow nm">Pagos a meses este mes</div><div class="amt">'+money(mesTot)+'</div></div><div class="row" style="cursor:default"><div class="grow nm">Por pagar en compras a meses</div><div class="amt">'+money(faltaTot)+'</div></div><p class="hint" style="margin:8px 0 0">Las compras a meses se cuentan aparte del saldo de cada tarjeta, para no sumarlas dos veces.</p>':'')+'</div>';
  return h;
}
