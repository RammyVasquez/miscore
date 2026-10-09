// Pantalla: bienvenida (primera vez).
import { ui } from '../ui.js';
import { cloudConfigured } from '../cloud.js';

export function vWelcome(){
  if(ui.wstep==='ingreso'){
    return '<div class="welcome"><h1>¿Cuánto cobras por quincena?</h1><p>Con este dato calculamos cuánto te queda libre después de tus sobres. Podrás cambiarlo cuando quieras.</p>'
      +'<div class="ask"><label for="wIngreso" class="mut" style="font-weight:600">Ingreso por quincena</label><input id="wIngreso" class="bigin" type="number" inputmode="decimal" step="any" placeholder="12000" autocomplete="off"></div>'
      +'<div class="btns"><button class="btn" data-act="start">Empezar</button><button class="btn ghost" data-act="w-back">Atrás</button></div></div>';
  }
  return '<div class="welcome"><h1>Tu dinero, por quincena</h1><p>Reparte lo que cobras en sobres (diezmo, tarjetas, renta, ahorro), vigila tus fechas de pago y descubre cuánto te queda libre de verdad.</p>'
    +'<div class="ask"><h2>¿Quieres precargar información de ejemplo para que conozcas mejor cómo funciona?</h2><p class="hint" style="margin:0">Usaremos un ingreso de $12,000 por quincena, con tarjetas, gastos y metas inventados. Los puedes borrar con un toque cuando quieras.</p></div>'
    +'<div class="btns"><button class="btn" data-act="seed">Sí, precargar ejemplo</button><button class="btn ghost" data-act="blank">No, empezar desde cero</button></div>'
    +(cloudConfigured?'<p style="margin-top:18px" class="mut">¿Ya usas la app en otro dispositivo? <button class="link" data-act="login">Iniciar sesión</button></p>':'')+'</div>';
}
