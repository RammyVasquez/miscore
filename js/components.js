// Piezas de HTML que se repiten en varias pantallas.
import { esc, money, fmtDate, ic } from './util.js';
import { cardName, KIND } from './logic.js';

export const chipK=k=>'<span class="chip"><i style="background:'+KIND[k].c+'"></i>'+KIND[k].l+'</span>';
export function hbars(items,max){
  max=max||Math.max.apply(null,items.map(i=>i[1]).concat([1]));
  return items.map(i=>'<div class="hb"><span>'+esc(i[0])+'</span><div class="ht"><i style="width:'+Math.max(2,Math.round(i[1]/max*100))+'%"></i></div><span class="hv">'+money(i[1])+'</span></div>').join('');
}
export function txRow(t){
  const ing=t.tipo==='ingreso';
  return '<div class="row" data-act="edit-tx" data-id="'+t.id+'" data-ym="'+t.f.slice(0,7)+'"><div class="grow"><div class="nm">'+esc(t.nota||t.cat)+'</div><div class="sb">'+fmtDate(t.f)+' · '+esc(t.cat)+' · '+esc(cardName(t.medio))+'</div></div><div class="amt '+(ing?'pos':'')+'">'+(ing?'+':'')+money(t.monto)+'</div><span class="pen">'+ic('edit')+'</span></div>';
}
