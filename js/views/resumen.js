// Pantalla: resumen (tablero principal).
import { esc, money, ymOf, MESES, parseYM, inDays, fdate, sum, ic, privacy } from '../util.js';
import { S } from '../state.js';
import { qBounds, qSummary, cardInfo, fijoMonto, metaObj, KIND, msiInfo, msiMes, cardTotal, valeSaldo, valeProx } from '../logic.js';
import { chipK } from '../components.js';
import { donut, legend, ring, paceChart } from '../charts.js';

export function vResumen() {
  const now = new Date(), ym = ymOf(now), n = now.getDate() <= 15 ? 1 : 2;
  const s = qSummary(ym, n), q = s.q, p = parseYM(ym), b = qBounds(ym, n);
  const startDay = +b[0].slice(8), endDay = +b[1].slice(8), today = now.getDate();
  const total = endDay - startDay + 1, dayIdx = today - startDay + 1, left = endDay - today + 1;
  const plan = id => (s.by[id] && s.by[id].plan) || 0;

  // Gasto del día a día (efectivo y débito) frente a lo que tienes para gastar
  const cash = s.tx.filter(t => t.tipo !== 'ingreso' && (t.medio === 'efectivo' || !t.medio));
  const spent = sum(cash, t => t.monto);
  const topes = q.allocs.filter(a => a.kind === 'gasto');
  const budget = sum(topes, a => plan(a.id)) + Math.max(0, s.ingreso - s.asignado);
  const cum = []; let acc = 0;
  for (let d = startDay; d <= endDay; d++) {
    if (d > today) { cum.push(null); continue; }
    acc += sum(cash.filter(t => +t.f.slice(8) === d), t => t.monto); cum.push(acc);
  }

  // Estado en lenguaje simple
  let tone = 'ok', msg = 'Vas bien';
  if (s.libre < 0) { tone = 'bad'; msg = 'Te pasaste de lo planeado'; }
  else if (budget > 0 && spent / budget > dayIdx / total + 0.15) { tone = 'warn'; msg = 'Estás gastando más rápido de lo normal'; }

  // ---- Encabezado: lo libre ----
  let h = '<section class="hero' + (tone === 'bad' ? ' neg' : '') + '">'
    + '<div class="hero-top"><div class="lbl">Te queda libre · ' + (n === 1 ? '1ª' : '2ª') + ' quincena de ' + MESES[p.m - 1] + '</div>'
    + '<button class="eye" data-act="toggle-hide" aria-label="Mostrar u ocultar montos">' + ic(privacy.hidden ? 'eyeoff' : 'eye') + '</button></div>'
    + '<div class="big" data-act="toggle-hide" title="Toca para ocultar o mostrar">' + money(s.libre) + '</div>'
    + '<div class="status t-' + tone + '"><i></i>' + msg + '</div>'
    + '<div class="sub">' + (left <= 1 ? 'Hoy es el último día de la quincena.' : 'Quedan ' + left + ' días de la quincena')
    + (s.libre > 0 && left >= 1 ? '. Puedes gastar unos <b>' + money(Math.round(s.libre / Math.max(1, left))) + '</b> al día.' : (left <= 1 ? '' : '.')) + '</div>'
    + '<div class="daybar"><div><i style="width:' + Math.min(100, Math.round(dayIdx / total * 100)) + '%"></i></div><span>Día ' + dayIdx + ' de ' + total + '</span></div>'
    + '<details class="how"><summary>¿Cómo se calcula?</summary><div class="eq">'
    + '<div><span>Ingreso de la quincena</span><b>' + money(s.ingreso) + '</b></div>'
    + '<div><span>− Apartados (lo que ya apartaste)</span><b>' + money(s.asignado) + '</b></div>'
    + '<div><span>− Gastos sin apartado</span><b>' + money(s.over + s.unb) + '</b></div>'
    + '<div class="res"><span>= Libre</span><b>' + money(s.libre) + '</b></div></div>'
    + '<p>Un apartado es una parte de tu sueldo con un destino, como los apartados de tu banco: diezmo, renta, tarjetas, ahorro o un tope de gasto.</p></details></section>';
  h += '<div class="quick"><button class="btn ghost sm" data-act="add-extra">Ingreso extra</button><button class="btn ghost sm" data-act="go" data-r="quincena">Ver mi quincena</button></div>';

  // ---- Por pagar ----
  const apartados = q.allocs.filter(a => a.kind !== 'gasto').slice().sort((a, b2) => (a.done ? 1 : 0) - (b2.done ? 1 : 0));
  const pend = sum(apartados.filter(a => !a.done), a => plan(a.id));
  const pagar = '<div class="panel"><div class="head"><h2>Por pagar esta quincena</h2>' + (apartados.some(a => !a.done) ? '<span class="amt">' + money(pend) + '</span>' : '') + '</div>'
    + (apartados.length ? apartados.slice(0, 8).map(a => {
      const ref = a.kind === 'tarjeta' ? S.config.tarjetas.find(c => c.id === a.ref) : a.kind === 'meta' ? S.config.metas.find(c => c.id === a.ref) : null;
      return '<div class="row' + (a.done ? ' done' : '') + '" data-act="go" data-r="quincena"><button class="chk" data-act="toggle-alloc" data-id="' + a.id + '" data-ym="' + ym + '" data-q="' + n + '" aria-pressed="' + (!!a.done) + '" aria-label="Marcar ' + esc(a.nombre) + ' como hecho">' + ic('check') + '</button>'
        + '<div class="grow"><div class="nm">' + esc(a.nombre) + '</div><div class="sb">' + KIND[a.kind].l + (ref ? ' · ' + esc(ref.nombre) : '') + '</div></div><div class="amt">' + money(plan(a.id)) + '</div></div>';
    }).join('') + (apartados.every(a => a.done) ? '<p class="ok-line">Todo al día. Ya marcaste todos tus apartados.</p>' : '')
      : '<div class="empty">Aún no tienes apartados. Créalos en la pestaña Quincena.</div>') + '</div>';

  // ---- Reparto de la quincena (dona) ----
  const kinds = [['diezmo', 'Diezmo', 'var(--k-die)'], ['pago', 'Renta y otros pagos', 'var(--k-pag)'], ['tarjeta', 'Pago de tarjetas', 'var(--k-tar)'], ['meta', 'Ahorro y metas', 'var(--k-met)'], ['gasto', 'Gastos con tope', 'var(--k-gas)']];
  const segs = kinds.map(k => ({ label: k[1], color: k[2], value: sum(q.allocs.filter(a => a.kind === k[0]), a => plan(a.id)) }));
  if (s.over + s.unb > 0) segs.push({ label: 'Gasto sin apartado', color: 'var(--bad)', value: s.over + s.unb });
  if (s.libre > 0) segs.push({ label: 'Libre', color: 'var(--lib)', value: s.libre });
  const reparto = '<div class="panel"><h2>¿A dónde se va tu quincena?</h2><div class="donutwrap">'
    + donut(segs, { center: money(s.ingreso), sub: 'ingreso', label: 'Reparto de tu ingreso de la quincena' }) + legend(segs) + '</div></div>';

  // ---- Ritmo de gasto ----
  let ritmo = '<div class="panel"><h2>Tu gasto día a día</h2>';
  if (budget <= 0 && !cash.length) ritmo += '<div class="empty">Agrega un apartado con tope (por ejemplo Despensa) y registra tus gastos para ver tu ritmo.</div>';
  else {
    const proj = dayIdx > 0 ? spent / dayIdx * total : 0;
    ritmo += '<p class="hint" style="margin-bottom:6px">' + (spent === 0 ? 'Aún no registras gastos en efectivo o débito esta quincena.'
      : 'Llevas <b>' + money(spent) + '</b> de <b>' + money(budget) + '</b> que tenías para gastar. ' + (proj > budget ? 'A este paso te pasarías unos ' + money(Math.round(proj - budget)) + '.' : 'A este paso llegarías al final con unos ' + money(Math.round(budget - proj)) + ' de sobra.')) + '</p>'
      + paceChart({ startDay: startDay, cum: cum, budget: budget, todayIdx: Math.min(dayIdx - 1, total - 1) })
      + '<div class="legend"><span><i class="ln"></i>Lo que llevas</span><span><i class="ln dash"></i>Ritmo ideal</span></div>'
      + '<p class="hint" style="margin:8px 0 0">Cuenta efectivo y débito frente a tus topes más lo libre. Lo que pagas con tarjeta se cuenta cuando pagas la tarjeta.</p>';
  }
  ritmo += '</div>';

  // ---- Topes ----
  const topesH = topes.length ? '<div class="panel"><h2>Tus topes de gasto</h2>' + topes.map(a => {
    const pl = plan(a.id), sp = (s.by[a.id] && s.by[a.id].spent) || 0, rest = pl - sp, r = pl ? sp / pl : 0;
    return '<div class="row" data-act="go" data-r="gastos"><div class="grow"><div class="nm">' + esc(a.nombre) + '</div><div class="bar ' + (r > 1 ? 'bad' : r > 0.8 ? 'warn' : 'ok') + '"><i style="width:' + Math.min(100, Math.round(r * 100)) + '%"></i></div></div>'
      + '<div style="text-align:right"><div class="amt" style="font-size:16px">' + (rest >= 0 ? money(rest) : money(-rest)) + '</div><div class="sb">' + (rest >= 0 ? 'te quedan' : 'te pasaste') + '</div></div></div>';
  }).join('') + '</div>' : '';

  // ---- Tarjetas ----
  const cards = S.config.tarjetas.filter(c => +c.saldo > 0).map(c => ({ c: c, i: cardInfo(c) })).sort((a, b2) => a.i.dl - b2.i.dl);
  const tarj = '<div class="panel"><div class="head"><h2>Próximos pagos de tarjeta</h2><button class="btn ghost sm" data-act="go" data-r="tarjetas">Ver todas</button></div>'
    + (cards.length ? cards.map(x => '<div class="row" data-act="go" data-r="tarjetas"><div class="grow"><div class="nm">' + esc(x.c.nombre) + '</div><div class="sb">Pagar antes del ' + fdate(x.i.nl) + (msiMes(x.c.id, ym) > 0 ? ' · a meses: ' + money(msiMes(x.c.id, ym)) : '') + '</div></div>'
      + '<div style="text-align:right"><div class="amt">' + money(x.c.saldo) + '</div><div class="when ' + (x.i.dl <= 3 ? 'w-bad' : x.i.dl <= 7 ? 'w-warn' : '') + '">' + inDays(x.i.dl) + '</div></div></div>').join('')
      : '<div class="empty">Sin saldos pendientes en tarjetas.</div>') + '</div>';

  // ---- Metas ----
  const metas = '<div class="panel"><div class="head"><h2>Tus metas</h2><button class="btn ghost sm" data-act="go" data-r="metas">Ver metas</button></div>'
    + (S.config.metas.length ? '<div class="rings">' + S.config.metas.map(m => {
      const o = metaObj(m), ah = +m.ahorrado || 0;
      return '<div class="ringc" data-act="go" data-r="metas">' + (o ? ring(ah / o * 100, 'var(--ok)') : '<div class="ring-none">' + ic('metas') + '</div>')
        + '<div class="nm">' + esc(m.nombre) + '</div><div class="sb">' + money(ah) + (o ? ' de ' + money(o) : '') + '</div></div>';
    }).join('') + '</div>' : '<div class="empty">Crea tu primera meta de ahorro.</div>') + '</div>';

  // ---- Panorama ----
  const deuda = sum(S.config.tarjetas, c => cardTotal(c)), fij = sum(S.config.fijos, f => fijoMonto(f, ym));
  const msiAll = (S.config.msi || []).map(m => msiInfo(m, ym));
  const vales = (S.config.vales || []);
  const valesH = vales.length ? '<div class="panel"><div class="head"><h2>Tus vales</h2><button class="btn ghost sm" data-act="go" data-r="vales">Ver vales</button></div>' + vales.map(v => { const px = valeProx(v); return '<div class="row" data-act="go" data-r="vales"><div class="grow"><div class="nm">' + esc(v.nombre) + '</div><div class="sb">' + (px ? 'Próxima recarga ' + inDays(px.dias) : 'Sin recarga mensual') + '</div></div><div class="amt">' + money(valeSaldo(v)) + '</div></div>'; }).join('') + '</div>' : '';
  const pano = '<div class="panel"><h2>Panorama del mes</h2><div class="row" data-act="go" data-r="tarjetas"><div class="grow nm">Deuda total en tarjetas</div><div class="amt">' + money(deuda) + '</div></div>'
    + '<div class="row" data-act="go" data-r="fijos"><div class="grow nm">Gastos fijos y suscripciones</div><div class="amt">' + money(fij) + '</div></div>'
    + (msiAll.length ? '<div class="row" data-act="go" data-r="tarjetas"><div class="grow nm">Pagos a meses este mes</div><div class="amt">' + money(sum(msiAll.filter(i => i.estado === 'activa'), i => i.monto)) + '</div></div><div class="row" data-act="go" data-r="tarjetas"><div class="grow nm">Por pagar en compras a meses</div><div class="amt">' + money(sum(msiAll, i => i.faltaTotal)) + '</div></div>' : '') + '</div>';

  return h + '<div class="cols two"><div>' + pagar + ritmo + topesH + '</div><div>' + reparto + tarj + valesH + metas + pano + '</div></div>';
}
