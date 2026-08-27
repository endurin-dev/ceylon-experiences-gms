"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, LifeBuoy, Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender: "GUEST" | "ADMIN";
  body: string;
  createdAt: string;
};

const GLASS =
  "border border-white/[0.10] bg-white/[0.055] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_30px_-8px_rgba(0,0,0,0.6)]";

function MessageBubble({ message }: { message: Message }) {
  const isGuest = message.sender === "GUEST";

  return (
    <div className={cn("flex", isGuest ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%]", isGuest ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-[18px] px-4 py-3 text-[14px] leading-snug",
            isGuest
              ? "rounded-br-[6px] bg-[#0A84FF] text-white shadow-[0_5px_18px_-8px_rgba(10,132,255,0.9)]"
              : "rounded-bl-[6px] border border-white/[0.10] bg-white/[0.09] text-white/85"
          )}
        >
          {message.body}
        </div>
        <p className={cn("mt-1 text-[11px] text-white/30", isGuest ? "text-right" : "text-left")}>
          {new Date(message.createdAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function GuestFeedbackPage() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guest/feedback")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your feedback thread");
        const json = await response.json();
        setMessages(json.thread.messages);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your feedback thread"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/guest/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not send your message");
      setMessages((current) => [...(current ?? []), json.message]);
      setDraft("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send your message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="px-4">
      <header className="pb-4 pt-3">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#8FC1FF]">
          <LifeBuoy size={14} /> We are here to help
        </div>
        <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-tight text-white">Feedback & chat</h1>
        <p className="mt-0.5 text-[14px] text-white/40">Talk to our team about your trip</p>
      </header>

      <div className={cn("mb-4 flex items-center gap-3 rounded-[16px] px-4 py-3", GLASS)}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#30D158]/15 text-[#30D158]">
          <ShieldCheck size={20} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-white/90">Travel team online</p>
          <p className="mt-0.5 text-[12px] text-white/40">Usually replies within a few hours</p>
        </div>
        <span className="ml-auto h-2 w-2 rounded-full bg-[#30D158] shadow-[0_0_8px_#30D158]" />
      </div>

      <section className={cn("overflow-hidden rounded-[20px]", GLASS)} aria-label="Chat with the travel team">
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0A84FF]/20 text-[#5AA6FF]">
            <MessageCircle size={19} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-white/90">Your travel team</p>
            <p className="text-[12px] text-white/35">Trip support thread</p>
          </div>
        </div>

        <div className="min-h-40 space-y-4 px-4 py-5">
          {loading && <Loader2 size={22} className="mx-auto animate-spin text-[#5AA6FF]" />}
          {!loading && messages?.length === 0 && (
            <p className="py-6 text-center text-[13px] text-white/35">Start the conversation with our travel team.</p>
          )}
          {messages?.map((message) => <MessageBubble key={message.id} message={message} />)}
        </div>

        {error && <p className="border-t border-[#FF453A]/20 bg-[#FF453A]/10 px-4 py-2 text-[13px] text-[#FF6961]">{error}</p>}

        <form onSubmit={handleSend} className="border-t border-white/[0.08] p-3">
          <div className="flex items-end gap-2 rounded-[16px] border border-white/[0.10] bg-black/15 p-1.5 focus-within:border-[#5AA6FF]/50">
            <label htmlFor="feedback-message" className="sr-only">
              Write a message
            </label>
            <textarea
              id="feedback-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder="Write a message..."
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[14px] text-white outline-none placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#0A84FF] text-white transition active:scale-95 disabled:bg-white/[0.08] disabled:text-white/25"
            >
              {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
          <p className="px-2 pt-2 text-[11px] text-white/25">Messages are saved to your trip thread.</p>
        </form>
      </section>

      <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-white/30">
        <Check size={14} className="text-[#30D158]" /> Your feedback helps us improve every stay
      </div>
    </div>
  );
}
