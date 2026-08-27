"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, Send, Trash2 } from "lucide-react";

type Guest = { id: string; fullName: string; email: string | null };
type Notification = { id: string; title: string; body: string; createdAt: string; guest: { fullName: string }; sender: { name: string } };

export default function NotificationsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [guestId, setGuestId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Could not load notifications");
      const json = await response.json();
      setGuests(json.guests);
      setNotifications(json.notifications);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(notification: Notification) {
    if (!window.confirm(`Delete the notification sent to ${notification.guest.fullName}?`)) return;

    setDeletingId(notification.id);
    setError(null);
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not delete notification");
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      setNotice("Notification deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete notification");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Delete every notification for every guest? This cannot be undone.")) return;

    setClearingAll(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not clear notifications");
      setNotifications([]);
      setNotice(`${json.deleted} notification${json.deleted === 1 ? "" : "s"} cleared.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not clear notifications");
    } finally {
      setClearingAll(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, title, message }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not send notification");
      setTitle("");
      setMessage("");
      setNotice(guestId === "ALL" ? `Notification sent to ${json.sent} guests.` : "Notification sent successfully.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100"><Bell size={20} /> Guest notifications</h1>
        <p className="text-sm text-neutral-500">Send important updates and alerts to guests</p>
      </div>

      {notice && <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"><CheckCircle2 size={16} /> {notice}</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Compose notification</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Recipient
            <select value={guestId} onChange={(event) => setGuestId(event.target.value)} required className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-normal dark:border-neutral-700 dark:bg-neutral-900">
              <option value="">Choose a guest</option>
              <option value="ALL">All guests</option>
              {guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.fullName}{guest.email ? ` · ${guest.email}` : ""}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="Airport pickup update" className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-normal dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Message
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} required rows={4} placeholder="Write the update guests should see on their dashboard..." className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 font-normal dark:border-neutral-700 dark:bg-neutral-900" />
        </label>
        <button type="submit" disabled={sending} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send notification
        </button>
      </form>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800"><h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Sent notifications</h2>{notifications.length > 0 && <button type="button" onClick={handleClearAll} disabled={clearingAll || deletingId !== null} className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30">{clearingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Clear all notifications</button>}</div>
        {loading ? <div className="p-8 text-center text-neutral-500"><Loader2 size={20} className="mx-auto animate-spin" /></div> : notifications.length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">No notifications sent yet.</p> : <div className="divide-y divide-neutral-100 dark:divide-neutral-900">{notifications.map((notification) => <div key={notification.id} className="flex items-start justify-between gap-4 px-5 py-4"><div><p className="font-medium text-neutral-900 dark:text-neutral-100">{notification.title}</p><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{notification.body}</p><p className="mt-2 text-xs text-neutral-400">To {notification.guest.fullName} · Sent by {notification.sender.name}</p></div><div className="flex shrink-0 items-start gap-3"><time className="text-xs text-neutral-400">{new Date(notification.createdAt).toLocaleDateString()}</time><button type="button" onClick={() => handleDelete(notification)} disabled={deletingId === notification.id} aria-label={`Delete notification sent to ${notification.guest.fullName}`} className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button></div></div>)}</div>}
      </section>
    </div>
  );
}
