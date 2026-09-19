import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isVerified,
  LISTING_SELECT,
  TRIP_SELECT,
  type Trip,
  type Listing,
  type ChatMessage,
  type Conversation,
} from "@/lib/types";
import { formatDate, daysUntil } from "@/lib/relativeTime";
import ListingCard from "@/components/ListingCard";
import ConversationSection from "@/components/ConversationSection";
import VerifiedBadge from "@/components/VerifiedBadge";
import { PlaneIcon, CalendarIcon, MapPinIcon, ShieldIcon, MessageCircleIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

export const dynamic = "force-dynamic";

async function getTrip(id: string): Promise<Trip | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("id", id)
    // Pas de filtre sur le statut : c'est la base qui décide qui voit quoi.
    // Un visiteur ne voit que les trajets actifs, l'auteur voit aussi le
    // sien une fois retiré — sinon « Mes trajets » menait à une page
    // introuvable.
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
    // 'urgent' > 'normal' dans l'ordre alphabétique : il faut donc
    // descendre pour faire remonter les demandes urgentes en premier.
    .order("urgency", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) {
    console.error(error);
    return [];
  }
  return data as Listing[];
}

type ConversationRow = Conversation & {
  owner: { first_name: string } | null;
  requester: { first_name: string } | null;
};

/**
 * Conversations de ce trajet visibles par l'utilisateur courant (les règles
 * de la base ne laissent passer que celles où il est le voyageur ou la
 * personne qui écrit), avec le prénom de l'autre participant déjà résolu,
 * et les messages des conversations acceptées.
 */
async function getConversationData(tripId: string, meId: string | null) {
  if (!meId) return { conversations: [] as Conversation[], messages: {} as Record<string, ChatMessage[]> };

  const supabase = createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      "*, owner:profiles!conversations_owner_id_fkey(first_name), requester:profiles!conversations_requester_id_fkey(first_name)"
    )
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  const rows = (data as unknown as ConversationRow[]) ?? [];
  const conversations: Conversation[] = rows.map((c) => ({
    id: c.id,
    listing_id: c.listing_id,
    trip_id: c.trip_id,
    owner_id: c.owner_id,
    requester_id: c.requester_id,
    status: c.status,
    created_at: c.created_at,
    responded_at: c.responded_at,
    other_first_name: (c.owner_id === meId ? c.requester?.first_name : c.owner?.first_name) || undefined,
  }));

  const acceptedIds = conversations.filter((c) => c.status === "accepted").map((c) => c.id);
  const messages: Record<string, ChatMessage[]> = {};
  if (acceptedIds.length > 0) {
    const { data: msgRows } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", acceptedIds)
      .order("created_at", { ascending: true });
    for (const m of (msgRows as ChatMessage[]) ?? []) {
      (messages[m.conversation_id] ??= []).push(m);
    }
  }

  return { conversations, messages };
}

export default async function TripPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const trip = await getTrip(params.id);
  if (!trip) notFound();

  const me = await getCurrentProfile();
  const isOwner = Boolean(me) && me!.id === trip.user_id;
  const { conversations, messages } = await getConversationData(trip.id, me?.id ?? null);
  const matches = await getMatchingRequests(trip.to_wilaya);
  const days = daysUntil(trip.travel_date);
  const origin = [trip.from_city, trip.from_country ? countryLabel(trip.from_country, locale) : null]
    .filter(Boolean)
    .join(", ");
  const toWilaya = wilayaLabel(trip.to_wilaya, locale);

  return (
    <div className="max-w-5xl mx-auto px-6 py-11 flex flex-col gap-10">
      <div>
        <Link href="/voyages" className="text-sm text-brand-ink-soft hover:text-brand-coral-dark">
          {dict.voyageDetail.back}
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
                {origin} → {toWilaya}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-sm font-semibold">{trip.first_name}</span>
                <VerifiedBadge verified={isVerified(trip)} locale={locale} />
              </div>
            </div>
          </div>
          {days >= 0 && (
            <span className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-bold bg-brand-coral-tint text-brand-coral-dark">
              {days === 0
                ? dict.voyageDetail.arrivesToday
                : days === 1
                  ? dict.voyageDetail.arrivesTomorrow
                  : t(dict.voyageDetail.arrivesInDays, { n: days })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-brand-ink-soft">
          <span className="flex items-center gap-2">
            <CalendarIcon />
            {formatDate(trip.travel_date, locale)}
          </span>
          <span className="flex items-center gap-2">
            <MapPinIcon />
            {dict.voyageDetail.arrivalWilaya} {toWilaya}
          </span>
        </div>

        {trip.capacity_note && (
          <div className="rounded-2xl bg-brand-green-tint px-5 py-4">
            <div className="text-[13px] font-bold text-brand-green-dark mb-1">
              {dict.voyageDetail.availabilityTitle}
            </div>
            <p className="text-sm text-brand-green-dark/90 leading-relaxed">{trip.capacity_note}</p>
          </div>
        )}

        {trip.context && (
          <p className="text-sm text-brand-ink-soft leading-relaxed">{trip.context}</p>
        )}

        <div className="flex gap-3 px-4 py-4 border-[1.5px] border-dashed border-brand-border rounded-xl">
          <ShieldIcon size={18} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-faint leading-relaxed">{dict.voyageDetail.handoverRule}</p>
        </div>

        <div className="border-t border-brand-border pt-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <MessageCircleIcon size={17} className="text-brand-ink-soft" />
            {dict.voyageDetail.contactTitle}
          </h2>
          <div className="max-w-md">
            <ConversationSection
              kind="trip"
              cibleId={trip.id}
              locale={locale}
              loggedIn={Boolean(me)}
              isOwner={isOwner}
              isActive={trip.status === "active"}
              meId={me?.id ?? null}
              conversations={conversations}
              initialMessages={messages}
            />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="font-display font-bold text-xl">
            {t(dict.voyageDetail.pendingRequestsTitle, { wilaya: toWilaya })}
          </h2>
          <p className="text-brand-ink-soft text-sm mt-1">
            {matches.length === 0
              ? dict.voyageDetail.noPendingRequests
              : matches.length === 1
                ? t(dict.voyageDetail.pendingRequestsCount_one, { n: matches.length })
                : t(dict.voyageDetail.pendingRequestsCount_other, { n: matches.length })}
          </p>
        </div>

        {matches.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((l) => (
              <ListingCard key={l.id} listing={l} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
