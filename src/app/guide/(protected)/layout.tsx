import { redirect } from "next/navigation";
import { getCurrentGuide } from "@/lib/guide-auth";
import GuideShell from "./guide-shell";

export default async function ProtectedGuideLayout({ children }: { children: React.ReactNode }) {
  const guide = await getCurrentGuide();
  if (!guide) redirect("/guide/login");

  return <GuideShell guideName={guide.fullName}>{children}</GuideShell>;
}