# ANDEX — Registro de decisiones de implementación

> Complementa al PRD (§11 exige registrar cambios de alcance ANTES del backlog).
> Aquí se anotan decisiones de implementación que el PRD no fija, con su porqué.
> Mantenido por el orquestador. Los agentes proponen en sus reportes.

| # | Fecha | Decisión | Porqué | Tipo |
|---|---|---|---|---|
| D1 | 2026-08-07 | **El prototipo `andex-prototipo-visual.html` no existe en el repo**; se construye con el PRD como única fuente y `/design` (showcase de componentes) pasa a ser la referencia visual viva. | El PRD §2.10/Anexo D lo citan pero el archivo no fue entregado. El PRD es lo bastante explícito (tokens, matriz de contraste, wireframes ASCII). | Hecho |
| D2 | 2026-08-07 | **Modo demo sin credenciales**: sin env vars de Supabase/Stripe la app corre con datos en localStorage + cookie de sesión y checkout simulado. | Permite validar el embudo completo (landing→entrevista→paywall→panel) hoy, sin bloquear por aprovisionamiento de servicios. La UI consume un contrato único (`lib/data/contract.ts`) y el cambio a producción es solo configuración. | APUESTA (criterio propio) |
| D3 | 2026-08-07 | `reason` del motor se persiste como **código estructurado** (`ReasonCode` JSON) y el copy se resuelve en i18n, no en el motor. | §7.1 exige motor sin dependencias de UI e intercambiable por IA en Fase 2; un string en español dentro del motor violaría ambos. En BD sigue cabiendo en `user_module_ranking.reason` (TEXT). | Hecho |
| D4 | 2026-08-07 | Paso 5 (objetivo inmediato) se modela como `InterestTag \| 'custom'`: las opciones se generan de los intereses del paso 4, tal como pide el PRD. | Evita un enum paralelo de "goals" que habría que mapear 1:1 a los mismos módulos. | Hecho |
| D5 | 2026-08-07 | Breakpoints Tailwind: `sm`=640, `lg`=1024, `xl`=1440 (PRD §2.4); `md` (768) se evita. | La tabla del PRD corta en 640/1024/1440. | Hecho |
| D6 | 2026-08-07 | Idioma por cookie (`andex_lang`) sin rutas /es /en. | El PRD pide toggle ES/EN (§2.7), no SEO multi-locale; la cookie mantiene la landing estática y ligera y funciona sin JS vía `/api/prefs`. | APUESTA |
| D7 | 2026-08-07 | Iconos con `lucide-react` (imports individuales, tree-shaking). | El seed §7.4 usa nombres de icono estilo lucide (`folder-lock`, `plane`, …). | Hecho |
| D8 | 2026-08-07 | Sin git por ahora. | El directorio no es repo y el dueño no pidió versionado; se ofrece al cierre. | Pendiente de confirmar |
| D9 | 2026-08-07 | **Normalización del score**: `round(100 × raw / max_raw)`, pero **el orden se decide sobre el raw**. | §3.3.1 paso 9 pide normalizar a 0–100 sin decir cómo. Ordenar por el normalizado dejaría que un redondeo empatara módulos con relevancia distinta. El top siempre vale 100, que es lo que la hero card necesita mostrar. | APUESTA razonada |
| D10 | 2026-08-07 | **URGENCY_BOOST (+12) se aplica a UN solo módulo**: el primero de la lista de la situación activa; sin situación, el de mayor base del contexto (in_us→M1, pre_arrival→M2). | §3.3.1 define el peso pero no a qué módulo aplicarlo. Las listas de `SITUATION_BOOSTS_*` están ordenadas por prioridad, así que su primer elemento es la mejor señal disponible de "qué es lo urgente para este perfil". | APUESTA razonada |
| D11 | 2026-08-07 | **Discrepancia detectada en el PRD §3.3.1**: los órdenes por defecto declarados (`in_us [1,7,5,3,2,4,6]`, `pre_arrival [2,6,1,3,5,4,7]`) NO se reproducen aplicando `BASE_RELEVANCE` + "empate → menor id" (daría `[1,7,2,3,5,4,6]` y `[2,6,1,3,4,5,7]`). Resolución: cuando ninguna señal contribuyó, el desempate es la posición en `DEFAULT_ORDER` (el PRD manda); con cualquier señal, menor id estricto. | El PRD declara ambas reglas y son incompatibles entre sí en el caso base. Se respeta el resultado explícito (los órdenes listados) por encima del mecanismo. **Requiere zanjarse en una futura edición del §3.3.1.** | Desviación razonada — pendiente de decisión de producto |
| D12 | 2026-08-07 | El interés `licencia_conducir` mapea a **M2**, no a M1. | La tabla §6 (línea 1222) ubica las citas de licencia de manejo en el Módulo 2. | Hecho |
| D13 | 2026-08-07 | Catálogos (`states`, `countries`, `situations`, `interests`) se separan de i18n en un agente propio. | Son datos estructurales sin copy de pantalla; los labels visibles siguen en `lib/i18n/dictionaries/wizard.ts` indexados por tag del enum. Permite paralelizar y evita que un archivo de 249 países compita con el trabajo de redacción. | Hecho |
| D14 | 2026-08-07 | **El paso 4 guarda los intereses en ORDEN DE SELECCIÓN, no en orden de catálogo.** El wizard es responsable de construir ese array; `OptionChips` conserva el orden que recibe. | §3.3.1 da `PRIMARY_INTEREST` (+30) al elemento `[0]` y `OTHER_INTEREST` (+15) al resto. Si se guardara el orden del catálogo, el "interés principal" sería un accidente de cómo está ordenada la lista en pantalla, no una señal del usuario. El primero que marca es la mejor señal disponible de qué le importa más. | APUESTA razonada — **vinculante para el agente del wizard** |
| D15 | 2026-08-07 | La **hero card** no es un contenedor clicable; se acciona por sus dos botones. Las tarjetas de grid y lista sí son un control completo. | §4.5 pide tarjeta accionable y §4.4 mete dos botones dentro. Anidar controles interactivos rompe la navegación por teclado y los lectores de pantalla. La accesibilidad es piso no negociable (§9). | Hecho |
| D16 | 2026-08-07 | El `accent_color` del seed §7.4 se usa **solo como tinte de superficie** tras el icono (`color-mix` al 14%); el icono va en color de texto normal. | Varios accent colors del seed son `#12B8A6` y `#F4B942`, que la matriz §2.1.1 prohíbe llevar contenido encima. Así el seed se respeta sin violar el contraste. | Hecho |
| D17 | 2026-08-07 | **Ningún importe monetario está escrito en los diccionarios.** Todo texto con precio es una función `(price: string) => string`; el precio llega desde `PRICES` de `lib/config.ts`. | §3.4.4 y la decisión abierta #1 del PRD dicen que $14 es hipótesis a validar contra $9/$19. Con el precio incrustado en el copy, probar otro precio obligaría a editar traducciones en dos idiomas. | Hecho |
| D18 | 2026-08-07 | El **motivo de cancelación se pregunta DESPUÉS de haber cancelado**, con "No, gracias" visible. | §3.4.6 prohíbe que cancelar requiera pasos extra o retención. Preguntar antes convierte la encuesta en un obstáculo; preguntar después sigue dando el dato sin retener a nadie. | Hecho |
| D19 | 2026-08-07 | Los testimonios de la landing quedan como **marcador honesto**, no inventados, y el número de familias es un parámetro, no texto fijo. | §3.1 pide "testimonios reales". Inventarlos sería fabricar prueba social. Un "2,400" exacto e inmóvil es lo primero que esta audiencia lee como inflado. | APUESTA |
| **D20** | 2026-08-07 | ⚠️ **La garantía de "14 días" del paywall (§3.4.2) no está definida en ninguna otra parte del PRD.** Se deja en el copy porque el wireframe la incluye, pero queda marcada como pendiente de aprobación. | §3.4.6 detalla los requisitos de cumplimiento y **no menciona ninguna garantía de devolución**. Si se publica, es una promesa comercial vinculante igual que la tarifa congelada (riesgo R2) y necesita política de reembolso escrita y operativa. | **Pendiente de decisión — bloqueante para publicar** |

| D21 | 2026-08-07 | **Tres columnas que el PRD exige en su texto pero omite en el esquema §7.2**, añadidas en `0005_schema_gaps.sql` en lugar de editar `0001`: `user_consents.ip_address` (§3.4.6 pide "versión, timestamp e IP"), `user_module_ranking.sessions_without_open` (§3.3.2 pide restar −10 tras 3 sesiones sin abrir; sin la columna la regla es inaplicable) y `location_context_changes.arrival_date` (§3.2.3). | Poner el parche en una migración aparte deja la discrepancia visible para corregirla en el documento (§11), en vez de disimularla dentro de la transcripción fiel del esquema. **Consecuencia operativa:** el consentimiento debe registrarse desde un route handler, porque el navegador no conoce su propia IP. | Hecho — **requiere corrección del PRD §7.2** |
| D22 | 2026-08-07 | El SQL del PRD §7.2, ejecutado en su orden literal, **falla**: `module_relevance` referencia `modules` antes de que exista. Las migraciones reordenan las sentencias. | Es un error de transcripción del documento, no una decisión de diseño. | Hecho — corregir en el PRD |
| D23 | 2026-08-07 | `@supabase/ssr` 0.6.1 y `supabase-js` 2.112 tienen firmas de genéricos incompatibles: pasar `Database` a las factories de `ssr` resuelve **todas las tablas a `never`**. Se llama sin genéricos y se tipa con `SupabaseClient<Database>`. | Es un desajuste de versiones de librería, no del diseño. Documentado en el propio `client.ts`; se elimina al actualizar `@supabase/ssr`. | Hecho — temporal |

| D24 | 2026-08-07 | **Evento `landing_section_viewed` añadido fuera de la tabla §7.5**, con `{ section }`. | La tabla de requisitos de §3.1.1 pide "evento por sección vista **y** por CTA", pero §7.5 solo listó el de CTA. Sin él no se puede saber en qué punto de la landing se cae la gente, que es lo que la métrica "tasa de inicio ≥25%" necesita explicar. | Hecho — **añadir a §7.5 del PRD** |
| D25 | 2026-08-07 | `track()` carga la capa de datos con `import()` **diferido**, no estático. | `@/lib/data` arrastra el SDK de Supabase (~40 KB gzip). Con import estático, la landing pública —que no toca la base de datos— se llevaría el SDK en su chunk inicial y rompería el presupuesto de §3.1.1. | Hecho |
| D26 | 2026-08-07 | Rutas legales (`/terminos`, `/privacidad`, `/contacto`) añadidas a `ROUTES`; el **contenido** queda fuera del alcance de v1. | §3.4.6 exige divulgar los términos antes del cobro y el footer necesita enlazarlos, así que las rutas deben existir. Redactarlos es trabajo legal, no de ingeniería. **Sin estas páginas escritas no se puede cobrar.** | Rutas hechas — **contenido pendiente, bloqueante para cobrar** |
| D27 | 2026-08-07 | La sugerencia de rama por IP **no altera la interfaz** de la landing: solo alimenta `was_ip_prefilled` / `changed_from_prefill`. | Preseleccionar una tarjeta contaminaría la métrica §0.6 "selección de rama ≥40%" y contradice la regla UX 7 de §3.2 ("se sugiere, el usuario confirma"). Dejarlo neutro permite medir cuánto se equivoca la geolocalización antes de fiarse de ella. | APUESTA razonada |

| **D28** | 2026-08-07 | **El estado (rama A) y el país de residencia (rama B) SÍ son obligatorios para avanzar del paso 2.** Resuelve una contradicción del PRD. | La regla UX 5 de §3.2 dice "solo email, nombre y `location_context` son requeridos", pero: (a) las tablas del paso 2 marcan explícitamente *Ciudad* y *Nacionalidad* como "opcional" y **deliberadamente no marcan así Estado ni País** — el documento distingue; (b) §3.4.3 lista la referencia geográfica ("2,400 familias **en Utah**") como **personalización obligatoria** del paywall, que sin scope se rompe; (c) §7.5 dedica un evento propio, `location_scope_selected`; (d) el diccionario ya traía escritos los mensajes de error de ambos campos — el agente de copy, leyendo el mismo PRD, concluyó lo mismo. La regla 5 se lee como qué **pasos** pueden saltarse, no como el interior del paso 2, que es justamente el único que no admite salto. | Decidido — **corregir la redacción de la regla 5 en el PRD** |
| D29 | 2026-08-07 | Añadida `users.country_other` (+ `countryOther` en los tipos) para el texto libre de "Mi país no está en la lista". | El Anexo C.2 lo pide explícitamente y §7.2 no tenía dónde guardarlo. Mismo patrón que el resto de los "Otro" (§3.2.1): el enum guarda `'XX'` y el texto libre va en columna aparte. | Hecho — **añadir a §7.2 del PRD** |
| D30 | 2026-08-07 | El paso 5 (objetivo) **no bloquea** el avance. | §3.2 regla 5 no lo lista como obligatorio y §3.2.1 regla 4 declara válido elegir la opción libre sin escribir nada. El motor funciona con los intereses del paso 4. | Hecho |

| D31 | 2026-08-07 | **Idempotencia de webhooks con reserva-y-liberación**: el `event_id` se INSERTA en `stripe_events` *antes* de procesar; si el procesado falla, la reserva se **libera** y se devuelve 500 para que el reintento de Stripe sí trabaje. | §9 exige que un webhook duplicado no duplique lógica. La versión ingenua (marcar como procesado al terminar) deja una ventana de doble cobro; la versión "marcar al empezar y no liberar nunca" convierte un fallo transitorio de red en un **cobro perdido para siempre**, porque el reintento de Stripe se descarta como duplicado. | Hecho |
| D32 | 2026-08-07 | `checkout_method_chosen` se emite **una sola vez**, cuando el usuario elige de verdad (primer foco en un campo de tarjeta o clic en el wallet), no al montar el componente. | Emitirlo al montar marcaría `method: 'card'` también a quien paga con Apple Pay, y esa métrica de §7.5 dejaría de significar nada. | Hecho |
| D33 | 2026-08-07 | El estilo de los iframes de Stripe se genera leyendo las **variables CSS** de la paleta, no con hex. | Mantiene la regla de §2.1 (los colores solo se declaran en `globals.css`) dentro de un iframe de terceros, y hace que el modo oscuro llegue solo. *Limitación conocida:* el `appearance` se captura al montar, así que un cambio de tema en vivo no repinta los iframes hasta recargar. | Hecho |
| D34 | 2026-08-07 | `?plan=annual\|monthly` viaja en la URL de `/pago`. | No es dato sensible (§9): declara la cadencia elegida, no un estatus migratorio — mismo criterio que el `?ctx=` de la landing. A cambio, "Cambiar de plan", el botón atrás del navegador y un refresco funcionan sin estado oculto. | Hecho |
| D35 | 2026-08-07 | `PILOT_FAMILIES` consolidado en `lib/config.ts` (estaba duplicado en la landing y en el paywall). | Un mismo número de prueba social en dos sitios acaba divergiendo, y el que se quede viejo es el que destruye la credibilidad. | Hecho |

| **D36** | 2026-08-07 | **La hero card salta el módulo descartado durante la sesión**, aunque la penalización de −25 no lo haya destronado. | §3.3.2 resta 25 puntos al pulsar "No es lo que busco", pero eso **no siempre cambia al líder**: un módulo con 100 cae a 75 y sigue por encima del segundo con 59. El usuario pulsaría el botón y vería la misma tarjeta: el control más honesto del producto (§4.4) convertido en una mentira. La penalización se sigue acumulando en el score persistido y el grid sigue mostrando los 7 (§0.4); solo la hero card respeta el descarte. **El motor no se tocó.** | Hecho — merece nota en §3.3.2 |
| D37 | 2026-08-07 | El re-ranking de comportamiento se aplica **una sola vez sobre una base recalculada**, no acumulativamente sesión tras sesión. | `applyBehaviorAdjustments` no es idempotente: reaplicarlo sobre el resultado anterior restaría el mismo descarte en cada inicio de sesión hasta hundir el módulo a 0. Se re-ejecuta `rankModules` (puro y barato) y el ajuste se aplica encima. | Hecho |
| D38 | 2026-08-07 | La ocultación de la hero card tras 3 descartes la gobierna una **ventana temporal**, no el contador. | El contador nunca baja, así que gobernado por él la hero card desaparecería **para siempre**; §4.7 dice explícitamente 7 días. | Hecho |
| D39 | 2026-08-07 | `module_opened` se emite **en la pantalla del módulo**, no en el clic de la tarjeta; `was_recommended` es `false` para quien saltó el onboarding. | Es el evento que mide la precisión real del motor (§7.5). Emitirlo en el clic perdería las entradas desde el sidebar, el tab bar o un enlace directo. Y marcar `was_recommended` en un usuario al que no se le recomendó nada inflaría artificialmente la métrica. | Hecho |
| D40 | 2026-08-07 | Los intereses se reordenan con **botones**, no arrastrando, pese a que el copy hablaba de arrastrar. | El orden decide qué interés vale +30 (D14), así que tiene que ser editable; y arrastrar no funciona con teclado ni con lector de pantalla, lo que choca con el piso de accesibilidad de §9. | Hecho |
| D41 | 2026-08-07 | La banda superior del escritorio **no lleva cuenta regresiva**: muestra el estado real de la suscripción. | §2.4 pide un "countdown banner" para eventos, pero no existe tabla de eventos en §7.2 y §3.4.1 prohíbe fabricar urgencia. El sitio queda listo para cuando haya una fuente real. | Hecho |
| D42 | 2026-08-07 | Corregido en `demo-store`: `recordLocationTransition` descartaba el país al migrar a `pre_arrival`. | El contrato lo declaraba y el dato se perdía; sin país no se resuelven los enlaces consulares de M2 (el módulo top de esa rama), ni la zona horaria ni la moneda de referencia (C.4). | Hecho |

| D43 | 2026-08-07 | **`subscription_canceled` se emite solo desde el cliente**, no desde el endpoint. | Se emitía en los dos sitios: en producción la métrica de cancelación habría salido **al doble**, sin forma de detectarlo. Se conserva el emisor del cliente porque §7.5 exige la propiedad `reason` y D18 manda preguntarla *después* de cancelar: desde el servidor saldría siempre vacía. La cancelación en sí no depende del evento — queda escrita en `subscriptions`, que es la fuente de verdad del churn. | Hecho |
| D44 | 2026-08-07 | Los `placeholder` pasan de `text-disabled` a `text-muted`. | `#8A9BAD` da **2.85:1** sobre blanco: reprueba AA (4.5:1) e incluso AA-large (3:1), y afectaba a todos los campos del producto. WCAG exime al texto de controles *inhabilitados*, no al de sugerencia que el usuario tiene que leer. `disabled:text-disabled` se mantiene: ahí el token conserva el uso que le da el PRD. | Hecho |
| **D45** | 2026-08-07 | **"Volver a mis respuestas" rehidrata el wizard desde el perfil guardado.** | El borrador se borra al terminar la entrevista, así que quien volvía desde el paywall encontraba un formulario **en blanco** — y §3.4.7 es explícito en que volver no obliga a repetir la entrevista. De paso emitía un segundo `onboarding_started` que inflaba la "tasa de inicio" de §0.6 con gente que ya había terminado. | Hecho |

## Rediseño de la landing (2026-08-07) — correcciones sobre el brief

El dueño del producto entregó una estructura de 10 secciones con copy detallado.
Se implementa tal cual **salvo seis puntos**, que se corrigen porque el brief original
chocaba con obligaciones legales o con reglas explícitas del PRD. Ninguno es una
preferencia de estilo; revertirlos tiene consecuencias.

| # | Lo que pedía el brief | Qué se hizo | Por qué |
|---|---|---|---|
| C1 | "Traducciones Certificadas & **Notaría Remota (RON)**" | El servicio se nombra por su entregable: "Traducciones certificadas". La palabra desaparece del producto. | **Anexo B del PRD**: en EE. UU. un *notary public* no es abogado y usar el término en español está expresamente restringido por las leyes estatales de consultoría migratoria. Es riesgo legal directo. |
| C2 | "Fondo de inversión segura al **4 % APY**" repetido en 3 sitios | Se habla de opciones de ahorro e inversión "con las tasas vigentes a la vista", sin cifra. | **Anexo B y §5-M3**: "ninguna tasa de rendimiento debe quedar fija en código o en copy; debe consumirse de una fuente con fecha de actualización visible". Una cifra fija en el copy es una promesa financiera que caduca sola. |
| C3 | Banner: "congela tu tarifa **antes de las próximas actualizaciones**" | Se mantiene la promesa de tarifa congelada (está en §3.4.4) pero **sin plazo ni urgencia**. | **§3.4.1**: "No hay contadores regresivos, ni 'solo quedan X cupos', ni descuentos que expiran. Esas tácticas funcionan en otros mercados y **aquí destruyen la marca**." |
| C4 | "**Ahorro directo del 40 % anual**" | "Ahorras $28 al año" — la cifra real. | 14 × 12 = 168; 168 − 140 = 28, que es un **17 %**, no un 40 %. Publicar el 40 % sería una afirmación de precio falsa, justo el tipo de cosa que esta audiencia ya ha sufrido. |
| C5 | Cinta: "**RESPALDADO Y CONECTADO CON**: DMV Utah Guide, IRS PTIN Certified Network, USCIS Tracking Helper" | Los portales se nombran como **destinos a los que guiamos**, no como respaldos. Las alianzas reales (USA Latino Prime, Starbiz Academy) sí van como tales. | **§6**: es obligatorio declarar que "ANDEX no está afiliado a ninguna agencia gubernamental". Presentar a USCIS o al IRS como quien te respalda afirma exactamente lo contrario en la misma página que lo niega. |
| C6 | "Avatares superpuestos de usuarios + 1.500 familias registradas" | Sin avatares. La cifra es un parámetro (`PILOT_FAMILIES`), no texto fijo. | **D19**: inventar prueba social es fabricarla. Las caras de stock son el patrón nº 1 de las webs que estafan a esta comunidad; su detector está calibrado para eso. |

Decisiones de diseño del rediseño:

| # | Decisión | Porqué |
|---|---|---|
| D46 | **Movimiento con Motion + GSAP/ScrollTrigger + Lenis**, cargado de forma diferida y desactivado por completo bajo `prefers-reduced-motion`. | El dueño lo pidió expresamente. El scroll suave no se aplica en táctil: el gesto nativo del móvil es mejor y no gasta batería en el Android de gama baja al que apunta el producto. |
| D47 | **El mockup del producto es CSS y SVG, no imagen ni vídeo.** | Pesa ~2 KB en vez de 40 KB–3 MB, es nítido a cualquier densidad, hereda los tokens (el modo oscuro sale gratis) y muestra la interfaz real, no una ilustración de cómo nos gustaría que fuera. Además no envejece con cada cambio de UI. |
| D48 | El titular del hero se revela **línea a línea tras una máscara**, y el título completo va aparte en `sr-only`. | El efecto es editorial y aquí además significa algo — las líneas llegan como llega el camino. Trocear el texto visible obligaría al lector de pantalla a oírlo en fragmentos, de ahí la versión completa oculta. |

### Rediseño móvil (2026-08-07)

Diagnóstico medido antes de tocar nada: en un teléfono de 390 px los 7 módulos eran
7 tarjetas apiladas a ancho completo de ~350 px cada una — **unos 2.450 px de scroll para
una sola sección**, sin un solo efecto ligado al scroll y con las secciones chocando entre
sí con bordes rectos.

| # | Decisión | Porqué |
|---|---|---|
| D49 | **Costuras curvas entre secciones** (`components/motion/section-seam.tsx`): el borde de cada sección lo pinta el color de la siguiente, y la curva se aplana con el scroll. | Apilar bandas con bordes rectos hace que la página se lea como una pila de cajas. En móvil, donde solo se ve una franja cada vez, ese corte seco es justo lo que la vuelve aburrida: se percibe "otra sección más" en vez de un recorrido. La curva es asimétrica a propósito —el punto bajo cae donde vive el texto— porque una simétrica se lee como adorno. |
| D50 | **Barra de acción fija en móvil** que aparece al salir el hero, **se esconde al bajar y vuelve al subir**, y desaparece en el cierre. | En un teléfono el CTA del hero se va a los dos dedos de scroll y el siguiente queda muy abajo: durante la mayor parte del recorrido no hay forma de empezar sin volver arriba. Se esconde al bajar porque bajar es leer y subir es buscar; solo aparece cuando el gesto sugiere que la persona busca algo. Se retira en el cierre para no competir con el CTA a pantalla completa que ya hay ahí. Lleva `env(safe-area-inset-bottom)` para no quedar bajo la barra de gestos del iPhone. |
| D51 | Los efectos ligados al scroll usan `useScroll` con `target` de Motion, **no Lenis**. | Lenis está desactivado en táctil a propósito (el gesto nativo del móvil es mejor y no gasta batería). `useScroll` con `target` funciona con el scroll nativo, así que el movimiento llega al móvil sin reactivar el scroll suave. |

## Bóveda Digital — escáner de documentos (2026-08-08)

El dueño del producto encarga un escáner tipo CamScanner dentro del módulo 1.
El PRD deja la bóveda fuera de la v1 (§0.3, línea 46); es su decisión revertirlo.
Siete decisiones de producto, no de implementación:

| # | Decisión | Porqué |
|---|---|---|
| **D52** | **Todo el procesado ocurre en el dispositivo. La foto no sale del teléfono en ningún momento.** | §R5 marca los datos migratorios como riesgo alto. Aquí se manejan pasaportes, permisos de trabajo y notificaciones de corte: el expediente completo de una persona. Un servidor que procese esas imágenes es un servidor que puede ser requerido, filtrado o robado. Procesar en el dispositivo elimina esa categoría entera de riesgo — y habilita la única frase que esta audiencia necesita oír: *ni nosotros podemos verlos*. Es el mayor diferenciador frente a CamScanner, que sube todo a su nube. |
| **D53** | **El PDF sale en tamaño CARTA, no A4**, pese a que el encargo pedía A4. | Los destinatarios son USCIS, cortes de inmigración, el IRS y el DMV: instituciones estadounidenses, donde el papel es Carta (8,5×11"). Un expediente en A4 llega con los márgenes descuadrados y puede recortarse al imprimirse. A4 queda disponible para trámites consulares. |
| **D54** | **El modo por defecto es COLOR, no blanco y negro.** | Es lo contrario de lo que hacen los escáneres de oficina, y aquí la diferencia es legal: los sellos, las firmas en tinta azul y los hologramas son parte de la prueba. Un umbral de blanco y negro los borra y puede invalidar el documento ante quien lo recibe. La interfaz lo advierte en vez de dejarlo a la suerte. |
| **D55** | **Sin OpenCV.js.** La detección de bordes es Sobel + Hough sobre una miniatura de 320 px (~150 líneas). | OpenCV.js pesa entre 8 y 11 MB. El público objetivo usa Android de gama baja con datos contados; descargar eso para recortar una foto es indefendible en un producto que se obliga a <300 KB en su portada. |
| **D56** | **Generador de PDF propio (~200 líneas)** en vez de `pdf-lib` o `jsPDF`. | Esas librerías pesan 250–400 KB. Para incrustar JPEG ya comprimido en páginas de tamaño fijo, el PDF es texto plano con los bytes dentro de un stream `DCTDecode`. Además el JPEG se incrusta **sin recodificar**: el archivo pesa lo mismo que las fotos y no pierde calidad. |
| **D57** | **Cifrado AES-GCM en IndexedDB con clave no extraíble**, y la interfaz declara con exactitud qué protege y qué no. | Protege los archivos en disco ante un análisis forense del dispositivo — el escenario que de verdad teme esta audiencia. **No** protege frente a alguien que abra la app en el teléfono desbloqueado, y decirlo así es parte del argumento: prometer de más en seguridad es peor que no prometer nada. Para sincronizar en la nube (V2) haría falta derivar la clave de una frase del usuario. |
| **D58** | Se añade el aviso de **7 días** a los 90/60/30 que pide §5-M1. | Los tres del PRD avisan con tiempo de sobra para empezar un trámite, pero ninguno atrapa a quien lo dejó pasar. El de 7 días es el último recordatorio antes de quedarse sin permiso de trabajo. |
| **D59** — ⚠️ **APUESTA** | **El escáner se regala entero en la landing**: PDF completo, sin marca de agua, sin registro y sin correo. Lo que se cobra es la bóveda y los avisos. | Es lo contrario del brief original, que pedía exigir el registro para descargar. Razón: "servicio gratis… ahora paga para bajarlo" **es el patrón exacto del que ya estafaron a esta audiencia**, y §3.4.1 obliga a que cada elemento de la página REDUZCA la sospecha. Reteniendo el archivo se gana un correo y se pierde la credibilidad, que es el único activo del producto. Regalándolo, el argumento de venta pasa a ser cierto y decible: *ese PDF suelto se pierde en Descargas y nadie te avisará cuando el documento venza*. **Sin base de evidencia**: no hay investigación previa en el notebook sobre conversión freemium en este segmento; queda como hipótesis a medir con `landing_cta_clicked{cta_position:"scanner"}` frente al resto de posiciones. |
| **D60** | El chunk del escáner **no entra en la carga inicial** de la landing: `next/dynamic` con `ssr:false`, y el componente sólo se monta al pulsar. | El motor completo (worker, canvas, detección de bordes, generador de PDF) reventaría el tope de 300 KB de §3.1.1 en la primera visita, penalizando a todo el que nunca lo va a usar. Verificado contra `app-build-manifest.json`: la landing se queda en **178 kB** y el chunk `3403` sólo se pide tras el clic. |

**Fallo encontrado por los tests, no por revisión:** el umbral de aviso se buscaba con
`find` sobre un array descendente `[90,60,30,7]`, así que a 60 días de vencer devolvía
90. El usuario habría leído "te avisamos con 90 días" cuando le quedaban 8. Corregido
buscando el umbral vigente, que es el **menor** que aún cubre los días restantes.

**Propuesta abierta (APUESTA):** el encargo limita el escáner a quien paga. Sugiero
permitir **un documento gratis durante el embudo, sin registro**. La métrica que decide
el modelo es la conversión (§0.6, meta 8%), y un escáner que funciona al instante, en el
dispositivo y sin pedir nada es la demostración de valor más barata y convincente que
tiene este producto. El paywall seguiría gobernando guardar, organizar y las alertas.

## Verificación ejecutada (2026-08-07)

Hasta este punto nada se había ejecutado: todo eran lecturas de código. Resultados reales:

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | Limpio |
| `npx vitest run` | 67/67 verdes |
| `npx next build` | **Compila.** 23 rutas generadas |
| Peso de la landing | **112 kB** de JS de primera carga (presupuesto §3.1.1: <300 KB con fuentes y CSS incluidos) |
| Arranque del servidor | `next start` levanta en 483 ms y sirve HTTP 200 |
| Landing servida | 44,6 KB de HTML **con contenido real**: titular, las dos tarjetas de bifurcación y el disclaimer de no afiliación |
| Reordenamiento sin JavaScript | **Confirmado**: `/?ctx=in_us` y `/?ctx=pre_arrival` devuelven HTML distinto, con los títulos de módulo de cada variante |
| Control de acceso | Las 6 rutas protegidas responden 307 → `/login?next=…`; las públicas, 200 |
| Sesión demo | La cookie se emite y las 6 rutas protegidas pasan a 200 |
| Endpoints | 400 ante cuerpo inválido, 503 con Stripe sin configurar, 303 en el cambio de idioma sin JS |

### Simulación en navegador real — 66/66 (`npm run simular`)

El embudo completo recorrido con Playwright sobre el build de producción, en modo demo:
landing → registro → entrevista (5 pasos) → paywall → checkout → panel → módulo → perfil,
más un segundo perfil `pre_arrival` para contrastar. Capturas en `tests/capturas/`.

Confirmado de punta a punta, con el producto en marcha:

- **El hero reordena la página al elegir rama** y persiste la elección en `sessionStorage`.
- **El motor funciona end-to-end**: con objetivo "crear una empresa", la hero card del panel
  es *Desarrollo Empresarial* y su explicación es *"Porque dijiste que quieres formalizar tu
  negocio en los próximos 30 días"*. El paywall refleja ese mismo módulo #1.
- **El grid cambia demostrablemente entre perfiles** (casilla 4 de la Definición de
  Terminado) y los 7 módulos aparecen con los títulos de su variante de contexto.
- **El consentimiento bloquea el cobro** (§3.4.6): sin marcar la casilla el pago no avanza,
  la pantalla explica qué falta y el foco va a la casilla.
- Cancelar es un clic desde Perfil, sin llamadas ni retención.
- Modo oscuro, cambio de idioma y 320px sin desbordes. Cero errores de JavaScript.

Tres "fallos" de la primera pasada resultaron ser **aserciones mal planteadas del propio
guion**, no defectos: buscar el nombre precargado como texto cuando es el *valor* de un
campo; exigir que el botón de pago esté deshabilitado cuando el patrón accesible correcto
es dejarlo pulsable y explicar qué falta; y buscar los títulos `in_us` de los módulos en el
panel `pre_arrival`, donde por diseño cambian.

**Sigue sin verificar** (requiere servicios aprovisionados o dispositivo real): las políticas
RLS contra una base viva, el cobro real de Stripe y el LCP medido en 4G.

## ⚠️ Promesa sin respaldo: "te avisamos 90, 60, 30 y 7 días antes"

**Bloqueante antes de publicar.** Esa frase aparece hoy en dos sitios —el módulo Bóveda
(`boveda.ts` → `alertPromise`) y la tarjeta de venta del escáner de la landing— y **el
producto no la cumple** como la lee cualquiera. No hay service worker, no hay push, y
`EmailJob` en `lib/notifications/email.ts` ni siquiera contempla un tipo de vencimiento.
Lo único que ocurre hoy es que, **si la persona abre la app**, ve la cuenta atrás. Eso no
es avisar: avisar es llegar tú a ella.

Y no se arregla con un cron, porque choca de frente con la otra promesa: el documento se
guarda cifrado en el teléfono y **el servidor nunca lo ve**, así que no puede saber cuándo
vence. Las dos frases de la landing —*"la foto no sale de tu teléfono"* y *"te avisamos"*—
no pueden ser ciertas a la vez con la arquitectura actual. Sólo hay tres salidas honestas:

1. **Notificación local en la PWA** — service worker + Notification API, programada en el
   dispositivo. Respeta el cifrado entero. Coste: exige instalar la PWA (en iOS, añadirla
   a la pantalla de inicio) y el aviso no llega si el sistema mató el service worker.
2. **Separar la fecha del documento** — subir al servidor *sólo* `{documento_id, vence_el}`,
   nunca el archivo, y disparar el correo desde un cron. Funciona siempre, pero deja de ser
   cierto que "nada sale del teléfono": hay que decir exactamente qué sí sale.
3. **Bajar la promesa** a lo que hoy es verdad ("verás la cuenta atrás desde 90 días antes")
   hasta que 1 o 2 estén construidas.

Contradice directamente la razón de D57 —*prometer de más en seguridad es peor que no
prometer nada*— y va dirigida a un público al que ya le vendieron humo. No publicar la
landing con esta frase mientras siga sin respaldo.

## Pendientes de integración (fuera de lo programable hoy)

- Aprovisionar proyecto Supabase + aplicar `supabase/migrations/` + activar Auth email/magic link.
- Crear productos/precios en Stripe ($14 mensual, $140 anual) + webhook endpoint + dominio para Apple Pay.
- Correos transaccionales (recordatorio 48h §3.4.6, recuperación 24h §3.4.7, recibo, aviso "¿ya llegaste?" §3.2.3): stubs en `lib/notifications/`, falta proveedor (Resend/SES) y scheduler (Vercel Cron / Supabase cron).
- Test A/B hero interrogativo vs afirmativo (§3.1.1, R3).
- Validación legal del copy "tarifa congelada" (§3.4.4, R2) — **bloqueante para publicar**.
- Contenido EN completo es traducción funcional; revisar antes de lanzar el toggle (Decisión abierta #4 del PRD).
