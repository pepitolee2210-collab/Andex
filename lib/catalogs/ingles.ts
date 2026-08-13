/**
 * INGLÉS PARA EL TRABAJO — temarios por oficio, y el catálogo completo.
 *
 * Los transversales —pago y derechos, seguridad, primeros meses— viven en
 * `ingles-transversales.ts`, porque salen de otra evidencia y se ofrecen con
 * otra regla: los de oficio se eligen, los transversales le hacen falta a
 * todo el mundo.
 *
 * ⚠️ TEMPORAL POR DISEÑO. La forma es un espejo exacto de `lesson_tracks` y
 * `lessons` en `0009_lugares_y_ingles.sql`, así que el día que el panel de
 * administración escriba el contenido lo único que cambia es de dónde salen
 * los datos. Ningún componente se entera.
 *
 * ── Por qué las frases viven aquí y no en i18n ──
 *
 * Porque no son copy de interfaz: son el CONTENIDO del curso, y son
 * bilingües por naturaleza — la frase en inglés y su significado en español
 * son las dos mitades del mismo dato. En la base viajan juntas dentro de un
 * JSONB. Los títulos de sección y las etiquetas de los botones sí están en
 * i18n, como todo lo demás.
 *
 * ── Sobre la pronunciación ──
 *
 * `say` está escrita como la leería alguien que sabe leer español, con la
 * sílaba fuerte en MAYÚSCULAS. No es alfabeto fonético a propósito: el AFI
 * no lo lee nadie sin haberlo estudiado, y aquí el objetivo es que una
 * persona pueda practicar sola en su casa esta noche.
 */

import type { LessonTrack } from "@/lib/academia/types";
import { RUTAS_TRANSVERSALES } from "./ingles-transversales";

const RUTAS_POR_OFICIO: readonly LessonTrack[] = [
  // ══════════════════════════════════════════════════════
  {
    id: "ingles-limpieza",
    slug: "limpieza",
    title: "Inglés para limpieza",
    summary:
      "De la entrevista al primer día: casas, oficinas y hoteles.",
    kind: "oficio",
    occupationTag: "limpieza",
    level: "basico",
    weeks: 4,
    lessons: [
      {
        id: "limpieza-entrevista",
        position: 1,
        title: "La entrevista",
        situation: "entrevista",
        phrases: [
          { en: "I have experience cleaning houses.", es: "Tengo experiencia limpiando casas.", say: "ai jav eks-PÍ-riens CLÍ-nin JÁU-ses" },
          { en: "I can start on Monday.", es: "Puedo empezar el lunes.", say: "ai can start on MÁN-dei" },
          { en: "How many hours per week?", es: "¿Cuántas horas por semana?", say: "jáu MÉ-ni áu-ers per uík" },
          { en: "Do you provide the supplies?", es: "¿Ustedes ponen los productos?", say: "du yu pro-VÁID de su-PLÁIS", note: "Pregúntalo siempre: si los pones tú, sale de tu pago." },
          { en: "What is the pay?", es: "¿Cuánto es el pago?", say: "uát is de péi" },
          { en: "I have my own transportation.", es: "Tengo mi propio transporte.", say: "ai jav mai óun trans-por-TÉI-shon" },
        ],
      },
      {
        id: "limpieza-primer-dia",
        position: 2,
        title: "El primer día",
        situation: "primer_dia",
        phrases: [
          { en: "Where do I start?", es: "¿Por dónde empiezo?", say: "uér du ai start" },
          { en: "Where are the cleaning supplies?", es: "¿Dónde están los productos?", say: "uér ar de CLÍ-nin su-PLÁIS" },
          { en: "Should I use this on the floor?", es: "¿Uso esto en el piso?", say: "shud ai yus dis on de flor" },
          { en: "Is this room included?", es: "¿Este cuarto también va?", say: "is dis rum in-CLÚ-did" },
          { en: "I'm done with the kitchen.", es: "Ya terminé la cocina.", say: "aim dan uíd de KÍ-chen" },
        ],
      },
      {
        id: "limpieza-turno",
        position: 3,
        title: "Durante el turno",
        situation: "en_el_turno",
        phrases: [
          { en: "I need more towels.", es: "Necesito más toallas.", say: "ai nid mor TÁU-els" },
          { en: "The vacuum is not working.", es: "La aspiradora no sirve.", say: "de VÁ-kium is not UÉR-kin" },
          { en: "Can I take my break now?", es: "¿Puedo tomar mi descanso?", say: "can ai teik mai breik náu" },
          { en: "I finished. Do you need anything else?", es: "Terminé. ¿Necesita algo más?", say: "ai FÍ-nisht. du yu nid É-ni-zin els" },
        ],
      },
      {
        id: "limpieza-problema",
        position: 4,
        title: "Cuando algo sale mal",
        situation: "problema",
        phrases: [
          { en: "I broke something. I'm sorry.", es: "Rompí algo. Lo siento.", say: "ai brouk SAM-zin. aim SÓ-rri", note: "Decirlo tú primero evita el problema más grande." },
          { en: "This stain will not come out.", es: "Esta mancha no sale.", say: "dis stein uil not cam áut" },
          { en: "I don't understand. Can you show me?", es: "No entiendo. ¿Me puede enseñar?", say: "ai dont an-der-STAND. can yu shóu mi", note: "La frase más útil del idioma. No da pena: da confianza." },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  {
    id: "ingles-restaurante",
    slug: "restaurante",
    title: "Inglés para restaurante",
    summary: "Mesero, ayudante de cocina y lavaplatos.",
    kind: "oficio",
    occupationTag: "mesero",
    level: "basico",
    weeks: 5,
    lessons: [
      {
        id: "restaurante-entrevista",
        position: 1,
        title: "La entrevista",
        situation: "entrevista",
        phrases: [
          { en: "I'm here about the job.", es: "Vengo por el trabajo.", say: "aim jíar a-BÁUT de yob" },
          { en: "I have worked in a restaurant before.", es: "Ya he trabajado en un restaurante.", say: "ai jav uérkt in a RES-to-rant bi-FÓR" },
          { en: "I can work nights and weekends.", es: "Puedo trabajar noches y fines de semana.", say: "ai can uérk naits and UÍK-ends", note: "Es lo que más les importa oír." },
          { en: "How much are the tips?", es: "¿Cómo son las propinas?", say: "jáu mach ar de tips" },
        ],
      },
      {
        id: "restaurante-primer-dia",
        position: 2,
        title: "El primer día",
        situation: "primer_dia",
        phrases: [
          { en: "Where do I clock in?", es: "¿Dónde marco mi entrada?", say: "uér du ai clok in" },
          { en: "What is my section?", es: "¿Cuál es mi área?", say: "uát is mai SEK-shon" },
          { en: "Where do the dirty dishes go?", es: "¿Dónde van los platos sucios?", say: "uér du de DÉR-ti DÍ-shes góu" },
          { en: "What time is my break?", es: "¿A qué hora es mi descanso?", say: "uát taim is mai breik" },
        ],
      },
      {
        id: "restaurante-turno",
        position: 3,
        title: "Atendiendo mesas",
        situation: "en_el_turno",
        phrases: [
          { en: "Are you ready to order?", es: "¿Ya van a ordenar?", say: "ar yu RÉ-di tu ÓR-der" },
          { en: "Anything to drink?", es: "¿Algo de tomar?", say: "É-ni-zin tu drink" },
          { en: "I'll be right back.", es: "Ahorita regreso.", say: "ail bi rait bak" },
          { en: "Is everything okay?", es: "¿Todo bien?", say: "is ÉV-ri-zin ou-KÉI" },
          { en: "Table four needs water.", es: "La mesa cuatro necesita agua.", say: "TÉI-bol for nids UÓ-ter" },
          { en: "Would you like dessert?", es: "¿Gustan postre?", say: "wud yu laik di-SÉRT" },
        ],
      },
      {
        id: "restaurante-problema",
        position: 4,
        title: "Cuando algo sale mal",
        situation: "problema",
        phrases: [
          { en: "I'm sorry, let me fix that.", es: "Disculpe, déjeme arreglarlo.", say: "aim SÓ-rri, let mi fiks dat" },
          { en: "Let me get my manager.", es: "Déjeme llamar al gerente.", say: "let mi guet mai MÁ-ni-yer", note: "Nunca discutas con un cliente. Esta frase te saca de todo." },
          { en: "Can you repeat that, please?", es: "¿Me lo repite, por favor?", say: "can yu ri-PÍT dat, plis" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  {
    id: "ingles-cuidado-ninos",
    slug: "cuidado-ninos",
    title: "Inglés para cuidado de niños",
    summary: "Niñera y cuidado en casa. Incluye lo que hay que saber decir en una emergencia.",
    kind: "oficio",
    occupationTag: "ninera",
    level: "basico",
    weeks: 4,
    lessons: [
      {
        id: "ninos-entrevista",
        position: 1,
        title: "La entrevista",
        situation: "entrevista",
        phrases: [
          { en: "I have cared for children for five years.", es: "He cuidado niños por cinco años.", say: "ai jav kerd for CHÍL-dren for faiv yíars", note: "Cambia el número por el tuyo." },
          { en: "I know first aid and CPR.", es: "Sé primeros auxilios y RCP.", say: "ai nóu ferst eid and si-pi-ÁR", note: "Sólo si es cierto. Si no lo es, la certificación es barata y te sube el pago." },
          { en: "I have references.", es: "Tengo referencias.", say: "ai jav RE-fe-ren-ses" },
          { en: "I can also help with light cleaning.", es: "También puedo ayudar con limpieza ligera.", say: "ai can ÓL-so jelp uíd lait CLÍ-nin" },
        ],
      },
      {
        id: "ninos-primer-dia",
        position: 2,
        title: "Lo que hay que preguntar el primer día",
        situation: "primer_dia",
        phrases: [
          { en: "Does she have any allergies?", es: "¿Tiene alguna alergia?", say: "das shi jav É-ni Á-ler-yis", note: "Pregúntalo SIEMPRE, antes que nada." },
          { en: "What time is snack?", es: "¿A qué hora es la merienda?", say: "uát taim is snak" },
          { en: "What time is bedtime?", es: "¿A qué hora se duerme?", say: "uát taim is BED-taim" },
          { en: "Can I give him this?", es: "¿Le puedo dar esto?", say: "can ai guiv jim dis" },
          { en: "Where is the first aid kit?", es: "¿Dónde está el botiquín?", say: "uér is de ferst eid kit" },
        ],
      },
      {
        id: "ninos-emergencia",
        position: 3,
        title: "Emergencia",
        situation: "emergencia",
        phrases: [
          { en: "He is hurt. I'm calling you now.", es: "Se lastimó. Le estoy llamando.", say: "ji is jert. aim CÓ-lin yu náu" },
          { en: "She has a fever.", es: "Tiene fiebre.", say: "shi jas a FÍ-ver" },
          { en: "I'm calling 911.", es: "Estoy llamando al 911.", say: "aim CÓ-lin nain-uán-uán" },
          { en: "We are at home. The address is…", es: "Estamos en la casa. La dirección es…", say: "uí ar at jóum. de a-DRÉS is…", note: "Ten la dirección escrita en tu teléfono desde el primer día." },
          { en: "The child is breathing.", es: "El niño está respirando.", say: "de chaild is BRÍ-din", note: "Es lo primero que pregunta el 911." },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  {
    id: "ingles-jardineria",
    slug: "jardineria",
    title: "Inglés para jardinería",
    summary: "Corte de pasto, poda y mantenimiento de jardines.",
    kind: "oficio",
    occupationTag: "jardineria",
    level: "basico",
    weeks: 3,
    lessons: [
      {
        id: "jardineria-entrevista",
        position: 1,
        title: "La entrevista",
        situation: "entrevista",
        phrases: [
          { en: "I have experience with lawns.", es: "Tengo experiencia con jardines.", say: "ai jav eks-PÍ-riens uíd lons" },
          { en: "I can use a mower and a trimmer.", es: "Puedo usar podadora y orilladora.", say: "ai can yus a MÓ-uer and a TRÍ-mer" },
          { en: "Do I need my own tools?", es: "¿Necesito mis propias herramientas?", say: "du ai nid mai óun tuls" },
        ],
      },
      {
        id: "jardineria-trabajo",
        position: 2,
        title: "En el trabajo",
        situation: "en_el_turno",
        phrases: [
          { en: "Where do I put the clippings?", es: "¿Dónde pongo la basura de jardín?", say: "uér du ai put de CLÍ-pins" },
          { en: "How short do you want the grass?", es: "¿Qué tan bajo corto el pasto?", say: "jáu short du yu uánt de gras" },
          { en: "Do you want me to trim the bushes?", es: "¿Quiere que pode los arbustos?", say: "du yu uánt mi tu trim de BÚ-shes" },
          { en: "I'm finished. Do you want to check?", es: "Ya terminé. ¿Quiere revisar?", say: "aim FÍ-nisht. du yu uánt tu chek" },
        ],
      },
      {
        id: "jardineria-problema",
        position: 3,
        title: "Cuando algo sale mal",
        situation: "problema",
        phrases: [
          { en: "The mower stopped working.", es: "La podadora se descompuso.", say: "de MÓ-uer stopt UÉR-kin" },
          { en: "I hit a sprinkler. I'm sorry.", es: "Le pegué a un aspersor. Lo siento.", say: "ai jit a SPRÍN-kler. aim SÓ-rri" },
          { en: "It's going to rain. Should I come back tomorrow?", es: "Va a llover. ¿Regreso mañana?", say: "its GÓU-in tu rein. shud ai cam bak tu-MÓ-rrou" },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════
  // Los dos oficios que faltaban. No es una intuición: el Migration Policy
  // Institute los señala como los de mayor presencia migrante junto a
  // limpieza y restaurante. Apoyo sanitario es uno de cada cuatro
  // trabajadores del sector —y paga mejor que la limpieza—; construcción,
  // un tercio.
  // ══════════════════════════════════════════════════════
  {
    id: "ingles-cuidado-en-casa",
    slug: "cuidado-en-casa",
    title: "Inglés para cuidado de personas mayores",
    summary:
      "Cuidado en casa y asistencia. Uno de cada cuatro de estos trabajos lo hace alguien migrante, y paga mejor que la limpieza.",
    kind: "oficio",
    occupationTag: "cuidado_personal",
    level: "basico",
    weeks: 5,
    lessons: [
      {
        id: "cuidado-entrevista",
        position: 1,
        title: "La entrevista",
        situation: "entrevista",
        phrases: [
          { en: "I have experience caring for older adults.", es: "Tengo experiencia cuidando adultos mayores.", say: "ai jav eks-PÍ-riens KÉ-rin for ÓL-der Á-dolts" },
          { en: "I can help with bathing and dressing.", es: "Puedo ayudar a bañarse y vestirse.", say: "ai can jelp uíd BÉI-din and DRÉ-sin" },
          { en: "I can cook and give medicine on time.", es: "Puedo cocinar y dar la medicina a tiempo.", say: "ai can kuk and guiv MÉ-di-sin on taim" },
          { en: "Do you need someone at night?", es: "¿Necesitan a alguien de noche?", say: "du yu nid SÁM-uan at nait", note: "El turno de noche paga más." },
        ],
      },
      {
        id: "cuidado-primer-dia",
        position: 2,
        title: "Lo que hay que preguntar el primer día",
        situation: "primer_dia",
        phrases: [
          { en: "What medicine does she take, and at what time?", es: "¿Qué medicina toma y a qué hora?", say: "uát MÉ-di-sin das shi teik, and at uát taim" },
          { en: "Can he walk by himself?", es: "¿Puede caminar solo?", say: "can ji uók bai jim-SÉLF" },
          { en: "Is there a special diet?", es: "¿Tiene alguna dieta especial?", say: "is der a SPÉ-shal DÁI-et" },
          { en: "Who do I call if there is a problem?", es: "¿A quién llamo si hay un problema?", say: "ju du ai col if der is a PRÓ-blem" },
        ],
      },
      {
        id: "cuidado-turno",
        position: 3,
        title: "Durante el día",
        situation: "en_el_turno",
        phrases: [
          { en: "Are you in pain?", es: "¿Le duele algo?", say: "ar yu in péin" },
          { en: "Let me help you stand up.", es: "Déjeme ayudarle a levantarse.", say: "let mi jelp yu stand ap" },
          { en: "Did you take your medicine?", es: "¿Ya tomó su medicina?", say: "did yu teik yor MÉ-di-sin" },
          { en: "Are you hungry?", es: "¿Tiene hambre?", say: "ar yu JÁN-gri" },
          { en: "Let us go slowly.", es: "Vamos despacio.", say: "lets góu SLÓU-li" },
        ],
      },
      {
        id: "cuidado-emergencia",
        position: 4,
        title: "Emergencia",
        situation: "emergencia",
        phrases: [
          { en: "She fell.", es: "Se cayó.", say: "shi fel" },
          { en: "He is not breathing well.", es: "No está respirando bien.", say: "ji is not BRÍ-din uél" },
          { en: "He is not responding.", es: "No responde.", say: "ji is not ris-PÓN-din" },
          { en: "I am calling 911 now.", es: "Estoy llamando al 911 ahora.", say: "ai am CÓ-lin nain-uán-uán náu" },
          { en: "The address is…", es: "La dirección es…", say: "de a-DRÉS is…", note: "Ten la dirección escrita en tu teléfono desde el primer día." },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  {
    id: "ingles-construccion",
    slug: "construccion",
    title: "Inglés para construcción",
    summary: "Herramientas, instrucciones en la obra y las palabras que evitan un accidente.",
    kind: "oficio",
    occupationTag: "construccion",
    level: "basico",
    weeks: 4,
    lessons: [
      {
        id: "construccion-entrevista",
        position: 1,
        title: "La entrevista",
        situation: "entrevista",
        phrases: [
          { en: "I have experience in construction.", es: "Tengo experiencia en construcción.", say: "ai jav eks-PÍ-riens in cons-TRÁK-shon" },
          { en: "I can do framing and drywall.", es: "Puedo hacer estructura y tablaroca.", say: "ai can du FRÉI-min and DRÁI-uol" },
          { en: "I have my own tools.", es: "Tengo mis propias herramientas.", say: "ai jav mai óun tuls" },
          { en: "What time does the crew start?", es: "¿A qué hora empieza la cuadrilla?", say: "uát taim das de kru start" },
        ],
      },
      {
        id: "construccion-herramientas",
        position: 2,
        title: "Las herramientas, por su nombre",
        situation: "primer_dia",
        phrases: [
          { en: "hammer", es: "martillo", say: "JÁ-mer" },
          { en: "drill", es: "taladro", say: "dril" },
          { en: "saw", es: "sierra o serrucho", say: "so" },
          { en: "ladder", es: "escalera", say: "LÁ-der" },
          { en: "tape measure", es: "cinta métrica", say: "téip MÉ-shur" },
          { en: "level", es: "nivel", say: "LÉ-vel" },
          { en: "stud", es: "poste de la pared", say: "stad" },
        ],
      },
      {
        id: "construccion-instrucciones",
        position: 3,
        title: "Entender la instrucción",
        situation: "en_el_turno",
        phrases: [
          { en: "How many inches?", es: "¿Cuántas pulgadas?", say: "jáu MÉ-ni ÍN-ches", note: "Aquí se mide en pulgadas y pies, no en centímetros." },
          { en: "Can you show me once?", es: "¿Me lo enseña una vez?", say: "can yu shóu mi uáns" },
          { en: "Where does this go?", es: "¿Dónde va esto?", say: "uér das dis góu" },
          { en: "I need more material.", es: "Necesito más material.", say: "ai nid mor ma-TÍ-rial" },
          { en: "Is this the right one?", es: "¿Es éste el correcto?", say: "is dis de rait uán" },
        ],
      },
      {
        id: "construccion-peligro",
        position: 4,
        title: "Las palabras que evitan un accidente",
        situation: "emergencia",
        phrases: [
          { en: "Watch out!", es: "¡Aguas! ¡Cuidado!", say: "uách áut", note: "Grítala. Es la que salva." },
          { en: "Stop!", es: "¡Pare!", say: "stop" },
          { en: "Behind you!", es: "¡Atrás de ti!", say: "bi-JÁIND yu" },
          { en: "The ladder is not stable.", es: "La escalera está insegura.", say: "de LÁ-der is not STÉI-bol" },
          { en: "Someone is hurt. Call 911.", es: "Hay alguien lastimado. Llame al 911.", say: "SÁM-uan is jert. col nain-uán-uán" },
        ],
      },
    ],
  },
] as const;

/**
 * Todo el catálogo: los oficios y los transversales.
 *
 * Los transversales van PRIMERO a propósito. Nadie sabe que necesita saber
 * qué hacer cuando no le pagan o cuando algo es peligroso, así que no se
 * puede esperar a que lo busque: se pone delante.
 */
export const RUTAS_INGLES: readonly LessonTrack[] = [
  ...RUTAS_TRANSVERSALES,
  ...RUTAS_POR_OFICIO,
];

export function rutaPorSlug(slug: string): LessonTrack | undefined {
  return RUTAS_INGLES.find((r) => r.slug === slug);
}

/** La ruta que corresponde a un oficio, si existe. */
export function rutaPorOficio(occupationTag: string): LessonTrack | undefined {
  const t = occupationTag.trim().toLowerCase();
  // Sólo temarios de oficio: un transversal no "pertenece" a ningún trabajo,
  // y devolverlo aquí haría que una vacante de limpieza ofreciera el temario
  // de derechos como si fuera su curso de inglés.
  return RUTAS_POR_OFICIO.find((r) => r.occupationTag === t);
}

export { RUTAS_TRANSVERSALES, RUTAS_POR_OFICIO };
