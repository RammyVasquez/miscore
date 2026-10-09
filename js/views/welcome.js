// Pantalla: bienvenida (primera vez, o después de borrar todo).
import { ui } from '../ui.js';
import { esc, ic } from '../util.js';
import { cloud, cloudConfigured } from '../cloud.js';

const LOGO = '<svg class="wl-logo" viewBox="70 78 372 372" aria-hidden="true"><defs><clipPath id="wlb"><rect x="92" y="222" width="328" height="212" rx="30"/></clipPath></defs>'
  + '<circle cx="256" cy="184" r="98" fill="#F5B700"/><circle cx="256" cy="184" r="73" fill="none" stroke="#D99A00" stroke-width="10"/>'
  + '<rect x="92" y="222" width="328" height="212" rx="30" fill="#F4F6F2"/><g clip-path="url(#wlb)"><path d="M80 214 L432 214 L256 356 Z" fill="#D9E1D7"/></g></svg>';

// Estado de la cuenta (así se ve que la sesión sigue abierta, por ejemplo después de borrar todo)
function acct() {
  if (!cloudConfigured) return '';
  if (cloud.user) return '<p class="wl-acct">Sesión iniciada como <b>' + esc(cloud.user.email) + '</b>.<br><button class="link" data-act="logout">Cerrar sesión</button></p>';
  return '<p class="wl-acct">¿Ya usas la app en otro dispositivo?<br><button class="link" data-act="login">Iniciar sesión</button></p>';
}

export function vWelcome() {
  if (ui.wstep === 'ingreso') {
    return '<div class="wl"><button class="link wl-back" data-act="w-back">‹ Atrás</button>'
      + '<h1 class="wl-h">¿Cuánto cobras por quincena?</h1>'
      + '<p class="wl-sub">Con este dato calculamos cuánto te queda libre después de tus sobres. Podrás cambiarlo cuando quieras.</p>'
      + '<div class="wl-ask"><label for="wIngreso" class="wl-lbl">Ingreso por quincena</label>'
      + '<div class="money-in"><span>$</span><input id="wIngreso" class="bigin" type="number" inputmode="decimal" step="any" placeholder="12,000" autocomplete="off"></div>'
      + '<div class="chips" aria-label="Montos comunes">' + [8000, 10000, 12000, 15000, 20000].map(v => '<button type="button" class="chipbtn" data-act="w-amount" data-v="' + v + '">$' + v.toLocaleString('es-MX') + '</button>').join('') + '</div></div>'
      + '<button class="btn wl-btn" data-act="start">Empezar</button></div>';
  }
  return '<div class="wl">'
    + '<section class="wl-hero"><div class="wl-brand">' + LOGO + '<span>Mis finanzas</span></div>'
    + '<h1>Tu dinero, por quincena</h1>'
    + '<p>Reparte lo que cobras en sobres, vigila tus tarjetas y descubre cuánto te queda libre de verdad.</p>'
    + '<div class="wl-prev" aria-hidden="true"><div class="l">Te queda libre</div><div class="v">$2,000</div><div class="st"><i></i>Vas bien</div></div></section>'
    + '<ul class="wl-feats">'
    + '<li><span class="fi">' + ic('quincena') + '</span><div><b>Sobres por quincena</b><span>Diezmo, renta, ahorro y topes de gasto, cada uno con su lugar.</span></div></li>'
    + '<li><span class="fi">' + ic('tarjetas') + '</span><div><b>Tarjetas sin sorpresas</b><span>Te avisa cuántos días faltan para cada corte y pago.</span></div></li>'
    + '<li><span class="fi">' + ic('metas') + '</span><div><b>Metas de ahorro</b><span>Mira cuánto llevas y cuánto falta para lo que sigue.</span></div></li></ul>'
    + '<section class="wl-ask"><h2>¿Quieres precargar información de ejemplo para que conozcas mejor cómo funciona?</h2>'
    + '<p>Usaremos un ingreso de $12,000 por quincena, con tarjetas, gastos y metas inventados. Los puedes borrar con un toque cuando quieras.</p>'
    + '<button class="btn wl-btn" data-act="seed">Sí, precargar ejemplo</button>'
    + '<button class="btn ghost wl-btn" data-act="blank">No, empezar desde cero</button></section>'
    + acct() + '</div>';
}
