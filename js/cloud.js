// Sincronización con Supabase: cuenta (correo y contraseña) + una tabla con tus datos.
// Si config.js está vacío, nada de esto se activa y la app funciona solo en el dispositivo.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { stable } from './util.js';
import { S, dirty, rt, hooks, blankConfig, saveLocal, saveDirty, persist, setStatus, cloudAdapter, applyRemoteDocs, applyRemoteSnapshot } from './state.js';
import { openForm, closeSheet } from './ui.js';

export const cloudConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const cloud = { client: null, user: null, channel: null, started: false, sessionLost: false, expectedOut: false };
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
const TABLE = 'finanzas_docs';

// ---- adaptador que usa state.js para guardar ----
cloudAdapter.save = async (id, data) => {
  const { error } = await cloud.client.from(TABLE).upsert(
    { user_id: cloud.user.id, doc_id: id, data: data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,doc_id' });
  if (error) throw error;
};
cloudAdapter.remove = async id => {
  const { error } = await cloud.client.from(TABLE).delete().eq('user_id', cloud.user.id).eq('doc_id', id);
  if (error) throw error;
};
cloudAdapter.wipe = async () => {
  const { error } = await cloud.client.from(TABLE).delete().eq('user_id', cloud.user.id);
  if (error) throw error;
};

// ---- arranque ----
export async function initCloud() {
  if (!cloudConfigured) { setStatus('local'); return; }
  try {
    const mod = await import('./vendor/supabase.js');
    cloud.client = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'mis-finanzas-auth' }
    });
    // Importante: no llamar a Supabase directamente dentro de este callback; por eso el setTimeout.
    cloud.client.auth.onAuthStateChange((evt, session) => { setTimeout(() => handleAuth(evt, session), 0); });
    bindCloudEvents();
  } catch (e) { setStatus('local'); }
}

// Si la sesión se perdió sola, intenta volver a entrar con la contraseña que guardó el navegador
async function trySilentSignIn() {
  try {
    if (!(window.PasswordCredential && navigator.credentials && navigator.credentials.get)) return false;
    const cred = await navigator.credentials.get({ password: true, mediation: 'silent' });
    if (cred && cred.id && cred.password) { await signInPassword(cred.id, cred.password); return true; }
  } catch (e) {}
  return false;
}

async function handleAuth(evt, session) {
  if (evt === 'PASSWORD_RECOVERY') hooks.newPassword && hooks.newPassword();
  if (session && session.user) {
    lsSet('mf-account', '1'); cloud.sessionLost = false;
    if (!cloud.user || cloud.user.id !== session.user.id) { cloud.user = session.user; await startSync(); }
    else cloud.user = session.user;
  } else if (evt === 'SIGNED_OUT' || evt === 'INITIAL_SESSION') {
    if (evt === 'SIGNED_OUT') { stopSync(); setStatus('local'); }
    const hadAccount = lsGet('mf-account') === '1';
    if (hadAccount && !cloud.expectedOut) {
      // La sesión se cerró sola (no la cerró la persona): se conservan los datos y se avisa
      const ok = await trySilentSignIn();
      if (!ok) { cloud.sessionLost = true; hooks.render(); }
    } else if (evt === 'SIGNED_OUT') hooks.render();
    cloud.expectedOut = false;
  }
}

async function pullRows() {
  const { data, error } = await cloud.client.from(TABLE).select('doc_id,data');
  if (error) throw error;
  return (data || []).map(r => ({ id: r.doc_id, data: r.data }));
}

async function startSync() {
  cloud.started = false;
  setStatus('syncing');
  try {
    const docs = await pullRows();
    const ok = await reconcile(docs);
    if (!ok) return;
    lsSet('mf-uid', cloud.user.id);
    cloudAdapter.active = true; cloud.started = true;
    subscribeRealtime();
    setStatus('cloud'); hooks.render();
    persist();
  } catch (e) { setStatus('error'); }
}

function stopSync() {
  cloudAdapter.active = false; cloud.started = false; cloud.user = null;
  if (cloud.channel && cloud.client) { try { cloud.client.removeChannel(cloud.channel); } catch (e) {} }
  cloud.channel = null;
}

function subscribeRealtime() {
  if (cloud.channel) { try { cloud.client.removeChannel(cloud.channel); } catch (e) {} }
  const uid = cloud.user.id;
  cloud.channel = cloud.client.channel('finanzas-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: 'user_id=eq.' + uid }, p => {
      if (p.new && p.new.doc_id) applyRemoteDocs([{ id: p.new.doc_id, data: p.new.data }]);
    })
    .subscribe();
}

// Las eliminaciones desde otro dispositivo se notan aquí (al volver a la app o al reconectar)
export async function pullAll() {
  if (!cloudAdapter.active || rt.pushing) return;
  try { applyRemoteSnapshot(await pullRows()); if (rt.syncMode !== 'syncing') setStatus('cloud'); }
  catch (e) { setStatus('error'); }
}
export async function syncNow() {
  if (!cloud.user) return;
  if (!cloudAdapter.active) { await startSync(); return; }
  await persist();
  await pullAll();
}
function bindCloudEvents() {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
  window.addEventListener('online', () => { if (cloud.user) syncNow(); });
}

// ---- primer encuentro entre lo de este dispositivo y lo de la cuenta ----
function markAllDirty() { dirty.cfg = true; Object.keys(S.months).forEach(k => dirty.months.add(k)); saveDirty(); }
function replaceLocalWith(docs) {
  const cfg = docs.find(d => d.id === 'config');
  S.config = Object.assign(blankConfig(), cfg ? cfg.data : {});
  S.months = {};
  docs.forEach(d => { if (d.id.indexOf('m-') === 0) S.months[d.id.slice(2)] = d.data; });
  dirty.cfg = false; dirty.months.clear();
  saveLocal(); saveDirty();
}
function sameAsLocal(docs) {
  const cfg = docs.find(d => d.id === 'config');
  const months = {};
  docs.forEach(d => { if (d.id.indexOf('m-') === 0) months[d.id.slice(2)] = d.data; });
  return stable({ c: Object.assign(blankConfig(), cfg ? cfg.data : {}), m: months }) === stable({ c: S.config, m: S.months });
}
// true = seguir sincronizando, false = el usuario cerró sesión
async function reconcile(docs) {
  const hasRemote = docs.some(d => d.id === 'config');
  const hasLocal = !!S.config.onboarded;
  if (!hasRemote) { if (hasLocal) markAllDirty(); return true; }
  if (!hasLocal) { replaceLocalWith(docs); return true; }
  if (sameAsLocal(docs)) return true;
  // Misma cuenta que ya usaba este dispositivo: se combinan (lo pendiente de aquí gana) y no se pregunta nada
  if (lsGet('mf-uid') === cloud.user.id) { applyRemoteSnapshot(docs); return true; }
  const choice = await askWhich();
  if (choice === 'cloud') { replaceLocalWith(docs); return true; }
  if (choice === 'local') {
    markAllDirty();
    // lo que solo existe en la nube se quita para que ambos queden iguales
    const extra = docs.map(d => d.id).filter(id => id !== 'config' && !S.months[id.slice(2)]);
    for (const id of extra) { try { await cloudAdapter.remove(id); } catch (e) {} }
    return true;
  }
  await cloud.client.auth.signOut();
  return false;
}
function askWhich() {
  return new Promise(res => {
    openForm({
      title: '¿Con qué datos te quedas?',
      note: 'Encontramos información en tu cuenta y también en este dispositivo, y no coinciden. Elige cuál conservar: la otra se reemplaza. Si dudas, cierra sesión, descarga un respaldo desde Ajustes y vuelve a entrar.',
      fields: [], modal: true,
      submit: 'Usar los de mi cuenta',
      deleteText: 'Subir los de este dispositivo',
      cancelText: 'Cerrar sesión',
      onSubmit: () => { res('cloud'); },
      onDelete: () => { res('local'); closeSheet(); },
      onCancel: () => { res('signout'); }
    });
  });
}

// ---- acciones de cuenta (las llama auth.js) ----
function need() { if (!cloud.client) { const e = new Error('no-client'); throw e; } }
export async function signInPassword(email, password) {
  need(); const { error } = await cloud.client.auth.signInWithPassword({ email, password }); if (error) throw error;
}
// devuelve true si quedó con sesión; false si falta confirmar el correo
export async function signUpPassword(email, password) {
  need();
  const { data, error } = await cloud.client.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } });
  if (error) throw error;
  return !!data.session;
}
export async function sendReset(email) {
  need(); const { error } = await cloud.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); if (error) throw error;
}
export async function setNewPassword(password) {
  need(); const { error } = await cloud.client.auth.updateUser({ password }); if (error) throw error;
}
// Sube lo pendiente, cierra la sesión y deja el dispositivo limpio (todo sigue en la cuenta)
export async function signOutAndClear() {
  try { await persist(); } catch (e) {}
  cloud.expectedOut = true; lsSet('mf-account', '0'); lsDel('mf-uid');
  if (cloud.client) { try { await cloud.client.auth.signOut(); } catch (e) {} }
  stopSync();
  S.config = blankConfig(); S.months = {};
  dirty.cfg = false; dirty.months.clear();
  saveLocal(); saveDirty(); setStatus('local');
}
export function friendly(e) {
  const m = String((e && (e.message || e.error_description)) || e || '').toLowerCase();
  if (e && e.message === 'no-client') return 'La sincronización aún no está lista. Revisa tu conexión e intenta de nuevo.';
  if (m.indexOf('invalid login') >= 0) return 'Correo o contraseña incorrectos.';
  if (m.indexOf('email not confirmed') >= 0) return 'Confirma tu correo (te enviamos un enlace) y vuelve a intentar.';
  if (m.indexOf('already registered') >= 0 || m.indexOf('already been registered') >= 0) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
  if (m.indexOf('at least') >= 0 && m.indexOf('character') >= 0) return 'La contraseña es muy corta (mínimo 6 caracteres).';
  if (m.indexOf('valid email') >= 0 || m.indexOf('invalid email') >= 0) return 'Escribe un correo válido.';
  if (m.indexOf('rate limit') >= 0 || m.indexOf('too many') >= 0) return 'Demasiados intentos. Espera unos minutos.';
  if (m.indexOf('fetch') >= 0 || m.indexOf('network') >= 0) return 'No hay conexión con el servidor.';
  return 'No se pudo completar: ' + (e && e.message ? e.message : 'error desconocido');
}
