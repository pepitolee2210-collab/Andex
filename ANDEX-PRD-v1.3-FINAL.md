# ARCHITECTURE & PRODUCT SPECIFICATION DOCUMENT (PRD)
## PROJECT: ANDEX SUPER APP & ECOSYSTEM

**Target System:** Cross-Platform Web & Mobile App
**Architecture:** Microservices API-First / Hybrid Link-Out Operations (Phase 1)
**Target Audience:** Inmigrantes Hispanos en EE. UU. y Latinoamérica
**Market Pilot:** Estado de Utah, Estados Unidos
**Brand Identity Code:** ANDEX-UI-2026-V1
**Versión del documento:** 1.3 FINAL — MVP completo con monetización
**Prototipo visual:** `andex-prototipo-visual.html`
**Última actualización:** Agosto 2026

---

## 0. ALCANCE DE ESTA VERSIÓN (MVP v1)

> **Esta sección define qué se construye AHORA.** El resto del documento (secciones 4 a 8) queda como especificación de referencia para las siguientes iteraciones. Nada de lo que está documentado más abajo se elimina — simplemente no entra en el sprint de lanzamiento.

### 0.1 Objetivo del MVP

Validar el **embudo de entrada y la experiencia adaptativa** antes de invertir en la profundidad de los módulos. El MVP debe responder una sola pregunta de negocio:

> *¿Un inmigrante hispano completa la micro-entrevista, entiende su plan personalizado y regresa a la app en los 7 días siguientes?*

Si eso funciona, los módulos tienen sentido. Si no funciona, ningún módulo lo va a arreglar.

### 0.2 Dentro del alcance (SE CONSTRUYE)

| # | Entregable | Descripción |
|---|---|---|
| **A** | **Landing Page de conversión** | Página pública, bilingüe (ES/EN). El hero **es la bifurcación** (ver 3.1.1): el usuario elige dónde está y la página se reordena. |
| **B** | **Login & Registro** | Autenticación por email + contraseña y magic link. Recuperación de contraseña. Sesión persistente. |
| **C** | **Micro-Entrevista Inteligente (5 pasos)** | Wizard bifurcado con indicador de ruta, guardado parcial y posibilidad de retomar. |
| **D** | **Motor de Recomendación (Rule-Based)** | Genera el vector `user_profile_tags` y calcula el ranking de módulos. Local, sin IA externa. |
| **E** | **Paywall personalizado** | Pantalla de membresía que **refleja las respuestas del usuario** antes de pedir el pago. Mensual $14 vs Anual $140 con tarifa congelada. |
| **F** | **Checkout Stripe** | Apple Pay, Google Pay y tarjeta. Webhooks, gestión de estado de suscripción y cancelación en un clic. |
| **G** | **Dashboard Adaptativo** | Shell de aplicación que **reordena y jerarquiza** los 7 módulos según el perfil. Todos los módulos visibles y accesibles para todos los usuarios. |
| **H** | **Sistema de Diseño ANDEX** | Tokens de color, tipografía, escala de espaciado, componentes base, elemento firma, estados y modo oscuro. |
| **I** | **Shell UI Mobile + Desktop** | Navegación, drawer lateral, grid de módulos (mobile) y layout de 3 columnas (desktop). |
| **J** | **Pantallas placeholder de módulo** | Cada uno de los 7 módulos abre a una pantalla real con su propósito, estado "En construcción" y captura de interés. |

### 0.3 Fuera del alcance (NO se construye en v1)

- Lógica interna de los Módulos M1 a M7 (solo la carcasa y el placeholder).
- Componente `<ExternalGuideModal />` y la tabla de trámites guiados.
- Bóveda de documentos, subida de archivos, OCR.
- Motor de alertas y notificaciones push.
- Feed comunitario, directorio local y bolsa de trabajo.
- Servicios directos *Done-for-You* (ver nota en 0.5).
- Integración con API de IA para bienvenida redactada.
- Facturación en moneda local (solo USD en v1).

### 0.4 Decisión de producto: acceso abierto a módulos

**Principio rector del MVP:**

> La personalización **ordena y enfatiza**. Nunca oculta ni bloquea.

Una vez pagada la membresía, todos los usuarios ven y pueden entrar a los 7 módulos, sin importar su perfil. Lo que cambia según el perfil es:

- Cuál módulo aparece como **tarjeta principal (hero card)**.
- El **orden** del grid de módulos.
- El **contenido** de cada módulo (variante `in_us` vs `pre_arrival`).
- El **contenido del sidebar contextual** (desktop) o del carrusel inferior (mobile).
- El **copy de bienvenida** y el objetivo sugerido de 30 días.

Razones para esta decisión:

1. **Evita el efecto jaula.** Un usuario que se autoclasifica mal en el onboarding no queda atrapado en un producto que no le sirve.
2. **Genera dato real.** Lo que el usuario *abre* es mucho mejor señal que lo que *dice* que le interesa. Esa divergencia es la métrica más valiosa del MVP.
3. **Permite corregir el motor.** Si el 60% de quienes eligen "Empleo" terminan entrando a "Trámites", el motor de reglas está mal y lo sabremos en dos semanas.
4. **Justifica el precio.** Si el usuario paga y luego descubre módulos bloqueados, el churn del mes 2 es inevitable.

### 0.5 Nota sobre pagos y servicios directos

El paywall **sí entra en el MVP** y se ubica entre la micro-entrevista y el dashboard. La justificación de producto y los requisitos de cumplimiento están en 3.4.

Los servicios directos (*Done-for-You*) descritos en la sección 5 quedan **fuera del alcance de v1** hasta completar las habilitaciones regulatorias correspondientes (registro de consultor migratorio, PTIN/EFIN, CAA, comisión notarial, etc.). El documento los conserva como especificación de destino, no como funcionalidad de lanzamiento. Ver Anexo B.

### 0.6 Métricas de éxito del MVP

| Métrica | Definición | Meta v1 |
|---|---|---|
| **Tasa de inicio** | Visitantes de landing que empiezan la entrevista | ≥ 25% |
| **Selección de rama en landing** | Visitantes que eligen `in_us` o `pre_arrival` en el hero | ≥ 40% |
| **Tasa de completitud** | Quienes inician y terminan los 5 pasos | ≥ 60% |
| **Abandono por paso** | Dónde se cae la gente | Ningún paso > 20% |
| **Llegada a paywall** | Quienes completan la entrevista y ven la pantalla de planes | ≥ 90% |
| **Conversión a pago** | Quienes ven el paywall y completan el checkout | ≥ 8% |
| **Mezcla de planes** | % que elige anual sobre mensual | ≥ 45% |
| **Abandono en checkout** | Quienes eligen plan pero no pagan | ≤ 40% |
| **Activación D0** | Usuarios pagos que abren ≥ 1 módulo el primer día | ≥ 70% |
| **Retorno D7** | Usuarios que vuelven en 7 días | ≥ 20% |
| **Churn M2** | Cancelaciones antes del segundo cobro | ≤ 25% |
| **Precisión del motor** | % que abre primero el módulo recomendado | ≥ 45% |
| **Divergencia de interés** | Módulo declarado ≠ módulo más abierto | Se mide, no se fija meta |

> **La métrica que decide el modelo de negocio** es *conversión a pago × churn M2*. Si la conversión supera el 8% pero el churn del mes 2 supera el 40%, el problema no es el paywall: es que el producto de Fase 1 no entrega suficiente valor todavía. En ese caso la decisión correcta es mover el paywall después de la primera semana de uso, no bajar el precio.

---

## 1. RESUMEN EJECUTIVO Y VISIÓN DEL PRODUCTO

### 1.1 Propósito

ANDEX es una Super App "All-in-One" diseñada como el sistema operativo integral para el desarrollo legal, financiero, laboral y empresarial de la comunidad hispana en Estados Unidos. Resuelve la fragmentación de servicios (trámites, empleos, educación, financiamiento) mediante una plataforma centralizada que combina autogestión tecnológica, gestoría directa (*Done-for-You*), formación técnica y un ecosistema comunitario.

### 1.2 Estrategia de Transición Tecnológica (Fase 1: Enlaces Externos Guiados)

Para garantizar un lanzamiento ágil sin comprometer la seguridad ni la complejidad de integraciones gubernamentales avanzadas en la etapa inicial:

- **Fase 1 (Actual):** Los módulos que involucren consultas oficiales (ej. estatus de caso USCIS, cortes EOIR, agendamiento en DMV, pagos al IRS) operarán bajo la modalidad de **"Guiado por Enlaces Externos Verificados"**.
  - **UX de Transición:** La app presentará un flujo paso a paso con capturas, instructivos y un botón modal interactivo con el enlace oficial hacia el portal del gobierno correspondiente.
  - **Tracking de Usuario:** Se registrarán los eventos en base de datos (`external_redirect_logs`) para analizar qué trámites tienen mayor demanda.
- **Fase 2 (Evolución Interna):** Sustitución progresiva de enlaces externos por APIs propietarias, web scrapers autorizados e integraciones directas (ej. Bóveda propia con OCR, sistema propio de tracking de casos).

---

## 2. BRANDING VISUAL Y GUÍA DE DISEÑO UI/UX

Basado en la identidad de marca aprobada (**ANDEX — Tu progreso cruza fronteras**), el diseño UI/UX debe reflejar solidez financiera, dinamismo tecnológico y calidez comunitaria.

### 2.1 Paleta de Colores Oficial (Tokens CSS / Tailwind Variables)

La paleta base se conserva. Se añaden **tokens derivados** para resolver los contrastes que no cumplen WCAG 2.2 AA. La regla es simple: **el teal y el ámbar son colores de superficie, no de texto.**

```scss
/* ═══════════════════════════════════════════════════════
   ANDEX DESIGN SYSTEM — COLOR TOKENS
   ═══════════════════════════════════════════════════════ */

/* ── Marca / Estructura ───────────────────────────────── */
$color-primary-dark:     #102A43; /* Deep Navy — navbar, tipografía principal. 14.6:1 sobre blanco ✓ */
$color-primary-hover:    #1B3B5A; /* Navy hover / pressed */
$color-primary-soft:     #EEF2F6; /* Navy 50 — fondos de sección */

/* ── Acento primario (Teal) ───────────────────────────── */
$color-secondary-teal:   #12B8A6; /* Vibrant Teal — SOLO superficie, barras de progreso, iconos */
$color-teal-deep:        #0F766E; /* Teal 700 — botones con texto BLANCO. 5.47:1 ✓ */
$color-teal-soft:        #E6F7F5; /* Teal 50 — fondos de tarjeta, badges suaves */

/* ── Acento secundario (Ámbar) ────────────────────────── */
$color-accent-amber:     #F4B942; /* Soft Gold — SOLO fondo de badge. Texto encima: navy */
$color-amber-deep:       #9A6B00; /* Ámbar 800 — texto de alerta sobre crema/blanco. 4.69:1 ✓ */
$color-amber-soft:       #FEF6E3; /* Ámbar 50 — fondo de callout */

/* ── Neutros ──────────────────────────────────────────── */
$color-background-cream: #F7F5EF; /* Warm Cream — fondo de pantalla */
$color-surface-white:    #FFFFFF; /* Contenedores de tarjeta, modales */
$color-text-muted:       #52708C; /* Slate — subtítulos. 5.18:1 ✓ */
$color-text-disabled:    #8A9BAD; /* Solo texto no interactivo */
$color-border-light:     #E4E7EB; /* Bordes y separadores */

/* ── Semánticos ───────────────────────────────────────── */
$color-success:          #0E7C5A;
$color-warning:          #9A6B00;
$color-danger:           #B42318;
$color-info:             #0F766E;
```

#### 2.1.1 Matriz de contraste — obligatoria

Antes de aprobar cualquier pantalla, verificar contra esta tabla. Los valores marcados ❌ son los que estaban en la versión original de la paleta y **no deben usarse**.

| Combinación | Ratio | AA (4.5:1) | Uso |
|---|---|---|---|
| `#102A43` sobre blanco | 14.6:1 | ✅ | Texto principal |
| `#102A43` sobre `#F7F5EF` | 13.7:1 | ✅ | Texto sobre crema |
| `#52708C` sobre blanco | 5.18:1 | ✅ | Texto secundario |
| `#627D98` sobre blanco | 4.28:1 | ❌ | **No usar para texto** |
| Blanco sobre `#0F766E` | 5.47:1 | ✅ | **Botón primario** |
| Blanco sobre `#12B8A6` | 2.49:1 | ❌ | **Nunca** |
| `#102A43` sobre `#12B8A6` | 5.88:1 | ✅ | Alternativa de botón teal |
| `#F4B942` sobre blanco | 1.77:1 | ❌ | **Nunca para texto** |
| `#102A43` sobre `#F4B942` | 8.2:1 | ✅ | Badge ámbar con texto navy |
| `#9A6B00` sobre blanco | 4.69:1 | ✅ | Texto de alerta |

**Regla de oro:** si un elemento lleva texto encima, el fondo es navy, blanco, crema, teal-deep, o uno de los tonos `-soft`. Nunca `#12B8A6` ni `#F4B942` puros.

### 2.2 Tipografía Sistema

- **Fuente Primaria (Headings & Brand):** Montserrat / Inter (Bold / SemiBold) — Limpia, moderna y de alta legibilidad en pantallas retina.
- **Fuente Secundaria (Body & Forms):** Inter / System-UI (Regular / Medium) — MÁXIMA legibilidad en bloques de texto e instructivos.

#### 2.2.1 Escala tipográfica

Base 16px. Nunca por debajo de 16px en body — la audiencia usa dispositivos de gama baja, con frecuencia bajo luz solar directa.

| Token | Tamaño | Line-height | Peso | Uso |
|---|---|---|---|---|
| `display` | 40 / 48px | 1.1 | 700 | Hero de landing |
| `h1` | 32px | 1.2 | 700 | Título de pantalla |
| `h2` | 24px | 1.3 | 600 | Sección |
| `h3` | 20px | 1.4 | 600 | Tarjeta |
| `body-lg` | 18px | 1.6 | 400 | Instructivos, párrafos largos |
| `body` | 16px | 1.6 | 400 | Texto base |
| `label` | 14px | 1.4 | 500 | Etiquetas de formulario |
| `caption` | 13px | 1.4 | 400 | Metadatos, timestamps |

**Requisito de accesibilidad:** todos los tamaños en `rem`. La app debe responder al ajuste de tamaño de texto del sistema operativo hasta 200% sin romper el layout.

### 2.3 Escala de Espaciado y Radios

```scss
/* Espaciado — base 4px */
$space-1: 4px;   $space-2: 8px;   $space-3: 12px;  $space-4: 16px;
$space-5: 24px;  $space-6: 32px;  $space-7: 48px;  $space-8: 64px;

/* Radios */
$radius-sm: 8px;    /* Inputs, chips */
$radius-md: 12px;   /* Botones */
$radius-lg: 16px;   /* Tarjetas de módulo */
$radius-xl: 24px;   /* Modales, hero card */
$radius-full: 999px;/* Avatares, badges */

/* Sombras */
$shadow-sm: 0 1px 3px rgba(16,42,67,0.06);
$shadow-md: 0 4px 12px rgba(16,42,67,0.06);
$shadow-lg: 0 12px 32px rgba(16,42,67,0.10);
```

### 2.4 Directrices de Layout & Adaptabilidad (Mobile-First / Responsive)

#### Vista Mobile (iOS / Android)

- Inspirado en la interfaz de navegación por bloques (App Grid Shell).
- Menú superior limpio con isotipo ANDEX y drawer lateral.
- Tarjetas cuadradas con bordes redondeados (`border-radius: 16px`), iconografía plana sobre fondos pastel y sombra suave (`box-shadow: 0 4px 12px rgba(16,42,67,0.06)`).
- **Targets táctiles mínimos de 44×44px.** No negociable.
- Grid de 2 columnas por defecto; 1 columna para la hero card.

```
┌─────────────────────────────┐
│ ☰   ANDEX            🔔  👤 │  ← Topbar 56px
├─────────────────────────────┤
│                             │
│  Hola, María 👋             │
│  Tu prioridad de este mes   │
│                             │
│ ┌─────────────────────────┐ │
│ │  ⭐ MÓDULO RECOMENDADO   │ │  ← Hero card, full width
│ │  Business Builder       │ │     radius-xl
│ │  Crea tu LLC en Utah    │ │
│ │  [ Empezar ]            │ │
│ └─────────────────────────┘ │
│                             │
│  Todos los módulos          │
│ ┌──────────┐ ┌──────────┐  │
│ │ 🗂️  M1    │ │ ✈️  M2    │  │  ← Grid 2 col
│ │ Bóveda   │ │ Pre-Land │  │     radius-lg
│ └──────────┘ └──────────┘  │
│ ┌──────────┐ ┌──────────┐  │
│ │ 💰 M3    │ │ 👥 M5    │  │
│ └──────────┘ └──────────┘  │
│                             │
├─────────────────────────────┤
│  🏠     📚     👥     👤    │  ← Tab bar
└─────────────────────────────┘
```

#### Vista Desktop / Web Dashboard

Estructura inspirada en la maquetación de Starbiz Academy:

- **Sidebar Izquierdo Colapsable:** Navegación por módulos, acceso a comunidad y perfil.
- **Feed Principal Central:** Tarjetas de contenido, banners promocionales y recomendaciones inteligentes.
- **Sidebar Derecho Contextual:** Próximos eventos, alertas activas y estado de la membresía.
- **Banner superior con cuenta regresiva** (Countdown Banner) para eventos comunitarios y promociones de membresía anual.

```
┌────────────┬──────────────────────────────┬─────────────┐
│            │  Countdown banner            │             │
│  ANDEX     ├──────────────────────────────┤  Próximos   │
│            │                              │  eventos    │
│  🏠 Inicio │  Hola, María                 │             │
│  🗂️ Bóveda │  ┌────────────────────────┐  │  ─────────  │
│  ✈️ Pre-L. │  │ ⭐ RECOMENDADO PARA TI │  │  Alertas    │
│  💰 Finanz │  │ Business Builder       │  │  activas    │
│  🏢 Negoc. │  └────────────────────────┘  │             │
│  👥 Comun. │                              │  ─────────  │
│  🎓 Academ.│  Explora todos los módulos   │  Tu perfil  │
│  💼 Empleo │  ┌────┐ ┌────┐ ┌────┐       │             │
│            │  │ M1 │ │ M2 │ │ M3 │       │             │
│  ─────────│  └────┘ └────┘ └────┘       │             │
│  👤 Perfil │                              │             │
└────────────┴──────────────────────────────┴─────────────┘
   240px              flexible                   320px
```

**Breakpoints:**

| Nombre | Ancho | Layout |
|---|---|---|
| `sm` | < 640px | 1 columna, tab bar, drawer |
| `md` | 640–1023px | 2 columnas, sidebar colapsado |
| `lg` | 1024–1439px | Sidebar izq + feed |
| `xl` | ≥ 1440px | 3 columnas completas |

### 2.5 Inventario de Componentes (MVP)

| Componente | Variantes | Estados obligatorios |
|---|---|---|
| `Button` | primary, secondary, ghost, danger | default, hover, active, focus-visible, disabled, loading |
| `Input` | text, email, tel, password, select | default, focus, error, disabled, con ayuda |
| `ModuleCard` | hero, grid, list | default, hover, recomendado, próximamente |
| `ProgressBar` | steps, lineal | — |
| `Badge` | teal, amber, navy, neutral | — |
| `Modal` | default, fullscreen-mobile | — |
| `Toast` | success, error, info | — |
| `EmptyState` | — | — |
| `Skeleton` | card, text, avatar | — |
| `LanguageToggle` | ES / EN | — |

**Piso de calidad para todos:** foco de teclado visible, `prefers-reduced-motion` respetado, etiquetas ARIA, y contraste verificado contra la matriz de 2.1.1.

### 2.6 Modo Oscuro

Requerido en v1. Mapeo de tokens:

```scss
[data-theme="dark"] {
  --bg:            #0B1929;
  --surface:       #16283D;
  --surface-alt:   #1E3550;
  --text:          #E8EDF2;
  --text-muted:    #9DB2C8;
  --border:        #2A4159;
  --teal:          #2DD4BF;  /* Teal aclarado para fondo oscuro */
  --amber:         #F9CE6B;
}
```

### 2.7 Idioma y Copy

- Español como idioma por defecto. Inglés disponible desde el toggle del header.
- **Español neutro latinoamericano.** Evitar regionalismos de un solo país.
- Voz: directa, cálida, sin jerga institucional. "Guarda tu pasaporte", no "Almacene su documentación migratoria".
- **Nunca usar la palabra "notario"** en el copy en español (ver nota regulatoria en el anexo de servicios).
- Los errores explican qué pasó y cómo resolverlo. Nunca se disculpan ni son vagos.

### 2.8 Elemento firma: LA RUTA

El sistema tiene **un solo elemento memorable**. Todo lo demás es disciplinado y silencioso.

> **La Ruta** es una línea con nodos que se bifurca. Nace de la promesa de marca — *tu progreso cruza fronteras* — y de la estructura real del producto: dos caminos que convergen en ANDEX.

**No es decoración: codifica información.** En cada aparición dice algo verdadero sobre dónde está el usuario.

| Dónde aparece | Qué comunica | Forma |
|---|---|---|
| **Hero de la landing** | Dos poblaciones, un destino | SVG con dos curvas que convergen en un nodo ANDEX. Se dibuja al cargar (`stroke-dashoffset`), 1.5s |
| **Wizard (pasos 1–5)** | Progreso en la entrevista **y** la bifurcación real | 6 nodos con conectores. El **nodo 2 tiene un glifo de bifurcación** porque ahí se parte el camino |
| **Paywall** | Meta alcanzada | El nodo 6 es un **sello ámbar** más grande, con halo |
| **Dashboard** | Dónde estás en tu camino | Chip compacto en el topbar: `🇺🇸 Utah` o `✈️ Colombia` |

**Especificación técnica del componente `<RouteBar />`:**

```
Props: { step: 1..6, context?: 'in_us' | 'pre_arrival' }

Nodo:        11px · radius-full · --line
Nodo done:   --teal-deep
Nodo now:    13px · --teal · halo 5px --teal-soft
Nodo seal:   18px · --amber · halo 5px --amber-soft
Conector:    1.5px · --line → --teal-deep cuando done
Glifo fork:  dos trazos de 11px a ±32° desde el nodo 2
Transición:  .35s en nodos, .4s en conectores
```

**Restricción de uso:** La Ruta aparece **una sola vez por pantalla**. No se usa como divisor, ni como viñeta, ni en tarjetas. Si aparece dos veces, deja de ser firma y se convierte en patrón decorativo.

### 2.9 El sello (único elemento decorativo permitido)

El **sello de tarifa congelada** del paywall es la única concesión decorativa del sistema. Círculo con borde de 2px rotado −9°, borde punteado en el contenedor, fondo ámbar suave.

Viene del mundo del usuario: el sello es el lenguaje visual de los documentos oficiales, las apostillas, las notarizaciones. Lo reconoce inmediatamente como *"esto es un compromiso formal"*, que es exactamente lo que la promesa de precio congelado significa.

**Se usa una sola vez en todo el producto.** Si aparece en badges, en confirmaciones o en el dashboard, pierde su significado.

### 2.10 Prototipo visual de referencia

El archivo **`andex-prototipo-visual.html`** es la fuente de verdad visual del MVP. Contiene las 12 pantallas implementadas con los tokens de este documento, el motor de recomendación funcionando y ambas ramas del contexto de ubicación.

**Cómo usarlo:**
- Toda decisión de espaciado, color o tipografía que no esté escrita aquí se resuelve mirando el prototipo.
- El navegador de pantallas de la barra superior permite inspeccionar cualquier vista sin recorrer el flujo.
- Los toggles de **Mobile / Desktop**, **Claro / Oscuro** y **Motor** permiten verificar los tres ejes de adaptación.
- El panel **Motor** muestra el desglose del cálculo de ranking. Es la herramienta para calibrar `BASE_RELEVANCE` y `WEIGHTS` antes de congelarlos en código de producción.

**Lo que el prototipo NO define:** no tiene backend, no persiste estado, no valida formularios y usa `<select>` nativos donde producción debe llevar combobox con búsqueda. Es referencia visual y de lógica, no de arquitectura.

---

## 3. EMBUDO PSICOLÓGICO Y FLUJO DE ONBOARDING INTELIGENTE

El flujo de acceso a la plataforma está diseñado bajo un modelo de **Conversión Emocional Progresiva**. El usuario no entra a la plataforma directamente; pasa por una experiencia guiada que justifica el valor de la membresía.

```
[ LANDING PAGE ]
  El hero ES la bifurcación. La página se reordena en vivo.
          │
          ▼
[ REGISTRO ]
          │
          ▼
[ MICRO-ENTREVISTA BIFURCADA — 5 pasos ]
          │ (Calcula location_context, tags y ranking)
          ▼
[ PAYWALL PERSONALIZADO ]
  Refleja las respuestas antes de pedir el pago.
  Mensual $14  vs  Anual $140 (destacado, tarifa congelada)
          │
          ▼
[ CHECKOUT STRIPE ]
  Apple Pay · Google Pay · Tarjeta
          │
          ▼
[ DASHBOARD ADAPTATIVO ]
```

> **El paywall entra en el MVP.** La versión 1.1 de este documento lo tenía marcado para v2; la decisión se revirtió porque el punto de cobro define el final del embudo y no se puede validar la conversión sin él. Ver 3.4.

### 3.1 Fase 1: Landing Page (Presentación & Propuesta de Valor)

- **Header:** Logo ANDEX, selector de idioma (ES/EN), botón "Iniciar Sesión" y CTA "Comenzar Ahora".
- **Hero Section:** Promesa de valor principal ("Tu progreso cruza fronteras. El ecosistema completo para triunfar en EE. UU.").
- **Sección de Solución:** Demostración de los 7 Módulos y servicios directos (*Done-for-You*).
- **Prueba Social / Comunidad:** Indicadores de familias beneficiadas en Utah y testimonios reales.
- **Preparación Psicológica del Pago:** Mensaje claro de que ANDEX es una red privada de alto valor que incluye acompañamiento continuo, introduciendo la expectativa del pago antes del registro.

#### 3.1.1 Decisión de diseño: el hero *es* la pregunta

**El hero de la landing no es un eslogan con botón. Es la primera pregunta del onboarding.**

En lugar de describir la propuesta de valor y pedir un clic ciego, la landing pregunta **"¿Dónde estás ahora?"** con las dos tarjetas de bifurcación. Al elegir, la página se reordena en vivo: los siete módulos cambian de orden y de título según el contexto.

```
┌──────────────────────────────────────────────────────┐
│  ANDEX · Tu progreso cruza fronteras      ES│EN  ⟶  │
├──────────────────────────────────────────────────────┤
│  ECOSISTEMA PARA INMIGRANTES · PILOTO UTAH           │
│                                                      │
│  Tu progreso                        ○ Fuera de EE.UU.│
│  cruza fronteras.                    ╲               │
│                                       ●  ANDEX       │
│  Trámites, empleo, finanzas y        ╱   un camino   │
│  comunidad en un solo lugar.        ○ Ya en EE.UU.   │
│                                                      │
│  ¿Dónde estás ahora?                                 │
│  ┌────────────────────────────────┐                  │
│  │ 🇺🇸 Ya estoy en Estados Unidos  │                  │
│  ├────────────────────────────────┤                  │
│  │ ✈️ Estoy fuera de Estados Unidos│                  │
│  └────────────────────────────────┘                  │
│                                                      │
│  [ Ver mi plan personalizado → ]  ← aparece al elegir│
└──────────────────────────────────────────────────────┘
```

**Por qué:**

1. **Demuestra la promesa en vez de describirla.** El usuario ve la personalización funcionando antes de dar un dato. Es la prueba más barata y más convincente de que la app hace lo que dice.
2. **Precalifica sin fricción.** La respuesta se persiste y **precarga el paso 2 del wizard**, que el usuario ya no tiene que responder dos veces.
3. **Reduce el rebote de la audiencia equivocada.** Alguien que no es ninguna de las dos cosas se autoexcluye antes de invertir tiempo.
4. **Es memorable.** Ninguna competencia directa abre preguntando. Todas abren afirmando.

**Riesgo asumido:** un hero interrogativo convierte peor que uno afirmativo en audiencias frías de tráfico pagado. **Mitigación:** el titular de marca ("Tu progreso cruza fronteras") sigue estando arriba y a mayor tamaño; la pregunta viene después de la promesa, no en lugar de ella. **A validar con test A/B en el primer mes** contra un hero afirmativo clásico.

**Persistencia:** la elección se guarda en `sessionStorage` (no cookie, no cuenta aún) y se envía al servidor al crear la cuenta. Si el usuario cambia de rama en el wizard, gana la del wizard.

| Requisito | Meta |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s en 4G |
| Peso total de primera carga | < 300 KB |
| Funciona sin JavaScript | Hero + CTA sí |
| Idiomas | ES (default) / EN |
| Tracking | Evento por sección vista y por CTA |

**Nota:** la audiencia usa mayoritariamente Android de gama media-baja con datos móviles limitados. El presupuesto de performance no es un detalle, es un requisito funcional.

### 3.2 Fase 2: Micro-Entrevista e Inteligencia de Segmentación (Onboarding Wizard)

El registro no es un formulario aburrido; es un **Smart Profiler de 5 pasos** con barra de progreso superior (`#12B8A6` como superficie).

#### 3.2.0 El eje fundamental: dentro o fuera de EE. UU.

ANDEX sirve a **dos poblaciones con problemas distintos** bajo una misma promesa de marca:

| | **Fuera de EE. UU.** (`pre_arrival`) | **Dentro de EE. UU.** (`in_us`) |
|---|---|---|
| **Momento** | Preparándose para llegar | Construyendo su vida aquí |
| **Dolor principal** | Visa, cita consular, documentación, incertidumbre | Trámites, fechas límite, empleo, crédito, formalización |
| **Geografía relevante** | País de residencia → consulado, embajada | Estado → DMV, corporaciones, cortes, comunidad local |
| **Módulos centrales** | M2, M6, M1 | M1, M7, M4, M3, M5 |
| **Moneda mental** | Costo del trámite en su moneda local | Ingreso mensual en USD |

Esta bifurcación **no es un campo de formulario. Es una variable de producto** (`location_context`) que se propaga a: el ordenamiento de módulos, el copy de cada pantalla, la tabla de enlaces externos, las notificaciones y el catálogo de servicios visibles.

**Regla de diseño:** ningún usuario queda excluido de nada. Un usuario `pre_arrival` puede entrar al Módulo 7 (Empleo) — pero verá contenido de *"así funciona el mercado laboral en Utah"* en lugar de vacantes activas. La bifurcación cambia el contenido y la jerarquía, nunca el acceso.

---

#### PASO 1 — Datos Básicos

| Campo | Tipo | Obligatorio |
|---|---|---|
| Nombre | texto | Sí |
| Apellido | texto | No |
| Email | email | Sí |
| Teléfono | tel con selector de código de país | No |

**Detalle de implementación:** el selector de código de país se preselecciona por geolocalización IP, pero siempre editable. Es la primera señal de `location_context` y ayuda a preseleccionar el paso 2 sin decidir por el usuario.

---

#### PASO 2 — Ubicación (LA BIFURCACIÓN)

Pregunta única, dos tarjetas grandes. Esta es la pantalla más importante del wizard.

```
┌─────────────────────────────────────────┐
│  Paso 2 de 5      ▓▓▓▓▓▓░░░░░░░░       │
│                                         │
│  ¿Dónde estás ahora?                    │
│  Esto nos ayuda a mostrarte lo que      │
│  de verdad te sirve.                    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🇺🇸                              │  │
│  │  Ya estoy en Estados Unidos       │  │
│  │  Vivo o estoy actualmente en EE.UU│  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  ✈️                               │  │
│  │  Estoy fuera de Estados Unidos    │  │
│  │  Me estoy preparando para viajar  │  │
│  │  o quiero informarme              │  │
│  └───────────────────────────────────┘  │
│                                         │
│           [ Atrás ]                     │
└─────────────────────────────────────────┘
```

**Ramificación A — "Ya estoy en Estados Unidos"**

Se despliega en la misma pantalla, sin navegación adicional:

| Campo | Tipo | Comportamiento |
|---|---|---|
| **Estado** | Select con búsqueda | Utah destacado arriba (piloto). Debajo, los 12 estados de mayor población hispana. Debajo, los 50 + DC + PR alfabéticos. |
| **Ciudad** | Texto, opcional | Solo se pide más tarde, al abrir M5. No en el wizard. |
| **Tiempo en EE. UU.** | Chips de opción única | Menos de 6 meses · 6 meses – 2 años · 2 – 5 años · Más de 5 años · Prefiero no decir |

**Ramificación B — "Estoy fuera de Estados Unidos"**

| Campo | Tipo | Comportamiento |
|---|---|---|
| **País de residencia** | Select con búsqueda | Países de Latinoamérica y España primero, luego resto del mundo alfabético. Preseleccionado por IP, editable. |
| **Nacionalidad** | Select, opcional | Solo si difiere del país de residencia. Toggle *"Mi nacionalidad es otra"*. |
| **Plan de viaje** | Chips de opción única | Ya tengo fecha de viaje · Quiero ir este año · Estoy explorando la idea · Aún no lo sé |

> **Nota de producto:** el campo *Plan de viaje* es la señal de urgencia más potente del embudo `pre_arrival` y el mejor predictor de disposición a pagar por servicios directos. Instrumentarlo bien.

---

#### PASO 3 — Situación Actual (opciones distintas por rama)

Encabezado que cambia según la rama:
- Rama A: *"¿En qué momento de tu camino estás?"*
- Rama B: *"¿Qué te trae a ANDEX?"*

**Opciones — Rama A (dentro de EE. UU.)**

- Acabo de llegar y estoy organizándome
- Tengo un trámite o solicitud en proceso
- Tengo permiso de trabajo vigente
- Soy residente permanente
- Soy ciudadano estadounidense
- Estoy con visa temporal (turismo, estudio o trabajo)
- Estoy resolviendo mi situación migratoria
- **Otro** → despliega campo de texto libre
- **Prefiero no responder**

**Opciones — Rama B (fuera de EE. UU.)**

- Quiero solicitar una visa de turismo (B1/B2)
- Quiero estudiar en EE. UU. (F-1 / M-1)
- Ya tengo mi visa y estoy preparando el viaje
- Me negaron una visa y quiero volver a intentarlo
- Quiero emigrar pero no sé por dónde empezar
- Tengo familia en EE. UU. y quiero reunirme con ellos
- Quiero invertir o abrir una empresa desde mi país
- **Otro** → despliega campo de texto libre
- **Prefiero no responder**

> **Requisito de privacidad:** este campo es **opcional en ambas ramas**. La opción *"Prefiero no responder"* debe tener el mismo peso visual que las demás — no arrinconada al final en gris. El motor de recomendación debe funcionar bien sin este dato.

---

#### PASO 3.5 — ¿Para quién buscas ayuda? *(nueva pregunta sugerida)*

Un único chip de tres opciones, en la misma pantalla del paso 3:

- Para mí
- Para un familiar
- Para ambos

**Por qué importa:** el caso *"estoy en Utah y quiero traer a mi mamá de Guatemala"* es enorme y hoy no lo captura ninguna rama. Ese usuario es `in_us` pero su necesidad es `pre_arrival`. Sin esta pregunta lo perfilas mal y le muestras el dashboard equivocado.

Cuando la respuesta es *"Para un familiar"* o *"Para ambos"*, el motor activa un **modo dual**: sube M2 (Migración) en el ranking y habilita en el dashboard una sección secundaria *"Para tu familia"* con contenido `pre_arrival`, sin cambiar el contexto principal del usuario.

---

#### PASO 4 — Intereses Principales (multi-select filtrado por rama)

**Base común (ambas ramas):**

- [ ] Asesoría Legal / Trámites Migratorios / Citas Consulares
- [ ] Crear o Formalizar una Empresa (LLC)
- [ ] Educación Financiera / Inversión Segura / Crédito
- [ ] Certificaciones Técnicas (Taxes, Seguros, Real Estate)
- [ ] Educación de Hijos / Programas Familiares (CEO Junior)
- [ ] **Otro** → campo de texto libre

**Solo Rama A (dentro de EE. UU.):**

- [ ] Empleo y Oportunidades Laborales
- [ ] Comunidad / Ferias de Ayuda / Restaurantes / Vida Local
- [ ] Licencia de Conducir y Trámites Locales

**Solo Rama B (fuera de EE. UU.):**

- [ ] Preparación de Visa y Entrevista Consular
- [ ] Cómo es la vida en EE. UU. (costos, vivienda, escuelas)
- [ ] Preparación financiera antes de viajar

> El campo **Otro** con texto libre es la fuente de investigación de producto más barata que tiene el MVP. Guardar cada entrada en `interest_other_signals` y revisarla semanalmente.

---

#### PASO 5 — Objetivo Inmediato

Elección del problema #1 a resolver en los próximos 30 días. Las opciones se generan dinámicamente a partir de los intereses marcados en el paso 4, más una opción libre:

- *"Escribe tu propio objetivo"* → campo de texto, máximo 120 caracteres.

Este texto se muestra literalmente en el dashboard como el objetivo del usuario. Verlo escrito con sus propias palabras es el momento de mayor conexión emocional de todo el onboarding.

---

#### 3.2.1 Patrón "Otro" — especificación de implementación

Todos los campos de opción del wizard siguen el mismo patrón, sin excepción:

```typescript
type OptionField = {
  value: string;        // Enum canónico, ej. 'recien_llegado' | 'other'
  valueOther?: string;  // Texto libre, solo cuando value === 'other'
};
```

**Reglas:**

1. Seleccionar *Otro* revela un campo de texto **debajo, sin cambiar de pantalla**.
2. El texto libre **nunca contamina el enum**. Se guarda en su propia columna.
3. Máximo 120 caracteres, sin validación de formato.
4. Si el usuario elige *Otro* y no escribe nada, se guarda `value: 'other'` con `valueOther: null`. Es válido.
5. Todo texto libre se sanitiza antes de persistirse y **nunca** se renderiza sin escapar.
6. Revisión mensual de los valores *Otro* más frecuentes → se promueven a opciones fijas del enum.

---

#### 3.2.2 Coherencia de datos entre ramas

Regla dura: **un usuario nunca tiene estado de EE. UU. y país de residencia extranjero al mismo tiempo.** Al cambiar de rama, los campos de la rama anterior se limpian, con confirmación explícita:

> *"Vas a cambiar tu ubicación. Se borrarán los datos que ya escribiste de la opción anterior. ¿Continuar?"*

---

#### Reglas de UX del wizard

1. **Guardado parcial en cada paso.** Si el usuario abandona, retoma donde quedó.
2. **Barra de progreso siempre visible** con conteo explícito ("Paso 3 de 5"). La bifurcación **no cambia el número total de pasos** — ambas ramas tienen 5. El usuario nunca siente que eligió el camino largo.
3. **Botón atrás siempre disponible**, incluyendo volver a cambiar de rama.
4. **Un paso = una pantalla en mobile.** No apilar dos preguntas.
5. **Sin campos obligatorios innecesarios.** Solo email, nombre y `location_context` son requeridos.
6. **Opción de saltar** ("Prefiero explorar por mi cuenta") disponible desde el paso 3 en adelante. **No disponible en el paso 2**: sin `location_context` el dashboard no puede adaptarse a nada.
7. **Preselección por geolocalización IP, nunca autoenvío.** Se sugiere, el usuario confirma.
8. **Todo cambiable después** desde Perfil, con recálculo del ranking y toast de confirmación.

---

#### 3.2.3 Evento de transición: "Ya llegué" *(alta prioridad de retención)*

Un usuario `pre_arrival` que llega a EE. UU. es el momento de mayor necesidad de todo el ciclo de vida — y el de mayor riesgo de abandono si la app sigue mostrándole contenido de preparación.

**Mecanismo:**

- Banner permanente y discreto en el dashboard `pre_arrival`: **"¿Ya llegaste a Estados Unidos?"** → abre un mini-flujo de 2 campos (estado + fecha de llegada) y migra el contexto.
- Si el usuario declaró fecha de viaje en el paso 2, se programa una notificación para esa fecha + 3 días.
- La migración de contexto **recalcula todo el ranking** y dispara una pantalla de bienvenida: *"Bienvenido a Utah. Esto es lo primero que deberías resolver."*
- Se registra `location_context_changed` con el contexto anterior y el nuevo.

Esta transición es, en la práctica, el momento de conversión más valioso del producto. Merece su propia pantalla, no un toggle escondido en Configuración.

### 3.3 Motor de Recomendación Inteligente (Profiling Logic)

**Implementación Técnica:**

- **Algoritmo de Reglas Local (Fase 1):** Un motor sintáctico en código (Rule-Based Engine) analiza las respuestas del usuario y genera un vector de etiquetas (`user_profile_tags`).
- **Mapeo a Módulo Principal (Primary Recommendation):**
  - Si selecciona **Empleo** → Módulo 7 (Job Match)
  - Si selecciona **Empresa/LLC** → Módulo 4 (Business Builder)
  - Si selecciona **Trámites/Visa** → Módulo 2 (Pre-Landing & Consular)
  - Si selecciona **Inversión/Crédito** → Módulo 3 (Finanzas)
  - Si selecciona **Certificaciones** → Módulo 6 (Academia)
  - Si selecciona **Comunidad/Familia** → Módulo 5 (Comunidad)
  - Si selecciona **Documentos/Fechas** → Módulo 1 (Bóveda)
- **Integración API AI (Fase 2 Ready):** Endpoint preparado para enviar el JSON de respuestas a una API (OpenAI/Claude) para generar una bienvenida redactada a la medida del perfil del usuario.

#### 3.3.1 Especificación del motor de reglas (v1)

El motor produce un **score por módulo** (0–100) y devuelve el orden completo. No devuelve un único módulo.

El cálculo arranca desde la **matriz de relevancia por contexto de ubicación** (tabla `module_relevance`) y suma pesos encima. Esto garantiza que un usuario `pre_arrival` nunca vea "Conexión Laboral" como recomendación principal aunque marque interés en empleo.

```typescript
type LocationContext = 'in_us' | 'pre_arrival';

type ProfileInput = {
  locationContext: LocationContext;   // Paso 2 — LA BIFURCACIÓN
  stateUS?: string;                   // Paso 2, rama A. ISO ej. 'UT'
  countryOfResidence?: string;        // Paso 2, rama B. ISO ej. 'MX'
  timeInUS?: TimeInUSTag;             // Paso 2, rama A
  travelPlan?: TravelPlanTag;         // Paso 2, rama B
  situation: SituationTag | 'other' | null;  // Paso 3 (opcional)
  seekingFor: 'self' | 'family' | 'both';    // Paso 3.5
  interests: InterestTag[];           // Paso 4, multi-select
  immediateGoal: GoalTag | 'custom';  // Paso 5
};

type ModuleScore = {
  moduleId: number;
  score: number;
  reason: string;                     // Copy mostrado al usuario
  contentVariant: LocationContext;    // Qué versión del módulo servir
};

// ── Base por contexto: leída de module_relevance ──────
// M1 Bóveda · M2 Migración · M3 Finanzas · M4 Negocio
// M5 Comunidad · M6 Academia · M7 Empleo
const BASE_RELEVANCE: Record<LocationContext, Record<number, number>> = {
  in_us:       { 1: 40, 2: 30, 3: 30, 4: 25, 5: 30, 6: 25, 7: 35 },
  pre_arrival: { 1: 25, 2: 50, 3: 20, 4: 15, 5: 15, 6: 30, 7:  5 },
};

// ── Pesos ────────────────────────────────────────────
const WEIGHTS = {
  IMMEDIATE_GOAL:    50,  // Paso 5 — la señal más fuerte
  PRIMARY_INTEREST:  30,  // Primer interés seleccionado
  OTHER_INTEREST:    15,  // Intereses adicionales
  SITUATION_BOOST:   10,  // Refuerzo contextual por situación
  URGENCY_BOOST:     12,  // Recién llegado / viaje con fecha
  PILOT_BOOST:        5,  // Utah = boost a M5 y M6
  FAMILY_BOOST:      15,  // seekingFor incluye 'family' → M2
};

// ── Refuerzos por situación — Rama A (in_us) ──────────
const SITUATION_BOOSTS_IN_US: Record<string, number[]> = {
  'recien_llegado':      [1, 7, 5],  // Bóveda, Empleo, Comunidad
  'tramite_proceso':     [1, 2],     // Bóveda, Migración
  'permiso_trabajo':     [7, 3, 1],
  'residente':           [3, 4, 6],  // Finanzas, Negocio, Academia
  'ciudadano':           [4, 3, 6],
  'visa_temporal':       [1, 2, 6],
  'resolviendo':         [2, 1],
};

// ── Refuerzos por situación — Rama B (pre_arrival) ────
const SITUATION_BOOSTS_PRE: Record<string, number[]> = {
  'visa_turismo':        [2],
  'visa_estudiante':     [2, 6, 3],
  'visa_aprobada':       [2, 1, 3],  // Preparando el viaje
  'visa_negada':         [2],
  'explorando':          [2, 6, 5],
  'reunificacion':       [2, 1],
  'inversion_remota':    [4, 3],     // LLC desde el extranjero
};

// ── Refuerzos de urgencia ────────────────────────────
const URGENCY_TAGS = {
  in_us:       ['menos_6_meses'],              // Recién llegado
  pre_arrival: ['fecha_confirmada', 'este_ano'], // Viaje inminente
};

function rankModules(input: ProfileInput): ModuleScore[] {
  // 1.  Inicializar los 7 módulos con BASE_RELEVANCE[locationContext]
  // 2.  Sumar IMMEDIATE_GOAL al módulo mapeado del paso 5
  // 3.  Sumar PRIMARY_INTEREST al primer interés
  // 4.  Sumar OTHER_INTEREST a cada interés adicional
  // 5.  Aplicar SITUATION_BOOST según la rama y el paso 3
  // 6.  Aplicar URGENCY_BOOST si el tag de urgencia aplica
  // 7.  Aplicar PILOT_BOOST si stateUS === 'UT'
  // 8.  Aplicar FAMILY_BOOST a M2 si seekingFor !== 'self'
  // 9.  Normalizar a 0–100
  // 10. Desempatar por orden canónico de módulo
  // 11. Devolver los 7 ordenados desc, con `reason` y `contentVariant`
}
```

**Reglas de negocio:**

- El motor **siempre devuelve los 7 módulos**, nunca un subconjunto. La relevancia baja hunde un módulo al fondo, no lo elimina.
- `contentVariant` determina qué versión del contenido sirve el módulo. Un `pre_arrival` que abre M7 ve *"Cómo funciona el mercado laboral en Utah"*, no vacantes activas.
- Empate → gana el módulo de menor `id` (orden canónico).
- **Perfil sin `location_context`** → imposible: es campo obligatorio del paso 2.
- Perfil con solo `location_context` (saltó del paso 3 en adelante) → orden por `BASE_RELEVANCE` puro. Sigue siendo un dashboard útil, y esa es la prueba de que la bifurcación por sí sola ya aporta valor.
- Orden por defecto `in_us`: `[1, 7, 5, 3, 2, 4, 6]`
- Orden por defecto `pre_arrival`: `[2, 6, 1, 3, 5, 4, 7]`
- Cada score lleva un `reason` legible que se muestra al usuario: *"Porque dijiste que quieres formalizar tu negocio en los próximos 30 días."*
- El resultado se persiste en `user_module_ranking`, no se recalcula en cada carga.
- **Recalcular obligatoriamente** cuando cambie `location_context`, `state_us`, `country_of_residence`, `situation_tag` o `seeking_for`.

#### 3.3.2 Re-ranking por comportamiento (v1 ligero)

Además del ranking inicial, el motor aplica un ajuste suave según el uso real:

- Abrir un módulo suma `+2` a su score (tope acumulado: `+20`).
- No abrir el módulo recomendado en 3 sesiones consecutivas le resta `-10`.
- El usuario puede pulsar **"No es lo que busco"** en la hero card → resta `-25` y recalcula al instante.
- El re-ranking corre al iniciar sesión, no en tiempo real.

Esto convierte el dashboard en algo que aprende, que es la promesa central del producto.

### 3.4 Fase 3: Paywall Personalizado

> ✅ **Dentro del alcance del MVP.** Se ubica entre el paso 5 de la entrevista y el dashboard.

#### 3.4.1 Principio de diseño

> El paywall no vende funciones. **Muestra el plan que el usuario acaba de construir con sus respuestas.**

El titular no es "Desbloquea ANDEX Premium". Es **"Tu plan está listo, María"**. La diferencia no es cosmética: el usuario no está comprando acceso a un catálogo, está confirmando algo que ya vio armarse frente a él en los cinco pasos anteriores.

Con esta audiencia, la confianza es el producto. Cada elemento de esta pantalla existe para reducir la sospecha, no para aumentar la urgencia. **No hay contadores regresivos, ni "solo quedan X cupos", ni descuentos que expiran.** Esas tácticas funcionan en otros mercados y aquí destruyen la marca.

#### 3.4.2 Anatomía de la pantalla

```
┌───────────────────────────────────────────────┐
│  ●━━●━━●━━●━━●━━◆   La Ruta, último nodo=sello │
│                                               │
│  ÚLTIMO PASO                                  │
│  Tu plan está listo, María.                   │
│  Esto es lo que armamos con tus respuestas.   │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ ✓ Bóveda Digital      [TU PRIORIDAD]   │  │ ← eco del ranking
│  │ ✓ Trámites y Estatus + 5 módulos más   │  │
│  │ ✓ Alertas de fechas límite              │  │
│  │ ✓ Comunidad de 2,400 familias en Utah   │  │ ← usa su estado
│  │ ✓ Contenido para tu familiar            │  │ ← solo si seeking≠self
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌───────────┐  ┌──────────────────────────┐ │
│  │ Mensual   │  │ ★ MÁS ELEGIDO            │ │
│  │           │  │ Anual                    │ │
│  │   $14     │  │   $140 /año              │ │
│  │   /mes    │  │   Equivale a $11.60/mes  │ │
│  │           │  │   [Ahorras $28 al año]   │ │
│  │           │  │  ╭────────────────────╮  │ │
│  │           │  │  │ ★  Tarifa congelada│  │ │ ← EL SELLO
│  │           │  │  ╰────────────────────╯  │ │
│  └───────────┘  └──────────────────────────┘ │
│                                               │
│  [ Continuar con el plan anual — $140 ]       │
│                                               │
│  🔒 Stripe   ↩︎ Cancelas en un clic   🛡️ 14 días│
│                                               │
│  La membresía se renueva automáticamente.     │
│  Te avisamos 48 h antes de cada cobro.        │
│                                               │
│         Volver a mis respuestas               │
└───────────────────────────────────────────────┘
```

#### 3.4.3 Personalización obligatoria

La tarjeta de resumen **debe** reflejar datos reales del perfil. Un paywall genérico anula todo el trabajo de los cinco pasos anteriores.

| Elemento | Fuente | Ejemplo |
|---|---|---|
| Nombre en el titular | Paso 1 | "Tu plan está listo, **María**." |
| Módulo #1 con badge | `user_module_ranking[0]` | "Bóveda Digital · **TU PRIORIDAD**" |
| Módulo #2 nombrado | `user_module_ranking[1]` | "Trámites y Estatus y los 5 restantes" |
| Referencia geográfica | `state_us` / `country` | "2,400 familias **en Utah**" |
| Línea de familia | `seeking_for ≠ 'self'` | "Contenido de preparación para tu familiar" |
| Nota de moneda | `location_context = pre_arrival` | "Se cobra en dólares. Tu banco aplica el cambio del día." |
| Títulos de módulo | `contentVariant` | "Tus documentos del viaje" en vez de "Bóveda Digital" |

#### 3.4.4 Estrategia de precios y anclaje

- **Mensual:** $14 USD / mes. Copy: *"Flexible. Cancelas cuando quieras."*
- **Anual (preseleccionado):** $140 USD / año. Badge ámbar **"Más elegido"**. Equivalente $11.60/mes. Chip **"Ahorras $28 al año"**.

**El sello de tarifa congelada:**

> ★ **Tarifa congelada.** Pagas $140 mientras mantengas tu membresía, aunque el precio suba.

⚠️ **Esto es una promesa comercial vinculante.** Si se publica, hay que cumplirla: los usuarios anuales de lanzamiento mantienen $140 indefinidamente mientras no cancelen, incluso cuando el precio suba a $25 o $45 para nuevos usuarios. Requiere que `stripe_price_id` quede fijado por suscripción y **nunca** se migre masivamente. Confirmar con asesoría legal antes de publicar el copy.

**Preselección:** el plan anual llega preseleccionado. Es anclaje legítimo (la opción mensual está visible, al mismo nivel jerárquico y a un clic). **No** se admite ningún patrón donde la opción cara esté preseleccionada y la barata escondida o requiera pasos extra.

#### 3.4.5 Checkout

Pantalla separada, no modal. Contiene:

1. Enlace **"← Cambiar de plan"** siempre visible.
2. **Resumen del pedido:** concepto, cadencia de renovación, total de hoy en USD.
3. **Apple Pay** y **Google Pay** arriba, como botones primarios.
4. Divisor *"o paga con tarjeta"*.
5. Campos de Stripe Elements: número, vencimiento, CVC, código postal.
6. Botón: **"Pagar $140 y entrar"** — el verbo dice exactamente qué pasa.
7. Nota: *"🔒 Conexión cifrada. ANDEX no almacena tu tarjeta."*

**Integración:** Stripe Elements. ANDEX **nunca** toca datos de tarjeta. Webhooks idempotentes contra `stripe_events`.

#### 3.4.6 Requisitos de cumplimiento (no negociables)

| Requisito | Implementación |
|---|---|
| Divulgación clara de términos materiales antes del cobro | Precio, cadencia y renovación automática visibles sin scroll en el botón de pago |
| Consentimiento afirmativo expreso | Checkbox no premarcado o clic explícito en el botón de pago; se registra en `user_consents` con versión de términos, timestamp e IP |
| Cancelación tan simple como la suscripción | Un clic desde Perfil, mismo medio (web), sin llamada ni formulario ni retención por chat |
| Aviso previo a la renovación | Correo 48 h antes de cada cobro, con enlace directo a cancelar |
| Sin patrones oscuros | Prohibidos: contadores falsos, escasez inventada, precio tachado que nunca existió, casillas premarcadas, botón de cancelar oculto |
| Recibo | Correo automático tras cada cobro |

> El marco regulatorio de suscripciones en EE. UU. está en movimiento y hay leyes estatales de renovación automática más estrictas que la norma federal. Diseñar cumpliendo el estándar más alto desde el día uno cuesta lo mismo que diseñar mal, y evita rehacerlo.

#### 3.4.7 Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Pago rechazado | Mensaje específico ("Tu banco rechazó el cargo"), no genérico. Ofrecer otro método. No perder el perfil. |
| Usuario abandona el checkout | El perfil queda guardado. Al volver, entra directo al paywall con su plan armado, sin repetir la entrevista. |
| Usuario vuelve días después | Correo de recuperación a las 24 h con enlace directo al paywall personalizado. Uno solo, sin secuencia insistente. |
| Suscripción vencida (`past_due`) | Acceso de solo lectura al dashboard durante 7 días con aviso claro. No borrar datos. |
| Cancelación | Acceso hasta `current_period_end`. Al vencer, dashboard bloqueado pero **cuenta y perfil intactos**. |
| Reactivación | Vuelve a su ranking anterior, sin repetir la entrevista. |

#### 3.4.8 Plan de contingencia

Si la conversión a pago queda por debajo del 5% o el churn del mes 2 supera el 40% en las primeras 6 semanas, la hipótesis del paywall duro queda invalidada. **La respuesta no es bajar el precio.** Es mover el punto de cobro:

- **Opción A — Prueba de 7 días** con tarjeta y recordatorio 48 h antes del primer cargo. El diseño de esta pantalla no cambia; solo el copy del botón.
- **Opción B — Freemium.** Bóveda y directorio gratuitos; se cobra por gestoría, revisión humana y academia.

Ambas están pre-diseñadas sobre el mismo componente. La decisión se toma con dato, no con opinión.

---

## 4. DASHBOARD ADAPTATIVO — ESPECIFICACIÓN DETALLADA

> **Este es el corazón del MVP.** Es la funcionalidad que hay que ejecutar impecablemente.

### 4.1 Principio de diseño

> El dashboard no le dice al usuario quién es. Le muestra por dónde empezar.

La adaptación es **jerárquica, no restrictiva**. Los 7 módulos siempre están presentes, siempre son accesibles, y siempre se ven completos. Lo que cambia es a qué le da protagonismo la pantalla.

### 4.2 Elementos que se adaptan

| Elemento | Qué cambia | Fuente |
|---|---|---|
| **Modo del dashboard** | `in_us` o `pre_arrival` — cambia copy, iconografía y jerarquía completa | Paso 2 |
| **Saludo** | Nombre + referencia al objetivo declarado | Paso 1 + Paso 5 |
| **Hero card** | Módulo #1 del ranking, con su `reason` | Motor de reglas |
| **Orden del grid** | Los 7 módulos ordenados por score | `user_module_ranking` |
| **Contenido de cada módulo** | Variante `in_us` vs `pre_arrival` del mismo módulo | `contentVariant` |
| **Enlaces externos** | DMV de tu estado / consulado de tu país | `external_resources.scope` |
| **Sidebar contextual** | Contenido asociado al módulo top | Módulo #1 y #2 |
| **Objetivo de 30 días** | Texto del paso 5, editable | Paso 5 |
| **Sugerencia secundaria** | Módulo #2, en formato tira horizontal | Motor de reglas |
| **Sección "Para tu familia"** | Aparece solo si `seeking_for` ≠ `self` | Paso 3.5 |
| **Banner "¿Ya llegaste?"** | Solo en modo `pre_arrival` | `location_context` |

#### 4.2.1 Los dos modos del dashboard

**Modo `in_us` — "Construye tu vida aquí"**

```
Hola, María 👋
Tu prioridad en Utah este mes

  [ ⭐ Bóveda Digital — organiza tus documentos ]

  Explora todos los módulos
  [Empleo] [Comunidad] [Finanzas] [Migración] ...

  Sidebar: Eventos en Utah · Fechas límite · Tu perfil
```

**Modo `pre_arrival` — "Prepárate para llegar"**

```
Hola, Carlos 👋
Tu camino desde Colombia a Estados Unidos

  ┌──────────────────────────────────────┐
  │ ¿Ya llegaste a Estados Unidos?  →   │  ← Banner de transición
  └──────────────────────────────────────┘

  [ ⭐ Guía Migratoria — prepara tu visa B1/B2 ]

  Explora todos los módulos
  [Academia] [Bóveda] [Finanzas] [Comunidad] ...

  Sidebar: Consulado de EE.UU. en Colombia ·
           Costo estimado del trámite · Tu perfil
```

**Diferencias de copy, no de funcionalidad:**

| Módulo | Título `in_us` | Título `pre_arrival` |
|---|---|---|
| M1 | Bóveda Digital & Alertas | Tus documentos para el viaje |
| M2 | Trámites y Estatus Migratorio | Prepara tu visa y tu cita |
| M3 | Finanzas & Patrimonio | Prepara tu llegada financiera |
| M4 | Desarrollo Empresarial | Invierte o abre empresa en EE. UU. |
| M5 | Comunidad & Vida Local | Conoce tu destino antes de llegar |
| M6 | Academia de Certificaciones | Certifícate desde tu país |
| M7 | Conexión Laboral | Cómo funciona el mercado laboral |

> **Decisión clave:** M4 (empresas) tiene relevancia real en `pre_arrival` — un no residente **sí puede** constituir una LLC en EE. UU. Es un segmento con alta capacidad de pago que la mayoría de plataformas ignora. Vale la pena no hundirlo en el ranking.

### 4.3 Elementos que NO se adaptan

Fijos para todos los usuarios, deliberadamente:

- La presencia y accesibilidad de los 7 módulos.
- La navegación del sidebar / tab bar.
- El acceso a perfil, configuración y ayuda.
- El botón de "Explorar todos los módulos".

### 4.4 Anatomía de la Hero Card

```
┌──────────────────────────────────────────────┐
│  ⭐ RECOMENDADO PARA TI          [ ✕ ]       │  ← Badge ámbar, texto navy
│                                              │
│  🏢  Desarrollo Empresarial                  │  ← h2
│                                              │
│  Porque dijiste que quieres formalizar       │  ← reason, body, text-muted
│  tu negocio en los próximos 30 días.         │
│                                              │
│  ┌────────────────┐  ┌──────────────────┐   │
│  │ Empezar aquí   │  │ No es lo que     │   │  ← primary (teal-deep)
│  └────────────────┘  │ busco            │   │     + ghost
│                      └──────────────────┘   │
└──────────────────────────────────────────────┘
```

El botón **"No es lo que busco"** es crítico: es el mecanismo de corrección del usuario y la señal más honesta que va a recibir el motor. No lo escondas.

### 4.5 Estados del ModuleCard

| Estado | Apariencia | Comportamiento |
|---|---|---|
| `recommended` | Borde teal, badge ámbar, tamaño hero | Abre el módulo |
| `available` | Tarjeta estándar, icono a color | Abre el módulo |
| `coming-soon` | Icono en gris, badge "Pronto" | Abre placeholder con captura de interés |
| `loading` | Skeleton | — |

**En el MVP, los 7 módulos están en `coming-soon`** salvo el placeholder funcional. Pero la tarjeta se comporta igual: se puede tocar, abre una pantalla real, y captura la intención.

### 4.6 Pantalla placeholder de módulo (v1)

Cada módulo abre a una pantalla completa, no a un toast de "próximamente". Contiene:

1. Header del módulo con su icono, nombre y color.
2. Descripción de qué va a resolver, en lenguaje del usuario.
3. Lista de las 3–4 funcionalidades que traerá.
4. **Captura de interés:** *"¿Qué es lo primero que necesitas de este módulo?"* — campo de texto libre + botón "Avísame cuando esté listo".
5. Enlace de retorno al dashboard.

Ese campo de texto libre es la investigación de producto más barata que vas a hacer. Guarda cada respuesta en `module_interest_signals`.

### 4.7 Casos borde

| Caso | Comportamiento |
|---|---|
| Usuario saltó el onboarding | Orden por defecto, hero card genérica con CTA a completar perfil |
| Perfil incompleto (abandonó en paso 3) | Retoma el wizard al entrar; puede saltar |
| Usuario descarta la hero card 3 veces | Se oculta la hero card por 7 días; se muestra el grid plano |
| Todos los scores empatados en 0 | Orden por defecto |
| Usuario cambia sus intereses en perfil | Recalcula ranking al guardar, con toast de confirmación |

---

## 5. ESPECIFICACIÓN DETALLADA DE MÓDULOS DE LA PLATAFORMA

> **Alcance v1:** de esta sección solo se construyen las **carcasas y pantallas placeholder** (ver 4.6). La lógica interna queda documentada para las siguientes iteraciones.

### MÓDULO 1: Bóveda Digital & Alertas Inteligentes (Vault & Tracking)

**Uso:** Almacenamiento seguro de documentos y recordatorios de fechas límite.

**Componentes UI:**
- Grid de categorías: Pasaportes, Licencias, Asilo/Corte, Formulario I-94, Taxes.
- Tarjeta de subida de archivo con visualizador de PDF y preview de imágenes.

**Mecanismo de Enlaces / Trámites Externos (Fase 1):**
Para rastreo de estatus de casos con USCIS o fechas de corte EOIR:
- **Botón Acción:** "Consultar Estado Oficial de Mi Caso (USCIS)".
- **Modal Interactivo:** Despliega instrucciones de 3 pasos:
  1. Copia tu número de recibo (ej. EAC1234567890).
  2. Haz clic en el enlace seguro oficial.
  3. Pega el número en el portal del gobierno.
- **Link Out:** Enlace saliente con `target="_blank"` a `https://egov.uscis.gov/casestatus/`.

**Motor de Alertas:** Notificaciones automáticas por Email/Push a 90, 60 y 30 días de la fecha de vencimiento configurada manualmente por el usuario.

---

### MÓDULO 2: Preparación Pre-Llegada, Guía Migratoria & Servicios Consulares

**Uso:** Acompañamiento en visas (Turismo B1/B2, Estudiante F-1/M-1), pasaportes y citas consulares.

**Mecanismo de Enlaces / Trámites Externos (Fase 1):**
Para llenado de Formulario DS-160 o citas en Embajadas:
- Paso a paso ilustrado dentro de ANDEX.
- Enlace oficial directo al portal `ceac.state.gov` o al sistema de citas consulares del país correspondiente.

**Servicio Directo (Done-for-You Integration):**
- Botón destacado: "¿Prefieres que un especialista ANDEX llene el formulario y agende tu cita por ti?" → Abre modal de contratación del servicio ($150 – $250 USD).

---

### MÓDULO 3: Inclusión Financiera & Patrimonial (USA Latino Prime)

**Uso:** Construcción de FICO Score, bancarización y fondos de inversión de bajo riesgo.

**Inversión Conservadora (Feature Destacada):**
- **Simulador Interactivo:** Slider para seleccionar monto a invertir ($500 – $50,000 USD) y plazo (6 – 24 meses).
- **Apertura Assist:** Guía y enlace para vinculación con fondos de Mercado Monetario / Cuentas de Alto Rendimiento (HYSA) asociadas a USA Latino Prime.

**Nota de implementación:** ninguna tasa de rendimiento debe quedar fija en código o en copy. Debe consumirse de una fuente con fecha de actualización visible.

---

### MÓDULO 4: Desarrollo Empresarial & Aceleración de Negocios

**Uso:** Creación de empresas LLC, obtención de EIN y servicios de Marketing/Ads.

**Mecanismo de Enlaces Externos (Fase 1):**
- Pasos para registro de nombre comercial en la división de corporaciones del estado de destino (ej. `corporations.utah.gov`).

**Servicio Directo (Done-for-You):**
- Formulario de contratación en 1 clic para el "Combo Lanzamiento Empresarial": LLC + EIN + Operating Agreement + Branding (Logo, Web y campaña en Google/Facebook Ads).

---

### MÓDULO 5: Comunidad, Vida Local & Ecosistema Familiar (Starbiz)

**Uso:** Red social, directorio geo-localizado y programas de desarrollo familiar.

**Componentes UI (Inspirado en interfaz Starbiz):**
- Feed de publicaciones, anuncios de eventos comunitarios y talleres en vivo.
- **Directorio Interactivo Local (Mapa / Grid):**
  - Ferias de ayuda (comida gratis, asesorías legales sin costo).
  - Restaurantes latinos filtrados por país de origen.
  - Clínicas médicas económicas / comunitarias.
  - Guía turística y parques familiares (enfoque inicial en Utah).

**Secciones Integradas:** Accesos a **CEO Junior** (emprendimiento para jóvenes) y **Padres 3.0**.

---

### MÓDULO 6: Academia de Certificaciones Técnicas (EdTech — Piloto Utah)

**Uso:** Capacitación y simulación de exámenes estatales para carreras de alta demanda.

**Especialidades:**
- Preparador de Impuestos (Tax Preparer / PTIN IRS).
- Licencias de Seguros (Life, Health, Auto).
- Gestor Inmobiliario (Real Estate).
- Asesoría Financiera Básica.

**Lógica Externa (Fase 1):**
- Guía y enlaces directos a las páginas oficiales de registro de exámenes estatales (ej. Utah Insurance Department / IRS PTIN Application).

**Componente App:** Reproductor de clases en video y simulador de preguntas de examen tipo test.

---

### MÓDULO 7: Conexión Laboral & Oportunidades (Job Match & Careers)

**Uso:** Bolsa de trabajo comunitaria con notificaciones inteligentes.

**UI/UX:**
- Tarjetas de empleo con etiquetas de sueldo, ubicación y requisitos.
- **Algoritmo de Coincidencia:** Notificación push inmediata al celular cuando un emprendedor del Módulo 4 o empresa verificada publica un empleo que coincide con el perfil del usuario.

---

## 6. TABLA RESUMEN DE ENLACES EXTERNOS GUIADOS (FASE 1)

> **Alcance v1:** documentado. El componente `<ExternalGuideModal />` se construye en la iteración de módulos.

El equipo de desarrollo debe implementar el componente reutilizable `<ExternalGuideModal />` para los siguientes trámites:

| Módulo | Trámite | Portal Oficial Externo (Fase 1) | Flujo Interno en App |
|---|---|---|---|
| M1 | Tracking Estado de Caso | `egov.uscis.gov` | Instrucciones + Copia de ID Caso + Modal |
| M1 | Fechas de Corte Inmigración | `portal.eoir.justice.gov` | Guía de consulta por número A (Alien Registration) |
| M2 | Formulario Visa DS-160 | `ceac.state.gov` | Wizard de preparación de datos + Link directo |
| M2 | Citas Consulares | Portales de Embajadas por País | Directorio de enlaces oficiales según nacionalidad |
| M2 | Citas Licencia de Manejo | `dmv.utah.gov` (o según estado) | Checklist de requisitos local + Link de agendamiento |
| M4 | Registro de LLC | Division of Corporations (State Gov) | Plantilla de datos + Link al registro estatal |
| M6 | Registro PTIN Taxes | `irs.gov/ptin` | Instructivo de creación de cuenta IRS + Link |

**Requisitos del componente cuando se construya:**
- Cada recurso debe llevar `last_verified_at` visible al usuario.
- Disclaimer permanente: *ANDEX no está afiliado a ninguna agencia gubernamental. Estos trámites son gratuitos en los portales oficiales.*
- Job semanal de verificación de URLs con alerta ante 404 o redirección.

---

## 7. ESPECIFICACIÓN TÉCNICA DE BASE DE DATOS Y ARQUITECTURA

### 7.1 Stack del MVP

| Capa | Tecnología |
|---|---|
| Frontend Web | Next.js (App Router) + TypeScript + Tailwind |
| Mobile | React Native / Expo (compartiendo tokens de diseño) |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth (email + magic link) |
| Hosting | Vercel |
| Analítica | Eventos propios en `analytics_events` |

**Requisito de arquitectura:** mantener el motor de recomendación en un módulo aislado (`/lib/recommendation-engine`) sin dependencias de UI, para poder sustituirlo por una llamada a API de IA en Fase 2 sin tocar el frontend.

### 7.2 Modelo de Datos Principal (Esquema PostgreSQL / Supabase)

```sql
-- ═══════════════════════════════════════════════════════
-- ANDEX — ESQUEMA MVP v1
-- ═══════════════════════════════════════════════════════

-- Tabla de Usuarios y Profiling Inteligente
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    phone_country_code VARCHAR(5),

    -- ── LA BIFURCACIÓN ────────────────────────────────
    location_context VARCHAR(20)
        CHECK (location_context IN ('in_us','pre_arrival')),

    -- Rama A: dentro de EE. UU.
    current_state_us CHAR(2),                 -- ISO ej. 'UT'. NULL si pre_arrival
    city VARCHAR(100),                        -- Opcional, se pide al abrir M5
    time_in_us VARCHAR(20),                   -- 'menos_6_meses' | '6m_2a' | ...

    -- Rama B: fuera de EE. UU.
    country_of_residence CHAR(2),             -- ISO 3166-1. NULL si in_us
    travel_plan_status VARCHAR(20),           -- 'fecha_confirmada' | 'este_ano' | ...
    estimated_arrival_date DATE,              -- Dispara el recordatorio de transición

    nationality CHAR(2),                      -- ISO. Solo si difiere de residencia
    timezone VARCHAR(50) DEFAULT 'America/Denver',
    preferred_language VARCHAR(5) DEFAULT 'es',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,                   -- Soft delete

    -- Coherencia: nunca estado de EE.UU. y país extranjero a la vez
    CONSTRAINT chk_location_coherence CHECK (
        location_context IS NULL
        OR (location_context = 'in_us'       AND country_of_residence IS NULL)
        OR (location_context = 'pre_arrival' AND current_state_us     IS NULL)
    )
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_context  ON users(location_context) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_state    ON users(current_state_us) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_country  ON users(country_of_residence) WHERE deleted_at IS NULL;

-- Respuestas del Onboarding para Recomendaciones
CREATE TABLE user_onboarding_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    primary_interest VARCHAR(100),
    interests_json JSONB,                     -- Array de intereses seleccionados
    interests_other TEXT,                     -- Texto libre del "Otro" del paso 4
    immediate_goal TEXT,                      -- Puede ser enum o texto libre
    immediate_goal_is_custom BOOLEAN DEFAULT false,

    situation_tag VARCHAR(50),                -- Enum canónico | 'other' | NULL
    situation_other TEXT,                     -- Texto libre cuando tag = 'other'
    situation_declined BOOLEAN DEFAULT false, -- "Prefiero no responder"

    seeking_for VARCHAR(20) DEFAULT 'self'    -- Paso 3.5
        CHECK (seeking_for IN ('self','family','both')),

    recommended_module_id INT,
    current_step SMALLINT DEFAULT 1,          -- Para retomar el wizard
    branch VARCHAR(20),                       -- Rama tomada en el paso 2
    is_completed BOOLEAN DEFAULT false,
    is_skipped BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── NUEVO: Relevancia de módulo por contexto ──────────
-- Permite que el mismo módulo se presente distinto según dónde esté el usuario,
-- sin duplicar módulos ni ramificar el frontend.
CREATE TABLE module_relevance (
    module_id INT REFERENCES modules(id),
    location_context VARCHAR(20)
        CHECK (location_context IN ('in_us','pre_arrival')),
    base_score SMALLINT NOT NULL DEFAULT 0,   -- Punto de partida del ranking
    alt_title VARCHAR(120),                   -- Título en este contexto
    alt_description TEXT,                     -- Descripción en este contexto
    PRIMARY KEY (module_id, location_context)
);

-- ── NUEVO: Recursos externos con alcance geográfico ───
-- El DMV depende del estado; el consulado, del país.
CREATE TABLE external_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_slug VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    official_url TEXT NOT NULL,
    scope_type VARCHAR(20) NOT NULL
        CHECK (scope_type IN ('national','state','country')),
    scope_value CHAR(2),                      -- 'UT' | 'MX' | NULL si national
    location_context VARCHAR(20),             -- NULL = aplica a ambos
    instructions_json JSONB,                  -- Pasos del ExternalGuideModal
    last_verified_at TIMESTAMPTZ,             -- Visible al usuario
    verified_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active','broken','deprecated'))
);

CREATE INDEX idx_resources_scope
    ON external_resources(scope_type, scope_value, module_slug)
    WHERE status = 'active';

-- ── NUEVO: Historial de cambio de contexto ────────────
CREATE TABLE location_context_changes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_context VARCHAR(20),
    to_context VARCHAR(20),
    from_scope CHAR(2),
    to_scope CHAR(2),
    trigger_source VARCHAR(50),               -- 'banner' | 'profile' | 'notification'
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- Módulos de la Plataforma
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    accent_color VARCHAR(20),
    canonical_order SMALLINT NOT NULL,
    status VARCHAR(20) DEFAULT 'coming_soon'  -- 'live' | 'coming_soon'
        CHECK (status IN ('live','coming_soon'))
);

-- ── NUEVO: Ranking personalizado por usuario ──────────
CREATE TABLE user_module_ranking (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id INT REFERENCES modules(id),
    score SMALLINT NOT NULL DEFAULT 0,
    reason TEXT,                              -- Copy mostrado en la hero card
    dismissed_count SMALLINT DEFAULT 0,
    open_count SMALLINT DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, module_id)
);

CREATE INDEX idx_ranking_user_score
    ON user_module_ranking(user_id, score DESC);

-- ── NUEVO: Captura de interés en placeholders ─────────
CREATE TABLE module_interest_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id INT REFERENCES modules(id),
    free_text TEXT,                           -- "¿Qué necesitas primero?"
    wants_notification BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── NUEVO: Consentimientos ────────────────────────────
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,        -- 'terms' | 'privacy' | 'marketing'
    document_version VARCHAR(20) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT now()
);

-- ── NUEVO: Analítica de producto ──────────────────────
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    occurred_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_name_time
    ON analytics_events(event_name, occurred_at DESC);

-- Tracking de Uso de Enlaces Externos (Fase 1 Analysis)
-- Agregado y anónimo: mide demanda de trámite, no comportamiento individual
CREATE TABLE external_redirect_logs (
    id BIGSERIAL PRIMARY KEY,
    module_slug VARCHAR(100),
    target_url TEXT,
    user_state VARCHAR(50),                   -- Estado, no usuario
    clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_redirect_module_time
    ON external_redirect_logs(module_slug, clicked_at DESC);

-- ── Suscripciones y Pagos (MVP) ───────────────────────
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    plan_type VARCHAR(20) CHECK (plan_type IN ('monthly','annual')),
    status VARCHAR(50),                       -- 'active','past_due','canceled'
    cancel_at_period_end BOOLEAN DEFAULT false,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- Idempotencia de webhooks de Stripe
CREATE TABLE stripe_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100),
    processed_at TIMESTAMPTZ DEFAULT now()
);

-- ── Trigger de updated_at ─────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 7.3 Row Level Security (obligatorio en Sprint 1)

Supabase expone las tablas públicamente por defecto. **Sin RLS, todo el perfil de todos los usuarios es legible.** Esto no es opcional ni se deja para después.

```sql
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_ranking     ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_interest_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions           ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve y edita lo suyo
CREATE POLICY own_user ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY own_profile ON user_onboarding_profile
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY own_ranking ON user_module_ranking
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY own_signals ON module_interest_signals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY own_consents ON user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY own_subscription ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Catálogo público de módulos: lectura para todos
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY modules_public_read ON modules FOR SELECT USING (true);
```

### 7.4 Seed de módulos

```sql
INSERT INTO modules (id, title, slug, description, icon_name, accent_color, canonical_order, status) VALUES
(1, 'Bóveda Digital & Alertas',      'boveda',    'Guarda tus documentos y no pierdas ninguna fecha límite.', 'folder-lock', '#0F766E', 1, 'coming_soon'),
(2, 'Guía Migratoria & Consular',    'migracion', 'Visas, pasaportes y citas, paso a paso.',                   'plane',       '#102A43', 2, 'coming_soon'),
(3, 'Finanzas & Patrimonio',         'finanzas',  'Construye tu crédito y protege lo que ahorras.',            'trending-up', '#0E7C5A', 3, 'coming_soon'),
(4, 'Desarrollo Empresarial',        'negocio',   'Crea tu LLC y haz crecer tu negocio.',                      'building',    '#9A6B00', 4, 'coming_soon'),
(5, 'Comunidad & Vida Local',        'comunidad', 'Encuentra tu gente, eventos y servicios cerca de ti.',      'users',       '#12B8A6', 5, 'coming_soon'),
(6, 'Academia de Certificaciones',   'academia',  'Certifícate en carreras de alta demanda.',                  'graduation',  '#102A43', 6, 'coming_soon'),
(7, 'Conexión Laboral',              'empleo',    'Empleos que coinciden con tu perfil.',                      'briefcase',   '#0F766E', 7, 'coming_soon');
```

### 7.5 Eventos de analítica mínimos (v1)

| Evento | Propiedades |
|---|---|
| `landing_viewed` | `lang`, `referrer` |
| `landing_cta_clicked` | `cta_position` |
| `onboarding_started` | — |
| `onboarding_step_completed` | `step`, `duration_ms`, `branch` |
| `onboarding_abandoned` | `last_step`, `branch` |
| `onboarding_completed` | `duration_ms`, `interests_count`, `location_context` |
| `onboarding_skipped` | `at_step` |
| `location_branch_selected` | `context`, `was_ip_prefilled`, `changed_from_prefill` |
| `location_scope_selected` | `context`, `scope_value` (estado o país) |
| `other_option_used` | `field_name`, `has_text` |
| `situation_declined` | `branch` |
| `seeking_for_selected` | `value` |
| `location_context_changed` | `from`, `to`, `trigger_source`, `days_since_signup` |
| `transition_banner_shown` | `days_since_signup` |
| `transition_banner_clicked` | — |
| `ranking_computed` | `top_module_id`, `top_score`, `location_context` |
| `paywall_viewed` | `top_module_id`, `location_context`, `plan_preselected` |
| `plan_selected` | `plan_type`, `switched_from` |
| `checkout_started` | `plan_type`, `amount` |
| `checkout_method_chosen` | `method` (`apple_pay` \| `google_pay` \| `card`) |
| `checkout_abandoned` | `plan_type`, `last_field` |
| `payment_succeeded` | `plan_type`, `amount`, `time_from_paywall_ms` |
| `payment_failed` | `plan_type`, `decline_code` |
| `subscription_canceled` | `plan_type`, `days_active`, `reason` |
| `hero_card_clicked` | `module_id` |
| `hero_card_dismissed` | `module_id`, `dismiss_count` |
| `module_opened` | `module_id`, `position_in_grid`, `was_recommended` |
| `interest_signal_submitted` | `module_id`, `has_free_text` |

El evento clave del MVP es `module_opened` con `was_recommended`. Esa proporción es la precisión real del motor.

---

## 8. ESTRATEGIA DE PRESENTACIÓN A INVERSIONISTAS (SLIDES & NARRATIVA)

Para la fase de levantamiento de capital (**$650,000 USD — Capital Semilla**), la estructura del Pitch Deck de 11 diapositivas se sintetiza en la siguiente narrativa financiera:

| # | Slide | Contenido |
|---|---|---|
| 1 | **Portada** | ANDEX — La Super App del Migrante Hispano en EE. UU. |
| 2 | **El Problema** | Fragmentación de servicios, cobros abusivos y falta de orientación confiable ($3,500 USD gastados al año por familia en procesos ineficientes). |
| 3 | **La Solución** | Ecosistema "All-in-One" (7 Módulos + Servicios Directos + Comunidad). |
| 4 | **Tamaño de Mercado** | TAM $1.9 billones (PIB Hispano EE. UU.) \| SAM 15M Inmigrantes de 1ra Generación \| SOM 250k Usuarios en Utah/Corredores Clave. |
| 5 | **Factor Diferencial** | *Community-Led Growth*: adquisición con CAC bajo a través del feed comunitario, directorio local y bolsa de trabajo. |
| 6 | **Modelo de Monetización** | SaaS Recurrente Escalonado ($14 a $45/mes) + Servicios Directos (High-Ticket). |
| 7 | **Go-To-Market** | Estrategia Piloto Utah (eventos presenciales, ferias de ayuda, marketing digital hiper-localizado). |
| 8 | **Ecosistema & Alianzas** | Sinergia con USA Latino Prime y Starbiz Academy. |
| 9 | **Equipo Fundador** | +10 años en banca/cooperativas, MBA, formación ejecutiva en Harvard y experiencia de asentamiento real en Utah. |
| 10 | **Proyección Financiera** | Año 1: $450K ARR → Año 3: $8.5M ARR. |
| 11 | **La Oferta (The Ask)** | $650,000 USD por 15–20% equity: desarrollo tecnológico (40%), marketing Utah (30%), legal/notaría (15%), soporte (15%). |

**Nota sobre el Slide 4:** en español, *trillion* del inglés equivale a **billón**. El PIB hispano de EE. UU. son ~1.9 **billones** de dólares, no trillones. Corregido en esta versión.

---

## 9. INSTRUCCIONES PARA EL EQUIPO DE INGENIERÍA

**Fuente de verdad visual:** `andex-prototipo-visual.html`. Cualquier decisión de espaciado, color, jerarquía o copy que no esté escrita en este documento se resuelve mirando el prototipo.

### Sprint 1 — Fundación visual y conversión

1. **Sistema de diseño** como tokens (CSS variables + config de Tailwind), incluyendo modo oscuro, el componente `<RouteBar />` (§2.8) y la matriz de contraste de §2.1.1 verificada automáticamente en CI.
2. **Landing Page** bilingüe con el hero-bifurcación (§3.1.1) y presupuesto de performance (LCP < 2.5 s en 4G, < 300 KB).
3. **Auth:** registro, login, magic link, recuperación de contraseña.
4. **Esquema de base de datos completo con RLS activo desde el día uno.**

### Sprint 2 — Inteligencia y perfilado

5. **Micro-Entrevista bifurcada de 5 pasos** con guardado parcial, patrón "Otro" (§3.2.1), coherencia entre ramas (§3.2.2) y opción de saltar desde el paso 3.
6. **Motor de recomendación** aislado en `/lib/recommendation-engine`, sin dependencias de UI, con tests unitarios que cubran los casos borde de §4.7.
7. **Tablas `module_relevance` y `external_resources`** pobladas con el seed de §7.4.
8. **Eventos de analítica** de §7.5 instrumentados de `landing_viewed` a `ranking_computed`.

### Sprint 3 — Monetización

9. **Paywall personalizado** (§3.4) con eco real del ranking, ambos planes y el sello de tarifa congelada.
10. **Checkout Stripe:** Elements, Apple Pay, Google Pay. Webhooks idempotentes contra `stripe_events`.
11. **Gestión del ciclo de vida:** estados `active`, `past_due`, `canceled`; cancelación en un clic desde Perfil; recordatorio 48 h antes de renovación; recibo automático.
12. **Registro de consentimientos** en `user_consents` con versión de términos, timestamp e IP.
13. **Eventos de pago** de §7.5 (`paywall_viewed` a `subscription_canceled`).

### Sprint 4 — Shell y entrega

14. **Dashboard Adaptativo:** hero card, grid reordenable, sidebar contextual, botón "No es lo que busco", modos `in_us` / `pre_arrival` (§4.2.1).
15. **Banner y flujo de transición "¿Ya llegaste?"** (§3.2.3).
16. **Pantallas placeholder** con captura de interés en `module_interest_signals`.
17. **Perfil editable:** cambiar ubicación, intereses y objetivo, con recálculo del ranking.

### Calidad de código

- **Arquitectura desacoplada:** la sustitución de enlaces externos por servicios automatizados internos en Fase 2 no debe requerir reescribir el frontend.
- **Motor de recomendación sin dependencias de UI**, para poder cambiarlo por una llamada a API de IA sin tocar componentes.
- **Un solo componente de paywall** que soporte las tres variantes de §3.4.8 (cobro directo, prueba de 7 días, freemium) por configuración, no por código nuevo.
- **Piso de accesibilidad no negociable:** responsive hasta 320 px, foco de teclado visible, `prefers-reduced-motion` respetado, targets táctiles ≥ 44 px, texto ≥ 16 px, contraste AA verificado.
- **Sin datos sensibles en URLs.** Nunca `?status=asilo` ni equivalentes.
- **ANDEX nunca toca datos de tarjeta.** Todo pasa por Stripe Elements.
- **Tests obligatorios** para el motor de reglas, el flujo completo de onboarding y los webhooks de Stripe.

### Definición de "Terminado" para el MVP

- [ ] Un usuario nuevo llega a la landing, elige su rama, se registra, completa la entrevista, paga y ve su dashboard personalizado en menos de 6 minutos.
- [ ] El mismo flujo funciona íntegro en ambas ramas (`in_us` y `pre_arrival`) con contenido distinto.
- [ ] Los 7 módulos son visibles y accesibles para todo usuario con suscripción activa.
- [ ] El orden del grid cambia demostrablemente entre dos perfiles distintos.
- [ ] El paywall muestra el módulo #1 real del usuario, no un texto genérico.
- [ ] Cancelar toma un clic desde Perfil y no requiere contactar a nadie.
- [ ] Un webhook de Stripe duplicado no duplica lógica de negocio.
- [ ] Todos los eventos de §7.5 se registran correctamente.
- [ ] RLS activo y verificado con un test que intente leer datos de otro usuario.
- [ ] Contraste AA en todas las pantallas, verificado automáticamente.
- [ ] Funciona en un Android de gama baja con conexión 3G.

---

## 10. RIESGOS Y DECISIONES ABIERTAS

| # | Riesgo | Impacto | Mitigación / Estado |
|---|---|---|---|
| R1 | **Paywall antes de entregar valor.** En Fase 1 el usuario paga por contenido guiado y enlaces a portales gratuitos. | Alto — churn M2 y riesgo reputacional | Métricas de §0.6 con umbrales de decisión; plan de contingencia pre-diseñado en §3.4.8 |
| R2 | **La promesa de tarifa congelada es vinculante.** | Medio — restringe pricing futuro | Fijar `stripe_price_id` por suscripción; validar copy con asesoría legal antes de publicar |
| R3 | **Hero interrogativo puede convertir peor en tráfico frío.** | Medio | Test A/B contra hero afirmativo en el primer mes (§3.1.1) |
| R4 | **Servicios directos sin habilitación regulatoria.** | Alto — legal | Fuera del alcance v1. Matriz de compliance en Anexo B |
| R5 | **Datos migratorios sensibles.** Estatus, nacionalidad, ubicación. | Alto — seguridad y confianza | `situation_tag` opcional con "Prefiero no responder"; `external_redirect_logs` sin `user_id`; RLS obligatorio; política pública de solicitudes gubernamentales pendiente de redactar |
| R6 | **Mantenimiento de enlaces externos.** URLs y formularios oficiales cambian. | Alto en Fase 2 | `external_resources.last_verified_at` visible; job semanal de verificación; rol de content ops presupuestado |
| R7 | **Siete módulos simultáneos.** Riesgo clásico de super app. | Alto | MVP entrega el shell, no los módulos. Se construyen de uno en uno según demanda medida |
| R8 | **Contexto de mercado.** El segmento pre-llegada depende de flujos migratorios volátiles. | Medio-Alto | El ICP principal debe ser `in_us` establecido, no recién llegado |

### Decisiones abiertas

1. **Precio del plan mensual.** $14 es hipótesis, no validación. Probar $9 / $14 / $19 antes de congelar.
2. **Prueba gratuita.** No entra en v1. Se activa si se cumple el umbral de §3.4.8.
3. **Ciudad en el onboarding.** Hoy se pide al abrir M5. Reevaluar si el directorio local resulta ser el gancho principal.
4. **Idioma inglés.** El toggle existe en el diseño; el contenido traducido queda pendiente de priorización.

---

## 11. REGISTRO DE CAMBIOS POSTERIORES

> Espacio reservado. Toda modificación de alcance debe anotarse aquí **antes** de llegar al backlog, con fecha, quién la pidió y qué sección del documento cambia.

| Fecha | Cambio | Sección afectada | Solicitado por |
|---|---|---|---|
| — | — | — | — |

---

## ANEXO A — CAMBIOS RESPECTO A LA VERSIÓN 1.0

| Cambio | Motivo |
|---|---|
| Sección 0 añadida | Delimitar el alcance del MVP |
| Sección 4 añadida | El dashboard adaptativo necesitaba especificación propia |
| Paleta ampliada con tokens `-deep` y `-soft` | Los colores originales no cumplían WCAG AA para texto |
| `#627D98` → `#52708C` para texto secundario | 4.28:1 no pasa AA; 5.18:1 sí |
| Escala tipográfica, espaciado e inventario de componentes | No existían |
| Motor de recomendación especificado con pesos y scores | Antes solo era un mapeo 1:1 |
| Paywall movido a v2 | Fuera del alcance del MVP |
| `user_onboarding_profile` recibió PRIMARY KEY | No tenía; el esquema fallaba |
| Tablas `user_module_ranking`, `module_interest_signals`, `user_consents`, `analytics_events`, `stripe_events` | Requeridas por el MVP |
| `external_redirect_logs` sin `user_id` | Minimización de datos sensibles |
| Sección RLS añadida | Supabase sin RLS deja los datos públicos |
| Índices, `updated_at`, `deleted_at` | Faltaban en todas las tablas |
| "Trillones" → "billones" | *Trillion* ≠ trillón |
| "INTELEGENTE" → "INTELIGENTE", "Externa" → "Externos" | Erratas |

### Versión 1.2 — Bifurcación dentro/fuera de EE. UU.

| Cambio | Motivo |
|---|---|
| Paso 2 convertido en bifurcación (`location_context`) | ANDEX sirve a dos poblaciones con problemas distintos |
| Catálogos de situación separados por rama | Las opciones de un pre-arrival no aplican a un residente |
| Patrón "Otro" + texto libre especificado en 3.2.1 | Requisito de producto + fuente de investigación |
| Paso 3.5 "¿Para quién buscas ayuda?" añadido | El caso "estoy aquí, mi familia allá" se perfilaba mal |
| Tabla `module_relevance` | Mismo módulo, distinta presentación por contexto, sin duplicar código |
| Tabla `external_resources` con `scope_type` | DMV es por estado, consulado es por país |
| Tabla `location_context_changes` | Medir la transición pre-arrival → in_us |
| `CONSTRAINT chk_location_coherence` | Impedir estado de EE. UU. + país extranjero simultáneos |
| Motor arranca desde `BASE_RELEVANCE` por contexto | Evita recomendar "Empleo en Utah" a alguien en Bogotá |
| `contentVariant` en `ModuleScore` | Un módulo, dos versiones de contenido |
| Evento de transición "¿Ya llegaste?" (3.2.3) | Momento de mayor necesidad del ciclo de vida |
| Anexo C con catálogos y enums | El equipo necesitaba las listas concretas |

### Versión 1.3 — Monetización y sistema visual (FINAL MVP)

| Cambio | Motivo |
|---|---|
| **Paywall movido de v2 al MVP** (§3.4) | El punto de cobro define el final del embudo; no se puede validar conversión sin él |
| Checkout Stripe añadido al alcance | Consecuencia directa de lo anterior |
| §3.4 reescrita completa: anatomía, personalización obligatoria, compliance, casos borde, plan de contingencia | Era un párrafo; ahora es una especificación construible |
| §3.1.1 — el hero de la landing *es* la bifurcación | Decisión de diseño validada en prototipo; demuestra la promesa en vez de describirla |
| §2.8 — elemento firma "La Ruta" | El sistema necesitaba un elemento memorable que codifique información real |
| §2.9 — el sello, único elemento decorativo | Restricción explícita para que no prolifere |
| §2.10 — prototipo como fuente de verdad visual | El equipo necesita dónde mirar cuando el documento no alcanza |
| Métricas de §0.6 ampliadas con el embudo de pago y umbrales de decisión | Sin umbral definido, ninguna métrica cambia una decisión |
| §10 — Riesgos y decisiones abiertas | El documento no tenía registro de riesgos |
| Sprints reorganizados a 4, con monetización en Sprint 3 | El alcance creció |
| `subscriptions` y `stripe_events` movidas a MVP | Consecuencia del paywall |
| 9 eventos de analítica de pago añadidos | Medir el embudo completo |

---

## ANEXO B — NOTA REGULATORIA SOBRE SERVICIOS DIRECTOS

Los servicios *Done-for-You* mencionados en la sección 5 (llenado de formularios migratorios, tramitación de ITIN, constitución de LLC, preparación de impuestos, notarización, traducciones y facilitación de inversiones) requieren habilitaciones específicas que deben resolverse **antes** de ofrecerse comercialmente.

Existe una matriz de compliance separada con el detalle de cada credencial, tiempo de trámite, costo y renovación. Dos puntos que afectan directamente al producto y al copy:

1. **La palabra "notario" no debe aparecer en ningún texto en español de la aplicación.** En EE. UU. un *notary public* no es un abogado, y usar el término en español está expresamente restringido por las leyes estatales de consultoría migratoria.
2. **Ninguna tasa de rendimiento financiero debe quedar fija en código o en copy.** Debe consumirse de una fuente con fecha de actualización visible.

---

*Documento vivo. Cualquier cambio de alcance debe reflejarse en la Sección 0 y registrarse en la Sección 11 antes de llegar al backlog.*

---

## ANEXO C — CATÁLOGOS DE OPCIONES DEL WIZARD

### C.1 Estados de EE. UU. — orden de presentación

**Bloque 1 — Piloto (destacado, separador visual):**
Utah

**Bloque 2 — Estados de mayor población hispana (acceso rápido):**
California · Texas · Florida · Nueva York · Arizona · Illinois · Nueva Jersey · Colorado · Nevada · Georgia · Carolina del Norte · Washington

**Bloque 3 — Todos los demás, alfabéticos:**
Los 50 estados + Washington D.C. + Puerto Rico.

**Implementación:** componente de búsqueda con teclado (`combobox`), no un `<select>` nativo de 52 entradas. En mobile, buscar escribiendo es más rápido que hacer scroll. Guardar código ISO de 2 letras, nunca el nombre.

### C.2 Países de residencia — orden de presentación

**Bloque 1 — Latinoamérica y España (acceso rápido):**
México · Guatemala · El Salvador · Honduras · Nicaragua · Costa Rica · Panamá · Colombia · Venezuela · Ecuador · Perú · Bolivia · Chile · Argentina · Uruguay · Paraguay · Brasil · República Dominicana · Cuba · España

**Bloque 2 — Resto del mundo, alfabético.**

**Opción final:** *"Mi país no está en la lista"* → campo de texto libre.

Guardar código ISO 3166-1 alpha-2. El país determina: consulado aplicable, zona horaria, formato de fecha, código telefónico y moneda de referencia para costos de trámite.

### C.3 Enums canónicos

```typescript
type LocationContext = 'in_us' | 'pre_arrival';

type TimeInUSTag =
  | 'menos_6_meses' | '6m_2a' | '2a_5a' | 'mas_5a' | 'no_responde';

type TravelPlanTag =
  | 'fecha_confirmada' | 'este_ano' | 'explorando' | 'no_se';

type SituationTagInUS =
  | 'recien_llegado' | 'tramite_proceso' | 'permiso_trabajo'
  | 'residente' | 'ciudadano' | 'visa_temporal' | 'resolviendo'
  | 'other' | 'declined';

type SituationTagPreArrival =
  | 'visa_turismo' | 'visa_estudiante' | 'visa_aprobada'
  | 'visa_negada' | 'explorando' | 'reunificacion'
  | 'inversion_remota' | 'other' | 'declined';

type SeekingFor = 'self' | 'family' | 'both';
```

### C.4 Reglas de localización derivadas

| Dato | Se deriva de | Uso |
|---|---|---|
| Zona horaria | Estado o país | Notificaciones, eventos, recordatorios |
| Formato de fecha | País | `pre_arrival` LatAm usa DD/MM/AAAA; EE. UU. usa MM/DD/AAAA |
| Código telefónico | País | Prellenado del campo teléfono |
| Moneda de referencia | País | Mostrar costo de trámite en USD **y** moneda local estimada |
| Consulado aplicable | País de residencia | Enlaces del M2 |
| Portal DMV / corporaciones | Estado | Enlaces del M2 y M4 |

> **Cuidado con la moneda:** mostrar el costo de un trámite convertido a la moneda local es útil, pero requiere una fuente de tipo de cambio con fecha visible. Nunca fijar una tasa en código.

---

## ANEXO D — ARTEFACTOS DEL PROYECTO

| Archivo | Qué es | Cómo se usa |
|---|---|---|
| `ANDEX-PRD-v1.3.md` | Este documento. Especificación de producto. | Fuente de verdad de alcance, lógica y datos |
| `andex-prototipo-visual.html` | Prototipo visual de las 12 pantallas, sin backend | Fuente de verdad visual. Referencia de espaciado, color, copy y comportamiento |
| `andex-prototipo-onboarding.html` | Prototipo anterior, solo wizard y dashboard | Histórico. Superado por el anterior |

**Orden de precedencia ante una discrepancia:**

1. Lo escrito en este PRD gana sobre el prototipo en **lógica, datos y reglas de negocio**.
2. El prototipo gana sobre el PRD en **decisiones visuales** no especificadas aquí.
3. Ante conflicto real, se resuelve y se documenta en §11 antes de escribir código.

---

*Documento vivo. Cualquier cambio de alcance debe reflejarse en la Sección 0 y registrarse en la Sección 11 antes de llegar al backlog.*
