import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Guide Portal",
};

// viewport-fit=cover + maximumScale lets us use env(safe-area-inset-*) for
// iPhone notch/home-indicator padding, and stops accidental pinch-zoom on
// a tool that's meant to be used one-handed in the field.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function GuidePortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">{children}</div>;
}