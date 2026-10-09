// Pantalla: quincena.
import { esc, money, MESES, parseYM, ic } from '../util.js';
import { S } from '../state.js';
import { qBounds, allocMonto, qSummary } from '../logic.js';
import { chipK, txRow } from '../components.js';
import { ui } from '../ui.js';

export function vQuincena(){
  const ym=ui.ym,n=ui.q,s=qSummary(ym,n),q=s.q,p=parseYM(ym),b=qBounds(ym,n);
  let h='<div class="qnav"><button class="icon" data-act="q-prev" aria-label="Quincena anterior">‹</button><div><b>'+(n===1?'1ª':'2ª')+' quincena de '+MESES[p.m-1]+'</b><span class="mut">'+p.y+' · del '+(+b[0].slice(8))+' al '+(+b[1].slice(8))+'</span></div><button class="icon" data-act="q-next" aria-label="Quincena siguiente">›</button></div>';
  h+='<label class="inc"><span>Sueldo de la quincena</span><input type="number" inputmode="decimal" step="any" value="'+esc(q.ingreso||'')+'" placeholder="0" data-chg="q-ingreso"></label>';
  h+='<section class="hero'+(s.libre<0?' neg':'')+'" style="padding:16px 20px"><div class="lbl">Libre</div><div class="big" style="font-size:clamp(40px,11vw,60px)">'+money(s.libre)+'</div>';
  h+='<div class="sub">Ingreso '+money(s.ingreso)+(s.extras?' (incluye '+money(s.extras)+' extra)':'')+' · '+(s.libre<0?'asignaste o gastaste más de lo que ingresa':'plan libre '+money(s.ingreso-s.asignado)+(s.over+s.unb>0?', menos '+money(s.over+s.unb)+' de gasto fuera de sobre':''))+'</div></section>';
  const ext=s.tx.filter(t=>t.tipo==='ingreso');
  h+='<div class="panel"><div class="head"><h2>Ingresos extra</h2><button class="btn sm" data-act="add-extra">Agregar</button></div>'+(ext.length?ext.map(txRow).join(''):'<div class="empty" style="padding:8px">Bonos, ventas, regalos… Lo que agregues aquí suma al Libre y también al cálculo de los sobres con porcentaje, como el diezmo.</div>')+'</div>';
  h+='<div class="panel"><div class="head"><h2>Sobres de la quincena</h2><button class="btn sm" data-act="add-alloc">Agregar</button></div>';
  if(!q.allocs.length)h+='<div class="empty">Sin sobres todavía. Agrega diezmo, renta, pagos de tarjeta o ahorro.</div>';
  q.allocs.forEach(a=>{
    const m=allocMonto(a,s.ingreso),inf=s.by[a.id]||{};
    h+='<div class="row" data-act="edit-alloc" data-id="'+a.id+'">';
    if(a.kind!=='gasto')h+='<button class="chk" data-act="toggle-alloc" data-id="'+a.id+'" aria-pressed="'+(!!a.done)+'" aria-label="Marcar '+esc(a.nombre)+' como hecho">'+ic('check')+'</button>';
    h+='<div class="grow"><div class="nm">'+esc(a.nombre)+chipK(a.kind)+((+a.pct>0)?'<span class="chip">'+a.pct+'%</span>':'')+'</div>';
    if(a.kind==='gasto'&&inf.spent!=null){const r=m?inf.spent/m:0;h+='<div class="bar '+(r>1?'bad':r>.8?'warn':'')+'"><i style="width:'+Math.min(100,Math.round(r*100))+'%"></i></div><div class="sb">Gastado '+money(inf.spent)+' de '+money(m)+'</div>'}
    else if(a.kind==='tarjeta'||a.kind==='meta'){const ref=a.kind==='tarjeta'?S.config.tarjetas.find(c=>c.id===a.ref):S.config.metas.find(c=>c.id===a.ref);h+='<div class="sb">'+(ref?esc(ref.nombre):'Sin '+(a.kind==='tarjeta'?'tarjeta':'meta')+' elegida')+(a.done?' · aplicado':'')+'</div>'}
    h+='</div><div class="amt">'+money(m)+'</div><span class="pen">'+ic('edit')+'</span></div>';
  });
  h+='<div class="btns"><button class="btn ghost sm" data-act="copy-prev">Copiar sobres de la quincena anterior</button><button class="btn ghost sm" data-act="save-template">Usar esta como plantilla</button></div></div>';
  if(s.tx.length){
    h+='<div class="panel"><div class="head"><h2>Movimientos de la quincena</h2><button class="btn ghost sm" data-act="go-gastos">Ver mes</button></div>'+s.tx.slice().sort((a,b)=>b.f.localeCompare(a.f)).slice(0,6).map(txRow).join('')+'</div>';
  }
  return h;
}
