// Pantalla: proyecciones (¿qué pasaría si…?). Nada de lo que escribas aquí cambia tus datos.
import { esc, money, ymOf, addMonths, monthIdx, MES3, parseYM, num, round2 } from '../util.js';
import { ui } from '../ui.js';
import { qSummary, ingresoMensual, fijosDeSueldo, msiTotalMes, planLibreMes, rentaApartados, rentaFijos, pmt, serieLibre, msiLiberan } from '../logic.js';
import { libreBars, saveChart } from '../charts.js';

const mesAnio = ym => { const p = parseYM(ym); return MES3[p.m - 1] + ' ' + p.y; };

// Números de partida, sacados de tus datos
function baseInfo() {
  const ym = ymOf(new Date()), ing = ingresoMensual(ym), fij = fijosDeSueldo(ym), msi = msiTotalMes(ym);
  const rA = rentaApartados(ym), rF = rentaFijos(ym), renta = rA > 0 ? rA : rF;
  // La renta se cuenta una sola vez, esté en tus apartados o en tus gastos fijos
  const plan = round2(planLibreMes(ym) - (rA > 0 ? 0 : rF));
  const libreFijos = round2(ing.sueldo + ing.extra - fij - msi - (rF > 0 ? 0 : rA));
  const tieneApartados = [1, 2].some(n => qSummary(ym, n).asignado > 0);
  const base = ui.proy.base || (tieneApartados ? 'plan' : 'fijos');
  const val = base === 'plan' ? plan : base === 'fijos' ? libreFijos : num(ui.proy.custom);
  return { ym: ym, ing: ing, fij: fij, msi: msi, rA: rA, rF: rF, renta: renta, fuenteRenta: rA > 0 ? 'tus apartados' : (rF > 0 ? 'tus gastos fijos' : ''), plan: plan, libreFijos: libreFijos, base: base, val: val };
}

const fila = (t, v, cls) => '<div' + (cls ? ' class="' + cls + '"' : '') + '><span>' + t + '</span><b>' + v + '</b></div>';

const usarHTML = b => 'Usaremos <b>' + money(b.val) + ' al mes</b> como punto de partida.';

function baseHTML(b) {
  const seg = (k, t) => '<button type="button" class="seg-b' + (b.base === k ? ' on' : '') + '" data-act="proy-base" data-v="' + k + '">' + t + '</button>';
  const ayuda = b.base === 'plan' ? 'Lo que te queda después de apartar diezmo, renta, tarjetas, ahorro y topes, según los apartados de esta quincena.'
    : b.base === 'fijos' ? 'Tu sueldo menos gastos fijos, mensualidades y renta. No incluye lo del día a día (despensa, salidas).'
    : 'Escribe la cantidad que quieras usar como punto de partida.';
  return '<div class="eql">'
    + fila('Ingreso al mes' + (b.ing.extra > 0 ? ' (con lo que se repite)' : ''), money(b.ing.sueldo + b.ing.extra))
    + fila('− Gastos fijos', money(b.fij))
    + fila('− Mensualidades a meses', money(b.msi))
    + (b.rF === 0 && b.rA > 0 ? fila('− Renta (de tus apartados)', money(b.rA)) : '')
    + fila('= Sueldo menos fijos', money(b.libreFijos), 'tot')
    + fila('Libre planeado con tus apartados', money(b.plan), 'tot')
    + '</div>'
    + '<div class="seg" role="group" aria-label="Punto de partida">' + seg('plan', 'Mi libre planeado') + seg('fijos', 'Sueldo − fijos') + seg('custom', 'Otra cantidad') + '</div>'
    + (b.base === 'custom' ? '<div class="fld"><label for="p_custom">Tu cantidad al mes</label><input id="p_custom" data-proy="custom" type="number" inputmode="decimal" step="any" value="' + esc(ui.proy.custom) + '" autocomplete="off"></div>' : '')
    + '<p class="hint" style="margin:6px 0 0">' + ayuda + '</p>'
    + '<div class="proy-res ok" id="proy-usar" style="margin-bottom:0">' + usarHTML(b) + '</div>';
}

// ---- Quiero comprar algo ----
function buyOut(b) {
  const p = ui.proy, precio = num(p.precio), aho = num(p.ahorrado), falta = Math.max(0, precio - aho);
  const aporteIn = num(p.aporte), aporte = aporteIn > 0 ? aporteIn : Math.max(0, b.val), usaBase = !(aporteIn > 0), hoy = ymOf(new Date());
  if (!(precio > 0)) return '<p class="hint">Escribe el precio para ver cuánto tardarías en juntarlo y si te conviene pagarlo a meses.</p>';
  let h = '';
  if (falta <= 0) h += '<div class="proy-res ok"><b>Ya tienes todo el dinero.</b> Lo que llevas ahorrado cubre el precio.</div>';
  else if (aporte > 0) {
    const meses = Math.ceil(falta / aporte), cuando = addMonths(hoy, meses);
    h += '<div class="proy-res"><div class="proy-big">' + meses + (meses === 1 ? ' mes' : ' meses') + '</div><div>Apartando <b>' + money(aporte) + '</b> al mes lo juntas en <b>' + mesAnio(cuando) + '</b>' + (usaBase ? ' <span class="mut">(con tu punto de partida)</span>' : '') + '.</div></div>'
      + saveChart({ precio: precio, ahorrado: aho, aporte: aporte, meses: meses, fin: mesAnio(cuando) });
  } else h += '<div class="proy-res bad">Con $0 al mes no se junta. Escribe cuánto puedes apartar o cambia tu punto de partida.</div>';
  if (p.fecha && falta > 0) {
    const m = monthIdx(p.fecha) - monthIdx(hoy);
    if (m < 1) h += '<div class="proy-res bad">Ese mes ya llegó. Elige una fecha más adelante.</div>';
    else {
      const need = round2(falta / m), dif = round2(b.val - need);
      h += '<div class="proy-res ' + (dif >= 0 ? 'ok' : 'bad') + '">Para tenerlo en <b>' + mesAnio(p.fecha) + '</b> necesitas apartar <b>' + money(need) + '</b> al mes. '
        + (dif >= 0 ? 'Con tu punto de partida (' + money(b.val) + ') te sobran ' + money(dif) + ' al mes.' : 'Con tu punto de partida (' + money(b.val) + ') te faltarían ' + money(-dif) + ' al mes.') + '</div>';
    }
  }
  const tasa = num(p.tasa);
  h += '<h3 class="proy-h">Si lo pagas a meses</h3><div>' + [3, 6, 9, 12, 18, 24].map(n => {
    const pm = pmt(precio, tasa, n), queda = round2(b.val - pm);
    return '<div class="trow' + (queda < 0 ? ' neg' : '') + '"><span>' + n + ' meses</span><b>' + money(pm) + ' al mes</b><span class="mut">' + (queda >= 0 ? 'Tu libre quedaría en ' + money(queda) : 'Te faltarían ' + money(-queda) + ' al mes') + '</span></div>';
  }).join('') + '</div>' + (tasa > 0 ? '<p class="hint">Con ' + esc(p.tasa) + '% anual, la mensualidad ya incluye los intereses.</p>' : '');
  return h + '<div class="btns"><button class="btn sm" data-act="proy-meta">Crear una meta con esto</button></div>';
}

// ---- ¿Y si cambio de renta (u otro gasto)? ----
function rentOut(b) {
  const p = ui.proy, rAct = p.rentaAct !== '' ? num(p.rentaAct) : b.renta, rNue = p.rentaNueva !== '' ? num(p.rentaNueva) : rAct, camb = num(p.cambioIng), otro = num(p.otroGasto);
  if (!((p.rentaNueva !== '' && rNue !== rAct) || camb || otro)) return '<p class="hint">Escribe la renta nueva, un aumento de sueldo o un gasto nuevo al mes para ver cómo cambiaría tu libre.</p>';
  const ingA = b.ing.sueldo + b.ing.extra, ingD = ingA + camb;
  const antes = b.val, despues = round2(b.val + rAct - rNue + camb - otro), dif = round2(despues - antes);
  const pA = ingA > 0 ? Math.round(rAct / ingA * 100) : 0, pD = ingD > 0 ? Math.round(rNue / ingD * 100) : 0;
  const c = (t, a, d) => '<div>' + t + '</div><div class="r">' + a + '</div><div class="r">' + d + '</div>';
  let h = '<div class="cmp"><div class="h"></div><div class="h r">Ahora</div><div class="h r">Con el cambio</div>'
    + c('Ingreso al mes', money(ingA), money(ingD)) + c('Renta', money(rAct), money(rNue)) + (otro ? c('Gasto nuevo', money(0), money(otro)) : '')
    + c('Libre al mes', money(antes), money(despues)) + c('Libre por quincena', money(antes / 2), money(despues / 2)) + c('La renta es…', pA + '% del ingreso', pD + '% del ingreso') + '</div>';
  if (despues < 0) h += '<div class="proy-res bad"><b>No te alcanzaría:</b> te faltarían ' + money(-despues) + ' al mes.</div>';
  else h += '<div class="proy-res ' + (dif >= 0 ? 'ok' : '') + '">Te quedarían <b>' + money(despues) + '</b> libres al mes' + (dif < 0 ? ' (' + money(-dif) + ' menos que hoy)' : dif > 0 ? ' (' + money(dif) + ' más que hoy)' : '') + '.</div>';
  if (pD > 35) h += '<p class="hint">Como referencia, muchas guías recomiendan que la renta no pase de 30 a 35 % del ingreso. Es solo una orientación, no una regla.</p>';
  if (b.base === 'plan' && camb > 0) h += '<p class="hint">Si apartas diezmo, al aumento réstale ese porcentaje.</p>';
  if (!(rAct > 0)) h += '<p class="hint">No encontré tu renta actual, así que la nueva se cuenta completa como gasto. Escribe tu renta de hoy arriba para comparar bien.</p>';
  return h;
}

export function proyRefresh() {
  const b = baseInfo(), a = document.getElementById('proy-buy'), r = document.getElementById('proy-rent');
  if (a) a.innerHTML = buyOut(b);
  if (r) r.innerHTML = rentOut(b);
  const u = document.getElementById('proy-usar');
  if (u) u.innerHTML = usarHTML(b);
}

export function vProyecciones() {
  const b = baseInfo(), p = ui.proy;
  const inp = (k, label, o) => { o = o || {}; const ty = o.type || 'number'; return '<div class="fld"><label for="p_' + k + '">' + label + '</label><input id="p_' + k + '" data-proy="' + k + '" type="' + ty + '"' + (ty === 'number' ? ' inputmode="decimal" step="any"' : '') + ' value="' + esc(p[k]) + '" placeholder="' + esc(o.ph || '') + '" autocomplete="off">' + (o.hint ? '<small>' + esc(o.hint) + '</small>' : '') + '</div>'; };
  const serie = serieLibre(b.ym, 12), lib = msiLiberan(b.ym, 12);
  return '<div class="head" style="margin:0 0 10px;align-items:flex-start"><p class="hint" style="margin:0;flex:1">Prueba escenarios sin cambiar tus datos. Nada de lo que escribas aquí se guarda en tu quincena.</p><button class="btn ghost sm" data-act="proy-reset">Limpiar</button></div>'
    + '<div class="panel"><h2>Tu punto de partida</h2><div id="proy-base">' + baseHTML(b) + '</div></div>'
    + '<div class="panel"><h2>Quiero comprar algo</h2>'
    + inp('nombre', '¿Qué quieres comprar? (opcional)', { type: 'text', ph: 'Una laptop, un viaje…' })
    + inp('precio', 'Precio', { ph: '15000' }) + inp('ahorrado', 'Lo que ya tienes ahorrado', { ph: '0' })
    + inp('aporte', '¿Cuánto puedes apartar al mes?', { ph: String(Math.max(0, Math.round(b.val))), hint: 'Si lo dejas vacío usamos tu punto de partida.' })
    + inp('fecha', '¿Para cuándo lo quieres? (opcional)', { type: 'month' })
    + inp('tasa', 'Interés anual si lo pagas a meses (%)', { ph: '0', hint: 'Déjalo en 0 si son meses sin intereses.' })
    + '<div id="proy-buy">' + buyOut(b) + '</div></div>'
    + '<div class="panel"><h2>¿Y si cambio de renta?</h2>'
    + inp('rentaAct', 'Mi renta de hoy al mes', { ph: String(b.renta || ''), hint: b.fuenteRenta ? 'La encontramos en ' + b.fuenteRenta + ': ' + money(b.renta) + '.' : 'No la encontramos. Escríbela para comparar bien.' })
    + inp('rentaNueva', 'Renta nueva al mes', { ph: '9000' })
    + inp('cambioIng', 'Aumento de sueldo o ingreso nuevo al mes (opcional)', { ph: '0' })
    + inp('otroGasto', 'Otro gasto nuevo al mes (opcional)', { ph: '0', hint: 'Por ejemplo, un pago de coche o de servicios nuevos.' })
    + '<div id="proy-rent">' + rentOut(b) + '</div></div>'
    + '<div class="panel"><h2>Tu libre en los próximos 12 meses</h2>' + libreBars(serie.map((d, i) => ({ label: MES3[parseYM(d.ym).m - 1], val: d.val, cur: i === 0 })))
    + '<p class="hint" style="margin:8px 0 0">Es tu sueldo menos gastos fijos, mensualidades a meses y renta. No incluye lo del día a día.</p>'
    + (lib.length ? '<div style="margin-top:6px">' + lib.map(x => '<div class="row" style="cursor:default"><div class="grow"><div class="nm">Desde ' + mesAnio(x.mes) + '</div><div class="sb">Termina «' + esc(x.nombre) + '»: te liberas ' + money(x.monto) + ' al mes</div></div></div>').join('') + '</div>' : '') + '</div>';
}
