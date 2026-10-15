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
    s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (k === 0 ? 'start' : k === 2 ? 'end' : 'middle') + '" class="ax-t">' + (o.dias ? o.dias[i] : o.startDay + i) + '</text>';
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

// Libre mes por mes (barras; en rojo si queda en negativo): data = [{label, val, cur}]
export function libreBars(data) {
  const W = 360, H = 210, pl = 44, pr = 6, pt = 14, pb = 28;
  const vals = data.map(d => d.val), mx = Math.max.apply(null, vals.concat([1])), mn = Math.min.apply(null, vals.concat([0]));
  const top = niceStep(mx / 2) * 2, bot = mn < 0 ? -niceStep(-mn / 2) * 2 : 0, span = (top - bot) || 1;
  const y = v => pt + (H - pt - pb) * (top - v) / span, y0 = y(0);
  const gw = (W - pl - pr) / data.length, bw = Math.min(20, gw - 6);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ch" role="img" aria-label="Tu libre mes por mes durante el próximo año">';
  [top, top / 2, 0].concat(bot < 0 ? [bot] : []).forEach(v => {
    s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" class="' + (v === 0 ? 'ax' : 'gl') + '"/>'
      + '<text x="' + (pl - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" class="ax-t">' + (v === 0 ? '0' : shortMoney(v)) + '</text>';
  });
  data.forEach((d, i) => {
    const x = pl + i * gw + (gw - bw) / 2, yv = y(d.val), h = Math.max(Math.abs(yv - y0), d.val ? 2 : 0);
    if (d.val) s += '<rect class="' + (d.val >= 0 ? 'b-ok' : 'b-bad') + '" x="' + x.toFixed(1) + '" y="' + Math.min(yv, y0).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3"/>';
    s += '<text x="' + (pl + i * gw + gw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" class="ax-t' + (d.cur ? ' cur' : '') + '">' + esc(d.label) + '</text>';
  });
  return s + '</svg>';
}

// Cuánto llevas ahorrado mes a mes hasta juntar el precio: o = { precio, ahorrado, aporte, meses, fin }
export function saveChart(o) {
  const N = Math.max(1, Math.min(o.meses, 36)), W = 360, H = 180, pl = 10, pr = 10, pt = 16, pb = 26;
  const ymax = o.precio * 1.1, X = i => pl + i / N * (W - pl - pr), Y = v => H - pb - (v / ymax) * (H - pt - pb);
  let pts = '';
  for (let i = 0; i <= N; i++) pts += (i ? ' ' : '') + X(i).toFixed(1) + ',' + Y(Math.min(o.precio, o.ahorrado + o.aporte * i)).toFixed(1);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ch" role="img" aria-label="Lo que irías ahorrando mes a mes hasta juntar el precio">';
  s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" class="ax"/>';
  s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(o.precio).toFixed(1) + '" y2="' + Y(o.precio).toFixed(1) + '" class="pc-cap"/><text x="' + (W - pr) + '" y="' + (Y(o.precio) - 5).toFixed(1) + '" text-anchor="end" class="ax-t">precio</text>';
  s += '<polygon points="' + X(0).toFixed(1) + ',' + (H - pb) + ' ' + pts + ' ' + X(N).toFixed(1) + ',' + (H - pb) + '" class="pc-area"/><polyline points="' + pts + '" class="pc-line"/>';
  s += '<circle cx="' + X(N).toFixed(1) + '" cy="' + Y(o.precio).toFixed(1) + '" r="5" class="pc-dot"/>';
  s += '<text x="' + pl + '" y="' + (H - 8) + '" class="ax-t">hoy</text><text x="' + (W - pr) + '" y="' + (H - 8) + '" text-anchor="end" class="ax-t">' + esc(o.fin || '') + '</text>';
  return s + '</svg>';
}
