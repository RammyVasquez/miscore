// "Qué hacer ahora": lo más importante de esta quincena, de lo más urgente a lo menos.
import { money, ymOf, fdate, inDays, round2, sum } from './util.js';
import { S } from './state.js';
import { qSummary, qBounds, cardInfo, msiInfo, fijoMonto, objetivoPago, planHastaLimite } from './logic.js';

// Cuánto falta apartar para pagar una tarjeta antes de su fecha límite (con lo apartado en las quincenas que llegan a tiempo)
export function faltaApartar(c) {
  const o = objetivoPago(c);
  return round2(Math.max(0, o.monto - planHastaLimite(c, o.limite)));
}

export function accionesAhora() {
  const now = new Date(), ym = ymOf(now), n = now.getDate() <= 15 ? 1 : 2, s = qSummary(ym, n), b = qBounds(ym, n);
  const endDay = +b[1].slice(8), left = endDay - now.getDate() + 1, out = [];
  const add = (tono, titulo, detalle, act, r, label, id) => out.push({ tono: tono, titulo: titulo, detalle: detalle, act: act, r: r, label: label, id: id });

  // 1) Tarjetas: lo que hay que pagar antes de su fecha límite (o ir apartando para el siguiente pago)
  S.config.tarjetas.forEach(c => {
    const o = objetivoPago(c), falta = faltaApartar(c);
    if (+c.saldo > 0) {
      const i = cardInfo(c), urg = i.dl <= 3 ? 'bad' : i.dl <= 7 ? 'warn' : 'info';
      if (falta > 0) add(urg, 'Aparta ' + money(falta) + ' para pagar ' + c.nombre, 'Pagar antes del ' + fdate(i.nl) + ' (' + inDays(i.dl) + '). Pago para no generar intereses: ' + money(c.saldo) + '.', 'apartar-tarjeta', null, 'Apartar ' + money(falta), c.id);
      else add(urg, 'Paga ' + c.nombre + ': ' + money(c.saldo), 'Antes del ' + fdate(i.nl) + ' (' + inDays(i.dl) + '). Ya lo tienes apartado; al pagarla, marca el apartado con la palomita.', 'go', 'quincena', 'Ver apartado');
    } else if (o.monto > 0 && falta > 0) {
      add('info', 'Ve apartando para ' + c.nombre + ': ≈ ' + money(o.monto), 'Se pagaría antes del ' + fdate(o.limite) + ' (' + inDays(o.dl) + '). Llevas apartados ' + money(planHastaLimite(c, o.limite)) + '; te faltan ' + money(falta) + '.', 'apartar-tarjeta', null, 'Apartar ' + money(falta), c.id);
    }
  });
  // 2) Te pasaste de lo planeado
  if (s.libre < 0) add('bad', 'Te pasaste ' + money(-s.libre) + ' de lo planeado', 'Revisa tus apartados o los gastos que no tienen apartado.', 'go', 'quincena', 'Revisar');
  // 3) Se acerca el depósito
  if (left <= 2) add('warn', 'Se acerca tu próximo depósito', 'Pasa a la quincena siguiente y ve planeando tus apartados antes de que llegue.', 'plan-next', null, 'Planear');
  // 4) Apartados por mover (las tarjetas ya salieron arriba)
  const pend = s.allocs.filter(a => a.kind !== 'gasto' && a.kind !== 'tarjeta' && !a.done);
  if (pend.length) {
    const tot = sum(pend, a => (s.by[a.id] || {}).plan || 0);
    add('info', 'Mueve tu dinero a ' + pend.length + (pend.length === 1 ? ' apartado' : ' apartados') + ': ' + money(tot), pend.slice(0, 4).map(a => a.nombre).join(', ') + (pend.length > 4 ? '…' : '') + '. Marca cada uno con la palomita cuando ya lo hayas movido.', 'go', 'quincena', 'Ver apartados');
  }
  // 5) Un pago grande que se aparta por mitades y se paga en esta quincena (la renta)
  S.config.fijos.filter(f => f.reparto === 'mitad' && +f.q === n && fijoMonto(f, ym) > 0).forEach(f =>
    add('info', 'Esta quincena se paga ' + f.nombre + ': ' + money(fijoMonto(f, ym)), 'Sale de lo que fuiste apartando (' + money(fijoMonto(f, ym) / 2) + ' en cada quincena).', 'go', 'fijos', 'Ver'));
  // 6) Última mensualidad de una compra a meses
  (S.config.msi || []).forEach(m => { const i = msiInfo(m, ym); if (i.estado === 'activa' && i.faltan === 1) add('ok', 'Esta es la última mensualidad de ' + m.nombre, 'Desde el mes que entra te liberas ' + money(i.monto) + ' al mes.', 'go', 'tarjetas', 'Ver'); });
  // 7) Todavía no hay apartados / cuánto queda libre
  if (s.asignado === 0) add('warn', 'Aún no tienes apartados esta quincena', 'Crea tus apartados (renta, diezmo, tarjetas, ahorro) para ver tu libre real.', 'go', 'quincena', 'Crear');
  else if (s.libre >= 0) add('ok', 'Te quedan ' + money(s.libre) + ' libres hasta el día ' + endDay, s.libre > 0 && left >= 1 ? 'Unos ' + money(Math.round(s.libre / Math.max(1, left))) + ' al día.' : '', 'add-tx', null, 'Registrar gasto');

  const orden = { bad: 0, warn: 1, info: 2, ok: 3 };
  return out.sort((a, b2) => orden[a.tono] - orden[b2.tono]).slice(0, 5);
}
