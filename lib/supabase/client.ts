import { createBrowserClient } from "@supabase/ssr";
import { safeUrl, safeKey } from "./config";

/** Client à utiliser dans les composants « use client ». */
export function createClient() {
  return createBrowserClient(safeUrl, safeKey);
}
