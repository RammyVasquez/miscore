// Dibuja la pantalla actual y el menú.
import { $, esc, ic } from './util.js';
import { S, statusText, rt } from './state.js';
import { ui, NAV, TABS, FAB_ROUTES, TITLES } from './ui.js';
import { vWelcome } from './views/welcome.js';
import { vResumen } from './views/resumen.js';
import { vQuincena } from './views/quincena.js';
import { vGastos } from './views/gastos.js';
import { vTarjetas } from './views/tarjetas.js';
import { vMetas } from './views/metas.js';
import { vFijos } from './views/fijos.js';
import { vReportes } from './views/reportes.js';
import { vMas } from './views/mas.js';
import { vAjustes } from './views/ajustes.js';

export function render(){
  rt.pendingRender=false;
  const view=$('#view');
  if(!S.config.onboarded){view.innerHTML=vWelcome();$('#side').innerHTML='';$('#tabbar').style.display='none';$('#fabroot').innerHTML='';return}
  $('#tabbar').style.display='';
  const r=ui.route;
  const fn={resumen:vResumen,quincena:vQuincena,gastos:vGastos,tarjetas:vTarjetas,metas:vMetas,fijos:vFijos,reportes:vReportes,mas:vMas,ajustes:vAjustes}[r];
  view.innerHTML='<div class="top"><h1>'+TITLES[r]+'</h1><span class="sync '+rt.syncMode+'"><i></i><span>'+esc(statusText())+'</span></span></div>'+fn();
  const tabOf=TABS.some(t=>t[0]===r)?r:'mas';
  $('#side').innerHTML='<div class="brand">Mis finanzas</div>'+NAV.map(n=>'<button data-act="go" data-r="'+n[0]+'"'+(n[0]===r?' aria-current="page"':'')+'>'+ic(n[0])+'<span>'+n[1]+'</span></button>').join('');
  $('#tabbar').innerHTML=TABS.map(t=>'<button data-act="go" data-r="'+t[0]+'"'+(t[0]===tabOf?' aria-current="page"':'')+'>'+ic(t[0])+'<span>'+t[1]+'</span></button>').join('');
  $('#fabroot').innerHTML=FAB_ROUTES.indexOf(r)>=0?'<button class="fab" data-act="add-tx">'+ic('plus')+'Gasto</button>':'';
}
