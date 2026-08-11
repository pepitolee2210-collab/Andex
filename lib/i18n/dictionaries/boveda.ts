/**
 * BÓVEDA DIGITAL — copy del módulo 1 (ES/EN).
 *
 * Reglas de redacción que gobiernan este archivo:
 *
 * · **Nada de jerga.** Ni "homografía", ni "AES-256", ni "DPI". Quien usa
 *   esto está resolviendo un trámite, no evaluando una tecnología.
 * · **La promesa de privacidad se dice en concreto**, nunca con adjetivos.
 *   "Ni nosotros podemos verlos" es verificable; "seguridad de nivel
 *   bancario" no significa nada y esta audiencia ya la oyó de quien la
 *   estafó.
 * · **Los portales del gobierno son destinos, no socios** (§6): hay que
 *   repetir que ANDEX no está afiliado y que esos trámites son gratuitos.
 * · Prohibida la palabra "notario" (Anexo B).
 */

const es = {
  title: "Bóveda Digital",
  subtitle: "Tus documentos ordenados y tus fechas límite bajo control.",

  privacy: {
    badge: "Todo pasa en tu teléfono",
    headline: "Tus documentos no salen de aquí",
    body:
      "El escaneo ocurre dentro de tu teléfono y los archivos se guardan cifrados en él. No los subimos a ningún servidor: ni nosotros podemos verlos.",
    // Honestidad sobre el límite real de la protección. Prometer de más en
    // seguridad es peor que no prometer nada.
    caveat:
      "Como están en tu teléfono, protégelo con tu clave o tu huella: quien pueda desbloquearlo puede abrir la app.",
  },

  sections: {
    dueSoon: "Se te vence pronto",
    allDocuments: "Tus documentos",
  },

  /**
   * Buscar y filtrar. A los seis meses una familia tiene veinte papeles
   * dentro, y "en qué carpeta lo metí" deja de ser una pregunta con
   * respuesta.
   */
  search: {
    placeholder: "Buscar entre mis documentos",
    label: "Buscar un documento por su nombre",
    clear: "Borrar la búsqueda",
    filters: {
      all: "Todos",
      dueSoon: "Vence pronto",
      noExpiry: "Sin fecha",
    },
    resultCount: "{n} resultados",
    resultCountOne: "1 resultado",
    noResults: "No encontramos ningún documento con eso.",
    noResultsHint: "Prueba con una palabra suelta del nombre que le pusiste.",
    // El aviso que tapa el agujero: un documento sin fecha jamás va a
    // disparar el aviso por el que se paga el módulo.
    noExpiryNudge:
      "Estos no tienen fecha de vencimiento, así que no te vamos a poder avisar. Pónsela con el lápiz.",
  },

  folders: {
    identity: {
      name: "Identificación",
      hint: "Pasaporte, matrícula consular, acta de nacimiento",
    },
    immigration: {
      name: "Estatus migratorio",
      hint: "Permiso de trabajo, I-94, citas de corte, recibos de USCIS",
    },
    driving: {
      name: "Manejo y vehículo",
      hint: "Licencia, registro del auto, seguro",
    },
    taxes: {
      name: "Impuestos",
      hint: "Carta de ITIN, W-2, 1099, declaraciones",
    },
    housing: {
      name: "Vivienda y estudios",
      hint: "Contrato de renta, récords escolares, títulos",
    },
  },

  empty: {
    title: "Tu bóveda está vacía",
    body: "Escanea tu primer documento con la cámara. Toma menos de un minuto.",
    cta: "Escanear un documento",
  },

  list: {
    documentCount: "{n} documentos",
    documentCountOne: "1 documento",
    pageCount: "{n} páginas",
    pageCountOne: "1 página",
    open: "Abrir",
    rename: "Cambiar nombre",
    move: "Mover de carpeta",
    delete: "Eliminar",
    deleteConfirm:
      "Se borrará de tu teléfono y no se puede recuperar. ¿Seguro que quieres eliminarlo?",
    deleteAction: "Sí, eliminar",
    keep: "Conservarlo",
    openFailed:
      "No pudimos abrir este documento. Puede que se haya guardado en otro teléfono o que se borraran los datos de la app.",
  },

  expiry: {
    label: "Fecha de vencimiento",
    optional: "Si no vence, déjalo en blanco",
    none: "No vence",
    expired: "Venció hace {n} días",
    expiredToday: "Venció hoy",
    soon: "Vence en {n} días",
    soonOne: "Vence mañana",
    ok: "Vigente",
    // El valor real del módulo, dicho sin rodeos.
    alertPromise:
      "Te avisamos 90, 60, 30 y 7 días antes. Ninguna fecha se te va a pasar.",
  },

  scanner: {
    title: "Escanear documento",
    // Aviso obligatorio del PRD §2.5: la cámara necesita permiso explícito.
    permissionTitle: "Necesitamos tu cámara",
    permissionBody:
      "Sólo para tomar la foto del documento. La imagen no sale de tu teléfono.",
    permissionDenied: "Tu navegador bloqueó la cámara",
    permissionDeniedHelp:
      "Ábrela desde el candado de la barra de direcciones, o elige una foto que ya tengas.",
    noCamera: "No encontramos una cámara en este dispositivo.",
    fromGallery: "Elegir de mi galería",
    capture: "Tomar foto",
    retake: "Repetir la foto",

    framingHint: "Pon el documento dentro del marco, sobre una superficie oscura",

    adjustTitle: "Ajusta las esquinas",
    adjustBody: "Arrastra los puntos para que encajen con las orillas del papel.",
    adjustKeyboard: "Con el teclado: Tab para elegir una esquina y las flechas para moverla.",
    adjustInvalid: "El recorte quedó muy pequeño o torcido. Ajusta las esquinas.",
    detected: "Encontramos las orillas solas. Corrígelas si hace falta.",
    notDetected: "No pudimos encontrar las orillas. Ajústalas tú.",

    processing: "Enderezando tu documento…",

    modeTitle: "Cómo se ve",
    modes: {
      document: "Color",
      gray: "Gris",
      bw: "Blanco y negro",
      photo: "Foto original",
    },
    // Advertencia de producto, no de diseño: presentar un documento sin sus
    // sellos puede invalidarlo ante la oficina que lo recibe.
    modeWarning:
      "Deja el color si vas a presentarlo ante USCIS o una corte: los sellos y las firmas en tinta son parte del documento.",

    addPage: "Añadir otra página",
    finish: "Terminar",
    pagesTitle: "Páginas",
    movePageUp: "Subir esta página",
    movePageDown: "Bajar esta página",
    removePage: "Quitar esta página",

    sizeTitle: "Tamaño de papel",
    sizeLetter: "Carta",
    sizeA4: "A4",
    // La corrección que evita un expediente mal impreso.
    sizeHint:
      "Carta es el tamaño de Estados Unidos: úsalo para USCIS, cortes, el IRS o el DMV. A4 sólo si vas a presentarlo en un consulado.",

    saveTitle: "Guardar en tu bóveda",
    nameLabel: "¿Qué documento es?",
    namePlaceholder: "Ej.: Pasaporte de María",
    folderLabel: "¿En qué carpeta?",
    noteLabel: "Nota (opcional)",
    notePlaceholder: "Ej.: el que pidió el abogado",
    save: "Guardar en mi bóveda",
    saved: "Guardado en tu bóveda",
    downloadPdf: "Descargar el PDF",
    cancel: "Cancelar",
  },

  storage: {
    title: "Espacio en tu teléfono",
    used: "{used} de {total} usados",
    warning: "Te queda poco espacio. Descarga y borra lo que ya no necesites.",
  },

  /**
   * Copy del flujo de escaneo. Las claves las fija `ScannerFlowCopy` de
   * `components/vault/scanner-flow.tsx`; `{n}`, `{from}` y `{to}` son
   * plantillas que rellena el componente.
   */
  scan: {
    start: {
      title: "Escanear un documento",
      intro:
        "Toma una foto del papel y lo convertimos en un PDF derecho y legible, listo para presentar.",
      privacyTitle: "No sale de tu teléfono",
      // Se dice ANTES de que el navegador pida la cámara: quien está
      // fotografiando su permiso de trabajo necesita saber a dónde va esa
      // imagen antes de conceder nada.
      privacyBody:
        "La foto se procesa aquí dentro y se guarda cifrada en tu teléfono. No la subimos a ningún servidor.",
      startLabel: "Usar la cámara",
      galleryLabel: "Elegir una foto que ya tengo",
      cancelLabel: "Ahora no",
    },

    camera: {
      title: "Toma la foto",
      hint: "Pon el documento sobre una superficie oscura y que se vean las cuatro esquinas.",
      privacyNote: "La imagen no sale de tu teléfono",
      requesting: "Pidiendo permiso para la cámara…",
      captureLabel: "Tomar foto",
      galleryLabel: "Elegir de mi galería",
      cancelLabel: "Cancelar",
      // Versiones cortas: a 320 px estos botones caben en ~90 px.
      galleryShortLabel: "Galería",
      cancelShortLabel: "Salir",
      deniedTitle: "Tu navegador bloqueó la cámara",
      deniedBody: "Puedes darle permiso o elegir una foto que ya tengas.",
      // Instrucción concreta: decir sólo que está bloqueada deja al usuario
      // sin salida, y esta pantalla es donde más gente abandona.
      deniedHowTo:
        "Toca el candado que está junto a la dirección de la página, entra en Cámara y elige Permitir. Después vuelve aquí.",
      unavailableTitle: "No encontramos una cámara",
      unavailableBody: "Elige una foto de tu galería y sigue igual.",
      failedTitle: "No pudimos abrir la cámara",
      failedBody: "Puede estar en uso por otra aplicación. Ciérrala e inténtalo otra vez.",
      retryLabel: "Intentar de nuevo",
      systemCameraLabel: "Usar la cámara del teléfono",
      captureError: "No se pudo tomar la foto. Inténtalo otra vez.",
    },

    adjuster: {
      title: "Ajusta las esquinas",
      hint: "Arrastra los puntos hasta que encajen con las orillas del papel.",
      keyboardHint: "Con el teclado: Tab para elegir una esquina y las flechas para moverla.",
      detecting: "Buscando las orillas…",
      corners: {
        topLeft: "Esquina de arriba a la izquierda",
        topRight: "Esquina de arriba a la derecha",
        bottomRight: "Esquina de abajo a la derecha",
        bottomLeft: "Esquina de abajo a la izquierda",
      },
      unusableWarning: "El recorte quedó muy pequeño o torcido. Mueve las esquinas.",
      resetLabel: "Empezar de nuevo",
      backLabel: "Repetir la foto",
      continueLabel: "Continuar",
      imageAlt: "Foto del documento con las esquinas marcadas",
    },

    preview: {
      title: "Así va a quedar",
      modeLegend: "Cómo se ve",
      modes: {
        document: "Color",
        gray: "Gris",
        bw: "Blanco y negro",
        photo: "Foto original",
      },
      // El porqué del color, siempre visible.
      colorReason: "En color, porque los sellos y las firmas también son parte del documento.",
      // Y la advertencia cuando se elige otra cosa: presentar un documento
      // sin sus sellos puede invalidarlo ante la oficina que lo recibe.
      colorWarning:
        "Ojo: sin color se pierden los sellos y las firmas en tinta. Si vas a presentarlo ante USCIS o una corte, deja el color.",
      processing: "Enderezando tu documento…",
      processingError: "No pudimos procesar esta foto. Prueba a repetirla.",
      retryLabel: "Intentar de nuevo",
      adjustLabel: "Volver a ajustar",
      addPageLabel: "Añadir otra página",
      finishLabel: "Terminar",
      imageAlt: "Vista del documento ya enderezado",
    },

    list: {
      countOne: "1 página",
      countOther: "{n} páginas",
      pageLabel: "Página {n}",
      moveUpLabel: "Subir la página {n}",
      moveDownLabel: "Bajar la página {n}",
      deleteLabel: "Quitar la página {n}",
      movedAnnouncement: "La página {from} pasó al lugar {to}",
      deleteTitle: "¿Quitar esta página?",
      deleteBody: "Se quitará la página {n} de este documento.",
      deleteConfirmLabel: "Sí, quitarla",
      deleteCancelLabel: "Conservarla",
      emptyTitle: "Todavía no hay páginas",
      emptyBody: "Toma la primera foto para empezar.",
      thumbnailAlt: "Vista de la página {n}",
    },

    review: {
      title: "Revisa tu documento",
      subtitle: "Ordena las páginas y elige el tamaño del papel.",
      pageSizeLegend: "Tamaño de papel",
      pageSizes: {
        letter: "Carta",
        a4: "A4",
      },
      // La corrección que evita un expediente mal impreso.
      pageSizeNote:
        "Carta es el tamaño de Estados Unidos: úsalo para USCIS, cortes, el IRS o el DMV. A4 sólo si lo presentas en un consulado.",
      addPageLabel: "Añadir otra página",
      finishLabel: "Crear mi PDF",
      cancelLabel: "Cancelar",
    },

    /**
     * Pantalla de entrega. No descarga sola: en el móvil ese `click()`
     * automático no llega a ninguna parte, así que la persona pulsa y el
     * sistema abre su propia hoja para guardar o compartir.
     */
    done: {
      title: "Tu PDF está listo",
      body: "Guárdalo en tu teléfono o mándalo por donde lo necesites presentar.",
      shareLabel: "Guardar o compartir",
      downloadLabel: "Descargar el PDF",
      openLabel: "Verlo antes de decidir",
      doneLabel: "Listo",
      shareFailed:
        "Tu navegador no dejó abrir el menú de compartir. Usa Descargar el PDF.",
    },

    progress: {
      preparing: "Preparando la foto…",
      savingPage: "Guardando la página…",
      buildingPdf: "Armando tu PDF…",
      queueRemaining: "Quedan {n} fotos por revisar",
    },

    errors: {
      imageFailed: "No pudimos leer esa foto. Prueba con otra.",
      pageFailed: "No pudimos procesar esta página. Inténtalo otra vez.",
      pdfFailed: "No pudimos crear el PDF. Vuelve a intentarlo.",
      dismissLabel: "Entendido",
      discardTitle: "¿Salir sin guardar?",
      discardBody: "Vas a perder las páginas que ya escaneaste.",
      discardConfirmLabel: "Sí, salir",
      discardCancelLabel: "Seguir escaneando",
    },
  },

  // ── Rastreador de casos: consulta guiada ──────────────
  tracker: {
    title: "Consultar mi caso oficial",
    subtitle: "Te preparamos y te llevamos al sitio del gobierno que corresponde.",
    // §6 obliga a declararlo, y aquí es donde más protege al usuario.
    disclaimer:
      "ANDEX no está afiliado a ninguna agencia del gobierno. Estas consultas son gratuitas en los portales oficiales: nadie debería cobrarte por hacerlas.",

    copyNumber: "Copiar mi número",
    copied: "Copiado. Pégalo en el sitio oficial.",
    goToPortal: "Ir al portal oficial",
    opensExternal: "Se abre en una pestaña nueva",
    whatYouNeed: "Lo que necesitas a la mano",
    whatYouWillSee: "Lo que vas a ver",

    uscis: {
      name: "Estado de mi caso (USCIS)",
      summary: "En qué va tu solicitud: recibida, en revisión, aprobada o con pedido de más pruebas.",
      needs: "Tu número de recibo: 3 letras y 10 números, por ejemplo IOE1234567890.",
      whereToFind:
        "Está arriba a la izquierda de tu Notificación de Acción (Formulario I-797), la carta que te llegó cuando recibieron tu solicitud.",
      inputLabel: "Número de recibo",
      willSee:
        "La fecha de tu último movimiento y un texto en inglés con el estado. Si dice «Request for Evidence», te están pidiendo más documentos y hay una fecha límite.",
    },

    eoir: {
      name: "Mi cita en la corte (EOIR)",
      summary: "La fecha, la hora y la dirección de tu próxima audiencia.",
      needs: "Tu número A: la letra A y 9 números.",
      whereToFind:
        "Está en tu Notificación de Comparecencia y también en tu permiso de trabajo, arriba a la derecha.",
      inputLabel: "Número A",
      willSee:
        "La fecha de tu próxima audiencia, el nombre del juez y la dirección de la corte. Anótala en tu bóveda apenas la veas.",
      // Advertencia con consecuencias reales: faltar a una audiencia puede
      // significar una orden de deportación en ausencia.
      warning:
        "Faltar a una audiencia tiene consecuencias graves. Si la fecha cambió, confírmala también por teléfono.",
    },

    i94: {
      name: "Mi registro de entrada (I-94)",
      summary: "El comprobante oficial de tu última entrada legal al país.",
      needs: "Tu pasaporte a la mano, con el nombre y la fecha de nacimiento tal como aparecen ahí.",
      whereToFind:
        "Los datos se escriben exactamente igual que en tu pasaporte, incluidos los dos apellidos si los tienes.",
      willSee:
        "Un PDF con tu fecha de entrada y hasta cuándo puedes estar. Descárgalo y guárdalo aquí, en Estatus migratorio.",
      whyItMatters:
        "Te lo van a pedir para la licencia de manejo, para el permiso de trabajo y para casi cualquier trámite.",
    },

    dmv: {
      name: "Cita para la licencia de manejo",
      summary: "Agenda tu cita y llega con todos los papeles que te van a pedir.",
      needs: "Comprobante de domicilio, identificación y tu número de ITIN o Seguro Social.",
      willSee: "El calendario de citas de tu estado. Suelen agotarse: revisa temprano.",
      checklist: "Lo que debes llevar el día de la cita",
      // El fallo más común y más caro: presentarse sin un papel y perder
      // una cita que tardó semanas en conseguirse.
      checklistWarning:
        "Si te falta uno solo de estos papeles te devuelven sin atenderte y pierdes la cita.",
    },

    help: {
      title: "¿Se te complicó?",
      body: "Si no encuentras el número o no hay citas disponibles, alguien del equipo puede acompañarte.",
      cta: "Pedir acompañamiento",
      // Los servicios directos están fuera de la v1 hasta completar las
      // habilitaciones regulatorias (§0.5 y Anexo B).
      availability: "Disponible por etapas durante el piloto.",
    },
  },
};

export type BovedaDict = typeof es;

const en = {
  title: "Digital Vault",
  subtitle: "Your documents organized and your deadlines under control.",

  privacy: {
    badge: "Everything stays on your phone",
    headline: "Your documents don't leave this device",
    body:
      "Scanning happens inside your phone and files are stored encrypted on it. We don't upload them anywhere: not even we can see them.",
    caveat:
      "Since they live on your phone, protect it with your passcode or fingerprint: anyone who can unlock it can open the app.",
  },

  sections: {
    dueSoon: "Expiring soon",
    allDocuments: "Your documents",
  },

  search: {
    placeholder: "Search my documents",
    label: "Search for a document by name",
    clear: "Clear the search",
    filters: {
      all: "All",
      dueSoon: "Expiring soon",
      noExpiry: "No date",
    },
    resultCount: "{n} results",
    resultCountOne: "1 result",
    noResults: "We didn't find any document matching that.",
    noResultsHint: "Try a single word from the name you gave it.",
    noExpiryNudge:
      "These have no expiry date, so we can't warn you about them. Add one with the pencil.",
  },

  folders: {
    identity: { name: "Identification", hint: "Passport, consular ID, birth certificate" },
    immigration: {
      name: "Immigration status",
      hint: "Work permit, I-94, court dates, USCIS receipts",
    },
    driving: { name: "Driving and vehicle", hint: "License, registration, insurance" },
    taxes: { name: "Taxes", hint: "ITIN letter, W-2, 1099, tax returns" },
    housing: { name: "Housing and school", hint: "Lease, school records, diplomas" },
  },

  empty: {
    title: "Your vault is empty",
    body: "Scan your first document with the camera. It takes less than a minute.",
    cta: "Scan a document",
  },

  list: {
    documentCount: "{n} documents",
    documentCountOne: "1 document",
    pageCount: "{n} pages",
    pageCountOne: "1 page",
    open: "Open",
    rename: "Rename",
    move: "Move to folder",
    delete: "Delete",
    deleteConfirm:
      "It will be erased from your phone and can't be recovered. Delete it anyway?",
    deleteAction: "Yes, delete",
    keep: "Keep it",
    openFailed:
      "We couldn't open this document. It may have been saved on another phone, or the app data was cleared.",
  },

  expiry: {
    label: "Expiration date",
    optional: "Leave blank if it doesn't expire",
    none: "Doesn't expire",
    expired: "Expired {n} days ago",
    expiredToday: "Expired today",
    soon: "Expires in {n} days",
    soonOne: "Expires tomorrow",
    ok: "Valid",
    alertPromise:
      "We remind you 90, 60, 30 and 7 days ahead. No date will slip past you.",
  },

  scanner: {
    title: "Scan document",
    permissionTitle: "We need your camera",
    permissionBody:
      "Only to take the photo of the document. The image never leaves your phone.",
    permissionDenied: "Your browser blocked the camera",
    permissionDeniedHelp:
      "Enable it from the lock icon in the address bar, or pick a photo you already have.",
    noCamera: "We couldn't find a camera on this device.",
    fromGallery: "Choose from my gallery",
    capture: "Take photo",
    retake: "Retake photo",

    framingHint: "Place the document inside the frame, on a dark surface",

    adjustTitle: "Adjust the corners",
    adjustBody: "Drag the dots so they match the edges of the paper.",
    adjustKeyboard: "With a keyboard: Tab to pick a corner, arrows to move it.",
    adjustInvalid: "The crop is too small or too skewed. Adjust the corners.",
    detected: "We found the edges for you. Fix them if needed.",
    notDetected: "We couldn't find the edges. Please adjust them.",

    processing: "Straightening your document…",

    modeTitle: "How it looks",
    modes: {
      document: "Color",
      gray: "Gray",
      bw: "Black and white",
      photo: "Original photo",
    },
    modeWarning:
      "Keep color if you're filing with USCIS or a court: stamps and ink signatures are part of the document.",

    addPage: "Add another page",
    finish: "Done",
    pagesTitle: "Pages",
    movePageUp: "Move this page up",
    movePageDown: "Move this page down",
    removePage: "Remove this page",

    sizeTitle: "Paper size",
    sizeLetter: "Letter",
    sizeA4: "A4",
    sizeHint:
      "Letter is the U.S. size: use it for USCIS, courts, the IRS or the DMV. A4 only if you're filing at a consulate.",

    saveTitle: "Save to your vault",
    nameLabel: "What document is this?",
    namePlaceholder: "E.g.: María's passport",
    folderLabel: "Which folder?",
    noteLabel: "Note (optional)",
    notePlaceholder: "E.g.: the one the lawyer asked for",
    save: "Save to my vault",
    saved: "Saved to your vault",
    downloadPdf: "Download the PDF",
    cancel: "Cancel",
  },

  storage: {
    title: "Space on your phone",
    used: "{used} of {total} used",
    warning: "You're low on space. Download and delete what you no longer need.",
  },

  scan: {
    start: {
      title: "Scan a document",
      intro:
        "Take a photo of the paper and we turn it into a straight, readable PDF, ready to file.",
      privacyTitle: "It doesn't leave your phone",
      privacyBody:
        "The photo is processed right here and stored encrypted on your phone. We don't upload it anywhere.",
      startLabel: "Use the camera",
      galleryLabel: "Pick a photo I already have",
      cancelLabel: "Not now",
    },

    camera: {
      title: "Take the photo",
      hint: "Put the document on a dark surface and make sure all four corners show.",
      privacyNote: "The image never leaves your phone",
      requesting: "Asking for camera permission…",
      captureLabel: "Take photo",
      galleryLabel: "Choose from my gallery",
      cancelLabel: "Cancel",
      galleryShortLabel: "Gallery",
      cancelShortLabel: "Exit",
      deniedTitle: "Your browser blocked the camera",
      deniedBody: "You can allow it, or pick a photo you already have.",
      deniedHowTo:
        "Tap the lock icon next to the page address, open Camera and choose Allow. Then come back here.",
      unavailableTitle: "We couldn't find a camera",
      unavailableBody: "Pick a photo from your gallery and carry on.",
      failedTitle: "We couldn't open the camera",
      failedBody: "Another app may be using it. Close it and try again.",
      retryLabel: "Try again",
      systemCameraLabel: "Use the phone camera",
      captureError: "The photo didn't work. Try again.",
    },

    adjuster: {
      title: "Adjust the corners",
      hint: "Drag the dots until they match the edges of the paper.",
      keyboardHint: "With a keyboard: Tab to pick a corner, arrows to move it.",
      detecting: "Looking for the edges…",
      corners: {
        topLeft: "Top left corner",
        topRight: "Top right corner",
        bottomRight: "Bottom right corner",
        bottomLeft: "Bottom left corner",
      },
      unusableWarning: "The crop is too small or too skewed. Move the corners.",
      resetLabel: "Start over",
      backLabel: "Retake photo",
      continueLabel: "Continue",
      imageAlt: "Photo of the document with its corners marked",
    },

    preview: {
      title: "This is how it will look",
      modeLegend: "How it looks",
      modes: {
        document: "Color",
        gray: "Gray",
        bw: "Black and white",
        photo: "Original photo",
      },
      colorReason: "In color, because stamps and signatures are part of the document too.",
      colorWarning:
        "Careful: without color you lose stamps and ink signatures. If you're filing with USCIS or a court, keep the color.",
      processing: "Straightening your document…",
      processingError: "We couldn't process this photo. Try taking it again.",
      retryLabel: "Try again",
      adjustLabel: "Adjust again",
      addPageLabel: "Add another page",
      finishLabel: "Done",
      imageAlt: "View of the straightened document",
    },

    list: {
      countOne: "1 page",
      countOther: "{n} pages",
      pageLabel: "Page {n}",
      moveUpLabel: "Move page {n} up",
      moveDownLabel: "Move page {n} down",
      deleteLabel: "Remove page {n}",
      movedAnnouncement: "Page {from} moved to position {to}",
      deleteTitle: "Remove this page?",
      deleteBody: "Page {n} will be removed from this document.",
      deleteConfirmLabel: "Yes, remove it",
      deleteCancelLabel: "Keep it",
      emptyTitle: "No pages yet",
      emptyBody: "Take the first photo to get started.",
      thumbnailAlt: "View of page {n}",
    },

    review: {
      title: "Review your document",
      subtitle: "Reorder the pages and pick the paper size.",
      pageSizeLegend: "Paper size",
      pageSizes: {
        letter: "Letter",
        a4: "A4",
      },
      pageSizeNote:
        "Letter is the U.S. size: use it for USCIS, courts, the IRS or the DMV. A4 only if you're filing at a consulate.",
      addPageLabel: "Add another page",
      finishLabel: "Create my PDF",
      cancelLabel: "Cancel",
    },

    done: {
      title: "Your PDF is ready",
      body: "Save it to your phone or send it wherever you need to file it.",
      shareLabel: "Save or share",
      downloadLabel: "Download the PDF",
      openLabel: "See it first",
      doneLabel: "Done",
      shareFailed:
        "Your browser wouldn't open the share menu. Use Download the PDF.",
    },

    progress: {
      preparing: "Getting the photo ready…",
      savingPage: "Saving the page…",
      buildingPdf: "Building your PDF…",
      queueRemaining: "{n} photos left to review",
    },

    errors: {
      imageFailed: "We couldn't read that photo. Try another one.",
      pageFailed: "We couldn't process this page. Try again.",
      pdfFailed: "We couldn't create the PDF. Please try again.",
      dismissLabel: "Got it",
      discardTitle: "Leave without saving?",
      discardBody: "You'll lose the pages you already scanned.",
      discardConfirmLabel: "Yes, leave",
      discardCancelLabel: "Keep scanning",
    },
  },

  tracker: {
    title: "Check my official case",
    subtitle: "We get you ready and take you to the right government site.",
    disclaimer:
      "ANDEX is not affiliated with any government agency. These lookups are free on the official portals: nobody should charge you for them.",

    copyNumber: "Copy my number",
    copied: "Copied. Paste it on the official site.",
    goToPortal: "Go to the official portal",
    opensExternal: "Opens in a new tab",
    whatYouNeed: "What you need at hand",
    whatYouWillSee: "What you'll see",

    uscis: {
      name: "My case status (USCIS)",
      summary: "Where your application stands: received, under review, approved or needing more evidence.",
      needs: "Your receipt number: 3 letters and 10 digits, for example IOE1234567890.",
      whereToFind:
        "It's at the top left of your Notice of Action (Form I-797), the letter you got when they received your application.",
      inputLabel: "Receipt number",
      willSee:
        "The date of your last update and a status message in English. If it says «Request for Evidence», they're asking for more documents and there's a deadline.",
    },

    eoir: {
      name: "My court date (EOIR)",
      summary: "The date, time and address of your next hearing.",
      needs: "Your A-number: the letter A and 9 digits.",
      whereToFind:
        "It's on your Notice to Appear and also on your work permit, at the top right.",
      inputLabel: "A-number",
      willSee:
        "Your next hearing date, the judge's name and the court address. Save it in your vault as soon as you see it.",
      warning:
        "Missing a hearing has serious consequences. If the date changed, confirm it by phone too.",
    },

    i94: {
      name: "My entry record (I-94)",
      summary: "The official proof of your last legal entry into the country.",
      needs: "Your passport at hand, with the name and date of birth exactly as they appear there.",
      whereToFind:
        "Type the details exactly as in your passport, including both last names if you have them.",
      willSee:
        "A PDF with your entry date and how long you may stay. Download it and store it here, under Immigration status.",
      whyItMatters:
        "You'll need it for your driver's license, your work permit and almost any other filing.",
    },

    dmv: {
      name: "Driver's license appointment",
      summary: "Book your appointment and show up with every paper they'll ask for.",
      needs: "Proof of address, identification and your ITIN or Social Security number.",
      willSee: "Your state's appointment calendar. Slots run out: check early.",
      checklist: "What to bring on the day",
      checklistWarning:
        "If even one of these papers is missing they'll turn you away and you lose the appointment.",
    },

    help: {
      title: "Got stuck?",
      body: "If you can't find the number or there are no appointments, someone on the team can walk you through it.",
      cta: "Ask for help",
      availability: "Rolling out in stages during the pilot.",
    },
  },
} satisfies BovedaDict;

export const boveda = { es, en };
