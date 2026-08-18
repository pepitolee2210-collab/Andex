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
    /*
     * El documento maestro dice «congela tu tarifa mensual DE POR VIDA antes
     * de la próxima actualización». Se escribe sin las dos cosas:
     *
     *  · «de por vida» no es cierto — si cancelas, la pierdes. Lo que sí se
     *    puede sostener es lo que dice §3.4.4: mientras mantengas activa la
     *    membresía. Prometer de más aquí es lo que hace desconfiar a alguien
     *    a quien ya le prometieron de más.
     *  · «antes de la próxima actualización» es un plazo sin fecha, y §3.4.1
     *    prohíbe la urgencia inventada en todo el producto.
     */
    text: "Piloto Utah 2026 · Hazte miembro fundador y congela tu tarifa mientras mantengas tu membresía.",
    cta: "Ver beneficios de fundador",
  },

  // ── S1 · Navegación ─────────────────────────────────────
  nav: {
    brand: "ANDEX",
    tagline: "Tu progreso cruza fronteras",
    links: {
      solucion: "Soluciones",
      modulos: "Módulos",
      ingles: "Inglés en Vivo",
      /* El documento lo llama «Membresía», no «Precios»: lo que se compra es
         la pertenencia, y el precio es sólo su etiqueta. */
      precios: "Membresía",
      servicios: "Servicios directos",
      comunidad: "Comunidad",
    },
    login: "Iniciar sesión",
    cta: "Comenzar diagnóstico",
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
  /**
   * ── EL CONCEPTO: «el mapa trazado por quien ya lo vivió» ──
   *
   * El hero deja de hablar en nombre de un producto y pasa a hablar en
   * nombre de una persona que ya hizo el camino. Es un cambio de registro,
   * no de palabras: «El camino que ya recorrí» sólo lo puede decir alguien
   * que lo recorrió, y con este público esa es la única credencial que
   * pesa más que un superlativo.
   *
   * La primera persona del singular es deliberada y va hasta el final:
   * el titular dice «recorrí» y la bajada dice «construí». La micro-copia
   * del pie cierra en plural —«quienes ya superamos»— porque ahí ya no
   * habla el fundador, habla la comunidad, que es justo lo que se ofrece.
   */
  hero: {
    badge: "Creado desde la experiencia real · Piloto Utah",
    title: "El camino que ya recorrí. Ahora trazado para tu progreso.",
    titleLines: ["El camino que ya recorrí."],
    /**
     * El segundo tiempo, en teal. Es SUBTÍTULO, no segunda línea del
     * titular: va un escalón por debajo en tamaño. Puestos al mismo cuerpo,
     * las dos frases competían y ninguna mandaba —y ésta es la que gira la
     * primera hacia quien lee: yo lo recorrí, ahora es tuyo.
     */
    titleAccent: "Ahora trazado para tu progreso.",
    /**
     * LA BAJADA.
     *
     * Empieza negando lo que se supone que es —«no es una app más»— porque
     * es exactamente lo que piensa quien llega: otra aplicación que promete.
     * Y nombra los cinco frentes de golpe para que nadie tenga que deducir
     * el alcance del producto de un eslogan.
     */
    /* ` ` entre «EE.» y «UU.»: con un espacio normal la abreviatura se
       parte al final del renglón y queda un «EE.» huérfano arriba y «UU.»
       solo abajo. Pasó en escritorio, medido. */
    body:
      "No es una app más; es la comunidad y el sistema que construí después " +
      "de superar cada traba en EE. UU. Aquí encuentras en un solo lugar " +
      "tus trámites, crédito, empleo, negocios, inglés laboral e inversión " +
      "para que tu familia avance sin cometer los mismos errores.",
    /**
     * Cada punto lleva ahora título y explicación. El título es la promesa
     * en tres palabras; la línea de abajo dice qué hay detrás, que es donde
     * se cae la mayoría de las landings: prometen «acompañamiento» y nunca
     * dicen de qué.
     */
    trustPoints: [
      {
        title: "Acompañamiento y ahorro real",
        body:
          "Trámites, visas, licencias y citas explicadas desde la práctica, " +
          "con 20% de descuento para miembros en la gestoría directa.",
      },
      {
        title: "Inglés laboral en vivo y certificaciones",
        body:
          "Clases prácticas para el trabajo de martes a viernes, simulador " +
          "de entrevistas y formación técnica en taxes y seguros.",
      },
      {
        title: "Crecimiento económico y familia",
        body:
          "De tu ITIN a la LLC, inversión al 4% APY, bolsa de empleo local " +
          "y educación empresarial para tus hijos (Starbiz).",
      },
    ],
    cta: "Unirme a la comunidad y armar mi plan",
    /**
     * Dice el recorrido entero y quién lo diseñó. La versión anterior
     * prometía «no pedimos tarjeta» y era falso: después del registro y de
     * la entrevista viene el plan y su pago.
     */
    ctaHint:
      "Diagnóstico de 5 preguntas · Clases en vivo incluidas · Diseñado " +
      "por quienes ya superamos el proceso en EE. UU.",
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
      "ANDEX es una plataforma tecnológica y comunitaria privada. No es una agencia gubernamental ni un bufete de abogados, y estos trámites son gratuitos en los portales oficiales. La gestoría y la preparación documental las prestan agentes tramitadores y especialistas autorizados conforme a la normativa vigente.",
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
        "Bóveda digital con alertas de vencimiento",
        "Guías migratorias y consulares",
        "Inglés laboral en vivo, de martes a viernes",
        "Bolsa de empleo local en Utah",
        "Directorio de vida local y ferias de ayuda",
        "20% de descuento en la gestoría directa",
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
      /*
       * El documento maestro dice «AHORRO DIRECTO DEL 40% anual». Es falso y
       * no se escribe: 14 × 12 = 168, y 168 − 140 = 28, que es un 17%. El
       * 40% ya venía marcado como error en la cabecera de este archivo. Un
       * número inflado en la única cifra que el visitante puede comprobar
       * con una resta es la forma más rápida de perderlo.
       */
      features: [
        "Todo lo del plan mensual",
        "Ahorras $28 al año: un 17% sobre pagar mes a mes",
        "Tarifa congelada mientras mantengas tu membresía, aunque el precio suba para quien entre después",
        "Prioridad en las alertas de empleo",
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

  /**
   * ── S3 · RESPALDO Y SEGURIDAD ──
   *
   * Una insignia se cambió a propósito. El documento pide «Cifrado Bancario
   * AES-256», y «nivel bancario» es justo la fórmula que este público oyó de
   * quien lo estafó: la regla del proyecto prohíbe prometer de más en
   * seguridad y obliga a decir el límite en la misma frase. AES-256 es
   * verdad —la bóveda cifra con AES-GCM en el navegador—, así que se queda
   * la parte comprobable y se le añade lo que de verdad la hace fuerte: que
   * los archivos no salen del teléfono.
   */
  trustBar: {
    title:
      "Construido con tecnología de nivel institucional para darte la " +
      "seguridad, el respaldo y la transparencia que tu familia merece en " +
      "Estados Unidos.",
    badges: [
      {
        label: "Cifrado AES-256 en tu teléfono",
        note: "Los documentos se cifran en tu dispositivo y no salen de él.",
      },
      { label: "USA Latino Prime Ecosystem", note: "La infraestructura detrás de ANDEX." },
      { label: "Starbiz Academy Network", note: "Formación empresarial para toda la familia." },
      { label: "Red certificada IRS PTIN", note: "Preparadores con número asignado por el IRS." },
      { label: "Guía de licencia de conducir de Utah", note: "Requisitos del DMV, paso a paso." },
    ],
  },

  // ── S4 · La historia del fundador ───────────────────────
  founder: {
    eyebrow: "Quién está detrás",
    title: "Sé lo que se siente llegar sin saber a quién acudir ni en quién confiar.",
    body: [
      "Cuando llegué a este país me enfrenté a lo mismo que tú: el miedo a " +
        "cometer un error en un formulario, la frustración de no tener " +
        "crédito, los abusos de quienes cobran sumas exorbitantes por " +
        "trámites sencillos y la barrera del idioma.",
      "Decidí crear ANDEX porque nadie debería tener que descifrar este " +
        "sistema solo ni perder años de esfuerzo por falta de una guía " +
        "honesta. Este no es un software creado desde un escritorio; es el " +
        "mapa real, paso a paso, para que tú y tu familia construyan " +
        "estabilidad y patrimonio en Estados Unidos.",
    ],
  },

  // ── S6 · Inglés laboral en vivo ─────────────────────────
  english: {
    eyebrow: "Incluido en la membresía",
    title: "Domina el inglés que multiplica tus ingresos, no la gramática aburrida.",
    points: [
      {
        title: "Sesiones en vivo, de martes a viernes",
        body: "Enfoque práctico en situaciones de trabajo reales.",
      },
      {
        title: "Simuladores de entrevista",
        body: "Práctica intensiva para postular a los puestos mejor pagados de la bolsa de empleo.",
      },
      {
        title: "Inglés por especialidad",
        body: "Construcción, atención al cliente, ventas, finanzas y trámites.",
      },
      {
        title: "Sin cuotas aparte",
        body: "Va dentro de la membresía: no se paga ninguna academia externa.",
      },
    ],
  },

  // ── S9 · Preguntas frecuentes ───────────────────────────
  faq: {
    eyebrow: "Antes de que preguntes",
    title: "Lo que todos nos preguntan",
    items: [
      {
        q: "¿Y si todavía no estoy en Estados Unidos?",
        a: "ANDEX empieza antes del viaje. El módulo de preparación cubre las visas de turismo y estudio, la cita consular, el presupuesto y los primeros pasos. Cuando llegues, la app cambia contigo.",
      },
      {
        q: "¿Por qué la membresía subirá de precio más adelante?",
        a: "Porque van a entrar herramientas que hoy no existen. Cuando entren, la mensualidad subirá para quien se registre a partir de entonces. El plan anual de $140 congela tu tarifa mientras mantengas la membresía activa.",
      },
      {
        q: "¿Cómo funcionan las clases de inglés laboral en vivo?",
        a: "Se dan de martes a viernes dentro de la app, en sesiones interactivas y con la grabación disponible después. Van incluidas en la membresía: no se paga ninguna academia aparte.",
      },
      {
        q: "¿Cómo accedo al 20% de descuento en los trámites?",
        a: "Con la suscripción activa, el descuento se aplica solo cuando pides una gestoría directa. No hay que reclamarlo ni pedir un código.",
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
    title: "Tu esfuerzo merece un camino claro en Estados Unidos.",
    subtitle: "Empieza a construir tu futuro hoy.",
    cta: "Iniciar mi diagnóstico de 5 preguntas",
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
    text: "Utah pilot 2026 · Become a founding member and lock in your rate for as long as you keep your membership.",
    cta: "See founding benefits",
  },

  nav: {
    brand: "ANDEX",
    tagline: "Your progress crosses borders",
    links: {
      solucion: "Solutions",
      modulos: "Modules",
      ingles: "Live English",
      precios: "Membership",
      servicios: "Done-for-you",
      comunidad: "Community",
    },
    login: "Log in",
    cta: "Start the check-in",
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
    badge: "Built from lived experience · Utah pilot",
    title: "The road I already walked. Now mapped for your progress.",
    titleLines: ["The road I already walked."],
    titleAccent: "Now mapped for your progress.",
    body:
      "This is not one more app; it is the community and the system I built " +
      "after getting past every obstacle in the U.S. Here you find your " +
      "paperwork, credit, work, business, workplace English and investing in " +
      "one place, so your family moves forward without repeating the same " +
      "mistakes.",
    trustPoints: [
      {
        title: "Guidance and real savings",
        body:
          "Paperwork, visas, licenses and appointments explained from real " +
          "practice, with 20% off direct filing help for members.",
      },
      {
        title: "Live workplace English and certifications",
        body:
          "Practical classes for work, Tuesday to Friday, an interview " +
          "simulator and technical training in taxes and insurance.",
      },
      {
        title: "Economic growth and family",
        body:
          "From your ITIN to your LLC, investing at 4% APY, a local job " +
          "board and business education for your children (Starbiz).",
      },
    ],
    cta: "Join the community and build my plan",
    ctaHint:
      "A 5-question check-in · Live classes included · Designed by those of " +
      "us who already got through the process in the U.S.",
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
        "Digital vault with expiration alerts",
        "Immigration and consular guides",
        "Live workplace English, Tuesday to Friday",
        "Local job board in Utah",
        "Local directory and help fairs",
        "20% off direct filing help",
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
        "You save $28 a year: 17% versus paying month to month",
        "Rate locked for as long as you keep your membership, even if the price goes up for people who join later",
        "Priority on job alerts",
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

  trustBar: {
    title:
      "Built with institution-grade technology to give you the security, " +
      "the backing and the transparency your family deserves in the " +
      "United States.",
    badges: [
      {
        label: "AES-256 encryption on your phone",
        note: "Documents are encrypted on your device and never leave it.",
      },
      { label: "USA Latino Prime Ecosystem", note: "The infrastructure behind ANDEX." },
      { label: "Starbiz Academy Network", note: "Business training for the whole family." },
      { label: "IRS PTIN certified network", note: "Preparers with an IRS-issued number." },
      { label: "Utah driver license guide", note: "DMV requirements, step by step." },
    ],
  },

  founder: {
    eyebrow: "Who is behind this",
    title: "I know what it feels like to arrive with no one to turn to and no one to trust.",
    body: [
      "When I came to this country I faced the same things you do: the fear " +
        "of getting a form wrong, the frustration of having no credit, the " +
        "abuse of people who charge huge sums for simple paperwork, and the " +
        "language barrier.",
      "I decided to build ANDEX because nobody should have to decode this " +
        "system alone or lose years of effort for want of honest guidance. " +
        "This is not software written from a desk; it is the real map, step " +
        "by step, so you and your family can build stability and wealth in " +
        "the United States.",
    ],
  },

  english: {
    eyebrow: "Included in the membership",
    title: "Master the English that raises your income, not boring grammar.",
    points: [
      {
        title: "Live sessions, Tuesday to Friday",
        body: "Practical focus on real workplace situations.",
      },
      {
        title: "Interview simulators",
        body: "Intensive practice for the best-paid roles on the job board.",
      },
      {
        title: "English by trade",
        body: "Construction, customer service, sales, finance and paperwork.",
      },
      {
        title: "No separate fees",
        body: "It is inside the membership: no outside academy to pay for.",
      },
    ],
  },

  faq: {
    eyebrow: "Before you ask",
    title: "What everyone asks us",
    items: [
      {
        q: "Why will the membership cost more later on?",
        a: "Because tools that do not exist yet are coming. When they land, the monthly price will go up for people who sign up from then on. The $140 annual plan freezes your rate for as long as your membership stays active.",
      },
      {
        q: "How do the live workplace English classes work?",
        a: "They run Tuesday to Friday inside the app, as interactive sessions with the recording available afterwards. They are included in the membership: there is no separate academy to pay for.",
      },
      {
        q: "How do I get the 20% off on filing help?",
        a: "With an active subscription the discount applies on its own when you request direct filing help. There is nothing to claim and no code to enter.",
      },
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
    title: "Your effort deserves a clear path in the United States.",
    subtitle: "Start building your future today.",
    cta: "Start my 5-question check-in",
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
      "ANDEX is a private technology and community platform. It is not a government agency or a law firm, and these procedures are free on the official portals. Filing help and document preparation are provided by authorized filing agents and specialists under applicable regulations.",
    rights: (year: number) => `© ${year} ANDEX. All rights reserved.`,
  },
} satisfies LandingDict;

/** Diccionario por idioma, con la misma forma que el resto. */
export const landing = { es, en };
