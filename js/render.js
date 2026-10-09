// Dibuja la pantalla actual y el menú.
import { $, esc, ic, privacy } from './util.js';
import { S, statusShort, rt, getMeta } from './state.js';
import { cloud, cloudConfigured } from './cloud.js';
import { ui, NAV, TABS, FAB_ROUTES, TITLES } from './ui.js';
import { vWelcome } from './views/welcome.js';
import { vResumen } from './views/resumen.js';
import { vVales } from './views/vales.js';
import { vQuincena } from './views/quincena.js';
import { vGastos } from './views/gastos.js';
import { vTarjetas } from './views/tarjetas.js';
import { vMetas } from './views/metas.js';
import { vFijos } from './views/fijos.js';
import { vReportes } from './views/reportes.js';
import { vMas } from './views/mas.js';
import { vAjustes } from './views/ajustes.js';

function needsReminder(){
  if(!S.config.onboarded||S.config.demo||cloud.user||!Object.keys(S.months).length)return false;
  const m=getMeta(),now=Date.now();
  if(m.snoozeUntil&&now<m.snoozeUntil)return false;
  return now-(m.lastBackup||m.since||now)>7*864e5;
}

export function render(){
  rt.pendingRender=false;
  const view=$('#view');
  $('#app').classList.toggle('solo',!S.config.onboarded);
  if(!S.config.onboarded){view.innerHTML=vWelcome();$('#side').innerHTML='';$('#tabbar').style.display='none';$('#fabroot').innerHTML='';return}
  $('#tabbar').style.display='';
  const r=ui.route;
  const demo=S.config.demo?'<div class="demo"><div><b>Datos de ejemplo.</b> Edítalos para practicar.</div><div class="btns"><button class="btn sm" data-act="clear-demo">Empezar desde cero</button><button class="btn ghost sm" data-act="hide-demo">Ocultar aviso</button></div></div>':'';
  const remind=(r==='resumen'&&needsReminder())?'<div class="demo"><div><b>Cuida tus datos.</b> '+(cloudConfigured?'Hoy solo están en este dispositivo. Crea una cuenta para sincronizarlos o descarga un respaldo.':'Hace tiempo que no descargas un respaldo.')+'</div><div class="btns">'+(cloudConfigured?'<button class="btn sm" data-act="signup">Crear cuenta</button>':'')+'<button class="btn '+(cloudConfigured?'ghost ':'')+'sm" data-act="export">Descargar respaldo</button><button class="btn ghost sm" data-act="remind-later">Más tarde</button></div></div>':'';
  const lost=(cloud.sessionLost&&!cloud.user&&(r==='resumen'||r==='ajustes'))?'<div class="demo"><div><b>Se cerró tu sesión.</b> Inicia sesión para seguir sincronizando. Tus datos de este dispositivo siguen aquí.</div><div class="btns"><button class="btn sm" data-act="login">Iniciar sesión</button></div></div>':'';
  const fn={resumen:vResumen,quincena:vQuincena,gastos:vGastos,tarjetas:vTarjetas,vales:vVales,metas:vMetas,fijos:vFijos,reportes:vReportes,mas:vMas,ajustes:vAjustes}[r];
  view.innerHTML='<div class="top"><h1>'+TITLES[r]+'</h1><div class="tools"><button class="iconbtn" data-act="toggle-hide" aria-pressed="'+privacy.hidden+'" aria-label="'+(privacy.hidden?'Mostrar montos':'Ocultar montos')+'">'+ic(privacy.hidden?'eyeoff':'eye')+'</button><span class="sync '+rt.syncMode+'"><i></i><span>'+esc(statusShort())+'</span></span></div></div>'+lost+demo+remind+fn();
  const tabOf=TABS.some(t=>t[0]===r)?r:'mas';
  $('#side').innerHTML='<div class="brand">Mis finanzas</div>'+NAV.map(n=>'<button data-act="go" data-r="'+n[0]+'"'+(n[0]===r?' aria-current="page"':'')+'>'+ic(n[0])+'<span>'+n[1]+'</span></button>').join('');
  $('#tabbar').innerHTML=TABS.map(t=>'<button data-act="go" data-r="'+t[0]+'"'+(t[0]===tabOf?' aria-current="page"':'')+'>'+ic(t[0])+'<span>'+t[1]+'</span></button>').join('');
  $('#fabroot').innerHTML=FAB_ROUTES.indexOf(r)>=0?'<button class="fab" data-act="add-tx">'+ic('plus')+'Gasto</button>':'';
}
