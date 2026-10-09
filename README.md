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
  css/
    styles.css          estilos y tema claro/oscuro
  js/
    main.js             arranque: conecta módulos y dibuja la app
    state.js            estado, guardado local y sincronización
    logic.js            reglas: quincenas, sobres, tarjetas, fijos
    util.js             formato de dinero y fechas, iconos
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
| Dónde y cómo se guardan los datos | `js/state.js` |
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

## Primer uso

Al abrir la app por primera vez pregunta si quieres precargar información de ejemplo (ingreso de $12,000 por quincena, tarjetas, gastos y metas inventados). Si dices que no, te pide cuánto cobras por quincena y empiezas en blanco. Con el ejemplo cargado aparece un aviso con el botón **Empezar desde cero**.

## Instalarla como app en el celular

- **iPhone (Safari):** Compartir > Agregar a pantalla de inicio.
- **Android (Chrome):** menú > Instalar app (también aparece un botón en Ajustes).

Se abre a pantalla completa, con su ícono, y funciona sin conexión gracias a `sw.js`. Si agregas o renombras archivos de `js/` o `css/`, súbelos también a la lista `SHELL` de `sw.js` y cambia `VERSION` (por ejemplo `miscore-v2`).

## Datos

Se guardan en el `localStorage` del navegador: son privados, pero **no se sincronizan** entre dispositivos y se pierden si borras los datos del sitio. Usa **Ajustes > Descargar respaldo** para copias o para moverlos de un dispositivo a otro.

La persistencia está concentrada en `js/state.js` (`loadLocal`, `saveLocal`, `persist`). Es el único lugar que hay que tocar para conectar un backend con inicio de sesión (por ejemplo Supabase).
