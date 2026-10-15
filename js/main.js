// Punto de entrada: conecta módulos y arranca la app.
import { hooks, rt, typing, loadLocal, getMeta, setMeta } from './state.js';
import { initCloud } from './cloud.js';
import { quincenaActual } from './logic.js';
import { ui, sheet } from './ui.js';
import { render } from './render.js';
import { applyTheme, bindEvents } from './actions.js';

hooks.render = render;
hooks.isSheetOpen = () => !!sheet.cur;

loadLocal();
{ const qa = quincenaActual(); ui.ym = qa.ym; ui.q = qa.n; }
if (!getMeta().since) setMeta({ since: Date.now() });
// Pide al navegador que no borre los datos de la app automáticamente
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
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
