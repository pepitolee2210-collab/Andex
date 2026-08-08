/**
 * Punto de entrada único de la capa de datos.
 * La UI importa SOLO de aquí: `import { getDataStore } from "@/lib/data"`.
 */

import { isDemoMode } from "@/lib/config";
import type { DataStore } from "./contract";
import { createDemoStore } from "./demo-store";
import { createSupabaseStore } from "./supabase-store";

export type { DataStore, StoredRanking, InterestSignal, ConsentRecord, LocationTransition } from "./contract";

let store: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!store) {
    store = isDemoMode ? createDemoStore() : createSupabaseStore();
  }
  return store;
}
