"use client";

/**
 * BÓVEDA — almacenamiento cifrado en el dispositivo.
 *
 * IndexedDB con los archivos cifrados en AES-GCM 256. No `localStorage`:
 * un PDF de varias páginas son megabytes, y `localStorage` tiene un tope de
 * ~5 MB y además es síncrono, así que bloquearía la pantalla al guardar.
 *
 * ── Qué protege este cifrado, y qué NO ────────────────────────────────
 *
 * Conviene ser exacto, porque prometer de más en seguridad es peor que no
 * prometer nada.
 *
 *  SÍ protege: los archivos en disco. Lo que IndexedDB deja escrito en el
 *  almacenamiento del teléfono son bytes cifrados, no JPEG legibles. Ante
 *  un análisis forense del dispositivo —el escenario que de verdad teme
 *  esta audiencia— eso es una diferencia real.
 *
 *  NO protege: a alguien que abra la app en el propio teléfono desbloqueado.
 *  La clave vive en el mismo navegador; si tienes la sesión, tienes los
 *  documentos. Eso se resuelve con el bloqueo de pantalla del teléfono, no
 *  aquí, y la interfaz debe decirlo así.
 *
 * La clave se guarda como `CryptoKey` NO extraíble: ni siquiera el código
 * de esta app puede leer su material en bruto, sólo pedirle al navegador
 * que cifre o descifre. Un script inyectado no se la puede llevar.
 *
 * ── Lo que falta para la nube (V2) ────────────────────────────────────
 * Para sincronizar habría que derivar la clave de una frase del usuario
 * (PBKDF2 o Argon2) y subir sólo el resultado cifrado, de modo que el
 * servidor no pueda descifrar nada. Mientras eso no exista, los documentos
 * NO salen del dispositivo — y la interfaz tampoco debe insinuar que sí.
 */

import type { VaultDocument, VaultFolderId } from "./types";

const DB_NAME = "andex-vault";
const DB_VERSION = 1;
const STORE_DOCS = "documents";
const STORE_BLOBS = "blobs";
const STORE_KEYS = "keys";
const KEY_ID = "vault-key-v1";

// ─── Base de datos ───────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Este navegador no puede guardar documentos."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        const docs = db.createObjectStore(STORE_DOCS, { keyPath: "id" });
        docs.createIndex("folder", "folder");
        // Índice por vencimiento: la consulta más frecuente es "qué se me
        // vence pronto", y sin él habría que recorrer todo el almacén.
        docs.createIndex("expiresAt", "expiresAt");
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir la bóveda."));
  });

  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Error de almacenamiento."));
      }),
  );
}

// ─── Clave ───────────────────────────────────────────────

let keyPromise: Promise<CryptoKey> | null = null;

/**
 * Obtiene la clave del dispositivo, creándola la primera vez.
 *
 * `extractable: false` es deliberado: el navegador nunca entrega el
 * material de la clave, ni a esta app. Se puede cifrar y descifrar con
 * ella, pero no copiarla ni enviarla a ningún sitio.
 */
function getKey(): Promise<CryptoKey> {
  if (keyPromise) return keyPromise;

  keyPromise = (async () => {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      throw new Error("Este navegador no puede cifrar tus documentos.");
    }

    const existing = await tx<CryptoKey | undefined>(STORE_KEYS, "readonly", (s) =>
      s.get(KEY_ID),
    );
    if (existing) return existing;

    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    await tx(STORE_KEYS, "readwrite", (s) => s.put(key, KEY_ID));
    return key;
  })();

  return keyPromise;
}

/** Longitud del vector de inicialización de AES-GCM, en bytes. */
const IV_BYTES = 12;

/**
 * Cifra y devuelve un único bloque: [IV | texto cifrado].
 *
 * El IV va DENTRO del mismo bloque en vez de en un campo aparte. Así el
 * archivo guardado se basta a sí mismo: no hay forma de que un cambio de
 * esquema deje el dato cifrado sin su IV, que lo volvería ilegible para
 * siempre. El IV no es secreto — sólo debe ser distinto en cada cifrado.
 */
async function encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await getKey();
  // IV nuevo en cada archivo: repetirlo en AES-GCM rompe el cifrado entero.
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  const packed = new Uint8Array(IV_BYTES + cipher.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipher), IV_BYTES);
  return packed.buffer;
}

async function decrypt(packed: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await getKey();
  const iv = new Uint8Array(packed.slice(0, IV_BYTES));
  const cipher = packed.slice(IV_BYTES);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
}

// ─── API de la bóveda ────────────────────────────────────

export type SaveDocumentInput = {
  folder: VaultFolderId;
  name: string;
  expiresAt: string | null;
  note: string | null;
  pageCount: number;
  pdf: Blob;
};

/** Guarda un documento cifrado y devuelve su ficha. */
export async function saveDocument(input: SaveDocumentInput): Promise<VaultDocument> {
  const packed = await encrypt(await input.pdf.arrayBuffer());

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const doc: VaultDocument = {
    id,
    folder: input.folder,
    name: input.name,
    expiresAt: input.expiresAt,
    pageCount: input.pageCount,
    sizeBytes: packed.byteLength,
    createdAt: now,
    updatedAt: now,
    note: input.note,
  };

  await tx(STORE_BLOBS, "readwrite", (s) => s.put(packed, id));
  await tx(STORE_DOCS, "readwrite", (s) => s.put(doc));
  return doc;
}

export async function listDocuments(): Promise<VaultDocument[]> {
  try {
    return await tx<VaultDocument[]>(STORE_DOCS, "readonly", (s) => s.getAll());
  } catch {
    // Sin bóveda disponible (modo privado, cuota llena) la pantalla debe
    // seguir cargando y mostrar su estado vacío, no romperse.
    return [];
  }
}

/** Recupera y descifra el PDF de un documento. */
export async function readDocument(id: string): Promise<Blob | null> {
  const packed = await tx<ArrayBuffer | undefined>(STORE_BLOBS, "readonly", (s) =>
    s.get(id),
  );
  if (!packed) return null;

  try {
    const bytes = await decrypt(packed);
    return new Blob([bytes], { type: "application/pdf" });
  } catch {
    // Si el descifrado falla, la clave no corresponde a este dato: se dice
    // que no está, en vez de devolver basura que el visor no abrirá.
    return null;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  await tx(STORE_BLOBS, "readwrite", (s) => s.delete(id));
  await tx(STORE_DOCS, "readwrite", (s) => s.delete(id));
}

export async function updateDocument(
  id: string,
  patch: Partial<Pick<VaultDocument, "name" | "folder" | "expiresAt" | "note">>,
): Promise<VaultDocument | null> {
  const current = await tx<VaultDocument | undefined>(STORE_DOCS, "readonly", (s) =>
    s.get(id),
  );
  if (!current) return null;

  const next: VaultDocument = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await tx(STORE_DOCS, "readwrite", (s) => s.put(next));
  return next;
}

/**
 * Espacio ocupado y disponible.
 *
 * Merece pantalla propia: el público objetivo usa teléfonos con poco
 * almacenamiento, y un guardado que falla a mitad sin explicar por qué es
 * exactamente la clase de fallo que hace desconfiar de una app.
 */
export async function storageEstimate(): Promise<{ used: number; quota: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { used: usage, quota };
}

/**
 * Pide al navegador que no borre la bóveda cuando ande escaso de espacio.
 *
 * Sin esto, un teléfono lleno puede vaciar IndexedDB sin avisar y llevarse
 * los documentos por delante. Se pide al guardar el primero.
 */
export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
