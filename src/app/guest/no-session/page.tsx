import Link from "next/link";
import { QrCode } from "lucide-react";

export default function GuestNoSessionPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
        <QrCode size={28} />
      </div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Session expired</h1>
      <p className="mt-2 max-w-xs text-sm text-neutral-500">
        Log back in with your phone number and password, or ask your guide for a fresh QR code.
      </p>
      <Link
        href="/guest/login"
        className="mt-5 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white active:bg-teal-700"
      >
        Log in with phone number
      </Link>
    </div>
  );
}