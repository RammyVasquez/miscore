// Pantalla: bienvenida (primera vez, o después de borrar todo).
import { ui } from '../ui.js';
import { esc, ic } from '../util.js';
import { cloud, cloudConfigured } from '../cloud.js';

const LOGO = '<svg class="wl-logo" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#BDEBD6"/><circle cx="256" cy="262" r="214" fill="#D5F5E6"/><g transform="translate(256 256) scale(0.96) translate(-256 -256)"><g transform="translate(0 -10)"><path d="M86 150 l7 -17 l7 17 l17 7 l-17 7 l-7 17 l-7 -17 l-17 -7z" fill="#FFFFFF" opacity=".9"/><path d="M432 214 l5 -13 l5 13 l13 5 l-13 5 l-5 13 l-5 -13 l-13 -5z" fill="#FFFFFF" opacity=".9"/><path d="M424 86 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z" fill="#FFFFFF" opacity=".8"/><ellipse cx="188" cy="452" rx="40" ry="23" fill="#FF8FAE"/><ellipse cx="324" cy="452" rx="40" ry="23" fill="#FF8FAE"/><circle cx="256" cy="112" r="50" fill="#F5B700"/><circle cx="256" cy="112" r="35" fill="none" stroke="#D99A00" stroke-width="8"/><path d="M238 96 Q249 85 263 89" stroke="#FFE59A" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M128 198 Q102 96 206 138 Q234 157 221 208 Z" fill="#FF9BB8"/><path d="M384 198 Q410 96 306 138 Q278 157 291 208 Z" fill="#FF9BB8"/><path d="M147 188 Q134 130 197 154 Q211 164 205 194 Z" fill="#FFD3DF"/><path d="M365 188 Q378 130 315 154 Q301 164 307 194 Z" fill="#FFD3DF"/><ellipse cx="256" cy="298" rx="162" ry="150" fill="#FFB6CB"/><ellipse cx="190" cy="214" rx="48" ry="21" fill="#FFD6E2" opacity=".85" transform="rotate(-28 190 214)"/><ellipse cx="205" cy="282" rx="14" ry="19" fill="#3A2432"/><circle cx="210" cy="274" r="5.5" fill="#fff"/><ellipse cx="307" cy="282" rx="14" ry="19" fill="#3A2432"/><circle cx="312" cy="274" r="5.5" fill="#fff"/><ellipse cx="158" cy="330" rx="28" ry="17" fill="#FF7FA3" opacity=".55"/><ellipse cx="354" cy="330" rx="28" ry="17" fill="#FF7FA3" opacity=".55"/><ellipse cx="256" cy="340" rx="64" ry="47" fill="#FF9DB9"/><ellipse cx="234" cy="340" rx="9" ry="13" fill="#D4577C"/><ellipse cx="278" cy="340" rx="9" ry="13" fill="#D4577C"/><path d="M237 394 Q256 412 275 394" fill="none" stroke="#C4476B" stroke-width="9" stroke-linecap="round"/></g></g></svg>';

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
      + '<p class="wl-sub">Con este dato calculamos cuánto te queda libre después de tus apartados. Podrás cambiarlo cuando quieras.</p>'
      + '<div class="wl-ask"><label for="wIngreso" class="wl-lbl">Ingreso por quincena</label>'
      + '<div class="money-in"><span>$</span><input id="wIngreso" class="bigin" type="number" inputmode="decimal" step="any" placeholder="12,000" autocomplete="off"></div>'
      + '<div class="chips" aria-label="Montos comunes">' + [8000, 10000, 12000, 15000, 20000].map(v => '<button type="button" class="chipbtn" data-act="w-amount" data-v="' + v + '">$' + v.toLocaleString('es-MX') + '</button>').join('') + '</div></div>'
      + '<button class="btn wl-btn" data-act="start">Empezar</button></div>';
  }
  return '<div class="wl">'
    + '<section class="wl-hero"><div class="wl-brand">' + LOGO + '<span>Mis finanzas</span></div>'
    + '<h1>Tu dinero, por quincena</h1>'
    + '<p>Reparte lo que cobras en apartados, vigila tus tarjetas y descubre cuánto te queda libre de verdad.</p>'
    + '<div class="wl-prev" aria-hidden="true"><div class="l">Te queda libre</div><div class="v">$2,000</div><div class="st"><i></i>Vas bien</div></div></section>'
    + '<ul class="wl-feats">'
    + '<li><span class="fi">' + ic('quincena') + '</span><div><b>Reparte tu sueldo en apartados</b><span>Aparta una parte para la renta, las tarjetas, el ahorro y la comida. Lo que no apartas es tuyo.</span></div></li>'
    + '<li><span class="fi">' + ic('tarjetas') + '</span><div><b>Tarjetas sin sorpresas</b><span>Te avisa cuántos días faltan para cada corte y pago.</span></div></li>'
    + '<li><span class="fi">' + ic('metas') + '</span><div><b>Metas de ahorro</b><span>Mira cuánto llevas y cuánto falta para lo que sigue.</span></div></li></ul>'
    + '<section class="wl-ask"><h2>¿Quieres precargar información de ejemplo para que conozcas mejor cómo funciona?</h2>'
    + '<p>Usaremos un ingreso de $12,000 por quincena, con tarjetas, gastos y metas inventados. Los puedes borrar con un toque cuando quieras.</p>'
    + '<button class="btn wl-btn" data-act="seed">Sí, precargar ejemplo</button>'
    + '<button class="btn ghost wl-btn" data-act="blank">No, empezar desde cero</button></section>'
    + acct() + '</div>';
}
