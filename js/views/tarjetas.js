// Pantalla: tarjetas.
import { esc, money, ymOf, inDays, fdate, sum, ic, MES3, parseYM, round2 } from '../util.js';
import { S } from '../state.js';
import { apartadoTarjeta, cardInfo, fijoMonto, msiInfo, msiDeTarjeta, msiMes, cardTotal, cardPorVencer, cardEstimado, objetivoPago, planHastaLimite } from '../logic.js';

const estPartes=est=>{const p=[];if(est.msi>0)p.push('mensualidades a meses ('+money(est.msi)+')');if(est.acum>0&&est.acum>=est.fij)p.push('compras que ya llevas por vencer ('+money(est.acum)+')');else if(est.fij>0)p.push('cargos fijos ('+money(est.fij)+')');return p};
const mesAnio=ym=>{const p=parseYM(ym);return MES3[p.m-1]+' '+p.y};
function msiRow(x){
  const m=x.m,i=x.i;
  let sub,right;
  if(i.estado==='terminada'){sub='Ya la terminaste de pagar';right='<div class="amt">Lista</div>'}
  else if(i.estado==='futura'){sub='Empieza en '+mesAnio(i.inicio)+' · '+money(i.monto)+' al mes';right='<div class="amt">'+money(i.faltaTotal)+'</div><div class="sb">por pagar</div>'}
  else{sub='Mensualidad '+i.cur+' de '+i.n+' · '+money(i.monto)+' al mes';right='<div class="amt">'+money(i.faltaTotal)+'</div><div class="sb">por pagar</div>'}
  const pct=Math.round(i.pagadas/i.n*100);
  return '<div class="row'+(i.estado==='terminada'?' done':'')+'" data-act="edit-msi" data-id="'+m.id+'"><div class="grow"><div class="nm">'+esc(m.nombre)+'</div><div class="sb">'+sub+'</div>'
    +(i.estado==='activa'?'<div class="bar ok"><i style="width:'+pct+'%"></i></div><div class="sb">Faltan '+i.faltan+(i.faltan===1?' mensualidad (esta)':' mensualidades (esta y '+(i.faltan-1)+' más)')+' · termina en '+mesAnio(i.fin)+'</div>':'')
    +'</div><div style="text-align:right">'+right+'</div><span class="pen">'+ic('edit')+'</span></div>';
}

export function vTarjetas(){
  const ym=ymOf(new Date());
  let h='<div class="btns" style="margin:0 0 14px"><button class="btn" data-act="add-card">Agregar tarjeta</button></div>';
  if(!S.config.tarjetas.length)return h+'<div class="panel empty">Agrega tus tarjetas con su saldo, día de corte y fecha límite de pago.</div>';
  S.config.tarjetas.forEach(c=>{
    const i=cardInfo(c),fijo=sum(S.config.fijos.filter(f=>f.medio===c.id),f=>fijoMonto(f,ym));
    const tot=cardTotal(c),pv=cardPorVencer(c),obj=objetivoPago(c),aparta=planHastaLimite(c,obj.limite),bal=apartadoTarjeta(c),falta=Math.max(0,round2(obj.monto-bal-aparta)),est=cardEstimado(c);
    h+='<div class="panel card-row" style="border-left-color:'+esc(c.color||'#1D4ED8')+'"><div class="head"><h2>'+esc(c.nombre)+'</h2><div style="text-align:right"><div class="amt" style="font-size:24px">'+money(c.saldo)+'</div><div class="sb">pago para no generar intereses</div></div></div>';
    h+='<div class="kv"><span>Corte: <b>'+fdate(i.nc)+'</b> ('+inDays(i.dc)+')</span>'+(+c.saldo>0?'<span class="'+(i.dl<=5?'due-soon':'')+'">Pagar antes del: <b>'+fdate(i.nl)+'</b> ('+inDays(i.dl)+')</span>':'<span>Sin pago pendiente ahora</span>')+'</div>';
    h+='<div class="kv"><span>Ya apartado en tu banco: <b>'+money(bal)+'</b></span><span>Planeado en tus quincenas: <b>'+money(aparta)+'</b></span>'+(fijo?'<span>Cargos fijos de este mes: <b>'+money(fijo)+'</b></span>':'')+'</div>';
    if(pv>0)h+='<div class="kv"><span>Saldo total: <b>'+money(tot)+'</b></span><span>Por vencer: <b>'+money(pv)+'</b></span></div>';
    if(falta>0)h+='<div class="kv"><span class="'+(+c.saldo>0?'due-soon':'')+'">'+(+c.saldo>0?'Falta apartar para pagarla':'Falta apartar para su próximo pago')+': <b>'+money(falta)+'</b></span></div>';
    if(c.ult)h+='<div class="kv"><span>Último pago: <b>'+money(c.ult.monto)+'</b> el '+fdate(new Date(c.ult.f+'T00:00:00'))+'</span></div>';
    if(obj.monto>0)h+='<div class="bar ok"><i style="width:'+Math.min(100,Math.round((bal+aparta)/obj.monto*100))+'%"></i></div>';
    if(est.total>0)h+='<div class="est"><div>Próximo pago estimado: <b>≈ '+money(est.total)+'</b></div><div class="sb">Corte del '+fdate(est.corte)+'; se pagaría antes del '+fdate(est.limite)+'. Incluye '+estPartes(est).join(' y ')+'. No incluye lo que compres de aquí al corte.</div></div>';
    const ms=msiDeTarjeta(c.id).map(m=>({m:m,i:msiInfo(m,ym)})).sort((a,b)=>((a.i.estado==='terminada')-(b.i.estado==='terminada'))||(a.i.faltan-b.i.faltan));
    if(ms.length){
      const mes=msiMes(c.id,ym),faltaMsi=sum(ms,x=>x.i.faltaTotal);
      h+='<div class="msi"><div class="msi-h"><b>Compras a meses</b><span>Este mes: <b>'+money(mes)+'</b> · Después: <b>'+money(faltaMsi-mes)+'</b></span></div>'+ms.map(msiRow).join('')+'</div>';
    }
    h+='<div class="btns">'+(+c.saldo>0?'<button class="btn sm" data-act="pagar-tarjeta" data-id="'+c.id+'">Ya pagué</button>':'')+'<button class="btn sm" data-act="card-charge" data-id="'+c.id+'">Agregar cargo</button><button class="btn sm" data-act="add-msi" data-id="'+c.id+'">Compra a meses</button><button class="btn ghost sm" data-act="edit-card" data-id="'+c.id+'">Editar</button></div></div>';
  });
  const todas=(S.config.msi||[]).map(m=>msiInfo(m,ym)),mesTot=sum(todas.filter(i=>i.estado==='activa'),i=>i.monto),faltaTot=sum(todas,i=>i.faltaTotal);
  h+='<div class="panel"><div class="row" style="cursor:default"><div class="grow nm">Deuda total de tus tarjetas</div><div class="amt">'+money(sum(S.config.tarjetas,c=>cardTotal(c)))+'</div></div>'
    +(todas.length?'<div class="row" style="cursor:default"><div class="grow nm">Pagos a meses este mes</div><div class="amt">'+money(mesTot)+'</div></div><div class="row" style="cursor:default"><div class="grow nm">Por pagar en compras a meses</div><div class="amt">'+money(faltaTot)+'</div></div><p class="hint" style="margin:8px 0 0">Lo que falta de las compras a meses ya está dentro del saldo total de tu tarjeta. Aquí solo se muestra para que veas cuántas mensualidades faltan.</p>':'')+'</div>';
  return h;
}
