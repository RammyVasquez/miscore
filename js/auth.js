// Formularios de cuenta: iniciar sesión, crear cuenta, recuperar y cambiar contraseña.
import { openForm, closeSheet, sheet, toast, sheetBusy, sheetNote } from './ui.js';
import { hooks } from './state.js';
import { signInPassword, signUpPassword, sendReset, setNewPassword, friendly } from './cloud.js';

const lastEmail = () => { try { return localStorage.getItem('mf-email') || ''; } catch (e) { return ''; } };
// Guarda el correo (para no escribirlo de nuevo) y le pide al navegador que recuerde la contraseña.
// La contraseña NUNCA se guarda en la app: la guarda el administrador de contraseñas del navegador.
function remember(email, password) {
  try { localStorage.setItem('mf-email', email); } catch (e) {}
  try {
    if (window.PasswordCredential && navigator.credentials && navigator.credentials.store)
      navigator.credentials.store(new PasswordCredential({ id: email, password: password, name: email })).catch(() => {});
  } catch (e) {}
}

// Ejecuta una acción asíncrona dentro de la hoja: "Un momento…" y errores en español, sin redibujar el formulario
async function run(fn) {
  const st = sheet.cur; if (!st) return;
  sheetBusy(true); sheetNote('', '');
  try { await fn(st); }
  catch (e) { if (sheet.cur === st) { sheetBusy(false); sheetNote('err', friendly(e)); } return; }
  if (sheet.cur === st) sheetBusy(false);
}

export function authForm(mode) {
  const login = mode === 'login';
  openForm({
    form: true,
    title: login ? 'Iniciar sesión' : 'Crear cuenta',
    note: login ? 'Entra para ver tus datos en este dispositivo.' : 'Con tu cuenta tus datos se sincronizan entre tus dispositivos y no se pierden si cambias de celular.',
    values: { email: lastEmail(), password: '' },
    fields: [
      { k: 'email', label: 'Correo', type: 'email', req: true, ac: 'username' },
      { k: 'password', label: 'Contraseña', type: 'password', req: true, ac: login ? 'current-password' : 'new-password', hint: login ? '' : 'Mínimo 6 caracteres.' }
    ],
    submit: login ? 'Entrar' : 'Crear cuenta',
    links: [{ text: login ? 'Crear cuenta nueva' : 'Ya tengo cuenta', fn: () => authForm(login ? 'signup' : 'login') }]
      .concat(login ? [{ text: 'Olvidé mi contraseña', fn: resetForm }] : []),
    onSubmit: o => {
      run(async () => {
        const email = o.email.trim();
        if (login) { await signInPassword(email, o.password); remember(email, o.password); closeSheet(); toast('Sesión iniciada'); }
        else {
          const logged = await signUpPassword(email, o.password);
          if (logged) { remember(email, o.password); closeSheet(); toast('Cuenta creada'); }
          else { try { localStorage.setItem('mf-email', email); } catch (e) {} sheetNote('msg', 'Te enviamos un correo para confirmar tu cuenta. Ábrelo, confirma y luego inicia sesión.'); }
        }
      });
      return false;
    }
  });
}

function resetForm() {
  openForm({
    form: true,
    title: 'Recuperar contraseña',
    note: 'Escribe tu correo y te enviamos un enlace para elegir una contraseña nueva.',
    values: { email: lastEmail() },
    fields: [{ k: 'email', label: 'Correo', type: 'email', req: true, ac: 'username' }],
    submit: 'Enviar enlace',
    links: [{ text: 'Volver a iniciar sesión', fn: () => authForm('login') }],
    onSubmit: o => {
      run(async () => { await sendReset(o.email.trim()); sheetNote('msg', 'Si ese correo tiene cuenta, te enviamos el enlace. Revisa también tu carpeta de spam.'); });
      return false;
    }
  });
}

export function newPasswordForm() {
  openForm({
    form: true,
    title: 'Nueva contraseña',
    note: 'Elige la contraseña con la que vas a entrar a partir de ahora.',
    values: { password: '' },
    fields: [{ k: 'password', label: 'Contraseña nueva', type: 'password', req: true, ac: 'new-password', hint: 'Mínimo 6 caracteres.' }],
    submit: 'Guardar contraseña',
    onSubmit: o => {
      if (o.password.length < 6) { sheetNote('err', 'La contraseña es muy corta (mínimo 6 caracteres).'); return false; }
      run(async () => { await setNewPassword(o.password); closeSheet(); toast('Contraseña actualizada'); });
      return false;
    }
  });
}
hooks.newPassword = newPasswordForm;
