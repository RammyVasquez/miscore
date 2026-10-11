// Pantalla: vales (despensa, gasolina…). No son sueldo: solo para saber cuánto queda.
import { esc, money, ymOf, inDays, fdate } from '../util.js';
import { S } from '../state.js';
import { valeSaldo, valeProx, valeGastoMes, valeTx, valeDias, valeRecargaMes } from '../logic.js';
import { txRow } from '../components.js';

export function vVales() {
  const vales = S.config.vales || [], ym = ymOf(new Date());
  let h = '<div class="btns" style="margin:0 0 14px"><button class="btn" data-act="add-vale">Agregar vales</button></div>';
  if (!vales.length) return h + '<div class="panel empty">Si recibes vales de despensa o de gasolina, agrégalos aquí para saber cuánto te queda. <b>No cuentan como sueldo</b> ni cambian tu dinero libre. Cuando compres con ellos, registra el gasto y en "Se pagó con" elige tus vales.</div>';
  vales.forEach(v => {
    const saldo = valeSaldo(v), gasMes = valeGastoMes(v, ym), px = valeProx(v);
    const movs = valeTx(v.id).slice().sort((a, b) => b.f.localeCompare(a.f)).slice(0, 5);
    h += '<div class="panel"><div class="head"><h2>' + esc(v.nombre) + '</h2><div class="amt" style="font-size:26px' + (saldo < 0 ? ';color:var(--bad)' : '') + '">' + money(saldo) + '</div></div>'
      + '<div class="kv"><span>Gastado este mes: <b>' + money(gasMes) + '</b></span>' + (px ? '<span>' + (v.cada === 'q' ? 'Recarga de <b>' + money(v.recarga) + '</b> cada quincena (días ' + valeDias(v).join(' y ') + ')' : 'Recarga de <b>' + money(v.recarga) + '</b> el día ' + v.dia) + ' · próxima ' + inDays(px.dias) + ', ' + fdate(px.fecha) + '</span>' : '<span>Sin recarga</span>') + '</div>'
      + (+v.recarga > 0 ? '<div class="bar ' + (gasMes > valeRecargaMes(v) ? 'bad' : 'ok') + '"><i style="width:' + Math.min(100, Math.round(gasMes / valeRecargaMes(v) * 100)) + '%"></i></div>' : '')
      + (movs.length ? '<div style="margin-top:6px">' + movs.map(txRow).join('') + '</div>' : '<p class="hint" style="margin:10px 0 0">Aún no registras gastos con estos vales.</p>')
      + '<div class="btns"><button class="btn sm" data-act="vale-gasto" data-id="' + v.id + '">Registrar gasto con vales</button><button class="btn ghost sm" data-act="edit-vale" data-id="' + v.id + '">Editar</button></div></div>';
  });
  return h + '<p class="hint">Las compras con vales aparecen en Gastos y Reportes, pero no restan de tus apartados con tope ni de tu dinero libre.</p>';
}
