// Pantalla: quincena.
import { esc, money, MESES, parseYM, ic, privacy, sum } from '../util.js';
import { S } from '../state.js';
import { qBounds, allocMonto, qSummary, msiMes, fijosQ, fijosSinQ, esDirecto, cardName } from '../logic.js';
import { chipK, txRow } from '../components.js';
import { ui } from '../ui.js';

export function vQuincena(){
  const ym=ui.ym,n=ui.q,s=qSummary(ym,n),q=s.q,p=parseYM(ym),b=qBounds(ym,n);
  let h='<div class="qnav"><button class="icon" data-act="q-prev" aria-label="Quincena anterior">‹</button><div><b>'+(n===1?'1ª':'2ª')+' quincena de '+MESES[p.m-1]+'</b><span class="mut">'+p.y+' · del '+(+b[0].slice(8))+' al '+(+b[1].slice(8))+'</span></div><button class="icon" data-act="q-next" aria-label="Quincena siguiente">›</button></div>';
  h+='<label class="inc"><span>Sueldo de la quincena</span><input type="'+(privacy.hidden?'password':'number')+'" inputmode="decimal" step="any" autocomplete="off" value="'+esc(q.ingreso||'')+'" placeholder="0" data-chg="q-ingreso"></label>';
  h+='<section class="hero'+(s.libre<0?' neg':'')+'" style="padding:16px 20px"><div class="lbl">Libre</div><div class="big" style="font-size:clamp(40px,11vw,60px)">'+money(s.libre)+'</div>';
  h+='<div class="sub">Ingreso '+money(s.ingreso)+(s.extras?' (incluye '+money(s.extras)+' extra)':'')+' · '+(s.libre<0?'asignaste o gastaste más de lo que ingresa':'plan libre '+money(s.ingreso-s.asignado)+(s.over+s.unb>0?', menos '+money(s.over+s.unb)+' de gasto fuera de sobre':''))+'</div></section>';
  const ext=s.tx.filter(t=>t.tipo==='ingreso');
  h+='<div class="panel"><div class="head"><h2>Ingresos extra</h2><button class="btn sm" data-act="add-extra">Agregar</button></div>'+(ext.length?ext.map(txRow).join(''):'<div class="empty" style="padding:8px">Bonos, ventas, regalos… Lo que agregues aquí suma al Libre y también al cálculo de los sobres con porcentaje, como el diezmo.</div>')+'</div>';
  const fq=fijosQ(ym,n),dirF=fq.filter(x=>esDirecto(x.f)),tarF=fq.filter(x=>!esDirecto(x.f)),totDir=sum(dirF,x=>x.m),totTar=sum(tarF,x=>x.m),sinQ=fijosSinQ(ym);
  const fRow=x=>'<div class="row" data-act="edit-fijo" data-id="'+x.f.id+'" data-ym="'+ym+'"><div class="grow"><div class="nm">'+esc(x.f.nombre)+'</div><div class="sb">'+(x.f.porQ?'Cada quincena':'Una vez al mes')+(esDirecto(x.f)?'':' · '+esc(cardName(x.f.medio)))+'</div></div><div class="amt">'+money(x.m)+'</div><span class="pen">'+ic('edit')+'</span></div>';
  const yaSobre=q.allocs.some(a=>a.auto==='fijos');
  h+='<div class="panel"><div class="head"><h2>Gastos fijos de esta quincena</h2>'+(dirF.length?'<span class="amt">'+money(totDir)+'</span>':'')+'</div>';
  if(!fq.length)h+='<div class="empty" style="padding:8px">Aquí aparecen los gastos fijos que tocan en esta quincena: lo que pagas cada quincena y lo que cae en ella (la renta del día 1, por ejemplo). Se definen en la pestaña Fijos.</div>';
  else{
    if(dirF.length)h+='<div class="fq-sec">Los pagas directo (efectivo o débito)</div>'+dirF.map(fRow).join('');
    if(tarF.length)h+='<div class="fq-sec">Van a tarjeta · '+money(totTar)+'</div><p class="hint" style="margin:0 0 2px">Se pagan cuando pagas la tarjeta, no hace falta apartarlos aparte.</p>'+tarF.map(fRow).join('');
    if(totDir>0)h+='<div class="btns"><button class="btn sm" data-act="fijos-sobre">'+(yaSobre?'Actualizar el sobre con ':'Apartar ')+money(totDir)+(yaSobre?'':' en un sobre')+'</button></div>';
  }
  if(sinQ.length)h+='<p class="hint" style="margin:10px 0 0">'+sinQ.length+(sinQ.length===1?' gasto que pagas directo no tiene':' gastos que pagas directo no tienen')+' quincena asignada. <button class="link" data-act="go" data-r="fijos">Asignar</button></p>';
  h+='</div>';
  h+='<div class="panel"><div class="head"><h2>Sobres de la quincena</h2><button class="btn sm" data-act="add-alloc">Agregar</button></div>'
    +'<details class="what"><summary>¿Qué es un sobre?</summary><p>Un sobre es una parte de tu sueldo con un destino: renta, tarjeta, ahorro, comida… Antes, cuando te pagaban en efectivo, separabas el dinero en sobres con etiqueta y no gastabas de uno lo que era de otro. Aquí es igual, pero digital.</p><p>Ejemplo: si cobras $12,000 y apartas renta $3,000, tarjeta $2,000, ahorro $1,000 y despensa $1,500, te quedan <b>$4,500 libres</b>. Lo que no metes en ningún sobre es tu dinero libre.</p><p>Hay sobres de <b>pago</b> (los marcas con la palomita cuando ya pagaste) y sobres con <b>tope</b> de gasto (registras tus compras y ves cuánto te queda).</p></details>';
  if(!q.allocs.length)h+='<div class="empty">Sin sobres todavía. Agrega diezmo, renta, pagos de tarjeta o ahorro.</div>';
  q.allocs.forEach(a=>{
    const m=allocMonto(a,s.ingreso),inf=s.by[a.id]||{};
    h+='<div class="row" data-act="edit-alloc" data-id="'+a.id+'">';
    if(a.kind!=='gasto')h+='<button class="chk" data-act="toggle-alloc" data-id="'+a.id+'" aria-pressed="'+(!!a.done)+'" aria-label="Marcar '+esc(a.nombre)+' como hecho">'+ic('check')+'</button>';
    h+='<div class="grow"><div class="nm">'+esc(a.nombre)+chipK(a.kind)+((+a.pct>0)?'<span class="chip">'+a.pct+'%</span>':'')+'</div>';
    if(a.kind==='gasto'&&inf.spent!=null){const r=m?inf.spent/m:0;h+='<div class="bar '+(r>1?'bad':r>.8?'warn':'')+'"><i style="width:'+Math.min(100,Math.round(r*100))+'%"></i></div><div class="sb">Gastado '+money(inf.spent)+' de '+money(m)+'</div>'}
    else if(a.kind==='tarjeta'||a.kind==='meta'){const ref=a.kind==='tarjeta'?S.config.tarjetas.find(c=>c.id===a.ref):S.config.metas.find(c=>c.id===a.ref);h+='<div class="sb">'+(ref?esc(ref.nombre):'Sin '+(a.kind==='tarjeta'?'tarjeta':'meta')+' elegida')+(a.kind==='tarjeta'&&ref&&msiMes(ref.id,ym)>0?' · a meses este mes: '+money(msiMes(ref.id,ym)):'')+(a.done?' · aplicado':'')+'</div>'}
    h+='</div><div class="amt">'+money(m)+'</div><span class="pen">'+ic('edit')+'</span></div>';
  });
  h+='<div class="btns"><button class="btn ghost sm" data-act="copy-prev">Copiar sobres de la quincena anterior</button><button class="btn ghost sm" data-act="save-template">Usar esta como plantilla</button></div></div>';
  if(s.tx.length){
    h+='<div class="panel"><div class="head"><h2>Movimientos de la quincena</h2><button class="btn ghost sm" data-act="go-gastos">Ver mes</button></div>'+s.tx.slice().sort((a,b)=>b.f.localeCompare(a.f)).slice(0,6).map(txRow).join('')+'</div>';
  }
  return h;
}
