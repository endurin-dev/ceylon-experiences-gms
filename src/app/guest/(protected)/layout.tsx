import { redirect } from "next/navigation";
import { getCurrentGuest } from "@/lib/guest-auth";
import GuestShell from "./guest-shell";

export default async function ProtectedGuestLayout({ children }: { children: React.ReactNode }) {
  const guest = await getCurrentGuest();
  if (!guest) redirect("/guest/no-session");

  return <GuestShell guestName={guest.firstName ?? guest.fullName}>{children}</GuestShell>;
}