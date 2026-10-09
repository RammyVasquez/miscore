# miscore

App web para llevar tus finanzas por quincena: sobres (diezmo, tarjetas, renta, ahorro), ingresos extra, gastos, tarjetas con fechas de corte y pago, metas de ahorro, gastos fijos (incluidos los que cambian cada mes) y reportes.

Es HTML, CSS y JavaScript con módulos nativos (ES modules). **No hay build ni dependencias.**

## Estructura

```
miscore/
  index.html            estructura base de la página
  vercel.json           configuración de Vercel
  manifest.webmanifest  datos para instalarla como app en el celular
  sw.js                 service worker: abre sin conexión
  icons/                íconos de la app
  supabase/schema.sql   tabla de la base de datos (se pega una vez en Supabase)
  css/
    styles.css          estilos y tema claro/oscuro
  js/
    main.js             arranque: conecta módulos y dibuja la app
    state.js            estado y guardado local
    logic.js            reglas: quincenas, sobres, tarjetas, fijos
    util.js             formato de dinero y fechas, iconos
    config.js           llaves de Supabase (tú las pegas aquí)
    cloud.js            sincronización con Supabase: sesión, subida y cambios en vivo
    auth.js             formularios de cuenta (entrar, crear, recuperar contraseña)
    vendor/supabase.js  librería de Supabase ya empaquetada (no se edita)
    components.js       piezas de HTML repetidas
    ui.js               navegación, hoja modal y avisos
    render.js           dibuja la pantalla actual y el menú
    forms.js            formularios de alta y edición
    actions.js          acciones de botones y eventos globales
    seed.js             información de ejemplo ($12,000 por quincena)
    views/
      resumen.js  quincena.js  gastos.js  tarjetas.js
      metas.js    fijos.js     reportes.js mas.js
      ajustes.js  welcome.js
```

Dónde tocar según lo que quieras cambiar:

| Quiero cambiar… | Archivo |
| --- | --- |
| Cómo se calcula el Libre, los sobres o las tarjetas | `js/logic.js` |
| Una pantalla (diseño o textos) | `js/views/<pantalla>.js` |
| Campos de un formulario | `js/forms.js` |
| Qué hace un botón | `js/actions.js` |
| Colores, tipografía, espaciados | `css/styles.css` |
| Guardado local y cola de envío | `js/state.js` |
| Sincronización y cuenta | `js/cloud.js` y `js/auth.js` |
| Los datos de ejemplo al empezar | `js/seed.js` |
| Íconos, nombre o color al instalarla | `manifest.webmanifest` e `icons/` |

## Probar en tu computadora

Los módulos no cargan abriendo `index.html` con doble clic. Levanta un servidor local:

```bash
python3 -m http.server 8000
# o: npx serve .
```

y abre http://localhost:8000

## Publicar en Vercel

1. Sube la carpeta a GitHub.
2. En vercel.com: **Add New > Project** e importa el repo.
3. Framework preset: **Other**. Sin build command ni output directory.
4. Cada `git push` a `main` publica solo. Las demás ramas generan una URL de prueba.

## Tablero y modo privado

El **Resumen** responde en este orden: cuánto te queda libre (con su explicación en "¿Cómo se calcula?"), qué falta por pagar (se marca ahí mismo), a dónde se va la quincena (dona), cómo vas con el gasto del día a día frente al ritmo ideal, tus topes, los próximos pagos de tarjeta y tus metas.

El ojo de la barra superior (o tocar el monto grande) **oculta todos los montos** de la app para cuando la usas frente a otras personas. Se recuerda en ese dispositivo.

## Sobres y compras a meses

- **Sobre:** una parte de tu sueldo con un destino (renta, tarjeta, ahorro, comida…). Lo que no metes en ningún sobre es tu dinero libre. Hay sobres de *pago* (se marcan con la palomita) y sobres con *tope* de gasto. La app lo explica en **Quincena > ¿Qué es un sobre?**
- **Compras a meses:** en **Tarjetas > Compra a meses** registras lo que pagas en mensualidades (monto total, número de meses y en qué mensualidad vas este mes). La app avanza sola cada mes, te dice cuántas faltan, cuánto falta por pagar y cuándo termina, y lo suma como "a meses" en el próximo pago de la tarjeta, en el sobre de esa tarjeta y en el panorama. Se cuentan aparte del saldo de la tarjeta para no sumarlas dos veces: en el saldo pon lo que debes pagar ahora.

## Primer uso

Al abrir la app por primera vez pregunta si quieres precargar información de ejemplo (ingreso de $12,000 por quincena, tarjetas, gastos y metas inventados). Si dices que no, te pide cuánto cobras por quincena y empiezas en blanco. Con el ejemplo cargado aparece un aviso con el botón **Empezar desde cero**.

## Instalarla como app en el celular

- **iPhone (Safari):** Compartir > Agregar a pantalla de inicio.
- **Android (Chrome):** menú > Instalar app (también aparece un botón en Ajustes).

Se abre a pantalla completa, con su ícono, y funciona sin conexión gracias a `sw.js`. Si agregas o renombras archivos de `js/` o `css/`, súbelos también a la lista `SHELL` de `sw.js` y cambia `VERSION` (por ejemplo `miscore-v2`).

## Datos

- **Sin cuenta:** se guardan en el `localStorage` del navegador. Son privados, pero no se sincronizan y se pierden si borras los datos del sitio. Usa **Ajustes > Descargar respaldo**; la app te lo recuerda cada 7 días.
- **Con cuenta (Supabase):** se guardan también en tu base de datos y se sincronizan entre tus dispositivos. Cada persona ve solo lo suyo gracias a las políticas RLS de `supabase/schema.sql`.

## Sincronizar con Supabase (paso a paso)

1. **Crea el proyecto** en [supabase.com](https://supabase.com) (New project). Elige una región cercana y guarda la contraseña de la base.
2. **Crea la tabla:** en **SQL Editor > New query** pega todo `supabase/schema.sql` y pulsa **Run** (una sola vez).
3. **Copia tus llaves:** en **Project Settings > API Keys** copia la *Project URL* y la llave **anon** (o *publishable*). Pégalas en `js/config.js`. Nunca uses la `service_role`.
4. **Direcciones permitidas:** en **Authentication > URL Configuration** pon como *Site URL* la dirección de tu app (por ejemplo `https://miscore.vercel.app`) y agrégala también en *Redirect URLs*, junto con `http://localhost:8000` si pruebas en tu computadora. Sin esto, los enlaces del correo (confirmar y recuperar contraseña) no regresan a la app.
5. **Correo de confirmación:** en **Authentication > Sign In / Providers > Email** puedes desactivar *Confirm email* si es solo para ti y para tu familia; así entras al instante. Si lo dejas activo, cada cuenta nueva debe confirmar su correo (y el correo gratuito de Supabase tiene un límite de envíos por hora).
6. **Cierra el registro cuando todos tengan su cuenta:** como la dirección de la app es pública, cualquiera podría crear una cuenta en tu proyecto. Sus datos no se mezclan con los tuyos, pero ocupan tu cuota. En **Authentication > Sign In / Providers** desactiva *Allow new users to sign up*.
7. **Sube los cambios a GitHub.** Vercel publica solo. En la app: **Ajustes > Crear cuenta**.

### Cómo se comporta

- Cada cambio se guarda primero en el dispositivo y luego se envía. Si no hay internet, queda pendiente y se envía al reconectar.
- Los cambios de un dispositivo aparecen en los demás en segundos. Si otro dispositivo borró un mes, lo notarás al volver a abrir la app.
- La primera vez que inicias sesión en un dispositivo que ya tiene datos distintos a los de tu cuenta, la app te pregunta con cuáles quedarte.
- **Cerrar sesión** sube lo pendiente y quita los datos de ese dispositivo (siguen en tu cuenta). Útil si prestas el celular.
- Si dos dispositivos editan lo mismo al mismo tiempo, gana el último en guardar.
- Como dueño del proyecto puedes ver los datos en el panel de Supabase (**Table Editor > finanzas_docs**). Están protegidos por RLS, pero no cifrados de extremo a extremo.
- Nota: en el plan gratuito Supabase pausa los proyectos sin actividad durante varios días. Si pasa, reactívalo desde su panel; mientras tanto la app sigue funcionando en local con lo que tiene guardado.

### Sesión y contraseña

- El inicio de sesión es un formulario real: el navegador (Opera, Chrome, Safari…) te ofrece **guardar la contraseña** y la autocompleta. Acepta la oferta la primera vez. La app **nunca** guarda tu contraseña; solo recuerda tu correo para escribirlo menos.
- La sesión se guarda en el dispositivo y se renueva sola, así que no tendrías que volver a entrar. Si aun así se cierra (por ejemplo porque el navegador borra los datos del sitio al cerrarse, o por usar una ventana privada), la app **no borra tus datos**: muestra un aviso, tu correo ya viene escrito y, en navegadores basados en Chrome, intenta volver a entrar sola con la contraseña guardada.
- Lo que cambies sin sesión o sin internet queda marcado como pendiente (incluso si cierras la app) y se envía al volver a entrar con la **misma cuenta**, sin preguntarte nada.
- **Borrar todo** quita los datos (también los de la cuenta y los de tus otros dispositivos) pero **no cierra tu sesión**. **Cerrar sesión** sí quita los datos de ese dispositivo.

### Actualizar la librería de Supabase (opcional)

`js/vendor/supabase.js` es `@supabase/supabase-js` empaquetado con esbuild para que la app no dependa de ningún CDN y abra sin conexión. Para actualizarlo:

```bash
mkdir tmp && cd tmp && npm init -y && npm i @supabase/supabase-js esbuild
echo "export { createClient } from '@supabase/supabase-js';" > entry.js
npx esbuild entry.js --bundle --format=esm --minify --platform=browser --target=es2020 --outfile=../js/vendor/supabase.js
```
