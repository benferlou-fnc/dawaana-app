import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { TRIP_SELECT, type Trip } from "@/lib/types";
import TripCard from "@/components/TripCard";
import { WILAYAS } from "@/lib/wilayas";
import { PlusIcon, ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function getTrips(searchParams: { wilaya?: string }): Promise<Trip[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = createClient();
  let query = supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("status", "active")
    // Un trajet déjà passé n'aide plus personne.
    .gte("travel_date", todayIso())
    .order("travel_date", { ascending: true });

  if (searchParams.wilaya) query = query.eq("to_wilaya", searchParams.wilaya);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data as Trip[];
}

export default async function VoyagesPage({
  searchParams,
}: {
  searchParams: { wilaya?: string };
}) {
  const trips = await getTrips(searchParams);

  return (
    <div className="max-w-6xl mx-auto px-6 py-11">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-[28px]">Carnet de voyages</h1>
          <p className="text-brand-ink-soft text-sm mt-1 max-w-xl">
            Les membres de la diaspora annoncent leurs trajets vers l&apos;Algérie.
            Savoir que quelqu&apos;un arrive bientôt dans une wilaya permet de
            s&apos;organiser à l&apos;avance.
          </p>
        </div>
        <Link
          href="/voyages/publier"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand-green-dark text-white font-display font-semibold text-sm hover:brightness-110 transition flex-none"
        >
          <PlusIcon />
          J&apos;annonce mon trajet
        </Link>
      </div>

      <div className="flex gap-3 mb-8 p-4 bg-brand-surface border border-brand-border rounded-2xl">
        <ShieldIcon size={18} className="text-brand-ink-faint flex-none mt-0.5" />
        <p className="text-xs text-brand-ink-soft leading-relaxed">
          <strong className="text-brand-ink">Ce carnet sert à se coordonner, pas à confier un colis.</strong>{" "}
          La réglementation douanière algérienne exige que les médicaments soient
          étiquetés au nom de la personne qui les transporte et accompagnés de son
          ordonnance. Transporter un médicament pour le compte d&apos;un tiers ne
          rentre pas dans ce cadre — Dawaana ne l&apos;organise pas et ne le
          recommande pas.{" "}
          <Link href="/confidentialite" className="underline underline-offset-2">
            En savoir plus
          </Link>
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-3 mb-9" method="get">
        <select
          name="wilaya"
          defaultValue={searchParams.wilaya ?? ""}
          className="h-11 px-4 rounded-xl border-[1.5px] border-brand-border bg-brand-surface text-sm text-brand-ink-soft"
        >
          <option value="">Toutes les wilayas d&apos;arrivée</option>
          {WILAYAS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-brand-ink text-white text-sm font-display font-semibold"
        >
          Filtrer
        </button>
      </form>

      {!isSupabaseConfigured ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-brand-ink-faint text-sm">
          Connectez Supabase pour afficher les trajets en direct.
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-brand-ink-faint text-sm">
          Aucun trajet annoncé pour le moment — soyez le premier à publier le vôtre.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </div>
      )}
    </div>
  );
}
