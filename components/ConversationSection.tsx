"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Conversation, ListingType } from "@/lib/types";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import { relativeTime } from "@/lib/relativeTime";
import { MessageCircleIcon, SendIcon } from "./icons";

const POLL_MS = 10_000;

/**
 * Fil de discussion d'une conversation acceptée. Pas de temps réel : on
 * relit les messages toutes les 10s, comme la cloche de notifications relit
 * son compteur toutes les 45s (même logique, cadence plus rapide car on
 * regarde ici une seule conversation, déjà ouverte à l'écran).
 */
function MessageThread({
  conversationId,
  meId,
  locale,
  initialMessages,
}: {
  conversationId: string;
  meId: string;
  locale: Locale;
  initialMessages: ChatMessage[];
}) {
  const dict = getDictionary(locale);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    const { data } = await createClient()
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }

  useEffect(() => {
    const interval = setInterval(loadMessages, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send() {
    const clean = body.trim();
    if (!clean || sending) return;
    setSending(true);
    setError(false);
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: meId,
      body: clean,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    const { error: sendError } = await createClient().rpc("send_message", {
      target_conversation_id: conversationId,
      body: clean,
    });
    setSending(false);
    if (sendError) {
      setError(true);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setBody(clean);
      return;
    }
    loadMessages();
  }

  return (
    <div className="flex flex-col gap-3 border-t border-brand-border pt-4 mt-1">
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-[12px] text-brand-ink-faint text-center py-3">{dict.messagerie.noMessagesYet}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-snug ${
                m.sender_id === meId
                  ? "self-end bg-brand-coral text-white rtl:self-start"
                  : "self-start bg-brand-bg text-brand-ink rtl:self-end"
              }`}
            >
              {m.body}
              <div className={`text-[10px] mt-1 ${m.sender_id === meId ? "text-white/70" : "text-brand-ink-faint"}`}>
                {relativeTime(m.created_at, locale)}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {error && <p className="text-[11px] text-brand-coral-dark">{dict.messagerie.errorSendFailed}</p>}
      <div className="flex items-center gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={dict.messagerie.messagePlaceholder}
          maxLength={2000}
          className="flex-1 h-10 px-3 rounded-lg border border-brand-border text-[13px] bg-brand-surface"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !body.trim()}
          aria-label={dict.messagerie.send}
          className="w-10 h-10 rounded-lg bg-brand-coral text-white flex items-center justify-center flex-none disabled:opacity-50"
        >
          <SendIcon size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Bloc « Comment aider » de la fiche annonce : bouton d'intérêt pour un
 * visiteur, cartes de propositions à accepter/décliner pour l'auteur, et
 * fil de discussion dès qu'une proposition est acceptée — tout directement
 * sur la fiche annonce, sans page dédiée.
 */
export default function ConversationSection({
  listingId,
  listingType,
  locale,
  loggedIn,
  isOwner,
  meId,
  conversations,
  initialMessages,
}: {
  listingId: string;
  listingType: ListingType;
  locale: Locale;
  loggedIn: boolean;
  isOwner: boolean;
  meId: string | null;
  conversations: Conversation[];
  initialMessages: Record<string, ChatMessage[]>;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [interestBusy, setInterestBusy] = useState(false);
  const [interestError, setInterestError] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondErrorId, setRespondErrorId] = useState<string | null>(null);

  if (!loggedIn) {
    return (
      <Link
        href="/connexion"
        className="h-12 rounded-xl border border-brand-border font-display font-semibold flex items-center justify-center text-[13.5px] hover:bg-brand-bg transition"
      >
        {dict.messagerie.needAccount}
      </Link>
    );
  }

  async function respond(conversationId: string, accept: boolean) {
    setRespondingId(conversationId);
    setRespondErrorId(null);
    const { error } = await createClient().rpc("respond_to_interest", {
      target_conversation_id: conversationId,
      accept,
    });
    setRespondingId(null);
    if (error) {
      setRespondErrorId(conversationId);
      return;
    }
    router.refresh();
  }

  async function expressInterest() {
    setInterestBusy(true);
    setInterestError(false);
    const { error } = await createClient().rpc("express_interest", { target_listing_id: listingId });
    setInterestBusy(false);
    if (error) {
      setInterestError(true);
      return;
    }
    router.refresh();
  }

  if (isOwner) {
    if (conversations.length === 0) {
      return (
        <p className="text-[13px] text-brand-ink-faint text-center px-2 py-3">{dict.messagerie.noProposalsYet}</p>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {conversations.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[13px]">
              <MessageCircleIcon size={15} className="text-brand-ink-faint flex-none" />
              <span>{t(dict.messagerie.proposalFrom, { name: c.other_first_name || dict.notifications.someone })}</span>
            </div>
            {c.status === "pending" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={respondingId === c.id}
                    onClick={() => respond(c.id, true)}
                    className="flex-1 h-10 rounded-lg bg-brand-green text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    {respondingId === c.id ? dict.messagerie.responding : dict.messagerie.accept}
                  </button>
                  <button
                    type="button"
                    disabled={respondingId === c.id}
                    onClick={() => respond(c.id, false)}
                    className="flex-1 h-10 rounded-lg border border-brand-border text-[13px] font-semibold disabled:opacity-50"
                  >
                    {dict.messagerie.decline}
                  </button>
                </div>
                {respondErrorId === c.id && (
                  <p className="text-[11px] text-brand-coral-dark">{dict.messagerie.errorRespondFailed}</p>
                )}
              </div>
            )}
            {c.status === "declined" && (
              <p className="text-[12px] text-brand-ink-faint">{dict.messagerie.declinedByOwner}</p>
            )}
            {c.status === "accepted" && meId && (
              <MessageThread
                conversationId={c.id}
                meId={meId}
                locale={locale}
                initialMessages={initialMessages[c.id] ?? []}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  const mine = conversations.find((c) => c.requester_id === meId);

  if (!mine) {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={interestBusy}
          onClick={expressInterest}
          className="h-12 rounded-xl bg-brand-coral text-white font-display font-semibold flex items-center justify-center disabled:opacity-50"
        >
          {interestBusy
            ? dict.messagerie.sending
            : listingType === "don"
            ? dict.messagerie.interestedDon
            : dict.messagerie.canHelpRequest}
        </button>
        {interestError && (
          <p className="text-[11px] text-brand-coral-dark text-center">{dict.messagerie.errorFailed}</p>
        )}
      </div>
    );
  }

  if (mine.status === "pending") {
    return <p className="text-[13px] text-brand-ink-faint text-center px-2 py-3">{dict.messagerie.pendingNote}</p>;
  }

  if (mine.status === "declined") {
    return <p className="text-[13px] text-brand-ink-faint text-center px-2 py-3">{dict.messagerie.declinedNote}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] text-brand-green-dark font-semibold">{dict.messagerie.acceptedNote}</p>
      {meId && (
        <MessageThread conversationId={mine.id} meId={meId} locale={locale} initialMessages={initialMessages[mine.id] ?? []} />
      )}
    </div>
  );
}
