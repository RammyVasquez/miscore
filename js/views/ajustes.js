// Pantalla: ajustes.
import { esc, privacy, money, ic } from '../util.js';
import { S, statusText, rt } from '../state.js';
import { cloud, cloudConfigured } from '../cloud.js';

function cuenta(){
  if(!cloudConfigured)return '<div class="panel"><h2>Cuenta y sincronización</h2><p class="hint" style="margin:0">Aún no está configurada. Para sincronizar entre dispositivos agrega las llaves de Supabase en <code>js/config.js</code> (los pasos están en el README).</p></div>';
  if(cloud.user)return '<div class="panel"><h2>Cuenta</h2><p class="hint">Sesión iniciada como <b>'+esc(cloud.user.email)+'</b>.<br>'+esc(statusText())+'.</p><div class="btns"><button class="btn sm" data-act="sync-now">Sincronizar ahora</button><button class="btn ghost sm" data-act="logout">Cerrar sesión</button></div></div>';
  return '<div class="panel"><h2>Cuenta</h2><p class="hint">Tus datos solo viven en este dispositivo. Con una cuenta se sincronizan entre tus dispositivos y no se pierden si cambias de celular.</p><div class="btns"><button class="btn sm" data-act="signup">Crear cuenta</button><button class="btn ghost sm" data-act="login">Iniciar sesión</button></div></div>';
}

function recurrentes(){
  const rec=S.config.ingresosRec||[];
  if(!rec.length)return '';
  return '<div class="panel"><h2>Ingresos que se repiten</h2>'+rec.map(r=>'<div class="row" data-act="edit-rec" data-id="'+r.id+'"><div class="grow"><div class="nm">'+esc(r.nombre)+'</div><div class="sb">'+(r.cada==='q'?'Cada quincena':'Cada mes · '+(+r.q===2?'2ª quincena':'1ª quincena'))+'</div></div><div class="amt">'+money(r.monto)+'</div><span class="pen">'+ic('edit')+'</span></div>').join('')+'</div>';
}

export function vAjustes(){
  const th=localStorage.getItem('tema-fin')||'auto';
  const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
  const inst=standalone?'':'<div class="panel"><h2>Instalar en tu celular</h2><p class="hint">Ábrela como una app: pantalla completa, sin barra del navegador y con su propio ícono.</p>'+(rt.installEvt?'<button class="btn sm" data-act="install">Instalar app</button>':'<p class="hint" style="margin:0">En iPhone: toca Compartir y luego "Agregar a pantalla de inicio". En Android: abre el menú del navegador y elige "Instalar app".</p>')+'</div>';
  return cuenta()+inst+recurrentes()+ '<div class="panel"><h2>Ingreso</h2><label class="inc" style="margin:0"><span>Ingreso por quincena</span><input type="'+(privacy.hidden?'password':'number')+'" inputmode="decimal" step="any" autocomplete="off" value="'+esc(S.config.ingresoQ||'')+'" data-chg="ingresoQ"></label><p class="hint" style="margin-top:8px">Se usa al crear cada nueva quincena. Puedes cambiarlo en cada una.</p></div>'
   +'<div class="panel"><h2>Apariencia</h2><div class="fld"><select data-chg="tema"><option value="auto"'+(th==='auto'?' selected':'')+'>Automático</option><option value="light"'+(th==='light'?' selected':'')+'>Claro</option><option value="dark"'+(th==='dark'?' selected':'')+'>Oscuro</option></select></div></div>'
   +'<div class="panel"><h2>Datos</h2><p class="hint">'+esc(statusText())+'.</p><div class="btns"><button class="btn ghost sm" data-act="export">Descargar respaldo</button><button class="btn ghost sm" data-act="import">Restaurar respaldo</button><button class="btn danger sm" data-act="wipe">Borrar todo</button></div></div>';
}
