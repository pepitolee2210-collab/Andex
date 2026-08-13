/**
 * INGLÉS PARA EL TRABAJO — temarios por oficio.
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

export const RUTAS_INGLES: readonly LessonTrack[] = [
  // ══════════════════════════════════════════════════════
  {
    id: "ingles-limpieza",
    slug: "limpieza",
    title: "Inglés para limpieza",
    summary:
      "De la entrevista al primer día: casas, oficinas y hoteles.",
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
] as const;

export function rutaPorSlug(slug: string): LessonTrack | undefined {
  return RUTAS_INGLES.find((r) => r.slug === slug);
}

/** La ruta que corresponde a un oficio, si existe. */
export function rutaPorOficio(occupationTag: string): LessonTrack | undefined {
  const t = occupationTag.trim().toLowerCase();
  return RUTAS_INGLES.find((r) => r.occupationTag === t);
}
