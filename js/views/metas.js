// Pantalla: metas.
import { esc, money, fmtDate, daysTo } from '../util.js';
import { S } from '../state.js';
import { metaObj } from '../logic.js';

export function vMetas(){
  let h='<div class="btns" style="margin:0 0 14px"><button class="btn" data-act="add-meta">Nueva meta</button></div>';
  if(!S.config.metas.length)return h+'<div class="panel empty">Crea metas como un fondo de emergencia, un viaje o un gasto grande que viene.</div>';
  S.config.metas.forEach(m=>{
    const o=metaObj(m),ah=+m.ahorrado||0,pc=o?Math.min(100,Math.round(ah/o*100)):0;
    h+='<div class="panel"><div class="head"><h2>'+esc(m.nombre)+'</h2><div class="amt">'+money(ah)+(o?'<span class="mut" style="font-weight:500;font-size:14px"> de '+money(o)+'</span>':'')+'</div></div>';
    if(o){h+='<div class="bar ok"><i style="width:'+pc+'%"></i></div><div class="kv"><span><b>'+pc+'%</b> completado</span><span>Faltan <b>'+money(Math.max(0,o-ah))+'</b></span>';
      if(m.fecha&&o>ah){const dm=Math.max(1,Math.ceil(daysTo(new Date(m.fecha+'T00:00:00'))/30));h+='<span>Para el '+fmtDate(m.fecha)+': <b>'+money((o-ah)/dm)+'</b> al mes</span>'}
      h+='</div>'}
    if(m.desglose&&m.desglose.length)h+='<div class="kv" style="margin-top:10px">'+m.desglose.map(d=>'<span>'+esc(d.n)+': <b>'+money(d.m)+'</b></span>').join('')+'</div>';
    h+='<div class="btns"><button class="btn sm" data-act="meta-add" data-id="'+m.id+'">Aportar</button><button class="btn ghost sm" data-act="edit-meta" data-id="'+m.id+'">Editar</button></div></div>';
  });
  return h;
}
