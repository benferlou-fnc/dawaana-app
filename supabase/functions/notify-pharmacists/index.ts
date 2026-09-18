import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

// Edge Function déclenchée par un trigger Postgres (AFTER INSERT ON listings)
// à chaque nouveau don actif. Elle notifie tous les pharmaciens bénévoles
// abonnés aux notifications push, avec un lien direct vers l'annonce.

Deno.serve(async (req: Request) => {
  try {
    const { listing_id } = await req.json();
    if (!listing_id) {
      return new Response(JSON.stringify({ error: "listing_id manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // On revalide côté serveur que l'annonce est bien un don actif réel,
    // plutôt que de faire confiance à l'appelant (voir README sécurité).
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, medication_name, type, status, wilaya")
      .eq("id", listing_id)
      .eq("type", "don")
      .eq("status", "active")
      .maybeSingle();

    if (listingError || !listing) {
      return new Response(JSON.stringify({ skipped: true, reason: "annonce introuvable ou non concernée" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: vaultRows, error: vaultError } = await supabase
      .schema("vault")
      .from("decrypted_secrets")
      .select("name, decrypted_secret")
      .in("name", ["vapid_public_key", "vapid_private_key"]);

    if (vaultError || !vaultRows || vaultRows.length < 2) {
      console.error("Clés VAPID introuvables dans le vault", vaultError);
      return new Response(JSON.stringify({ error: "Clés VAPID indisponibles" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const publicKey = vaultRows.find((r) => r.name === "vapid_public_key")?.decrypted_secret;
    const privateKey = vaultRows.find((r) => r.name === "vapid_private_key")?.decrypted_secret;

    webpush.setVapidDetails("mailto:contact@dawaana.app", publicKey!, privateKey!);

    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth_key, profiles!inner(is_pharmacist)")
      .eq("profiles.is_pharmacist", true);

    if (subsError) {
      console.error("Erreur lecture des abonnements push", subsError);
      return new Response(JSON.stringify({ error: "Erreur lecture des abonnements" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title: "Nouveau don à contrôler",
      body: `${listing.medication_name} — ${listing.wilaya}`,
      url: `/annonces/${listing.id}`,
    });

    let sent = 0;
    const expiredIds: string[] = [];

    await Promise.all(
      (subs ?? []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth_key },
            },
            payload,
          );
          sent++;
        } catch (err: any) {
          const statusCode = err?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            expiredIds.push(sub.id);
          } else {
            console.error("Échec envoi push", sub.id, err?.message ?? err);
          }
        }
      }),
    );

    if (expiredIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expiredIds);
    }

    return new Response(JSON.stringify({ sent, expired_removed: expiredIds.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur inattendue notify-pharmacists", err);
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
