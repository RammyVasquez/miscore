// Gráficas en SVG, sin librerías.
import { esc, money, shortMoney } from './util.js';

export const PAL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)'];

// Dona: segs = [{label, value, color}]
export function donut(segs, opt) {
  opt = opt || {};
  const size = 180, thick = 24;
  const live = segs.filter(x => x.value > 0);
  const total = live.reduce((s, x) => s + x.value, 0);
  const cx = size / 2, r = (size - thick) / 2, C = 2 * Math.PI * r;
  let svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" class="donut" role="img" aria-label="' + esc(opt.label || 'Distribución') + '">'
    + '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" style="stroke:var(--surf2)" stroke-width="' + thick + '"/>';
  let off = 0;
  live.forEach(x => {
    const len = x.value / total * C, gap = live.length > 1 ? Math.min(3, len * 0.25) : 0, dash = Math.max(0.01, len - gap);
    svg += '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" style="stroke:' + x.color + '" stroke-width="' + thick
      + '" stroke-dasharray="' + dash.toFixed(2) + ' ' + (C - dash).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2)
      + '" transform="rotate(-90 ' + cx + ' ' + cx + ')"/>';
    off += len;
  });
  if (opt.center != null) svg += '<text x="' + cx + '" y="' + (cx + (opt.sub ? -2 : 8)) + '" text-anchor="middle" class="dn-big">' + esc(opt.center) + '</text>';
  if (opt.sub) svg += '<text x="' + cx + '" y="' + (cx + 20) + '" text-anchor="middle" class="dn-sub">' + esc(opt.sub) + '</text>';
  return svg + '</svg>';
}

export function legend(segs, total) {
  const live = segs.filter(x => x.value > 0);
  total = total || live.reduce((s, x) => s + x.value, 0) || 1;
  return '<div class="lg">' + live.map(x => '<div class="lgr"><i style="background:' + x.color + '"></i><span class="lgl">' + esc(x.label)
    + '</span><span class="lgv">' + money(x.value) + '</span><span class="lgp">' + Math.round(x.value / total * 100) + '%</span></div>').join('') + '</div>';
}

// Anillo de avance (metas)
export function ring(pct, color, size) {
  size = size || 68;
  const th = 9, r = (size - th) / 2 - 1, C = 2 * Math.PI * r, c = size / 2, p = Math.max(0, Math.min(100, Math.round(pct)));
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" class="ring" role="img" aria-label="' + p + '% completado">'
    + '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" style="stroke:var(--line)" stroke-width="' + th + '"/>'
    + (p > 0 ? '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" style="stroke:' + color + '" stroke-width="' + th + '" stroke-linecap="round" stroke-dasharray="' + (C * p / 100).toFixed(2) + ' ' + C.toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>' : '')
    + '<text x="' + c + '" y="' + (c + 5) + '" text-anchor="middle" class="rg-t">' + p + '%</text></svg>';
}

// Gasto acumulado de la quincena frente al ritmo ideal.
// o = { startDay, cum:[acumulado por día | null], budget, todayIdx }
export function paceChart(o) {
  const N = o.cum.length, W = 360, H = 190, pl = 10, pr = 10, pt = 16, pb = 26;
  const last = o.cum[o.todayIdx] || 0;
  const ymax = Math.max(o.budget, last, 1) * 1.1;
  const X = i => pl + (N > 1 ? i / (N - 1) : 0) * (W - pl - pr);
  const Y = v => H - pb - (v / ymax) * (H - pt - pb);
  const over = o.budget > 0 && last > o.budget * ((o.todayIdx + 1) / N) + 0.01;
  let pts = '';
  for (let i = 0; i <= o.todayIdx && i < N; i++) pts += (i ? ' ' : '') + X(i).toFixed(1) + ',' + Y(o.cum[i] || 0).toFixed(1);
  const lastX = X(Math.min(o.todayIdx, N - 1)).toFixed(1), lastY = Y(last).toFixed(1);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ch" role="img" aria-label="Gasto acumulado de la quincena frente al ritmo ideal">';
  s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" class="ax"/>';
  if (o.budget > 0) {
    s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(o.budget).toFixed(1) + '" y2="' + Y(o.budget).toFixed(1) + '" class="pc-cap"/>';
    s += '<text x="' + (W - pr) + '" y="' + (Y(o.budget) - 5).toFixed(1) + '" text-anchor="end" class="ax-t">tope</text>';
    s += '<line x1="' + X(0).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(N - 1).toFixed(1) + '" y2="' + Y(o.budget).toFixed(1) + '" class="pc-ideal"/>';
  }
  if (o.todayIdx < N - 1) s += '<line x1="' + lastX + '" x2="' + lastX + '" y1="' + pt + '" y2="' + (H - pb) + '" class="pc-today"/><text x="' + lastX + '" y="' + (pt - 4) + '" text-anchor="middle" class="ax-t">hoy</text>';
  if (pts) {
    s += '<polygon points="' + X(0).toFixed(1) + ',' + (H - pb) + ' ' + pts + ' ' + lastX + ',' + (H - pb) + '" class="pc-area' + (over ? ' over' : '') + '"/>';
    s += '<polyline points="' + pts + '" class="pc-line' + (over ? ' over' : '') + '"/>';
    s += '<circle cx="' + lastX + '" cy="' + lastY + '" r="5" class="pc-dot' + (over ? ' over' : '') + '"/>';
  }
  [0, Math.floor((N - 1) / 2), N - 1].forEach((i, k) => {
    s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (k === 0 ? 'start' : k === 2 ? 'end' : 'middle') + '" class="ax-t">' + (o.startDay + i) + '</text>';
  });
  return s + '</svg>';
}

function niceStep(x) {
  const k = Math.pow(10, Math.floor(Math.log10(x || 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (k * m >= x) return k * m;
  return k * 10;
}
// Barras agrupadas por mes: data = [{label, ing, gas, aho, cur}]
export function barsChart(data) {
  const W = 360, H = 220, pl = 38, pr = 6, pt = 12, pb = 28;
  const mx = Math.max.apply(null, data.map(d => Math.max(d.ing, d.gas, d.aho)).concat([1]));
  const step = niceStep(mx / 3), top = step * 3;
  const gw = (W - pl - pr) / data.length, bw = Math.min(15, (gw - 8) / 3);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ch" role="img" aria-label="Ingresos, gastos y ahorro de los últimos seis meses">';
  for (let g = 0; g <= 3; g++) {
    const y = H - pb - (H - pb - pt) * g / 3;
    s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" class="' + (g ? 'gl' : 'ax') + '"/>';
    s += '<text x="' + (pl - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" class="ax-t">' + (g ? shortMoney(step * g) : '0') + '</text>';
  }
  data.forEach((d, i) => {
    const x0 = pl + i * gw + gw / 2 - (bw * 3 + 4) / 2;
    [['ing', d.ing], ['gas', d.gas], ['aho', d.aho]].forEach((e, j) => {
      const h = (H - pb - pt) * e[1] / top;
      if (e[1] > 0) s += '<rect class="b-' + e[0] + '" x="' + (x0 + j * (bw + 2)).toFixed(1) + '" y="' + (H - pb - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(h, 2).toFixed(1) + '" rx="3"/>';
    });
    s += '<text x="' + (pl + i * gw + gw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" class="ax-t' + (d.cur ? ' cur' : '') + '">' + esc(d.label) + '</text>';
  });
  return s + '</svg><div class="legend"><span><i style="background:var(--pri)"></i>Ingresos</span><span><i style="background:var(--bad)"></i>Gastos</span><span><i style="background:var(--ok)"></i>Ahorro</span></div>';
}
