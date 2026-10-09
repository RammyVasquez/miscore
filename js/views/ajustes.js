// Pantalla: ajustes.
import { esc } from '../util.js';
import { S, statusText } from '../state.js';

export function vAjustes(){
  const th=localStorage.getItem('tema-fin')||'auto';
  return '<div class="panel"><h2>Ingreso</h2><label class="inc" style="margin:0"><span>Ingreso por quincena</span><input type="number" inputmode="decimal" step="any" value="'+esc(S.config.ingresoQ||'')+'" data-chg="ingresoQ"></label><p class="hint" style="margin-top:8px">Se usa al crear cada nueva quincena. Puedes cambiarlo en cada una.</p></div>'
   +'<div class="panel"><h2>Apariencia</h2><div class="fld"><select data-chg="tema"><option value="auto"'+(th==='auto'?' selected':'')+'>Automático</option><option value="light"'+(th==='light'?' selected':'')+'>Claro</option><option value="dark"'+(th==='dark'?' selected':'')+'>Oscuro</option></select></div></div>'
   +'<div class="panel"><h2>Datos</h2><p class="hint">'+esc(statusText())+'.</p><div class="btns"><button class="btn ghost sm" data-act="export">Descargar respaldo</button><button class="btn ghost sm" data-act="import">Restaurar respaldo</button><button class="btn danger sm" data-act="wipe">Borrar todo</button></div></div>';
}
