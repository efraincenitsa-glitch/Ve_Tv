# MX TV Públicos — PWA lista para GitHub Pages

Este paquete está listo para subir **tal cual** a GitHub. Incluye:

- `index.html`, `app.js`, `styles.css`
- `manifest.webmanifest`, `sw.js`, `sw-register.js`
- Íconos: `icons/icon-192.png`, `icon-512.png`, `icon-1024.png`
- Listas: `lists/mx_regionales.m3u`, `lists/mx_documentales_nocturnos.m3u`, `lists/intl_publicos.m3u`
- Candado **Adulto** (PIN **1975**), oculto por defecto.
- **Modo nocturno** (22:00–06:00) con filtro a *Documentales*.
- Botón **🧹 Restablecer app** (limpia caché y Service Worker si Safari queda “atorado”).

## Publicación en GitHub Pages

### Opción A: *Project site* (recomendada)
1. Crea un repo, por ejemplo `mx-tv-app`.
2. Sube **todo el contenido** de esta carpeta (no subas el .zip; sube los archivos extraídos) al **root** del repo.
3. Ve a **Settings → Pages** y selecciona **Branch:** `main` y **Folder:** `/(root)`.
4. Tu URL será `https://<usuario>.github.io/mx-tv-app/`.

### Opción B: *User/Org site*
1. El repo **debe** llamarse `tu_usuario.github.io`.
2. Sube el contenido al root y habilita Pages como arriba.
3. Tu URL será `https://tu_usuario.github.io/`.

> Si hiciste cambios y no los ves en iPhone, toca **🧹 Restablecer app** (o borra Datos de Sitios de Safari), y recarga.

## Cómo usar
- **Filtros**: País, Grupo, Clasificación y Favoritos.
- **Importar M3U**: botón *“📄 Importar M3U”* mezcla tu lista con las preinstaladas.
- **WEB**: canales que abren su plataforma oficial (compatibles con iPhone). Para marcar uno tuyo, añade `x-web="true" x-site="https://..."`.
- **Adulto**: marca en tu M3U `group-title` con `Adulto`/`18+`, o `tvg-rating="18+"`, o `x-adult="true"`.

## Notas para iPhone
- Safari cachea agresivamente PWA; por eso el **Service Worker v3** renueva el caché y el botón de **Restablecer** te saca de cualquier atoro.
- Agregar a pantalla de inicio: abrir la URL, **Compartir → Añadir a pantalla de inicio**. Usará el ícono `icon-1024.png`.
