// Punto de entrada: conecta módulos y arranca la app.
import { hooks, loadLocal, initCloud } from './state.js';
import { sheet } from './ui.js';
import { render } from './render.js';
import { applyTheme, bindEvents } from './actions.js';

hooks.render = render;
hooks.isSheetOpen = () => !!sheet.cur;

loadLocal();
applyTheme();
bindEvents();
render();
initCloud();
