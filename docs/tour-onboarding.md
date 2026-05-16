# Tour/onboarding mobile-first

El onboarding ahora usa un motor reutilizable en `components/tour`.

## Arquitectura

- `TourProvider`: estado del tour, apertura manual/automática, avance, cierre y finalización.
- `TourOverlay`: orquesta portal, highlight, tarjeta y analytics.
- `TourPortal`: renderiza el tour en `document.body` para evitar problemas con layouts anidados.
- `TourHighlight`: dibuja el foco visual del elemento activo.
- `TourStepCard`: tarjeta accesible y responsive del paso.
- `useTour`: API contextual para abrir/cerrar tours.
- `useTourHighlight`: selector resiliente con retry, `MutationObserver`, resize, orientación y `visualViewport`.
- `useScrollLock`: evita desplazamiento horizontal accidental sin congelar agresivamente la página.
- `useTourAnalytics`: emite eventos desacoplados para PostHog, Plausible, custom events o integración futura.
- `useTourPersistence`: helpers versionados para localStorage.

## Mobile-first

- La tarjeta usa `100dvh`, safe areas (`--sat`, `--sab`, `--sal`, `--sar`) y ancho limitado por viewport.
- Touch targets mínimos de 44px.
- El placement se calcula en móvil antes que en desktop.
- En móvil se prioriza `top`/`bottom`; en desktop se habilita `left`/`right`.
- Se escuchan `visualViewport`, `orientationchange` y `resize` para Safari iOS, Android Chrome, zoom y teclado virtual.
- El scroll no queda bloqueado de forma agresiva; el tour usa scroll automático al target y previene scroll horizontal accidental.

## Flujo actual

- Home: `components/home/HubHomeTutorial.tsx`.
- Sandbox/álbum: `components/album/AlbumOnboarding.tsx`.
- El Home continúa hacia `/album/demo?onboarding=album` para explicar la lógica del álbum sin pedir login.
- Se mantiene una sola fuente de persistencia: `hub_home_tutorial_seen`.
- La versión actual es `HUB_HOME_TUTORIAL_VERSION = 2`.

## Analytics

Eventos emitidos:

- `tutorial_auto_opened`
- `tutorial_manual_opened`
- `tutorial_step_viewed`
- `tutorial_next`
- `tutorial_previous`
- `tutorial_skipped`
- `tutorial_closed`
- `tutorial_completed`
- `tutorial_transitioned_to_sandbox`
- `tutorial_selector_missing`

Cada evento también dispara un `CustomEvent` en `window`, y si existen `window.posthog` o `window.plausible`, se envía ahí.

## Edge cases cubiertos

- Selector ausente: no rompe el tour; muestra fallback y emite analytics.
- Re-render del target: `MutationObserver` recalcula highlight.
- iOS Safari / teclado virtual: `visualViewport` recalcula posición.
- Landscape: placement se recalcula en `orientationchange`.
- Zoom: se usan medidas reales de viewport.
- Notch/safe area: variables CSS basadas en `env(safe-area-inset-*)`.

## Mejoras futuras

- Añadir capturas reales en `/public/tutorial`.
- Añadir test E2E con Playwright cuando el proyecto acepte dependencias de testing.
- Persistir progreso parcial del paso actual.
- Sincronizar estado guest/auth al iniciar sesión.
