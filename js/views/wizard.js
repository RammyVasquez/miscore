// Pantalla: asistente de configuración (5 pasos).
import { esc, money, ic } from '../util.js';
import { wiz, getPath, estimado, ensurePagos, PASOS } from '../wizard.js';

const val = p => { const v = getPath(p); return v == null ? '' : v; };
const inp = (path, label, o) => {
  o = o || {}; const ty = o.type || 'number';
  return '<div class="fld"><label for="z_' + path + '">' + label + '</label><input id="z_' + path + '" data-wiz="' + path + '" type="' + ty + '"' + (ty === 'number' ? ' inputmode="decimal" step="any"' : '') + ' value="' + esc(val(path)) + '" placeholder="' + esc(o.ph || '') + '" autocomplete="off">' + (o.hint ? '<small>' + esc(o.hint) + '</small>' : '') + '</div>';
};
const sel = (path, label, opts, re, hint) =>
  '<div class="fld"><label for="z_' + path + '">' + label + '</label><select id="z_' + path + '" data-wiz="' + path + '"' + (re ? ' data-wizre="1"' : '') + '>'
  + opts.map(o => '<option value="' + esc(o[0]) + '"' + (String(val(path) || opts[0][0]) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div>';

const titulo = (t, sub) => '<h1 class="wl-h">' + t + '</h1><p class="wl-sub">' + sub + '</p>';
const quitar = (act, id, nombre) => '<button class="wz-x" data-act="' + act + '" data-id="' + id + '" aria-label="Quitar ' + esc(nombre) + '">×</button>';

function paso1(w) {
  return titulo('¿Cuánto cobras por quincena?', 'Con esto calculamos cuánto te queda libre después de tus apartados. Podrás cambiarlo cuando quieras.')
    + '<div class="wl-ask"><label for="z_ingreso" class="wl-lbl">Ingreso por quincena</label><div class="money-in"><span>$</span><input id="z_ingreso" class="bigin" data-wiz="ingreso" type="number" inputmode="decimal" step="any" placeholder="12000" autocomplete="off" value="' + esc(w.ingreso) + '"></div>'
    + '<div class="chips" aria-label="Montos comunes">' + [8000, 10000, 12000, 15000, 20000].map(v => '<button type="button" class="chipbtn" data-act="wiz-amount" data-v="' + v + '">$' + v.toLocaleString('es-MX') + '</button>').join('') + '</div></div>'
    + '<div class="wl-ask"><h2>¿Cuándo empieza tu quincena?</h2>' + sel('modoQ', 'Mi quincena cambia…', [['cal', 'El 1 y el 16 (del 1 al 15 y del 16 al fin de mes)'], ['pago', 'El día que me pagan (el 15 y el último día del mes)']], false, 'Si te pagan el 15 y a fin de mes, elige la segunda: así el dinero de hoy ya cuenta en la quincena nueva.') + '</div>'
    + '<div class="wl-ask"><h2>¿Tienes un bono o ingreso que llega cada mes? (opcional)</h2>' + inp('bono', 'Monto del bono', { ph: '1400' })
    + sel('bonoQ', '¿En qué quincena lo recibes?', [['2', '2ª quincena (días 16 al fin de mes)'], ['1', '1ª quincena (días 1 al 15)']], false, 'Elige la quincena en que cae la fecha en que te lo pagan. Por ejemplo, si te llega el 6 o el 7, es la 1ª quincena.') + '</div>';
}

function paso2(w) {
  const filas = w.tarjetas.map(c => '<div class="wz-row"><div class="grow"><div class="nm">' + esc(c.nombre) + '</div><div class="sb">Pago sin intereses ' + money(c.saldo) + (c.total > c.saldo ? ' · total ' + money(c.total) : '') + ' · corte el día ' + c.corte + ' · pagar antes del día ' + c.limite + '</div></div>' + quitar('wiz-del-card', c.id, c.nombre) + '</div>').join('');
  return titulo('¿Qué tarjetas usas?', 'Así te avisamos cuánto apartar y cuándo pagar para no generar intereses. Si no usas tarjetas, omite este paso.')
    + (filas ? '<div class="wl-ask">' + filas + '</div>' : '')
    + '<div class="wl-ask"><h2>' + (w.tarjetas.length ? 'Agregar otra tarjeta' : 'Agregar una tarjeta') + '</h2>'
    + inp('fc.nombre', 'Nombre', { type: 'text', ph: 'BBVA, Rappi…' })
    + inp('fc.saldo', 'Pago para no generar intereses', { ph: '3962', hint: 'Es lo que dice tu estado de cuenta que debes pagar antes de la fecha límite. Si ya la pagaste, déjalo en 0.' })
    + inp('fc.total', 'Saldo total de la tarjeta (opcional)', { ph: '5329' })
    + inp('fc.corte', 'Día de corte (1 a 31)', { ph: '5' }) + inp('fc.limite', 'Día límite de pago (1 a 31)', { ph: '26' })
    + '<button class="btn" data-act="wiz-add-card">Agregar tarjeta</button></div>';
}

const mensual = x => x.cada === 'q' ? x.monto * 2 : x.monto;
function descFijo(w, x) {
  const medio = x.medio === 'efectivo' ? 'Efectivo o débito' : ((w.tarjetas.find(c => c.id === x.medio) || {}).nombre || 'Tarjeta');
  return (x.cada === 'q' ? 'Cada quincena' : 'Cada mes' + (x.q !== '0' ? ' · ' + (x.q === '1' ? '1ª' : '2ª') + ' quincena' : '') + (x.reparto === 'mitad' ? ' · la mitad en cada quincena' : '')) + ' · ' + medio;
}
function paso3(w) {
  const filas = w.fijos.map(x => '<div class="wz-row"><div class="grow"><div class="nm">' + esc(x.nombre) + '</div><div class="sb">' + descFijo(w, x) + '</div></div><div class="amt">' + money(mensual(x)) + '</div>' + quitar('wiz-del-fijo', x.id, x.nombre) + '</div>').join('');
  const medios = [['efectivo', 'Efectivo o débito']].concat(w.tarjetas.map(c => [c.id, c.nombre]));
  const cada = (w.fx || {}).cada || '1';
  return titulo('¿Qué pagas cada mes?', 'Renta, servicios, suscripciones… Lo que pagas en efectivo o débito se aparta solo de tu sueldo; lo que cargas a tarjeta se paga con el pago de la tarjeta.')
    + (filas ? '<div class="wl-ask">' + filas + '</div>' : '')
    + '<div class="wl-ask"><h2>' + (w.fijos.length ? 'Agregar otro gasto' : 'Agregar un gasto') + '</h2><div class="chips" aria-label="Sugerencias">'
    + ['Renta', 'Luz', 'Agua', 'Internet', 'Celular', 'Gas', 'Gasolina'].map(n => '<button type="button" class="chipbtn" data-act="wiz-chip-fijo" data-v="' + n + '">' + n + '</button>').join('') + '</div>'
    + inp('fx.nombre', 'Nombre', { type: 'text', ph: 'Renta' }) + inp('fx.monto', 'Monto', { ph: '5000', hint: 'Si se paga cada quincena, escribe lo que pagas cada vez.' })
    + sel('fx.cada', '¿Cada cuánto se paga?', [['1', 'Cada mes'], ['q', 'Cada quincena (2 veces al mes)']], true)
    + (cada !== 'q' ? sel('fx.q', '¿En qué quincena lo pagas?', [['0', 'No importa (se reparte mitad en cada quincena)'], ['1', '1ª quincena (días 1 al 15)'], ['2', '2ª quincena (días 16 al fin de mes)']], false, 'Si pagas el día 15 o 16, normalmente es la 2ª.')
      + sel('fx.reparto', '¿Cómo lo apartas?', [['junto', 'Todo en la quincena en que se paga'], ['mitad', 'La mitad en cada quincena (lo voy juntando)']], false, 'Por ejemplo: una renta de $5,000 que pagas el día 16 y de la que apartas $2,500 cada quincena.') : '')
    + sel('fx.medio', 'Se paga con', medios)
    + '<button class="btn" data-act="wiz-add-fijo">Agregar gasto</button></div>';
}

function estInner() {
  const e = estimado();
  return '<div class="proy-res ' + (e.libre < 0 ? 'bad' : 'ok') + '"><div>Con esto te quedarían <b>≈ ' + money(e.libre) + '</b> libres por quincena.</div><div class="sb" style="margin-top:4px">Ingreso ' + money(e.ing) + ' − apartados ' + money(e.apartados) + (e.fijos > 0 ? ' (incluye ' + money(e.fijos) + ' de tus gastos fijos directos, en promedio)' : '') + '.</div></div>';
}
export function wizRefresh() { const b = document.getElementById('wiz-est'); if (b) b.innerHTML = estInner(); }

function paso4(w) {
  ensurePagos();
  const tarj = w.tarjetas.map(c => inp('pago.' + c.id, 'Pagar ' + esc(c.nombre) + ' (cada quincena)', { hint: 'Su pago para no generar intereses es ' + money(c.saldo) + '. Si lo juntas en dos quincenas, aparta la mitad en cada una.' })).join('');
  return titulo('Reparte tu sueldo en apartados', 'Cada quincena apartas una parte para cada cosa. Lo que no apartas es tu dinero libre. Puedes cambiarlo después.')
    + '<div class="wl-ask"><label class="wz-chk"><input type="checkbox" data-wiz="diezmo"' + (w.diezmo ? ' checked' : '') + '><span>Aparto diezmo</span></label>' + (w.diezmo ? inp('diezmoPct', 'Porcentaje de tu ingreso', { ph: '10' }) : '') + '</div>'
    + (tarj ? '<div class="wl-ask"><h2>Pagos de tarjetas</h2>' + tarj + '</div>' : '')
    + '<div class="wl-ask"><h2>Ahorro y gastos del día a día</h2>' + inp('ahorro', 'Ahorro por quincena (opcional)', { ph: '500' })
    + inp('topes.despensa', 'Despensa: tope por quincena (opcional)', { ph: '1500', hint: 'Cuando registres tus compras en efectivo o débito, verás cuánto te queda de este tope.' })
    + inp('topes.salidas', 'Salidas: tope por quincena (opcional)', { ph: '800' }) + '</div>'
    + '<div id="wiz-est">' + estInner() + '</div>';
}

function paso5(w) {
  const e = estimado(), fila = (t, v, s) => '<div class="wz-row"><div class="grow"><div class="nm">' + t + '</div>' + (v ? '<div class="sb">' + v + '</div>' : '') + '</div><button class="link" data-act="wiz-goto" data-s="' + s + '">Cambiar</button></div>';
  const aps = [];
  if (w.diezmo) aps.push('Diezmo ' + (+w.diezmoPct || 10) + '%');
  w.tarjetas.forEach(c => { if (+w.pago[c.id] > 0) aps.push('Pagar ' + esc(c.nombre) + ' ' + money(w.pago[c.id])); });
  if (+w.ahorro > 0) aps.push('Ahorro ' + money(w.ahorro));
  if (+w.topes.despensa > 0) aps.push('Despensa ' + money(w.topes.despensa));
  if (+w.topes.salidas > 0) aps.push('Salidas ' + money(w.topes.salidas));
  const falta = [];
  if (!w.tarjetas.length) falta.push('tus tarjetas (en Tarjetas)');
  if (!w.fijos.length) falta.push('tus gastos fijos (en Más > Fijos)');
  return titulo('Todo listo', 'Esto es lo que vamos a crear. Si algo no cuadra, cámbialo ahora o después.')
    + '<div class="wl-ask">'
    + fila('Sueldo ' + money(e.ing) + ' por quincena', +w.bono > 0 ? 'Más un bono de ' + money(w.bono) + ' cada mes' : '', 1)
    + fila(w.tarjetas.length + (w.tarjetas.length === 1 ? ' tarjeta' : ' tarjetas'), w.tarjetas.map(c => esc(c.nombre)).join(', '), 2)
    + fila(w.fijos.length + (w.fijos.length === 1 ? ' gasto fijo' : ' gastos fijos'), w.fijos.map(x => esc(x.nombre)).join(', '), 3)
    + fila(aps.length + (aps.length === 1 ? ' apartado' : ' apartados'), aps.join(' · '), 4) + '</div>'
    + (e.libre < 0 ? '<div class="proy-res bad"><b>Tus apartados superan tu sueldo</b> por ' + money(-e.libre) + ' cada quincena. Cambia el paso 4 para que te alcance.</div>'
      : '<div class="proy-res ok">Te quedarían <b>≈ ' + money(e.libre) + '</b> libres por quincena.</div>')
    + (falta.length ? '<p class="hint">Aún puedes agregar ' + falta.join(' y ') + ' cuando quieras.</p>' : '')
    + '<p class="hint">Después puedes agregar vales (Más > Vales), compras a meses (Tarjetas), metas y probar escenarios en Proyecciones. En el Resumen verás "Qué hacer ahora".</p>';
}

export function vWizard() {
  const w = wiz(), n = w.step;
  const cuerpo = [paso1, paso2, paso3, paso4, paso5][n - 1](w);
  return '<div class="wl"><div class="wz-top"><button class="link" data-act="wiz-exit">‹ Salir</button><span>Paso ' + n + ' de ' + PASOS + '</span></div>'
    + '<div class="wz-prog" aria-hidden="true">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= n ? 'on' : '') + '"></i>').join('') + '</div>'
    + cuerpo
    + '<div class="wz-nav"><button class="btn ghost" data-act="wiz-back">Atrás</button>'
    + (n < PASOS ? '<button class="btn" data-act="wiz-next">Siguiente</button>' : '<button class="btn" data-act="wiz-finish">Empezar a usar la app</button>') + '</div>'
    + (n >= 2 && n <= 4 ? '<button class="link wz-skip" data-act="wiz-skip">Omitir este paso</button>' : '') + '</div>';
}
