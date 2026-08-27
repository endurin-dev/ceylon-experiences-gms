"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LifeBuoy, Loader2, MessageCircle, RefreshCw, Send, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender: "GUEST" | "ADMIN";
  body: string;
  createdAt: string;
  admin?: { name: string } | null;
};

type Thread = {
  id: string;
  status: "OPEN" | "CLOSED";
  updatedAt: string;
  guest: { id: string; fullName: string; email: string | null; phoneNumber: string | null };
  messages: Message[];
};

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FeedbackPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null,
    [selectedId, threads]
  );

  async function loadThreads() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback");
      if (!response.ok) throw new Error("Failed to load feedback threads");
      const json = await response.json();
      setThreads(json.threads);
      setSelectedId((current) => current ?? json.threads[0]?.id ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to load feedback threads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThreads();
  }, []);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!selectedThread || !message || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: selectedThread.guest.id, message }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Failed to send reply");
      setThreads((current) => current.map((thread) => thread.id === selectedThread.id
        ? { ...thread, status: "OPEN", updatedAt: json.message.createdAt, messages: [...thread.messages, json.message] }
        : thread
      ));
      setDraft("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            <LifeBuoy size={20} /> Guest feedback
          </h1>
          <p className="text-sm text-neutral-500">Review guest conversations and reply from one inbox</p>
        </div>
        <button
          type="button"
          onClick={loadThreads}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

      <div className="grid min-h-[620px] overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-neutral-200 dark:border-neutral-800 lg:border-b-0 lg:border-r">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Conversations</p>
            <p className="mt-1 text-sm text-neutral-500">{threads.length} guest thread{threads.length === 1 ? "" : "s"}</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto lg:max-h-[560px]">
            {threads.length === 0 && !loading && <p className="px-4 py-8 text-center text-sm text-neutral-500">No guest messages yet.</p>}
            {threads.map((thread) => {
              const latest = thread.messages[thread.messages.length - 1];
              const active = selectedThread?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedId(thread.id)}
                  className={cn("w-full border-b border-neutral-100 px-4 py-3 text-left transition dark:border-neutral-900", active ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-900")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">{thread.guest.fullName}</span>
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", thread.status === "OPEN" ? "bg-emerald-500" : "bg-neutral-300")} />
                  </div>
                  <p className="mt-1 truncate text-xs text-neutral-500">{latest?.body ?? "No messages"}</p>
                  {latest && <p className="mt-1 text-[11px] text-neutral-400">{formatTime(latest.createdAt)}</p>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          {!selectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-neutral-500">
              <MessageCircle size={30} />
              <p className="text-sm">Select a guest conversation to read and reply.</p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{selectedThread.guest.fullName}</h2>
                  <p className="truncate text-xs text-neutral-500">{selectedThread.guest.email ?? selectedThread.guest.phoneNumber ?? "Guest contact details unavailable"}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", selectedThread.status === "OPEN" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                  {selectedThread.status}
                </span>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto bg-neutral-50/70 px-5 py-6 dark:bg-neutral-900/30">
                {selectedThread.messages.map((message) => {
                  const isAdmin = message.sender === "ADMIN";
                  return (
                    <div key={message.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[78%]", isAdmin ? "items-end" : "items-start")}>
                        <div className={cn("rounded-2xl px-4 py-3 text-sm", isAdmin ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200")}>
                          {message.body}
                        </div>
                        <p className={cn("mt-1 text-[11px] text-neutral-400", isAdmin ? "text-right" : "text-left")}>
                          {isAdmin ? message.admin?.name ?? "Admin" : selectedThread.guest.fullName} · {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReply} className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex items-end gap-2">
                  <label htmlFor="admin-feedback-reply" className="sr-only">Reply to guest</label>
                  <textarea
                    id="admin-feedback-reply"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={2}
                    placeholder="Write a reply to this guest..."
                    className="min-h-11 flex-1 resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <button type="submit" disabled={!draft.trim() || sending} className="flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Reply
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
