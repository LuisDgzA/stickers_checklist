# Historias de Usuario — Album Checklist

> Proyecto: Checklist de estampas de álbum coleccionable (FIFA World Cup 2026)
> Fecha: 2026-04-26
> Estado general: En desarrollo

---

## HU-001 — Registro e inicio de sesión con Google

**Como** usuario nuevo,
**Quiero** poder iniciar sesión con mi cuenta de Google,
**Para** acceder a mi colección personal de estampas de forma segura sin crear una contraseña adicional.

### Criterios de aceptación
- La pantalla de login muestra un botón "Continuar con Google".
- Al hacer clic, el usuario es redirigido al flujo OAuth de Google.
- Tras autenticarse exitosamente, el usuario es redirigido a la pantalla principal (`/`).
- Si la autenticación falla, el usuario regresa a `/login?error=auth_error` con un mensaje legible.
- Se crea automáticamente un registro en la tabla `profiles` con email y nombre del usuario.
- Un usuario ya autenticado que visita `/login` es redirigido a `/`.

### Escenarios de prueba
1. **Flujo exitoso**: Usuario no autenticado → hace clic en Google → autoriza → llega a `/`. ✓
2. **Fallo OAuth**: Google rechaza → usuario ve mensaje de error en `/login`. ✓
3. **Ya autenticado**: Usuario con sesión activa visita `/login` → redirige a `/`. ✓
4. **Perfil creado**: Primer login genera fila en `profiles` con id, email, full_name, avatar_url. ✓

**Estado**: Pendiente

---

## HU-002 — Cierre de sesión

**Como** usuario autenticado,
**Quiero** poder cerrar mi sesión,
**Para** proteger mi cuenta en dispositivos compartidos.

### Criterios de aceptación
- Hay un botón "Cerrar sesión" visible en el navbar de todas las páginas autenticadas.
- Al hacer clic, se envía un POST a `/auth/signout`.
- Tras el cierre de sesión, el usuario es redirigido a `/`.
- La sesión queda invalidada: intentar acceder a `/album/*` redirige a `/login`.

### Escenarios de prueba
1. **Flujo exitoso**: Usuario hace clic en "Cerrar sesión" → sesión destruida → llega a `/`. ✓
2. **Acceso post-logout**: Intento de GET `/album/mundial-2026` → redirige a `/login`. ✓
3. **Navbar visible**: El botón "Cerrar sesión" se ve en `/`, `/album/*` y `/share/*`. ✓

**Estado**: Pendiente

---

## HU-003 — Ver lista de colecciones disponibles

**Como** usuario (autenticado o no),
**Quiero** ver todas las colecciones de álbumes disponibles en la página de inicio,
**Para** seleccionar la que quiero gestionar.

### Criterios de aceptación
- La página `/` muestra una grilla de colecciones activas (`is_active = true`).
- Cada tarjeta muestra: imagen de portada (o ícono por defecto), nombre y descripción.
- Si no hay colecciones, se muestra un mensaje "No hay colecciones disponibles aún."
- Las colecciones se ordenan por fecha de creación ascendente.
- Un usuario no autenticado puede ver la lista pero al hacer clic en una colección es redirigido a `/login`.

### Escenarios de prueba
1. **Con colecciones**: La BD tiene "Mundial 2026" → aparece en la grilla. ✓
2. **Sin colecciones**: BD vacía → mensaje informativo. ✓
3. **Sin portada**: Colección sin `cover_image_url` → muestra ícono 🏆. ✓
4. **No autenticado**: Click en colección → redirige a `/login`. ✓

**Estado**: Pendiente

---

## HU-004 — Acceder al álbum de una colección

**Como** usuario autenticado,
**Quiero** abrir el álbum de una colección específica,
**Para** ver y gestionar mis estampas.

### Criterios de aceptación
- La ruta `/album/[collectionSlug]` carga los datos de la colección, grupos, países y estampas.
- Si el slug no existe o la colección está inactiva, el usuario es redirigido a `/`.
- Si el usuario no está autenticado, es redirigido a `/login`.
- La página muestra la barra de estadísticas con progreso general.
- Los países se listan en orden de `sort_order` ascendente.

### Escenarios de prueba
1. **Slug válido autenticado**: `/album/mundial-2026` → carga el álbum correctamente. ✓
2. **Slug inválido**: `/album/album-inexistente` → redirige a `/`. ✓
3. **No autenticado**: GET `/album/mundial-2026` → redirige a `/login`. ✓
4. **Colección inactiva**: `is_active = false` → redirige a `/`. ✓

**Estado**: Pendiente

---

## HU-005 — Ver progreso general de la colección

**Como** usuario autenticado viendo un álbum,
**Quiero** ver un resumen del progreso de mi colección,
**Para** saber cuántas estampas tengo, cuántas me faltan y cuántas tengo duplicadas.

### Criterios de aceptación
- El componente `StatsBar` muestra: nombre de la colección, porcentaje total, total de estampas, obtenidas, faltantes y duplicados.
- También muestra "Países completos: X / Y".
- El porcentaje se calcula como `Math.round((obtenidas / total) * 100)`.
- La barra de progreso cambia de color: azul oscuro (<50%), azul (≥50%), verde (100%).
- Los datos se actualizan en tiempo real cuando el usuario modifica cantidades.

### Escenarios de prueba
1. **Sin estampas**: 0/740 → 0%, barra vacía. ✓
2. **Mitad**: 370/740 → 50%, barra azul a la mitad. ✓
3. **Completo**: 740/740 → 100%, barra verde completa. ✓
4. **Duplicados**: Estampa con quantity=3 → duplicados = 2. ✓
5. **País completo**: Todos los stickers de un país en 1+ → cuenta en "Países completos". ✓

**Estado**: Pendiente

---

## HU-006 — Ver estampas organizadas por país

**Como** usuario autenticado,
**Quiero** ver las estampas agrupadas por país,
**Para** encontrar fácilmente las que busco dentro de cada selección nacional.

### Criterios de aceptación
- Cada país se muestra como una tarjeta colapsable `CountryCard`.
- La tarjeta muestra: nombre del país, código, progreso (X/20) y barra de progreso.
- Si el país tiene todas las estampas con quantity ≥ 1, muestra la etiqueta "✓ Completo".
- Al hacer clic en la tarjeta, se expande mostrando la grilla de estampas.
- Al hacer clic de nuevo, se contrae.

### Escenarios de prueba
1. **Carga inicial**: Todos los países colapsados, mostrando nombre y progreso. ✓
2. **Expandir**: Click en "México" → se muestran MEX-01 a MEX-20. ✓
3. **Contraer**: Segundo click → se ocultan las estampas. ✓
4. **País completo**: 20/20 → etiqueta verde "✓ Completo". ✓
5. **País vacío (filtro)**: Con filtro "Faltantes" y todos completos → país no se muestra. ✓

**Estado**: Pendiente

---

## HU-007 — Marcar una estampa como obtenida

**Como** usuario autenticado,
**Quiero** hacer clic en una estampa para marcarla como obtenida,
**Para** registrar que ya la tengo en mi álbum.

### Criterios de aceptación
- Una estampa con quantity=0 (gris) al hacer clic pasa a quantity=1 (azul).
- El cambio se refleja visualmente de inmediato (optimistic update).
- El cambio se persiste en Supabase vía upsert en `user_stickers`.
- Si la operación falla, la estampa vuelve a su estado anterior.
- La barra de progreso del país y de la colección se actualizan automáticamente.

### Escenarios de prueba
1. **Click en faltante**: MEX-01 quantity=0 → click → quantity=1, color azul. ✓
2. **Persistencia**: Recargar la página → MEX-01 sigue en quantity=1. ✓
3. **Error de red**: Simular fallo → la estampa vuelve a quantity=0. ✓
4. **Progreso actualizado**: Después del click, contador del país sube de X/20 a X+1/20. ✓

**Estado**: Pendiente

---

## HU-008 — Incrementar cantidad de una estampa (duplicados)

**Como** usuario autenticado,
**Quiero** presionar el botón "+" en una estampa para incrementar su cantidad,
**Para** registrar que tengo más de un ejemplar de esa estampa.

### Criterios de aceptación
- El botón "+" aumenta la cantidad en 1 por clic.
- Cuando quantity > 1, la estampa se muestra en color ámbar (repetida).
- Se muestra una etiqueta "+N" indicando cuántos duplicados hay (N = quantity - 1).
- El botón "+" se deshabilita cuando quantity alcanza `max_quantity` (1000).
- El cambio se persiste en Supabase.

### Escenarios de prueba
1. **Primera vez**: quantity=0 → "+" → quantity=1, color azul. ✓
2. **Duplicado**: quantity=1 → "+" → quantity=2, color ámbar, etiqueta "+1". ✓
3. **Múltiples**: quantity=5 → etiqueta "+4". ✓
4. **Límite máximo**: quantity=1000 → botón "+" deshabilitado. ✓

**Estado**: Pendiente

---

## HU-009 — Decrementar cantidad de una estampa

**Como** usuario autenticado,
**Quiero** presionar el botón "−" para reducir la cantidad de una estampa,
**Para** corregir errores o registrar que entregué un duplicado.

### Criterios de aceptación
- El botón "−" reduce la cantidad en 1 por clic.
- El botón "−" se deshabilita cuando quantity = 0 (no puede ser negativo).
- Si quantity baja de 2 a 1, la estampa vuelve al color azul (sin etiqueta de duplicado).
- Si quantity baja de 1 a 0, la estampa vuelve al color gris.
- El cambio se persiste en Supabase.

### Escenarios de prueba
1. **De duplicado a obtenido**: quantity=2 → "−" → quantity=1, color azul, sin etiqueta "+". ✓
2. **De obtenido a faltante**: quantity=1 → "−" → quantity=0, color gris. ✓
3. **Límite mínimo**: quantity=0 → botón "−" deshabilitado. ✓
4. **Persistencia**: Recarga → el nuevo valor persiste. ✓

**Estado**: Pendiente

---

## HU-010 — Filtrar estampas por estado

**Como** usuario autenticado viendo un álbum,
**Quiero** filtrar las estampas por su estado (Todas / Faltantes / Completas / Repetidas),
**Para** concentrarme en las estampas que más me importan.

### Criterios de aceptación
- La barra de filtros `FilterBar` muestra 4 botones: Todas, Faltantes, Completas, Repetidas.
- El filtro activo se muestra en azul; los inactivos en gris.
- "Faltantes": muestra solo estampas con quantity=0.
- "Completas": muestra solo estampas con quantity≥1.
- "Repetidas": muestra solo estampas con quantity>1.
- Los países cuyas estampas quedan vacías tras el filtro se ocultan.
- El filtro es reactivo: no requiere recarga de página.

### Escenarios de prueba
1. **Filtro "Faltantes"**: Solo MEX-05 con q=0 se muestra; MEX-01 (q=1) no aparece. ✓
2. **Filtro "Repetidas"**: Solo estampas con q>1. País sin repetidas no aparece. ✓
3. **Filtro "Todas"**: Se muestran todas las estampas de todos los países. ✓
4. **Cambio de filtro**: De "Faltantes" a "Completas" → lista cambia instantáneamente. ✓

**Estado**: Pendiente

---

## HU-011 — Buscar estampas por código o nombre de país

**Como** usuario autenticado,
**Quiero** usar un campo de búsqueda para encontrar estampas o países,
**Para** localizar rápidamente una estampa específica sin hacer scroll.

### Criterios de aceptación
- El campo de búsqueda acepta texto libre.
- La búsqueda filtra países cuyo nombre o código coincida con la query.
- También muestra países que tengan estampas cuyo código o nombre coincida.
- La búsqueda es insensible a mayúsculas.
- Al borrar la búsqueda, se restaura la vista completa.
- La búsqueda se combina con el filtro de estado activo.

### Escenarios de prueba
1. **Búsqueda por país**: Escribir "mex" → solo México visible. ✓
2. **Búsqueda por código**: Escribir "ARG-05" → Argentina visible con solo ARG-05. ✓
3. **Sin resultados**: Escribir "xxxxxx" → mensaje "No se encontraron países". ✓
4. **Combinado**: Filtro "Faltantes" + búsqueda "bra" → Brasil con solo sus faltantes. ✓
5. **Borrar**: Limpiar campo → vista completa restaurada. ✓

**Estado**: Pendiente

---

## HU-012 — Navegar por grupos (Grupos A–L)

**Como** usuario autenticado,
**Quiero** filtrar países por grupo de la fase de grupos,
**Para** ver solo los equipos de un grupo específico del torneo.

### Criterios de aceptación
- El componente `GroupNav` muestra botones para cada grupo (A–L) y un botón "Todos".
- Al seleccionar un grupo, solo se muestran los países de ese grupo.
- El botón "Todos" restaura la vista completa.
- La navegación por grupo se combina con el filtro de estado y la búsqueda.
- Si no hay grupos definidos, el componente no se renderiza.

### Escenarios de prueba
1. **Seleccionar Grupo A**: Solo México, USA y Canadá aparecen. ✓
2. **Seleccionar Grupo D**: Solo España, Portugal y Marruecos. ✓
3. **Botón "Todos"**: Todos los países vuelven a aparecer. ✓
4. **Grupo + filtro**: Grupo B + Filtro "Faltantes" → solo faltantes de Argentina, Chile, Perú. ✓
5. **Sin grupos**: Si no hay grupos en BD, `GroupNav` no se renderiza. ✓

**Estado**: Pendiente

---

## HU-013 — Ver progreso por país

**Como** usuario autenticado,
**Quiero** ver el progreso de cada país (cuántas estampas tengo de ese país),
**Para** saber qué países me faltan completar.

### Criterios de aceptación
- Cada `CountryCard` muestra el conteo "X/20" de estampas obtenidas.
- La barra de progreso del país refleja el porcentaje visual.
- La barra cambia de color según el porcentaje (azul oscuro < 50%, azul ≥ 50%, verde = 100%).
- El progreso se actualiza en tiempo real al modificar cantidades.

### Escenarios de prueba
1. **País vacío**: 0/20 → barra vacía. ✓
2. **País a medias**: 10/20 → barra azul al 50%. ✓
3. **País completo**: 20/20 → barra verde al 100%, etiqueta "✓ Completo". ✓
4. **Actualización**: Marcar una estampa → contador sube de X/20 a X+1/20 sin recargar. ✓

**Estado**: Pendiente

---

## HU-014 — Generar enlace de compartir

**Como** usuario autenticado,
**Quiero** generar un enlace único para compartir mi colección,
**Para** que otro usuario pueda ver qué estampas podemos intercambiar.

### Criterios de aceptación
- El botón "Compartir" está visible en la barra superior del álbum.
- Al hacer clic, se genera (o recupera) un `share_link` activo para el usuario y la colección.
- El token es único, de 16 caracteres hexadecimales.
- Si ya existe un enlace activo, se reutiliza (no se crea uno nuevo).
- Se muestra el `ShareModal` con el URL del enlace y el QR.
- Si hay un error, se muestra una alerta al usuario.

### Escenarios de prueba
1. **Primera vez**: Click "Compartir" → nuevo token creado en BD → modal visible. ✓
2. **Segunda vez**: Click "Compartir" de nuevo → mismo token reutilizado. ✓
3. **URL del enlace**: `https://app.example.com/share/[token]` bien formado. ✓
4. **Error de BD**: Simular fallo → alerta "Error al generar el enlace". ✓

**Estado**: Pendiente

---

## HU-015 — Ver QR del enlace de compartir

**Como** usuario autenticado,
**Quiero** ver un código QR en el modal de compartir,
**Para** que otro usuario pueda escanear el código y abrir mi colección directamente.

### Criterios de aceptación
- El `ShareModal` muestra un QR generado a partir del URL de compartir.
- El QR tiene fondo blanco y es legible (tamaño 180x180px).
- El URL también se muestra en texto debajo del QR.
- El modal puede cerrarse haciendo clic fuera de él o con la tecla Escape.

### Escenarios de prueba
1. **QR visible**: Al abrir el modal, el QR se muestra correctamente. ✓
2. **QR escaneable**: Escanear con cámara → abre la URL correcta. ✓
3. **Cerrar con Escape**: Tecla Escape → modal se cierra. ✓
4. **Cerrar con clic fuera**: Click en backdrop → modal se cierra. ✓

**Estado**: Pendiente

---

## HU-016 — Copiar enlace de compartir

**Como** usuario autenticado,
**Quiero** copiar el enlace de compartir con un clic,
**Para** enviarlo por mensaje a otro coleccionista.

### Criterios de aceptación
- El modal de compartir tiene un botón "Copiar enlace".
- Al hacer clic, el URL se copia al portapapeles.
- El botón cambia temporalmente a "✓ Enlace copiado" durante 2 segundos.
- Si la API de clipboard falla, se usa el método fallback con `execCommand`.

### Escenarios de prueba
1. **Copia exitosa**: Click "Copiar enlace" → portapapeles contiene el URL. ✓
2. **Feedback visual**: Botón cambia a "✓ Enlace copiado" por 2 segundos. ✓
3. **Restauración**: Después de 2 segundos, el botón vuelve a "Copiar enlace". ✓
4. **Fallback**: Simular fallo de clipboard API → el método fallback copia igual. ✓

**Estado**: Pendiente

---

## HU-017 — Ver página de intercambio al abrir enlace compartido

**Como** usuario autenticado que recibió un enlace de compartir,
**Quiero** abrir el enlace y ver una comparación de colecciones,
**Para** saber qué estampas podemos intercambiar mutuamente.

### Criterios de aceptación
- La ruta `/share/[token]` requiere que el visitante esté autenticado.
- Si el token es inválido o inactivo, se muestra un mensaje de error.
- Si el token pertenece al propio usuario, se muestra un mensaje informativo.
- Si el token es válido y el visitante es diferente al dueño, se carga la página de intercambio.
- Se muestran tres métricas: lo que el dueño puede dar, los intercambios posibles, lo que el visitante puede dar.

### Escenarios de prueba
1. **Token válido, distinto usuario**: Carga `MatchClient` con datos reales. ✓
2. **Token inválido**: Muestra "Enlace no válido". ✓
3. **Token propio**: Dueño visita su propio link → mensaje informativo con link a su colección. ✓
4. **No autenticado**: Redirige a `/login?next=/share/[token]`. ✓

**Estado**: Pendiente

---

## HU-018 — Ver estampas que el otro usuario puede darme

**Como** usuario viendo una página de intercambio,
**Quiero** ver una lista de las estampas que el otro coleccionista tiene duplicadas y yo no tengo,
**Para** saber exactamente qué le voy a pedir.

### Criterios de aceptación
- La sección "Lo que [nombre] te puede dar" lista estampas donde: owner.quantity > 1 AND visitor.quantity = 0.
- Las estampas se agrupan por país.
- Cada estampa muestra su código y cuántos duplicados tiene el dueño (×N donde N = quantity - 1).
- Si no hay estampas posibles, se muestra el mensaje "[nombre] no tiene duplicados que te falten."

### Escenarios de prueba
1. **Con duplicados**: Dueño tiene ARG-01 en quantity=3 y visitante en 0 → aparece "ARG-01 ×2". ✓
2. **Sin duplicados útiles**: Dueño no tiene duplicados de lo que le falta al visitante → mensaje vacío. ✓
3. **Agrupado por país**: Estampas de Argentina aparecen bajo "Argentina". ✓
4. **Sección especial**: Estampa FWC sin country_id aparece bajo "Sección especial". ✓

**Estado**: Pendiente

---

## HU-019 — Ver estampas que yo puedo dar al otro usuario

**Como** usuario viendo una página de intercambio,
**Quiero** ver una lista de mis estampas duplicadas que le faltan al otro coleccionista,
**Para** saber qué le puedo ofrecer en un intercambio.

### Criterios de aceptación
- La sección "Lo que tú le puedes dar" lista estampas donde: visitor.quantity > 1 AND owner.quantity = 0.
- Las estampas se agrupan por país.
- Cada estampa muestra su código y cuántos duplicados el visitante puede ofrecer.
- Si no hay estampas, se muestra "No tienes duplicados que le falten."

### Escenarios de prueba
1. **Con duplicados**: Visitante tiene ESP-10 en quantity=2 y dueño en 0 → aparece "ESP-10 ×1". ✓
2. **Sin duplicados útiles**: Mensaje "No tienes duplicados que le falten." ✓
3. **Agrupado por país**: Estampas de España aparecen bajo "España". ✓

**Estado**: Pendiente

---

## HU-020 — Ver número de intercambios posibles

**Como** usuario viendo una página de intercambio,
**Quiero** ver un resumen del número de intercambios posibles,
**Para** tener una visión rápida de si el intercambio vale la pena organizar.

### Criterios de aceptación
- Se muestra un número central "Posibles intercambios" = `Math.min(ownerCanGive.length, visitorCanGive.length)`.
- El número refleja cuántas estampas únicas se pueden intercambiar en ambas direcciones.
- El resumen se muestra en tres tarjetas en la parte superior de la página.

### Escenarios de prueba
1. **Caso simétrico**: Dueño puede dar 5, visitante puede dar 8 → intercambios = 5. ✓
2. **Sin intercambios**: Dueño puede dar 0 → intercambios = 0. ✓
3. **Tarjetas**: Los tres valores (dueño puede dar, intercambios, visitante puede dar) se muestran. ✓

**Estado**: Pendiente

---

## HU-021 — Redirección a login desde enlace compartido

**Como** usuario no autenticado que recibe un enlace de compartir,
**Quiero** ser redirigido al login y luego de autenticarme volver automáticamente al enlace,
**Para** no perder el contexto del intercambio.

### Criterios de aceptación
- Al visitar `/share/[token]` sin autenticación, se redirige a `/login?next=/share/[token]`.
- Tras autenticarse exitosamente, el callback redirige a `/share/[token]`.
- El parámetro `next` es respetado en el flujo OAuth callback.

### Escenarios de prueba
1. **Sin sesión**: GET `/share/abc123` → redirige a `/login?next=/share/abc123`. ✓
2. **Login exitoso con next**: Tras OAuth → `GET /auth/callback?code=...&next=/share/abc123` → llega a `/share/abc123`. ✓

**Estado**: Pendiente

---

## HU-022 — Seguridad: solo el dueño puede modificar sus estampas

**Como** usuario del sistema,
**Quiero** que las políticas de seguridad impidan que otros usuarios modifiquen mis estampas,
**Para** que mi colección esté protegida.

### Criterios de aceptación
- Las políticas RLS en `user_stickers` solo permiten SELECT/INSERT/UPDATE/DELETE al propio `auth.uid()`.
- Un intento de modificar `user_stickers` de otro usuario devuelve error de permisos.
- El bypass para intercambios (política `select_for_match`) solo permite SELECT cuando hay un share_link activo.

### Escenarios de prueba
1. **Modificación propia**: Usuario A modifica sus propias estampas → éxito. ✓
2. **Modificación ajena**: Usuario A intenta UPDATE en estampas del Usuario B → RLS rechaza. ✓
3. **Lectura para intercambio**: Usuario B con token válido puede leer estampas de A (solo SELECT). ✓

**Estado**: Pendiente

---

## HU-023 — Seguridad: colecciones, países y estampas son de solo lectura pública

**Como** administrador del sistema,
**Quiero** que todos los usuarios autenticados puedan leer los catálogos (colecciones, países, estampas),
**Para** que la app funcione sin necesitar permisos especiales por usuario.

### Criterios de aceptación
- Políticas RLS en `collections`, `sections`, `groups`, `countries`, `stickers` permiten SELECT a cualquier usuario autenticado.
- No hay política de INSERT/UPDATE/DELETE para usuarios normales en estas tablas.
- Solo el service role o un rol admin puede insertar/actualizar el catálogo.

### Escenarios de prueba
1. **Lectura de colecciones**: Usuario autenticado puede listar colecciones. ✓
2. **Lectura de estampas**: Usuario autenticado puede leer todas las estampas del catálogo. ✓
3. **Escritura bloqueada**: Usuario normal no puede INSERT en `stickers`. ✓

**Estado**: Pendiente

---

## HU-024 — Middleware: rutas protegidas redirigen al login

**Como** sistema,
**Quiero** que el middleware verifique la autenticación antes de acceder a rutas protegidas,
**Para** evitar cargar datos de usuario cuando no hay sesión activa.

### Criterios de aceptación
- El middleware protege cualquier ruta que comience con `/album`.
- Si no hay usuario en la sesión, se redirige a `/login`.
- Las rutas públicas (`/`, `/login`, `/share/*`, `/auth/*`) no están bloqueadas.
- Los assets estáticos (`_next/static`, imágenes, etc.) no pasan por el middleware de auth.

### Escenarios de prueba
1. **Sin sesión → /album/x**: Redirige a `/login`. ✓
2. **Con sesión → /album/x**: Pasa el middleware, carga la página. ✓
3. **Sin sesión → /**: Carga normalmente (no redirige). ✓
4. **Sin sesión → /share/token**: Carga la página (maneja auth internamente). ✓

**Estado**: Pendiente

---

## HU-025 — Persistencia optimista de cambios

**Como** usuario modificando cantidades,
**Quiero** que la UI responda inmediatamente a mis clics sin esperar la respuesta del servidor,
**Para** tener una experiencia fluida incluso con conexiones lentas.

### Criterios de aceptación
- Al hacer clic en una estampa o los botones +/−, la UI cambia de inmediato (optimistic update).
- La petición a Supabase se envía en segundo plano.
- Si la petición falla, la UI revierte al estado anterior.
- Mientras una petición está en curso, la estampa muestra opacidad reducida (`opacity-60`).

### Escenarios de prueba
1. **Click rápido**: UI cambia antes de que llegue respuesta del servidor. ✓
2. **Éxito**: Respuesta exitosa → UI queda en el nuevo estado. ✓
3. **Fallo**: Error de red → UI revierte al estado previo. ✓
4. **Indicador de carga**: Estampa en proceso tiene opacidad reducida. ✓

**Estado**: Pendiente

---

## HU-026 — Navbar responsivo

**Como** usuario en dispositivo móvil,
**Quiero** que el navbar sea utilizable en pantallas pequeñas,
**Para** acceder a las acciones principales sin problemas.

### Criterios de aceptación
- El email del usuario se oculta en pantallas pequeñas (`hidden sm:block`).
- Los botones del navbar son accesibles en todas las resoluciones.
- El botón "Cerrar sesión" / "Salir" siempre es visible.
- En la página del álbum, el buscador se adapta al ancho disponible.

### Escenarios de prueba
1. **Mobile (375px)**: Email oculto, botón "Salir" visible, buscador y botón "Compartir" alineados. ✓
2. **Tablet (768px)**: Email visible, todos los elementos correctamente distribuidos. ✓
3. **Desktop (1280px)**: Layout completo sin desbordamiento. ✓

**Estado**: Pendiente

---

## HU-027 — Grilla de estampas responsiva

**Como** usuario en diferentes dispositivos,
**Quiero** que la grilla de estampas se adapte al tamaño de la pantalla,
**Para** ver más o menos estampas por fila según el espacio disponible.

### Criterios de aceptación
- Mobile: 4 columnas.
- Tablet (sm): 6 columnas.
- Desktop (md): 8 columnas.
- Las tarjetas de estampa tienen altura mínima de 80px.
- El texto del código siempre es legible (font-mono, text-xs).

### Escenarios de prueba
1. **Mobile**: 4 estampas por fila. ✓
2. **Tablet**: 6 estampas por fila. ✓
3. **Desktop**: 8 estampas por fila. ✓

**Estado**: Pendiente

---

## HU-028 — Filtros horizontales con scroll sin barra visible

**Como** usuario en mobile,
**Quiero** poder deslizar horizontalmente los filtros y la navegación de grupos,
**Para** ver todas las opciones sin que una barra de scroll ocupe espacio visual.

### Criterios de aceptación
- Los componentes `FilterBar` y `GroupNav` tienen `overflow-x-auto` con la clase `no-scrollbar`.
- En mobile se puede deslizar horizontalmente para ver todos los grupos.
- La barra de scroll nativa no es visible.

### Escenarios de prueba
1. **Scroll horizontal**: En mobile, deslizar sobre los filtros → muestra todos. ✓
2. **Sin barra visible**: No aparece scrollbar visual en ningún navegador moderno. ✓

**Estado**: Pendiente

---

## HU-029 — Estampa con nombre visible en la tarjeta

**Como** usuario,
**Quiero** ver el nombre de la estampa (si existe) en la tarjeta,
**Para** saber a qué jugador o elemento especial corresponde.

### Criterios de aceptación
- Si `sticker.name` no es null, se muestra debajo del código en la tarjeta.
- El texto es pequeño (`text-[10px]`), centrado y con opacidad reducida.
- Si el nombre es null (estampas de países sin nombre), no se muestra.

### Escenarios de prueba
1. **Con nombre**: Estampa FWC Especial 1 → muestra "FWC Especial 1". ✓
2. **Sin nombre**: MEX-01 sin nombre → solo muestra el código. ✓

**Estado**: Pendiente

---

## HU-030 — Perfil de usuario creado automáticamente

**Como** usuario que inicia sesión por primera vez,
**Quiero** que mi perfil se cree automáticamente en la base de datos,
**Para** que el sistema pueda asociar mis estampas a mi cuenta.

### Criterios de aceptación
- El trigger `on_auth_user_created` se dispara al insertar un nuevo usuario en `auth.users`.
- El trigger ejecuta `handle_new_user()` que inserta en `public.profiles`.
- Si el perfil ya existe (ON CONFLICT), no se sobreescribe.
- Los campos `email`, `full_name` y `avatar_url` se toman de `raw_user_meta_data`.

### Escenarios de prueba
1. **Primer login**: Usuario nuevo → fila en `profiles` creada automáticamente. ✓
2. **Login repetido**: Segundo login → no crea duplicado (ON CONFLICT DO NOTHING). ✓
3. **Datos de Google**: `full_name` y `avatar_url` se mapean correctamente desde los metadatos OAuth. ✓

**Estado**: Pendiente

---

## HU-031 — Soporte para múltiples colecciones

**Como** administrador,
**Quiero** poder agregar nuevas colecciones (ej. UEFA Euro 2028, Copa América 2027),
**Para** que los usuarios puedan gestionar álbumes de diferentes torneos.

### Criterios de aceptación
- La tabla `collections` permite múltiples filas activas.
- Cada colección tiene su propio `slug`, grupos, países, secciones y estampas.
- Las rutas `/album/[slug]` soportan cualquier colección activa.
- Los `user_stickers` están aislados por `collection_id`.

### Escenarios de prueba
1. **Dos colecciones activas**: Ambas aparecen en la home. ✓
2. **Aislamiento**: Progreso de Mundial 2026 no afecta Copa América 2027. ✓
3. **Slug único**: No pueden existir dos colecciones con el mismo slug. ✓

**Estado**: Pendiente

---

## HU-032 — Sección especial FWC (estampas sin país)

**Como** usuario coleccionista,
**Quiero** gestionar las estampas especiales del álbum (FWC-01 a FWC-20) que no pertenecen a un país,
**Para** completar el álbum incluyendo estas estampas de la sección especial.

### Criterios de aceptación
- Las estampas de tipo `section_id = fwc` y `country_id = null` existen en la BD.
- En la página del álbum, estas estampas aparecen en la sección de intercambio bajo "Sección especial".
- El progreso de la colección incluye estas 20 estampas en el total.
- Se pueden marcar, incrementar y decrementar igual que las estampas de países.

### Escenarios de prueba
1. **Seed correcto**: 20 estampas FWC-01 a FWC-20 existen en la BD. ✓
2. **Total correcto**: 36 países × 20 + 20 FWC = 740 estampas en total. ✓
3. **Modificable**: FWC-01 puede ser marcada como obtenida. ✓
4. **En intercambio**: FWC con duplicados aparece bajo "Sección especial" en match. ✓

**Estado**: Pendiente

---

## HU-033 — Despliegue en Vercel

**Como** desarrollador,
**Quiero** poder desplegar la aplicación en Vercel con un comando,
**Para** tener un ambiente de producción estable y con HTTPS.

### Criterios de aceptación
- El proyecto compila exitosamente con `npm run build`.
- Las variables de entorno `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_APP_URL` están configuradas en Vercel.
- La URL de producción se configura como `NEXT_PUBLIC_APP_URL`.
- La URL de producción se agrega a los "Redirect URLs" de Google OAuth en Supabase.

### Escenarios de prueba
1. **Build exitoso**: `npm run build` termina sin errores de TypeScript o compilación. ✓
2. **Variables configuradas**: La app en Vercel puede conectarse a Supabase. ✓
3. **OAuth en producción**: El flujo Google OAuth funciona con la URL de Vercel. ✓

**Estado**: Pendiente

---

## HU-034 — Confirmación visual de acción completada

**Como** usuario que copia el enlace de compartir,
**Quiero** ver una confirmación visual de que el enlace fue copiado exitosamente,
**Para** saber que puedo proceder a pegarlo en un mensaje.

### Criterios de aceptación
- El botón "Copiar enlace" cambia su texto y color (verde) durante 2 segundos tras copiar.
- Después de 2 segundos, el botón vuelve a su estado original.
- La confirmación se activa tanto con la API de clipboard como con el método fallback.

### Escenarios de prueba
1. **Copia exitosa**: Botón cambia a "✓ Enlace copiado" con fondo verde. ✓
2. **Restauración automática**: Después de 2 segundos, vuelve a "Copiar enlace" azul. ✓
3. **Múltiples clicks**: Copiar varias veces reinicia el timer de 2 segundos. ✓

**Estado**: Pendiente
