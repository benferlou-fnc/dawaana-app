export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Un .env.local copié depuis .env.local.example contient encore les valeurs
// d'exemple : on les traite comme « non configuré » pour afficher un état vide
// clair plutôt que d'appeler un domaine qui n'existe pas.
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("xxxxxxxxxxxx") &&
    !supabaseAnonKey.includes("xxxxxxxxxxxxxxxxxxxxxxxx")
);

// Valeurs de repli : sans elles, l'application planterait au démarrage quand
// les variables ne sont pas encore renseignées.
export const safeUrl = supabaseUrl || "https://placeholder.supabase.co";
export const safeKey = supabaseAnonKey || "placeholder-anon-key";
