# Leon S. Kennedy Workout

PWA de rutina de entrenamiento con sincronización en tiempo real entre dispositivos. Vanilla JS, sin build ni dependencias — un solo `index.html`.

Sitio en producción: https://leon.rez-lex.com

## Funcionalidad

- Rutina de 3 días (ejercicios, series, peso) editable desde cualquier dispositivo.
- Checks de progreso por ejercicio, temporizador de descanso y contador de series, todo sincronizado en tiempo real vía Firebase Realtime Database + Server-Sent Events.
- Historial de sesiones.
- Instalable como PWA (Android/iOS/desktop) — service worker cachea los assets estáticos; HTML y llamadas a Firebase siempre van a red.

## Autenticación

El acceso está restringido a **2 cuentas de Google específicas**. Flujo:

1. Google Identity Services (`accounts.google.com/gsi/client`) renderiza el botón "Iniciar sesión con Google" y devuelve un ID token de Google.
2. Ese token se intercambia por un token de Firebase vía la REST API de Identity Toolkit (`accounts:signInWithIdp`).
3. El correo devuelto se valida contra una lista blanca (`ALLOWED_EMAILS` en `index.html`) — si no coincide, no se entrega ni guarda ningún token.
4. La sesión persiste vía refresh token en `localStorage`; se revalida el correo en cada renovación silenciosa (cada ~55 min y en cada carga de página).

**Importante:** la lista blanca del cliente es solo para la UI. La restricción real debe reforzarse en las **Reglas de la Realtime Database** (Firebase Console → Realtime Database → Reglas):

```json
{
  "rules": {
    ".read": "auth != null && (auth.token.email === 'correo1@gmail.com' || auth.token.email === 'correo2@gmail.com')",
    ".write": "auth != null && (auth.token.email === 'correo1@gmail.com' || auth.token.email === 'correo2@gmail.com')"
  }
}
```

Sin esto, cualquier cuenta de Google que logre autenticarse contra el proyecto de Firebase podría leer/escribir la base de datos completa.

### Configuración necesaria en Google/Firebase

- **Firebase Console** → Authentication → Sign-in method → Google: habilitado, con el Web Client ID usado en `GOOGLE_CLIENT_ID`.
- **Google Cloud Console** → Credentials → ese mismo OAuth Client ID → **Authorized JavaScript origins** debe incluir el dominio de producción (`https://leon.rez-lex.com`) y cualquier origen de prueba local.
- La **Firebase API key** y el **Client ID de OAuth** en el código son públicos por diseño (no son secretos) — la seguridad real vive en las Reglas de la base de datos y en los orígenes autorizados, no en ocultar estos valores.

## PWA / manifest

`manifest.json` usa `start_url`/`scope`/`id` = `/` (raíz del dominio custom). Si cambias de dominio o de estructura de rutas, hay que actualizar esos campos — y si el cambio es solo de contenido (no de ruta), versiona la URL del manifest en el `<link rel="manifest">` (`manifest.json?v=N`) para forzar que el servidor de Google que empaqueta la PWA en Android (WebAPK) no sirva una copia cacheada del manifest viejo.

## Archivos

| Archivo | Rol |
|---|---|
| `index.html` | Toda la app: markup, estilos y lógica (rutina, timer, historial, auth, sync con Firebase) |
| `sw.js` | Service worker — cache-first para assets estáticos, siempre red para HTML/Firebase |
| `manifest.json` | Manifest de la PWA |
| `data.csv` | Rutina original, usada para restaurar a valores de fábrica |
| `CNAME` | Dominio custom de GitHub Pages |

## Despliegue

GitHub Pages sirve directo desde la rama `main` (raíz del repo) al dominio en `CNAME`. Push a `main` = deploy.
