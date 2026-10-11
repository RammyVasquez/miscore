// Asistente de configuración (5 pasos). Guarda su avance en este dispositivo y, al terminar,
// crea toda la configuración de una vez.
import { uid8, round2, num, ymOf, sum, norm } from './util.js';
import { S, blankConfig, touchCfg } from './state.js';
import { ui } from './ui.js';

const KEY = 'mf-wiz';
const COLORES = ['#1D4ED8', '#E0463A', '#13795B', '#7C3AED', '#D97706', '#334155'];
export const PASOS = 5;

export const defaultWiz = () => ({ step: 1, ingreso: '', bono: '', bonoQ: '2', tarjetas: [], fijos: [], fc: {}, fx: {}, diezmo: true, diezmoPct: '10', pago: {}, ahorro: '', topes: { despensa: '', salidas: '' } });
export function wiz() {
  if (!ui.wiz) { let d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} ui.wiz = Object.assign(defaultWiz(), d || {}); }
  return ui.wiz;
}
export function saveWiz() { try { localStorage.setItem(KEY, JSON.stringify(ui.wiz)); } catch (e) {} }
export function clearWiz() { ui.wiz = null; try { localStorage.removeItem(KEY); } catch (e) {} }
export function getPath(path) { let o = wiz(); for (const k of path.split('.')) { if (o == null) return ''; o = o[k]; } return o; }
export function setPath(path, val) {
  const w = wiz(), ks = path.split('.'); let o = w;
  for (let i = 0; i < ks.length - 1; i++) { if (typeof o[ks[i]] !== 'object' || o[ks[i]] === null) o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val; saveWiz();
}

// Lo que sugerimos apartar cada quincena para pagar una tarjeta: la mitad de su pago, redondeada
export const sugerido = c => { const s = num(c.saldo); return s > 0 ? Math.ceil(s / 2 / 50) * 50 : 0; };
export function ensurePagos() { const w = wiz(); w.tarjetas.forEach(c => { if (w.pago[c.id] === undefined) w.pago[c.id] = String(sugerido(c)); }); saveWiz(); }

// ---- Tarjetas y gastos fijos: agregar / quitar ----
// Devuelven un mensaje de error, o '' si todo salió bien
export function addCard() {
  const w = wiz(), f = w.fc || {}, nombre = String(f.nombre || '').trim();
  if (!nombre) return 'Escribe el nombre de la tarjeta.';
  const corte = Math.round(num(f.corte)), lim = Math.round(num(f.limite));
  if (corte < 1 || corte > 31 || lim < 1 || lim > 31) return 'Los días de corte y de pago deben estar entre 1 y 31.';
  w.tarjetas.push({ id: uid8(), nombre: nombre, saldo: round2(num(f.saldo)), total: round2(num(f.total)), corte: corte, limite: lim, color: COLORES[w.tarjetas.length % COLORES.length] });
  w.fc = {}; saveWiz(); return '';
}
export function delCard(id) { const w = wiz(); w.tarjetas = w.tarjetas.filter(c => c.id !== id); delete w.pago[id]; w.fijos.forEach(x => { if (x.medio === id) x.medio = 'efectivo'; }); saveWiz(); }
export function addFijo() {
  const w = wiz(), f = w.fx || {}, nombre = String(f.nombre || '').trim();
  if (!nombre) return 'Escribe el nombre del gasto.';
  if (!(num(f.monto) > 0)) return 'Escribe el monto del gasto.';
  const q = f.cada === 'q';
  w.fijos.push({ id: uid8(), nombre: nombre, monto: round2(num(f.monto)), cada: q ? 'q' : '1', q: q ? '0' : String(f.q || '0'), reparto: (!q && f.reparto === 'mitad') ? 'mitad' : 'junto', medio: f.medio || 'efectivo' });
  w.fx = {}; saveWiz(); return '';
}
export function delFijo(id) { const w = wiz(); w.fijos = w.fijos.filter(x => x.id !== id); saveWiz(); }
// Si dejaste algo escrito sin pulsar "Agregar", se agrega al pasar al siguiente paso
export function autoAgregar(step) {
  const w = wiz();
  if (step === 2 && String((w.fc || {}).nombre || '').trim()) return addCard();
  if (step === 3 && String((w.fx || {}).nombre || '').trim()) return addFijo();
  return '';
}

// ---- Cuánto te quedaría libre por quincena (aproximado) ----
export function estimado() {
  const w = wiz(), ing = num(w.ingreso);
  const diez = w.diezmo ? round2(ing * (num(w.diezmoPct) || 10) / 100) : 0;
  const pagos = round2(sum(w.tarjetas, c => num(w.pago[c.id])));
  const aho = round2(num(w.ahorro)), topes = round2(num(w.topes.despensa) + num(w.topes.salidas));
  // lo que pagas directo se aparta solo: cada quincena, o la mitad de lo mensual
  const fijos = round2(sum(w.fijos.filter(x => x.medio === 'efectivo'), x => x.cada === 'q' ? num(x.monto) : num(x.monto) / 2));
  const apartados = round2(diez + pagos + aho + topes + fijos);
  return { ing: ing, diez: diez, pagos: pagos, aho: aho, topes: topes, fijos: fijos, apartados: apartados, libre: round2(ing - apartados) };
}

const catDe = n => { const s = norm(n); return (s.indexOf('renta') >= 0 || s.indexOf('hipoteca') >= 0) ? 'Hogar' : s.indexOf('gasolina') >= 0 ? 'Gasolina' : 'Servicios'; };

// Crea toda la configuración con lo que contestaste
export function finish() {
  const w = wiz(), c = blankConfig(), hoy = ymOf(new Date());
  c.onboarded = true; c.ingresoQ = round2(num(w.ingreso));
  c.tarjetas = w.tarjetas.map(t => ({ id: t.id, nombre: t.nombre, saldo: t.saldo, total: t.total || 0, corte: t.corte, limite: t.limite, color: t.color }));
  c.fijos = w.fijos.map(x => ({ id: x.id, nombre: x.nombre, monto: x.monto, tipo: 'fijo', medio: x.medio, cat: catDe(x.nombre), variable: false, porQ: x.cada === 'q', cada: 1, q: x.cada === 'q' ? 0 : (+x.q || 0), reparto: x.reparto === 'mitad' ? 'mitad' : 'junto', auto: true, desde: '', vals: {} }));
  if (num(w.bono) > 0) c.ingresosRec = [{ id: uid8(), nombre: 'Bono', monto: round2(num(w.bono)), cada: '1', q: +w.bonoQ || 2, desde: hoy, hasta: '', vals: {} }];
  const al = (nombre, kind, monto, extra) => Object.assign({ id: uid8(), nombre: nombre, kind: kind, monto: monto, pct: 0, ref: '', cat: '' }, extra || {});
  const pl = [];
  if (w.diezmo) pl.push(al('Diezmo', 'diezmo', 0, { pct: num(w.diezmoPct) || 10 }));
  w.tarjetas.forEach(t => { const m = num(w.pago[t.id]); if (m > 0) pl.push(al('Pagar ' + t.nombre, 'tarjeta', round2(m), { ref: t.id })); });
  if (num(w.ahorro) > 0) { const meta = { id: uid8(), nombre: 'Ahorro general', objetivo: 0, ahorrado: 0, fecha: '', desglose: [] }; c.metas = [meta]; pl.push(al('Ahorro', 'meta', round2(num(w.ahorro)), { ref: meta.id })); }
  if (num(w.topes.despensa) > 0) pl.push(al('Despensa', 'gasto', round2(num(w.topes.despensa)), { cat: 'Mandado' }));
  if (num(w.topes.salidas) > 0) pl.push(al('Salidas', 'gasto', round2(num(w.topes.salidas)), { cat: 'Salidas' }));
  c.plantilla = pl;
  S.config = c; S.months = {};
  clearWiz(); touchCfg();
  const d = new Date(); ui.wstep = 'ask'; ui.route = 'resumen'; ui.ym = ymOf(d); ui.q = d.getDate() <= 15 ? 1 : 2;
}
