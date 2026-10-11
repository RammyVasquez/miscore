// Pantalla: fijos.
import { esc, money, MESES, cap, parseYM, ic, sum } from '../util.js';
import { S } from '../state.js';
import { cardName, fijoDue, fijoMonto } from '../logic.js';
import { ui } from '../ui.js';

const QL={1:'1ª quincena',2:'2ª quincena'};
export function vFijos(){
  const ym=ui.fym,p=parseYM(ym),f=S.config.fijos;
  let h='<div class="qnav"><button class="icon" data-act="f-prev" aria-label="Mes anterior">‹</button><div><b>'+cap(MESES[p.m-1])+' '+p.y+'</b><span class="mut">Total del mes '+money(sum(f,x=>fijoMonto(x,ym)))+'</span></div><button class="icon" data-act="f-next" aria-label="Mes siguiente">›</button></div>';
  h+='<div class="btns" style="margin:0 0 14px"><button class="btn" data-act="add-fijo">Agregar gasto</button></div>';
  if(!f.length)return h+'<div class="panel empty">Agrega tu renta, servicios, suscripciones y cualquier cargo que se repite: cada mes, cada quincena o cada cierto tiempo. Si el monto cambia, márcalo como "Cambia cada vez".</div>';
  [['fijo','Gastos fijos y recurrentes'],['sub','Suscripciones y gastos hormiga']].forEach(g=>{
    const list=f.filter(x=>(x.tipo||'fijo')===g[0]);
    if(!list.length)return;
    h+='<div class="panel"><div class="head"><h2>'+g[1]+'</h2><div class="amt">'+money(sum(list,x=>fijoMonto(x,ym)))+'</div></div>';
    list.forEach(x=>{
      const due=fijoDue(x,ym);
      const real=x.porQ?!!(x.vals&&(x.vals[ym+'-1']!=null||x.vals[ym+'-2']!=null)):!!(x.vals&&x.vals[ym]!=null&&x.vals[ym]!=='');
      const chips=(x.variable?'<span class="chip">Cambia</span>':'')+(x.porQ?'<span class="chip">Cada quincena</span>':(x.reparto==='mitad'?'<span class="chip">Mitad en cada quincena</span>'+(+x.q>0?'<span class="chip">Se paga en la '+QL[x.q]+'</span>':''):(+x.q>0?'<span class="chip">'+QL[x.q]+'</span>':'')))+((!x.porQ&&+x.cada>1)?'<span class="chip">Cada '+x.cada+' meses</span>':'');
      const sub=esc(cardName(x.medio))+(x.cat?' · '+esc(x.cat):'')+(x.porQ?' · '+money(x.monto)+' cada quincena':'')+(x.reparto==='mitad'?' · apartas '+money(fijoMonto(x,ym)/2)+' en cada quincena':'')+(!due?' · no toca este mes':(x.variable?(real?' · monto real':' · estimado'):''));
      h+='<div class="row" data-act="edit-fijo" data-id="'+x.id+'"'+(due?'':' style="opacity:.55"')+'><div class="grow"><div class="nm">'+esc(x.nombre)+chips+'</div><div class="sb">'+sub+'</div>'
        +((x.variable&&due)?'<div class="btns" style="margin-top:6px"><button class="btn ghost sm" data-act="fijo-mes" data-id="'+x.id+'">'+(real?'Cambiar monto real':'Registrar monto real')+'</button></div>':'')
        +'</div><div class="amt">'+(due?money(fijoMonto(x,ym)):'—')+'</div><span class="pen">'+ic('edit')+'</span></div>';
    });
    h+='</div>';
  });
  const by={};f.forEach(x=>{const k=x.medio||'efectivo';by[k]=(by[k]||0)+fijoMonto(x,ym)});
  h+='<div class="panel"><h2>Por dónde se paga</h2>'+Object.entries(by).map(e=>'<div class="row" style="cursor:default"><div class="grow nm">'+esc(cardName(e[0]))+'</div><div class="amt">'+money(e[1])+'</div></div>').join('')+'<div class="row" style="cursor:default"><div class="grow nm">Total del mes</div><div class="amt">'+money(sum(f,x=>fijoMonto(x,ym)))+'</div></div></div>';
  return h;
}
