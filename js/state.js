// Estado de la app y guardado local. La sincronización con la nube vive en cloud.js
// y se conecta a través de `cloudAdapter` (así state.js no depende de ella).
import { stable, clean } from './util.js';

export const rt = { syncMode: 'local', pendingRender: false, installEvt: null, pushing: false };
// main.js conecta estas funciones para evitar importaciones circulares
export const hooks = { render: () => {}, isSheetOpen: () => false, newPassword: () => {} };
// cloud.js lo activa cuando hay una sesión iniciada
export const cloudAdapter = { active: false, save: async () => {}, remove: async () => {}, wipe: async () => {} };

const LS = 'mis-finanzas-v1';
const LS_META = 'mis-finanzas-meta';
export const S = { config: null, months: {} };
export const dirty = { cfg: false, months: new Set() };
export const typing = () => { const a = document.activeElement; return !!(a && a.matches && a.matches('#view input,#view select,#view textarea')); };
export const blankConfig = () => ({ onboarded: false, demo: false, ingresoQ: 0, tarjetas: [], fijos: [], metas: [], plantilla: [], cats: ['Mandado', 'Salidas', 'Gasolina', 'Salud', 'Hogar', 'Servicios', 'Compras', 'Otros'] });

export function loadLocal() {
  try {
    const r = localStorage.getItem(LS);
    if (r) { const o = JSON.parse(r); S.config = Object.assign(blankConfig(), o.config); S.months = o.months || {}; return; }
  } catch (e) {}
  S.config = blankConfig(); S.months = {};
}
export function saveLocal() { try { localStorage.setItem(LS, JSON.stringify({ config: S.config, months: S.months })); } catch (e) {} }

// Datos de este dispositivo que NO se sincronizan (recordatorio de respaldo)
export function getMeta() { try { return JSON.parse(localStorage.getItem(LS_META)) || {}; } catch (e) { return {}; } }
export function setMeta(patch) { try { localStorage.setItem(LS_META, JSON.stringify(Object.assign(getMeta(), patch))); } catch (e) {} }

let pt = null, retryT = null;
export function schedulePersist() { saveLocal(); clearTimeout(pt); pt = setTimeout(persist, 500); }
export const touchCfg = () => { dirty.cfg = true; schedulePersist(); };
export const touchMonth = ym => { dirty.months.add(ym); schedulePersist(); };

// Envía a la nube lo que cambió. Si falla, lo deja pendiente y reintenta.
export async function persist() {
  if (!cloudAdapter.active) return;
  if (!dirty.cfg && dirty.months.size === 0) return;
  clearTimeout(retryT);
  setStatus('syncing');
  rt.pushing = true;
  try {
    if (dirty.cfg) {
      dirty.cfg = false;
      try { await cloudAdapter.save('config', clean(S.config)); } catch (e) { dirty.cfg = true; throw e; }
    }
    for (const ym of Array.from(dirty.months)) {
      dirty.months.delete(ym);
      try { await cloudAdapter.save('m-' + ym, clean(S.months[ym] || { tx: [] })); } catch (e) { dirty.months.add(ym); throw e; }
    }
    setStatus('cloud');
  } catch (e) {
    setStatus('error');
    retryT = setTimeout(persist, 20000);
  } finally {
    rt.pushing = false;
  }
}
export function setStatus(m) {
  rt.syncMode = m;
  const el = document.querySelector('.sync');
  if (el) { el.className = 'sync ' + m; el.querySelector('span').textContent = statusShort(); }
}
export const statusShort = () => ({ cloud: 'Sincronizado', syncing: 'Sincronizando…', error: 'Sin conexión', local: 'Solo aquí' }[rt.syncMode] || '');
export const statusText = () => ({
  cloud: 'Sincronizado con tu cuenta',
  syncing: 'Sincronizando…',
  error: 'Sin conexión: se enviará al reconectar',
  local: 'Solo en este dispositivo'
}[rt.syncMode] || '');

// ---- Cambios que llegan de la nube ----
function afterRemoteChange() {
  saveLocal();
  if (hooks.isSheetOpen() || typing()) rt.pendingRender = true; else hooks.render();
}
function mergeDocs(docs) {
  let changed = false;
  docs.forEach(d => {
    if (d.id === 'config') {
      if (!dirty.cfg) {
        const nc = Object.assign(blankConfig(), d.data);
        if (stable(nc) !== stable(S.config)) { S.config = nc; changed = true; }
      }
    } else if (d.id.indexOf('m-') === 0) {
      const ym = d.id.slice(2);
      if (!dirty.months.has(ym) && stable(d.data) !== stable(S.months[ym] || null)) { S.months[ym] = d.data; changed = true; }
    }
  });
  return changed;
}
// Un documento suelto (evento en vivo)
export function applyRemoteDocs(docs) { if (mergeDocs(docs)) afterRemoteChange(); }
// Lista completa de lo que hay en la nube: además detecta lo que se borró desde otro dispositivo
export function applyRemoteSnapshot(docs) {
  let changed = mergeDocs(docs);
  const ids = new Set(docs.map(d => d.id));
  Object.keys(S.months).forEach(ym => {
    if (!ids.has('m-' + ym) && !dirty.months.has(ym)) { delete S.months[ym]; changed = true; }
  });
  if (!ids.has('config') && !dirty.cfg && S.config.onboarded) { S.config = blankConfig(); S.months = {}; changed = true; }
  if (changed) afterRemoteChange();
}
