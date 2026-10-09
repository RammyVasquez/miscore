// Punto de entrada: conecta módulos y arranca la app.
import { hooks, rt, typing, loadLocal, initCloud } from './state.js';
import { ui, sheet } from './ui.js';
import { render } from './render.js';
import { applyTheme, bindEvents } from './actions.js';

hooks.render = render;
hooks.isSheetOpen = () => !!sheet.cur;

loadLocal();
applyTheme();
bindEvents();
render();
initCloud();

// App instalable y con funcionamiento sin conexión
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  rt.installEvt = e;
  if (ui.route === 'ajustes' && !sheet.cur && !typing()) render();
});
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
