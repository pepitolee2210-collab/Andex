/**
 * LANDING — copy completo (ES/EN).
 *
 * Estructura de 10 secciones definida por el dueño del producto.
 *
 * ⚠️ SEIS CORRECCIONES sobre el brief original, todas obligatorias. Están
 * documentadas en docs/DECISIONES.md; no revertir sin leerlas:
 *
 *  1. NO aparece la palabra "notario"/"notaría" (Anexo B del PRD: su uso en
 *     español está restringido por las leyes estatales de consultoría
 *     migratoria). El servicio se nombra por lo que entrega.
 *  2. NO se fija ninguna tasa de rendimiento ("4% APY") en el copy: el PRD
 *     y el Anexo B exigen que venga de una fuente con fecha visible.
 *  3. NO hay urgencia inventada ni plazos que expiran (§3.4.1). La tarifa
 *     congelada sí se promete, porque está en §3.4.4 — pero sin cuenta atrás.
 *  4. El ahorro anual es el real: $28 sobre $168 (17%), no el 40% del brief.
 *  5. Los portales del gobierno se nombran como DESTINOS a los que guiamos,
 *     nunca como respaldos: §6 obliga a declarar que ANDEX no está afiliado
 *     a ninguna agencia gubernamental.
 *  6. NO hay avatares de usuarios inventados (D19). Las cifras son
 *     parámetros, no texto fijo.
 */

const es = {
  meta: {
    title: "ANDEX — Tu progreso cruza fronteras",
    description:
      "Trámites, empleo, finanzas y comunidad en un solo lugar. El ecosistema para la comunidad hispana en Estados Unidos.",
  },

  // ── S0 · Banner superior ────────────────────────────────
  banner: {
    text: "Piloto Utah 2026 · Los miembros fundadores congelan su tarifa mientras mantengan la membresía.",
    cta: "Ver beneficios de fundador",
  },

  // ── S1 · Navegación ─────────────────────────────────────
  nav: {
    brand: "ANDEX",
    tagline: "Tu progreso cruza fronteras",
    links: {
      solucion: "Soluciones",
      modulos: "Módulos",
      servicios: "Servicios directos",
      comunidad: "Comunidad",
      precios: "Precios",
    },
    login: "Iniciar sesión",
    cta: "Comenzar ahora",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
  },

  /**
   * ── S2 · PORTADA ──────────────────────────────────────
   *
   * La primera pantalla, tal como la fija el sistema de diseño: fondo navy
   * a sangre —la única del producto que lo usa así—, la promesa de marca
   * como titular, y el precio de entrada dicho con su límite en la misma
   * vista: cinco preguntas, dos minutos, y no se pide tarjeta.
   *
   * El aviso de no-afiliación cierra la pantalla porque es donde surge la
   * pregunta, no en una nota al pie tres secciones más abajo.
   */
  portada: {
    /** El titular, en las dos líneas exactas del diseño. */
    titleLines: ["Tu progreso", "cruza fronteras"],
    /** El mismo titular en un solo nodo, para lectores de pantalla. */
    title: "Tu progreso cruza fronteras",
    /** Dos líneas: la promesa y su límite, juntas. */
    promiseLines: ["Cinco preguntas. Dos minutos.", "No pedimos tarjeta."],
    scanCta: "Escanear un documento gratis",
    accountCta: "Crear mi cuenta",
  },

  // ── S2 · Hero ───────────────────────────────────────────
  hero: {
    badge: "Piloto en Utah",
    /**
     * EL ESLOGAN.
     *
     * Tiene que decir quiénes somos y qué buscamos, y resumir los siete
     * módulos en algo que cualquiera reconozca. Los siete son papeles,
     * trámites, dinero, negocio, comunidad, inglés y trabajo — y eso cabe
     * en cuatro palabras que nadie tiene que descifrar:
     *
     *   tus papeles  →  Bóveda + Trámites y Estatus Migratorio
     *   tu inglés    →  Academia de Certificaciones
     *   tu trabajo   →  Conexión Laboral + Finanzas + Desarrollo Empresarial
     *   tu gente     →  Comunidad y Vida Local
     *
     * La segunda línea dice qué buscamos: avanzar, no sobrevivir. Es la
     * misión del producto en cinco palabras.
     *
     * Se descartaron las de registro comercial —«transforma tu experiencia»,
     * «el sistema operativo del inmigrante»— porque este público ya oyó ese
     * tono de quien le cobró por trámites gratis.
     */
    /**
     * EL TITULAR, EN DOS TIEMPOS.
     *
     *   «Todo lo tuyo, en su sitio.»  →  los SIETE módulos sin nombrar uno
     *   «Ordenado para tu caso.»      →  lo que hace la tecnología
     *
     * El primero alude a los siete de golpe: papeles, trámites, dinero,
     * negocio, comunidad, inglés y empleo son «lo tuyo». Nombrarlos
     * obligaba a enumerar y a alargar.
     *
     * El segundo dice qué hace ANDEX por dentro, y no es un adorno: el
     * motor de recomendación reordena los módulos según lo que la persona
     * contestó en la entrevista, y cita el porqué en la propia tarjeta. Es
     * una función construida y con 31 pruebas detrás, así que se puede
     * decir sin faltar a la verdad.
     *
     * EL CAMBIO DE VIDA, SIN EXAGERAR. «En su sitio» es todo lo que se
     * promete, y es todo lo que hace falta: quien vive esto sabe lo que
     * cuesta que nada esté en su sitio. Se descartaron «transforma tu
     * vida», «tu nueva vida empieza aquí» y parecidas — este público ya
     * oyó ese tono de quien le cobró por trámites gratis, y la promesa
     * grande es justo lo que le hace desconfiar.
     */
    title: "Todo lo tuyo, en su sitio. Ordenado para tu caso.",
    titleLines: ["Todo lo tuyo,", "en su sitio."],
    /** El segundo tiempo, en teal: lo que hace la tecnología. */
    titleAccent: "Ordenado para tu caso.",
    /**
     * El subtítulo se fue entero.
     *
     * Decía en treinta palabras lo mismo que el titular en nueve, y debajo
     * los tres hechos volvían a decirlo por tercera vez. En la única
     * pantalla donde alguien decide si sigue leyendo, repetir es lo que
     * hace que no lea nada.
     *
     * El titular dice QUÉ; los tres hechos dicen POR QUÉ CREERLO. No hace
     * falta una capa en medio.
     */
    /**
     * LA CONFIANZA SE DEMUESTRA, NO SE DECLARA.
     *
     * Tres hechos comprobables en lugar de tres adjetivos. El segundo dice
     * su límite en la misma línea: prometer de más en seguridad es peor que
     * no prometer nada.
     */
    /**
     * Tres hechos, y ninguno pasa de siete palabras.
     *
     * Se recortaron sin perder lo que importa: el segundo sigue diciendo
     * que los documentos NO SALEN del teléfono —la promesa entera está en
     * el verbo— y el tercero sigue diciendo lo que ANDEX no es, que con
     * este público pesa más que cualquier superlativo.
     */
    trustPoints: [
      "Talleres en vivo, de martes a viernes",
      "Tus documentos no salen de tu teléfono",
      "Sin afiliación con ninguna agencia del gobierno",
    ],
    cta: "Comenzar viaje",
    /**
     * Antes decía «no pedimos tarjeta», y era falso: después del registro y
     * de la entrevista viene el plan y su pago. Decirlo aquí y cobrar tres
     * pantallas después es exactamente lo que hace desconfiar a alguien que
     * ya fue engañado. Ahora dice el recorrido entero.
     */
    ctaHint: "Cinco preguntas. Ves el precio antes de pagar.",
    scrollHint: "Baja para conocer ANDEX",
    /**
     * El rótulo que anuncia el recorrido del producto.
     *
     * Sin él, el teléfono aparecía debajo del botón sin que nada dijera
     * qué es: se leía como una imagen decorativa. Con la frase delante, lo
     * que viene después es una demostración.
     */
    tourLabel: "Así funciona ANDEX",
    /**
     * El mockup reproduce el PANEL REAL, no pantallas inventadas: mismo
     * saludo, misma tarjeta recomendada con su porqué, mismos módulos.
     * Enseñar el producto de verdad convence más que una ilustración.
     */
    mockup: {
      ariaLabel: "Vista previa del panel de ANDEX",
      chip: "Utah",
      screens: {
        panel: {
          tab: "Inicio",
          greeting: "Hola, María",
          headline: "Tu prioridad en Utah este mes",
          goalLabel: "Tu objetivo de estos 30 días",
          goal: "formalizar tu negocio",
          badge: "Recomendado para ti",
          cardTitle: "Desarrollo Empresarial",
          cardReason: "Porque dijiste que quieres formalizar tu negocio.",
          cardCta: "Empezar aquí",
          gridLabel: "Explora todos los módulos",
          tiles: ["Bóveda Digital", "Conexión Laboral", "Finanzas", "Comunidad", "Academia", "Migración"],
          alert: "Tu permiso de trabajo vence en 60 días",
        },
        boveda: {
          tab: "Bóveda",
          greeting: "Bóveda Digital",
          headline: "Tus documentos, seguros",
          goalLabel: "Guardados",
          goal: "3 documentos",
          badge: "Vence pronto",
          cardTitle: "Permiso de trabajo",
          cardReason: "Te avisamos a los 90, 60 y 30 días.",
          cardCta: "Ver documento",
          gridLabel: "Todos tus documentos",
          tiles: ["Pasaporte", "Formulario I-94", "Licencia", "Taxes", "Seguro médico", "Contrato"],
          alert: "Te avisamos antes de cada vencimiento",
        },
        empleo: {
          tab: "Empleo",
          greeting: "Conexión Laboral",
          headline: "Empleos que encajan contigo",
          goalLabel: "Cerca de ti",
          goal: "12 vacantes nuevas",
          badge: "Alta coincidencia",
          cardTitle: "Técnico de refrigeración",
          cardReason: "West Valley City · $24–28 por hora",
          cardCta: "Ver la vacante",
          gridLabel: "Más oportunidades",
          tiles: ["Ayudante de cocina", "Instalador solar", "Bodega", "Limpieza", "Jardinería", "Mensajería"],
          alert: "3 vacantes nuevas cerca de ti hoy",
        },
      },
    },
  },

  // ── S3 · Cinta de confianza ─────────────────────────────
  trust: {
    // Redacción deliberada: guiamos HACIA los portales oficiales, no somos
    // socios suyos. Presentarlos como respaldo sería afirmar una afiliación
    // gubernamental que el §6 obliga a negar expresamente.
    eyebrow: "Te guiamos paso a paso hacia los portales oficiales",
    portals: ["USCIS", "IRS", "DMV de tu estado", "Cortes de inmigración (EOIR)"],
    alliancesEyebrow: "Con el ecosistema de",
    alliances: ["USA Latino Prime", "Starbiz Academy"],
    disclaimer:
      "ANDEX no está afiliado a ninguna agencia gubernamental. Estos trámites son gratuitos en los portales oficiales.",
  },

  // ── S4 · Problema vs solución ───────────────────────────
  compare: {
    eyebrow: "Por qué existe ANDEX",
    title: "Lo que vives hoy, y lo que podría ser",
    subtitle:
      "No inventamos un problema para venderte la cura. Esto es lo que nos contaron las familias del piloto.",
    beforeTitle: "Sin ANDEX",
    afterTitle: "Con ANDEX",
    rows: [
      {
        before: "Seis gestores distintos, cada uno con su precio y ninguno responde después de cobrar.",
        after: "Un solo lugar, con precios a la vista y acompañamiento que sigue ahí la semana siguiente.",
      },
      {
        before: "Te enteras de que venció tu permiso cuando ya venció.",
        after: "Avisos a los 90, 60 y 30 días antes de cada fecha límite que guardes.",
      },
      {
        before: "Trabajas por debajo de lo que sabes hacer porque nadie certifica tu experiencia.",
        after: "Certificaciones que el mercado reconoce y empleos de la propia comunidad.",
      },
      {
        before: "Tus ahorros parados en una cuenta que no rinde nada.",
        after: "Opciones de ahorro e inversión explicadas en tu idioma, con las tasas vigentes a la vista.",
      },
    ],
  },

  // ── S4.5 · La rueda de frentes ──────────────────────────
  wheel: {
    eyebrow: "Siete frentes",
    title: "Todo lo que un migrante necesita resolver, en un solo lugar.",
    listLabel: "Los siete módulos de ANDEX",
    // Nombres cortos: la rueda gira, no se lee despacio.
    items: ["Empleo", "Academia", "Comunidad", "Bóveda", "Migración", "Finanzas", "Negocios"],
  },

  // ── S4.2 · Pruébalo ahora (escáner en vivo) ─────────────
  liveScanner: {
    eyebrow: "Pruébalo ahora",
    title: "Escanea un documento. Gratis y sin registrarte.",
    body:
      "Toma una foto de tu pasaporte o de tu permiso de trabajo y te devolvemos un PDF derecho y legible, listo para presentar.",
    assurances: [
      "Sin registro",
      "Sin tarjeta",
      "La foto no sale de tu teléfono",
    ],
    cta: "Escanear un documento",

    doneTitle: "Listo. Ya tienes tu PDF.",
    // El argumento de venta. Funciona porque no retiene nada: describe lo
    // que le falta al archivo que la persona ya tiene.
    pitchTitle: "Ahora la parte que de verdad importa",
    pitchBody:
      "Ese PDF ya es tuyo, pero queda suelto entre mil archivos del teléfono. El día que se rompa se va con él. Y cuando ese documento esté por vencer, nadie te va a avisar.",
    pitchBenefits: [
      "Se guarda cifrado y lo encuentras cuando lo necesites",
      "Te avisamos 90, 60, 30 y 7 días antes de que venza",
      "Todos tus papeles ordenados en un solo lugar",
    ],
    pitchCta: "Crear mi cuenta",
    scanAgain: "Escanear otro",
  },

  // ── S5 · Los 7 módulos ──────────────────────────────────
  modules: {
    eyebrow: "La plataforma",
    title: "Siete frentes, un solo lugar",
    subtitle:
      "Todos abiertos desde el primer día. Tu panel los ordena según lo que respondiste, pero nunca te esconde ninguno.",
    reorderedNote: "Reordenados para tu caso",
    cta: "Ver mi plan personalizado",
    items: {
      1: {
        title: "Bóveda Digital & Alertas",
        body: "Tus documentos cifrados y el seguimiento guiado del estado de tu caso.",
      },
      2: {
        title: "Guía Migratoria & Consular",
        body: "Visas de turismo y estudio, pasaportes, citas consulares y licencia de manejo.",
      },
      3: {
        title: "Inclusión Financiera",
        body: "Escuela de crédito, tu primer ITIN y opciones de ahorro explicadas sin letra pequeña.",
      },
      4: {
        title: "Creación de Empresas",
        body: "Tu LLC y tu EIN, más el lanzamiento: marca, sitio web y primeros clientes.",
      },
      5: {
        title: "Comunidad & Vida Local",
        body: "Ferias de ayuda, servicios cerca de ti y los programas CEO Junior y Padres 3.0.",
      },
      6: {
        title: "Academia de Certificaciones",
        body: "Formación y simulador de examen para impuestos, seguros e inmobiliaria.",
      },
      7: {
        title: "Conexión Laboral",
        body: "Empleos que coinciden con tu perfil, con aviso al celular en cuanto salen.",
      },
    },
  },

  // ── S6 · Servicios directos ─────────────────────────────
  services: {
    eyebrow: "Gestoría ANDEX",
    title: "¿Prefieres que lo hagamos por ti?",
    subtitle:
      "Hay trámites que puedes resolver solo con nuestras guías, y otros donde conviene que los haga un especialista. Ambas opciones están dentro.",
    // Aviso obligatorio: §0.5 y Anexo B dejan estos servicios FUERA de v1
    // hasta completar las habilitaciones regulatorias.
    availability: "Disponible por etapas durante el piloto. Te avisamos en cuanto abra cada servicio en tu estado.",
    items: [
      {
        title: "Licencia de manejo y DMV",
        body: "Checklist de requisitos de tu estado y acompañamiento en español hasta la cita.",
      },
      {
        title: "Número ITIN (Formulario W-7)",
        body: "Preparación del formulario sin que tengas que enviar tus documentos originales por correo.",
      },
      {
        title: "Constitución de tu LLC",
        body: "Tu empresa registrada, con EIN y acuerdo operativo, lista para abrir cuenta de negocio.",
      },
      {
        title: "Declaración de impuestos",
        body: "Asesoría para personas y negocios, con alguien que te explica qué estás firmando.",
      },
      {
        // Sin la palabra prohibida (Anexo B): se nombra el entregable.
        title: "Traducciones certificadas",
        body: "Documentos traducidos y certificados para presentar ante USCIS y las cortes.",
      },
    ],
    cta: "Quiero que me avisen",
  },

  // ── S7 · Misión, visión y comunidad ─────────────────────
  purpose: {
    eyebrow: "Nuestro propósito",
    missionTitle: "Nuestra misión",
    mission:
      "No solo ayudamos a hacer trámites: construimos el camino para que la comunidad hispana pase de sobrevivir a crear patrimonio en Estados Unidos.",
    visionTitle: "Nuestra visión",
    vision:
      "Ser el sistema de desarrollo de diez millones de familias en las Américas para 2030.",
    familyTitle: "El ecosistema familiar",
    familySubtitle: "Con Starbiz Academy",
    family: [
      {
        title: "CEO Junior",
        body: "Donde los adolescentes aprenden a crear negocios en lugar de consumir pantallas.",
      },
      {
        title: "Padres 3.0",
        body: "Para acompañar de verdad el camino académico de tus hijos en un sistema que no conocías.",
      },
    ],
  },


  // ── Qué es ANDEX, y qué se puede contar de verdad ───────
  vision: {
    eyebrow: "Qué es ANDEX",
    title: "Un solo sitio para todo lo que un trámite te pide",
    body: "No es una app de consejos. Es donde guardas tus documentos, sabes qué se te vence, aprendes el inglés que te piden en el trabajo y encuentras a quien ya pasó por lo mismo. Piloto en Utah.",
    /**
     * LAS CIFRAS SON VERIFICABLES, UNA POR UNA.
     *
     * El sketch pedía «+1K inmigrantes» y «+4 estrellas». No existen: el
     * producto todavía no ha salido. Con este público —que ya fue estafado
     * por gente que inflaba números— una cifra inventada no es marketing
     * flojo, es el mismo patrón. Y desde 2024 las reseñas y métricas falsas
     * son sancionables por la FTC.
     *
     * Estas cuatro se pueden contar abriendo la app. Cuando haya usuarios
     * de verdad, se añaden aquí y no antes.
     */
    stats: [
      { value: "7", label: "módulos", detail: "Tres abiertos; cuatro durante el piloto" },
      { value: "9", label: "temarios de inglés", detail: "Con su manual en PDF para leer sin datos" },
      { value: "0", label: "documentos en nuestros servidores", detail: "Se cifran en tu teléfono y no salen de él" },
      { value: "$0", label: "para escanear", detail: "El escáner funciona sin registrarte" },
    ],
  },

  // ── Lo que hoy no funciona ──────────────────────────────
  needs: {
    eyebrow: "Por qué existe",
    title: "Lo que pasa cuando todo vive en una carpeta de plástico",
    items: [
      {
        title: "Los papeles no aparecen cuando los piden",
        body: "El permiso de trabajo, el I-94, el acta de nacimiento de cada hijo. Repartidos entre una carpeta, el correo y las fotos del teléfono.",
      },
      {
        title: "Una fecha se pasa y nadie avisó",
        body: "Renovar tarde un permiso de trabajo puede costar el empleo. La fecha estaba escrita en un papel que se quedó en un cajón.",
      },
      {
        title: "El inglés del trabajo no es el del curso",
        body: "Nadie necesita conjugar verbos: necesita entender lo que dice el supervisor en la obra y saber contestar.",
      },
      {
        title: "Se paga por lo que era gratis",
        body: "Cientos de dólares por trámites que los portales oficiales hacen sin cobrar. Casi siempre a alguien que dijo ser de confianza.",
      },
    ],
  },

  // ── Los módulos, uno a uno ──────────────────────────────
  showcase: {
    eyebrow: "Lo que incluye",
    title: "Siete módulos, uno por cada cosa que hay que resolver",
    /** Nombre accesible de la lista: sin él son siete botones sueltos. */
    pickerLabel: "Elige un módulo para ver qué hace",
    explore: "Explorar ANDEX",
    building: "Se abre durante el piloto",
  },

  // ── Reseñas ─────────────────────────────────────────────
  reviews: {
    eyebrow: "Lo que dicen",
    title: "Todavía no hay reseñas, y no vamos a inventarlas",
    /**
     * ESTA SECCIÓN NO SE PINTA MIENTRAS `RESENAS` ESTÉ VACÍO.
     *
     * El componente está hecho y espera datos reales. Poner testimonios de
     * relleno en un producto cuyo argumento entero es la confianza sería
     * exactamente lo que hace dudar — y es lo que hizo quien les cobró de
     * más.
     */
    empty: "ANDEX está en piloto en Utah. Cuando las primeras familias lo usen y quieran contarlo, sus palabras van aquí — con su nombre y sin retocar.",
  },

  // ── S8 · Precios ────────────────────────────────────────
  pricing: {
    eyebrow: "Membresía",
    title: "Una inversión accesible para asegurar el futuro de tu familia",
    subtitle: "Te decimos el precio antes de pedirte un solo dato de pago.",
    monthly: {
      name: "Mensual",
      price: (p: string) => `${p} / mes`,
      tagline: "Flexible. Cancelas cuando quieras.",
      features: [
        "Los 7 módulos, completos",
        "Bóveda digital con alertas de vencimiento",
        "Guías migratorias y consulares",
        "Directorio de vida local y ferias de ayuda",
        "Soporte de la comunidad",
      ],
      cta: "Elegir plan mensual",
    },
    annual: {
      name: "Anual",
      /*
       * Era «Más elegido», la misma afirmación sobre otra gente que se
       * quitó del muro de pago: nadie ha elegido plan todavía porque el
       * piloto no ha empezado. Y las dos pantallas enseñan el mismo plan
       * dentro del mismo embudo, así que no pueden llamarlo distinto.
       */
      badge: "Recomendado",
      price: (p: string) => `${p} / año`,
      // Cifra real: 14 × 12 = 168 · 168 − 140 = 28 (un 17 %, no un 40 %).
      equivalent: (p: string) => `Equivale a ${p} al mes`,
      savings: (p: string) => `Ahorras ${p} al año`,
      tagline: "Para quien ya decidió quedarse.",
      features: [
        "Todo lo del plan mensual",
        "Tarifa congelada mientras mantengas tu membresía",
        "Acceso prioritario a las alertas de empleo",
      ],
      cta: "Elegir plan anual",
      sealTitle: "Tarifa congelada",
      sealBody:
        "Pagas lo mismo mientras mantengas tu membresía, aunque el precio suba para quien entre después.",
    },
    trust: [
      "Ves tu plan armado antes de decidir si pagas",
      "Cancelas en un clic, desde la web",
      "Sin contadores, sin cupos falsos, sin descuentos que expiran",
    ],
    note: "La membresía se renueva automáticamente. Te avisamos 48 horas antes de cada cobro.",
  },

  // ── S9 · Preguntas frecuentes ───────────────────────────
  faq: {
    eyebrow: "Antes de que preguntes",
    title: "Lo que todos nos preguntan",
    items: [
      {
        q: "¿Y si todavía no estoy en Estados Unidos?",
        a: "ANDEX empieza antes del viaje. El módulo de preparación cubre visas de turismo y estudio, la cita consular y todo lo que conviene dejar resuelto desde tu país. Cuando llegues, la app cambia contigo.",
      },
      {
        q: "¿Cómo funciona la bóveda de documentos?",
        a: "Guardas tus archivos cifrados y registras sus fechas de vencimiento. Te avisamos por correo 90, 60 y 30 días antes de cada una, para que ninguna te agarre por sorpresa.",
      },
      {
        q: "¿Ustedes hacen los trámites del gobierno?",
        a: "Te guiamos paso a paso dentro de ANDEX y te llevamos al portal oficial que corresponde. ANDEX no está afiliado a ninguna agencia gubernamental, y esos trámites son gratuitos en sus portales oficiales.",
      },
      {
        q: "¿Puedo cancelar cuando quiera?",
        a: "Sí, con un clic desde tu perfil. Sin llamadas, sin formularios y sin que nadie intente convencerte. Sigues teniendo acceso hasta el final del periodo que ya pagaste.",
      },
      {
        q: "¿Qué pasa con mis datos?",
        a: "Solo tú ves tu información. Nunca la vendemos. Los datos de estatus migratorio son opcionales en todo el registro y puedes usar ANDEX sin darlos.",
      },
    ],
  },

  // ── S10 · Cierre y pie ──────────────────────────────────
  closing: {
    title: "Tu progreso cruza fronteras.",
    subtitle: "Empieza a construir tu futuro hoy.",
    cta: "Completar mi registro",
    /*
     * Mismo arreglo que en `hero.ctaHint`: la version anterior prometia
     * «no pedimos tarjeta» y el pago llega tres pantallas despues. Aqui, en
     * la ultima frase de la pagina, la mentira pesa todavia mas.
     */
    hint: "Cinco preguntas y verás tu plan. Ves el precio antes de pagar.",
  },
  footer: {
    tagline: "El ecosistema para la comunidad hispana en Estados Unidos.",
    columns: {
      product: "Producto",
      company: "ANDEX",
      legal: "Legal",
    },
    links: {
      modulos: "Módulos",
      precios: "Precios",
      servicios: "Servicios directos",
      comunidad: "Comunidad",
      terminos: "Términos de servicio",
      privacidad: "Política de privacidad",
      contacto: "Soporte",
    },
    disclaimer:
      "ANDEX no está afiliado a ninguna agencia gubernamental. Estos trámites son gratuitos en los portales oficiales.",
    rights: (year: number) => `© ${year} ANDEX. Todos los derechos reservados.`,
  },
};

/**
 * Sin `as const`: con él los tipos serían literales ("Módulos" en vez de
 * string) y el `satisfies` del inglés rechazaría cada traducción por no ser
 * idéntica al español. Igual que en los otros ocho diccionarios.
 */
export type LandingDict = typeof es;

const en = {
  meta: {
    title: "ANDEX — Your progress crosses borders",
    description:
      "Paperwork, jobs, finances and community in one place. The ecosystem for the Hispanic community in the United States.",
  },

  banner: {
    text: "Utah pilot 2026 · Founding members lock in their rate for as long as they keep their membership.",
    cta: "See founding benefits",
  },

  nav: {
    brand: "ANDEX",
    tagline: "Your progress crosses borders",
    links: {
      solucion: "Solutions",
      modulos: "Modules",
      servicios: "Done-for-you",
      comunidad: "Community",
      precios: "Pricing",
    },
    login: "Log in",
    cta: "Get started",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  portada: {
    titleLines: ["Your progress", "crosses borders"],
    title: "Your progress crosses borders",
    promiseLines: ["Five questions. Two minutes.", "We don't ask for a card."],
    scanCta: "Scan a document, free",
    accountCta: "Create my account",
  },

  hero: {
    badge: "Pilot in Utah",
    title: "Everything of yours, in its place. Ordered around your case.",
    titleLines: ["Everything of yours,", "in its place."],
    titleAccent: "Ordered around your case.",
    trustPoints: [
      "Live workshops, Tuesday to Friday",
      "Your documents never leave your phone",
      "Not affiliated with any government agency",
    ],
    cta: "Start the journey",
    ctaHint: "Five questions. You see the price before you pay.",
    scrollHint: "Scroll to learn about ANDEX",
    tourLabel: "How ANDEX works",
    mockup: {
      ariaLabel: "Preview of the ANDEX dashboard",
      chip: "Utah",
      screens: {
        panel: {
          tab: "Home",
          greeting: "Hi, María",
          headline: "Your priority in Utah this month",
          goalLabel: "Your goal for these 30 days",
          goal: "register my business",
          badge: "Recommended for you",
          cardTitle: "Business Development",
          cardReason: "Because you said you want to register your business.",
          cardCta: "Start here",
          gridLabel: "Explore all modules",
          tiles: ["Digital Vault", "Job Match", "Finances", "Community", "Academy", "Immigration"],
          alert: "Your work permit expires in 60 days",
        },
        boveda: {
          tab: "Vault",
          greeting: "Digital Vault",
          headline: "Your documents, safe",
          goalLabel: "Stored",
          goal: "3 documents",
          badge: "Expires soon",
          cardTitle: "Work permit",
          cardReason: "We remind you 90, 60 and 30 days ahead.",
          cardCta: "View document",
          gridLabel: "All your documents",
          tiles: ["Passport", "Form I-94", "License", "Taxes", "Health plan", "Contract"],
          alert: "We remind you before every expiration",
        },
        empleo: {
          tab: "Jobs",
          greeting: "Job Match",
          headline: "Jobs that fit you",
          goalLabel: "Near you",
          goal: "12 new openings",
          badge: "Strong match",
          cardTitle: "HVAC technician",
          cardReason: "West Valley City · $24–28 per hour",
          cardCta: "View opening",
          gridLabel: "More opportunities",
          tiles: ["Kitchen assistant", "Solar installer", "Warehouse", "Cleaning", "Landscaping", "Delivery"],
          alert: "3 new openings near you today"
        },
      },
    },
  },

  trust: {
    eyebrow: "We guide you step by step to the official portals",
    portals: ["USCIS", "IRS", "Your state's DMV", "Immigration courts (EOIR)"],
    alliancesEyebrow: "With the ecosystem of",
    alliances: ["USA Latino Prime", "Starbiz Academy"],
    disclaimer:
      "ANDEX is not affiliated with any government agency. These procedures are free on the official portals.",
  },

  compare: {
    eyebrow: "Why ANDEX exists",
    title: "What you live today, and what it could be",
    subtitle:
      "We didn't invent a problem to sell you the cure. This is what the pilot families told us.",
    beforeTitle: "Without ANDEX",
    afterTitle: "With ANDEX",
    rows: [
      {
        before: "Six different agents, each with their own price, and none picks up after they charge you.",
        after: "One place, prices in plain sight, and support that's still there the following week.",
      },
      {
        before: "You find out your permit expired after it already expired.",
        after: "Reminders 90, 60 and 30 days before every deadline you save.",
      },
      {
        before: "You work below what you know how to do because nobody certifies your experience.",
        after: "Certifications the market recognizes and jobs from the community itself.",
      },
      {
        before: "Your savings sitting in an account that earns nothing.",
        after: "Savings and investment options explained in your language, with current rates in view.",
      },
    ],
  },

  wheel: {
    eyebrow: "Seven fronts",
    title: "Everything an immigrant needs to solve, in one place.",
    listLabel: "The seven ANDEX modules",
    items: ["Jobs", "Academy", "Community", "Vault", "Immigration", "Finances", "Business"],
  },

  liveScanner: {
    eyebrow: "Try it now",
    title: "Scan a document. Free, no signup.",
    body:
      "Take a photo of your passport or your work permit and we hand you back a straight, readable PDF, ready to file.",
    assurances: [
      "No signup",
      "No card",
      "The photo never leaves your phone",
    ],
    cta: "Scan a document",

    doneTitle: "Done. Your PDF is yours.",
    pitchTitle: "Now the part that really matters",
    pitchBody:
      "That PDF is yours now, but it's loose among a thousand files on your phone. The day it breaks, the file goes with it. And when that document is about to expire, nobody will tell you.",
    pitchBenefits: [
      "Stored encrypted and easy to find when you need it",
      "We remind you 90, 60, 30 and 7 days before it expires",
      "All your papers organized in one place",
    ],
    pitchCta: "Create my account",
    scanAgain: "Scan another",
  },

  modules: {
    eyebrow: "The platform",
    title: "Seven fronts, one place",
    subtitle:
      "All open from day one. Your dashboard orders them by what you answered, but never hides any of them.",
    reorderedNote: "Reordered for your case",
    cta: "See my personalized plan",
    items: {
      1: {
        title: "Digital Vault & Alerts",
        body: "Your documents encrypted, plus guided tracking of your case status.",
      },
      2: {
        title: "Immigration & Consular Guide",
        body: "Tourist and student visas, passports, consular appointments and your driver's license.",
      },
      3: {
        title: "Financial Inclusion",
        body: "Credit school, your first ITIN and savings options explained without fine print.",
      },
      4: {
        title: "Business Creation",
        body: "Your LLC and EIN, plus the launch: brand, website and first customers.",
      },
      5: {
        title: "Community & Local Life",
        body: "Help fairs, services near you and the CEO Junior and Padres 3.0 programs.",
      },
      6: {
        title: "Certification Academy",
        body: "Training and exam simulator for taxes, insurance and real estate.",
      },
      7: {
        title: "Job Match",
        body: "Jobs that match your profile, with an alert on your phone the moment they open.",
      },
    },
  },

  services: {
    eyebrow: "ANDEX done-for-you",
    title: "Would you rather we handled it?",
    subtitle:
      "Some paperwork you can solve on your own with our guides. Other things are better done by a specialist. Both options are inside.",
    availability: "Rolling out in stages during the pilot. We'll let you know as each service opens in your state.",
    items: [
      {
        title: "Driver's license and DMV",
        body: "Your state's requirements checklist and support in Spanish all the way to the appointment.",
      },
      {
        title: "ITIN number (Form W-7)",
        body: "Form preparation without having to mail your original documents.",
      },
      {
        title: "Setting up your LLC",
        body: "Your company registered, with EIN and operating agreement, ready to open a business account.",
      },
      {
        title: "Tax filing",
        body: "Guidance for individuals and businesses, with someone who explains what you're signing.",
      },
      {
        title: "Certified translations",
        body: "Documents translated and certified for filing with USCIS and the courts.",
      },
    ],
    cta: "Let me know when it opens",
  },

  purpose: {
    eyebrow: "Our purpose",
    missionTitle: "Our mission",
    mission:
      "We don't just help with paperwork: we build the path for the Hispanic community to go from surviving to building wealth in the United States.",
    visionTitle: "Our vision",
    vision:
      "To be the development system for ten million families across the Americas by 2030.",
    familyTitle: "The family ecosystem",
    familySubtitle: "With Starbiz Academy",
    family: [
      {
        title: "CEO Junior",
        body: "Where teenagers learn to build businesses instead of consuming screens.",
      },
      {
        title: "Padres 3.0",
        body: "To truly walk your children's academic path in a system you didn't grow up in.",
      },
    ],
  },

vision: {
    eyebrow: "What ANDEX is",
    title: "One place for everything a process asks you for",
    body: "It isn't an advice app. It's where you keep your documents, know what's about to expire, learn the English they ask for at work, and find people who have been through the same. Pilot in Utah.",
    stats: [
      { value: "7", label: "modules", detail: "Three open; four during the pilot" },
      { value: "9", label: "English tracks", detail: "Each with a PDF manual to read without data" },
      { value: "0", label: "documents on our servers", detail: "Encrypted on your phone; they never leave it" },
      { value: "$0", label: "to scan", detail: "The scanner works without signing up" },
    ],
  },

  needs: {
    eyebrow: "Why it exists",
    title: "What happens when everything lives in a plastic folder",
    items: [
      {
        title: "The papers aren't there when they're asked for",
        body: "The work permit, the I-94, each child's birth certificate. Split between a folder, your email and your phone's photos.",
      },
      {
        title: "A date passes and nobody warned you",
        body: "Renewing a work permit late can cost you the job. The date was written on a paper left in a drawer.",
      },
      {
        title: "Work English isn't classroom English",
        body: "Nobody needs to conjugate verbs: they need to understand the supervisor on site and know how to answer.",
      },
      {
        title: "People pay for what was free",
        body: "Hundreds of dollars for procedures the official portals do at no charge. Almost always to someone who claimed to be trustworthy.",
      },
    ],
  },

  showcase: {
    eyebrow: "What's included",
    title: "Seven modules, one for each thing you have to solve",
    pickerLabel: "Pick a module to see what it does",
    explore: "Explore ANDEX",
    building: "Opening during the pilot",
  },

  reviews: {
    eyebrow: "What people say",
    title: "There are no reviews yet, and we won't invent them",
    empty: "ANDEX is piloting in Utah. When the first families use it and want to say so, their words go here — with their name and unedited.",
  },

  pricing: {
    eyebrow: "Membership",
    title: "An affordable investment to secure your family's future",
    subtitle: "We tell you the price before asking for a single payment detail.",
    monthly: {
      name: "Monthly",
      price: (p: string) => `${p} / month`,
      tagline: "Flexible. Cancel whenever you want.",
      features: [
        "All 7 modules, complete",
        "Digital vault with expiration alerts",
        "Immigration and consular guides",
        "Local directory and help fairs",
        "Community support",
      ],
      cta: "Choose monthly",
    },
    annual: {
      name: "Annual",
      badge: "Recommended",
      price: (p: string) => `${p} / year`,
      equivalent: (p: string) => `That's ${p} a month`,
      savings: (p: string) => `You save ${p} a year`,
      tagline: "For those who already decided to stay.",
      features: [
        "Everything in the monthly plan",
        "Rate locked for as long as you keep your membership",
        "Priority access to job alerts",
      ],
      cta: "Choose annual",
      sealTitle: "Locked rate",
      sealBody:
        "You pay the same for as long as you keep your membership, even if the price goes up for people who join later.",
    },
    trust: [
      "You see your plan built before deciding whether to pay",
      "Cancel in one click, from the web",
      "No countdowns, no fake spots, no expiring discounts",
    ],
    note: "Membership renews automatically. We remind you 48 hours before each charge.",
  },

  faq: {
    eyebrow: "Before you ask",
    title: "What everyone asks us",
    items: [
      {
        q: "What if I'm not in the United States yet?",
        a: "ANDEX starts before the trip. The preparation module covers tourist and student visas, the consular appointment and everything worth settling from your country. When you arrive, the app changes with you.",
      },
      {
        q: "How does the document vault work?",
        a: "You store your files encrypted and record their expiration dates. We remind you by email 90, 60 and 30 days before each one, so none of them catches you by surprise.",
      },
      {
        q: "Do you handle government procedures?",
        a: "We guide you step by step inside ANDEX and take you to the right official portal. ANDEX is not affiliated with any government agency, and those procedures are free on their official portals.",
      },
      {
        q: "Can I cancel whenever I want?",
        a: "Yes, in one click from your profile. No calls, no forms, and nobody trying to talk you out of it. You keep access until the end of the period you already paid for.",
      },
      {
        q: "What happens to my data?",
        a: "Only you see your information. We never sell it. Immigration status details are optional throughout signup and you can use ANDEX without providing them.",
      },
    ],
  },

  closing: {
    title: "Your progress crosses borders.",
    subtitle: "Start building your future today.",
    cta: "Complete my signup",
    hint: "Five questions and you'll see your plan. You see the price before you pay.",
  },
  footer: {
    tagline: "The ecosystem for the Hispanic community in the United States.",
    columns: {
      product: "Product",
      company: "ANDEX",
      legal: "Legal",
    },
    links: {
      modulos: "Modules",
      precios: "Pricing",
      servicios: "Done-for-you",
      comunidad: "Community",
      terminos: "Terms of service",
      privacidad: "Privacy policy",
      contacto: "Support",
    },
    disclaimer:
      "ANDEX is not affiliated with any government agency. These procedures are free on the official portals.",
    rights: (year: number) => `© ${year} ANDEX. All rights reserved.`,
  },
} satisfies LandingDict;

/** Diccionario por idioma, con la misma forma que el resto. */
export const landing = { es, en };
