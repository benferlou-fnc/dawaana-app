import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isVerified,
  LISTING_SELECT,
  TRIP_SELECT,
  type Trip,
  type Listing,
} from "@/lib/types";
import { formatDateFr, daysUntil } from "@/lib/relativeTime";
import ListingCard from "@/components/ListingCard";
import VerifiedBadge from "@/components/VerifiedBadge";
import { PlaneIcon, CalendarIcon, MapPinIcon, ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

async function getTrip(id: string): Promise<Trip | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return (data as unknown as Trip) ?? null;
}

/** Demandes en attente dans la wilaya où ce voyageur arrive. */
async function getMatchingRequests(wilaya: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .eq("type", "recherche")
    .eq("wilaya", wilaya)
    .order("urgency", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) {
    console.error(error);
    return [];
  }
  return data as Listing[];
}

export default async function TripPage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  if (!trip) notFound();

  const matches = await getMatchingRequests(trip.to_wilaya);
  const days = daysUntil(trip.travel_date);
  const origin = [trip.from_city, trip.from_country].filter(Boolean).join(", ");

  return (
    <div className="max-w-5xl mx-auto px-6 py-11 flex flex-col gap-10">
      <div>
        <Link href="/voyages" className="text-sm text-brand-ink-soft hover:text-brand-coral-dark">
          ← Retour au carnet de voyages
        </Link>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-[20px] p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-brand-green-tint text-brand-green-dark flex items-center justify-center flex-none">
              <PlaneIcon size={20} />
            </span>
            <div>
              <h1 className="font-display font-extrabold text-[26px] leading-tight">
                {origin} → {trip.to_wilaya}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-sm font-semibold">{trip.first_name}</span>
                <VerifiedBadge verified={isVerified(trip)} />
              </div>
            </div>
          </div>
          {days >= 0 && (
            <span className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-bold bg-brand-coral-tint text-brand-coral-dark">
              {days === 0 ? "Arrive aujourd'hui" : days === 1 ? "Arrive demain" : `Dans ${days} jours`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-brand-ink-soft">
          <span className="flex items-center gap-2">
            <CalendarIcon />
            {formatDateFr(trip.travel_date)}
          </span>
          <span className="flex items-center gap-2">
            <MapPinIcon />
            Arrivée : {trip.to_wilaya}
          </span>
        </div>

        {trip.capacity_note && (
          <div className="rounded-2xl bg-brand-green-tint px-5 py-4">
            <div className="text-[13px] font-bold text-brand-green-dark mb-1">
              Disponibilité annoncée
            </div>
            <p className="text-sm text-brand-green-dark/90 leading-relaxed">{trip.capacity_note}</p>
          </div>
        )}

        {trip.context && (
          <p className="text-sm text-brand-ink-soft leading-relaxed">{trip.context}</p>
        )}

        <div className="flex gap-3 px-4 py-4 border-[1.5px] border-dashed border-brand-border rounded-xl">
          <ShieldIcon size={18} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-faint leading-relaxed">
            La mise en relation par messagerie n&apos;est pas encore ouverte. Un
            médicament doit voyager étiqueté au nom de la personne qui le porte,
            avec son ordonnance : ce trajet sert à savoir qui sera sur place, pas
            à confier un colis.
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="font-display font-bold text-xl">
            Demandes en attente à {trip.to_wilaya}
          </h2>
          <p className="text-brand-ink-soft text-sm mt-1">
            {matches.length === 0
              ? "Aucune demande active dans cette wilaya pour le moment."
              : `${matches.length} personne${matches.length > 1 ? "s cherchent" : " cherche"} un médicament là où ce trajet arrive.`}
          </p>
        </div>

        {matches.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
