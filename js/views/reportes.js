// Pantalla: reportes.
import { esc, money, ymOf, MESES, MES3, cap, parseYM, addMonths, sum } from '../util.js';
import { roMonth, catTotals, recsQ } from '../logic.js';
import { donut, legend, barsChart, PAL } from '../charts.js';
import { ui } from '../ui.js';

function monthTotals(ym) {
  const mo = roMonth(ym);
  let ing = 0, aho = 0, gas = 0;
  ['q1', 'q2'].forEach(k => { const q = mo[k]; if (q) { ing += +q.ingreso || 0; q.allocs.forEach(a => { if (a.kind === 'meta' && a.done) aho += +a.aplicado || 0; }); } });
  [1, 2].forEach(n => { if (mo['q' + n]) ing += sum(recsQ(ym, n), x => x.m); });
  (mo.tx || []).forEach(t => { if (t.tipo === 'ingreso') ing += t.monto; else gas += t.monto; });
  return { ing: ing, gas: gas, aho: aho };
}

export function chart6() {
  const base = ymOf(new Date()), data = [];
  for (let i = 5; i >= 0; i--) {
    const ym = addMonths(base, -i), t = monthTotals(ym);
    data.push({ label: MES3[parseYM(ym).m - 1], ing: t.ing, gas: t.gas, aho: t.aho, cur: i === 0 });
  }
  if (!data.some(d => d.ing || d.gas || d.aho)) return '<div class="empty">Cuando tengas algunas quincenas registradas, verás aquí la comparación mensual.</div>';
  return barsChart(data);
}

export function vReportes() {
  const ym = ui.rym, p = parseYM(ym), t = monthTotals(ym), ct = catTotals(ym);
  const pctAho = t.ing > 0 ? Math.round(t.aho / t.ing * 100) : null;
  let h = '<div class="qnav"><button class="icon" data-act="r-prev" aria-label="Mes anterior">‹</button><div><b>' + cap(MESES[p.m - 1]) + ' ' + p.y + '</b><span class="mut">Resumen del mes</span></div><button class="icon" data-act="r-next" aria-label="Mes siguiente">›</button></div>';

  h += '<div class="panel stats"><div><span class="sl">Ingresos</span><b class="sv">' + money(t.ing) + '</b></div>'
    + '<div><span class="sl">Gastos</span><b class="sv">' + money(t.gas) + '</b></div>'
    + '<div><span class="sl">Ahorro</span><b class="sv">' + money(t.aho) + '</b><span class="ss">' + (pctAho == null ? '' : pctAho + '% del ingreso') + '</span></div></div>';

  // Dona por categoría (las 6 mayores y "Otras")
  const top = ct.slice(0, 6), rest = sum(ct.slice(6), c => c[1]);
  const segs = top.map((c, i) => ({ label: c[0], value: c[1], color: PAL[i] }));
  if (rest > 0) segs.push({ label: 'Otras', value: rest, color: PAL[7] });
  h += '<div class="cols two"><div class="panel"><h2>¿En qué gastaste?</h2>' + (ct.length
    ? '<div class="donutwrap">' + donut(segs, { center: money(t.gas), sub: 'gastado', label: 'Gasto del mes por categoría' }) + legend(segs) + '</div>'
    : '<div class="empty">Sin gastos registrados en este mes.</div>') + '</div>';
  h += '<div class="panel"><h2>Últimos seis meses</h2>' + chart6() + '</div></div>';
  return h;
}
