import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "My Trip",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function GuestPortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-teal-50 dark:bg-neutral-950">{children}</div>;
}