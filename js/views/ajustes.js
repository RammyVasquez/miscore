// Pantalla: ajustes.
import { esc } from '../util.js';
import { S, statusText, rt } from '../state.js';

export function vAjustes(){
  const th=localStorage.getItem('tema-fin')||'auto';
  const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
  const inst=standalone?'':'<div class="panel"><h2>Instalar en tu celular</h2><p class="hint">Ábrela como una app: pantalla completa, sin barra del navegador y con su propio ícono.</p>'+(rt.installEvt?'<button class="btn sm" data-act="install">Instalar app</button>':'<p class="hint" style="margin:0">En iPhone: toca Compartir y luego "Agregar a pantalla de inicio". En Android: abre el menú del navegador y elige "Instalar app".</p>')+'</div>';
  return inst+ '<div class="panel"><h2>Ingreso</h2><label class="inc" style="margin:0"><span>Ingreso por quincena</span><input type="number" inputmode="decimal" step="any" value="'+esc(S.config.ingresoQ||'')+'" data-chg="ingresoQ"></label><p class="hint" style="margin-top:8px">Se usa al crear cada nueva quincena. Puedes cambiarlo en cada una.</p></div>'
   +'<div class="panel"><h2>Apariencia</h2><div class="fld"><select data-chg="tema"><option value="auto"'+(th==='auto'?' selected':'')+'>Automático</option><option value="light"'+(th==='light'?' selected':'')+'>Claro</option><option value="dark"'+(th==='dark'?' selected':'')+'>Oscuro</option></select></div></div>'
   +'<div class="panel"><h2>Datos</h2><p class="hint">'+esc(statusText())+'.</p><div class="btns"><button class="btn ghost sm" data-act="export">Descargar respaldo</button><button class="btn ghost sm" data-act="import">Restaurar respaldo</button><button class="btn danger sm" data-act="wipe">Borrar todo</button></div></div>';
}
