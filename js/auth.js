// Formularios de cuenta: iniciar sesión, crear cuenta, recuperar y cambiar contraseña.
import { openForm, closeSheet, drawSheet, sheet, toast } from './ui.js';
import { hooks } from './state.js';
import { signInPassword, signUpPassword, sendReset, setNewPassword, friendly } from './cloud.js';

// Ejecuta una acción asíncrona dentro de la hoja mostrando "Un momento…" y los errores en español
async function run(fn) {
  const st = sheet.cur; if (!st) return;
  st.busy = true; st.err = ''; st.msg = ''; drawSheet();
  try { await fn(st); }
  catch (e) { if (sheet.cur === st) { st.busy = false; st.err = friendly(e); drawSheet(); } return; }
  if (sheet.cur === st && st.busy) { st.busy = false; drawSheet(); }
}

export function authForm(mode) {
  const login = mode === 'login';
  openForm({
    title: login ? 'Iniciar sesión' : 'Crear cuenta',
    note: login ? 'Entra para ver tus datos en este dispositivo.' : 'Con tu cuenta tus datos se sincronizan entre tus dispositivos y no se pierden si cambias de celular.',
    values: { email: '', password: '' },
    fields: [
      { k: 'email', label: 'Correo', type: 'email', req: true, ac: 'email' },
      { k: 'password', label: 'Contraseña', type: 'password', req: true, ac: login ? 'current-password' : 'new-password', hint: login ? '' : 'Mínimo 6 caracteres.' }
    ],
    submit: login ? 'Entrar' : 'Crear cuenta',
    links: [{ text: login ? 'Crear cuenta nueva' : 'Ya tengo cuenta', fn: () => authForm(login ? 'signup' : 'login') }]
      .concat(login ? [{ text: 'Olvidé mi contraseña', fn: resetForm }] : []),
    onSubmit: o => {
      run(async st => {
        const email = o.email.trim();
        if (login) { await signInPassword(email, o.password); closeSheet(); toast('Sesión iniciada'); }
        else {
          const logged = await signUpPassword(email, o.password);
          if (logged) { closeSheet(); toast('Cuenta creada'); }
          else st.msg = 'Te enviamos un correo para confirmar tu cuenta. Ábrelo, confirma y luego inicia sesión.';
        }
      });
      return false;
    }
  });
}

function resetForm() {
  openForm({
    title: 'Recuperar contraseña',
    note: 'Escribe tu correo y te enviamos un enlace para elegir una contraseña nueva.',
    values: { email: '' },
    fields: [{ k: 'email', label: 'Correo', type: 'email', req: true, ac: 'email' }],
    submit: 'Enviar enlace',
    links: [{ text: 'Volver a iniciar sesión', fn: () => authForm('login') }],
    onSubmit: o => {
      run(async st => { await sendReset(o.email.trim()); st.msg = 'Si ese correo tiene cuenta, te enviamos el enlace. Revisa también tu carpeta de spam.'; });
      return false;
    }
  });
}

export function newPasswordForm() {
  openForm({
    title: 'Nueva contraseña',
    note: 'Elige la contraseña con la que vas a entrar a partir de ahora.',
    values: { password: '' },
    fields: [{ k: 'password', label: 'Contraseña nueva', type: 'password', req: true, ac: 'new-password', hint: 'Mínimo 6 caracteres.' }],
    submit: 'Guardar contraseña',
    onSubmit: o => {
      if (o.password.length < 6) { sheet.cur.err = 'La contraseña es muy corta (mínimo 6 caracteres).'; drawSheet(); return false; }
      run(async () => { await setNewPassword(o.password); closeSheet(); toast('Contraseña actualizada'); });
      return false;
    }
  });
}
hooks.newPassword = newPasswordForm;
