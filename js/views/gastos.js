// Pantalla: gastos.
import { money, MESES, cap, parseYM, fmtDate, sum } from '../util.js';
import { roMonth } from '../logic.js';
import { txRow } from '../components.js';
import { ui } from '../ui.js';

export function vGastos(){
  const ym=ui.gym,p=parseYM(ym),mo=roMonth(ym),tx=(mo.tx||[]).slice().sort((a,b)=>b.f.localeCompare(a.f)||0);
  const g=sum(tx.filter(t=>t.tipo!=='ingreso'),t=>t.monto),i=sum(tx.filter(t=>t.tipo==='ingreso'),t=>t.monto);
  let h='<div class="qnav"><button class="icon" data-act="g-prev" aria-label="Mes anterior">‹</button><div><b>'+cap(MESES[p.m-1])+' '+p.y+'</b><span class="mut">Gastado '+money(g)+(i?' · Ingresos extra '+money(i):'')+'</span></div><button class="icon" data-act="g-next" aria-label="Mes siguiente">›</button></div>';
  if(!tx.length)return h+'<div class="panel empty">No hay movimientos en este mes. Registra tu primer gasto con el botón de abajo.</div>';
  let last='';h+='<div class="panel">';
  tx.forEach(t=>{if(t.f!==last){last=t.f;h+='<div class="date-h">'+fmtDate(t.f)+'</div>'}h+=txRow(t)});
  return h+'</div>';
}
