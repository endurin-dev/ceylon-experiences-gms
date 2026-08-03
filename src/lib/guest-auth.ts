import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.GUEST_JWT_SECRET;
export const GUEST_COOKIE_NAME = "guest_session";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days — shorter than guide sessions since this is a lighter verification method

interface GuestSessionPayload {
  guestId: string;
}

export function signGuestSession(guestId: string): string {
  if (!SECRET) throw new Error("GUEST_JWT_SECRET env var is not set");
  return jwt.sign({ guestId } satisfies GuestSessionPayload, SECRET, {
    expiresIn: GUEST_COOKIE_MAX_AGE,
  });
}

function verifyGuestSession(token: string): GuestSessionPayload | null {
  if (!SECRET) return null;
  try {
    return jwt.verify(token, SECRET) as GuestSessionPayload;
  } catch {
    return null;
  }
}

/** Strips everything but digits, for tolerant phone-number comparison. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Compares two phone numbers ignoring formatting and, loosely, country-code
 * prefixes (e.g. "+94771234567" should match "0771234567"). Requires at
 * least 7 digits of overlap to avoid trivial false positives.
 */
export function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhone(a);
  const db = normalizePhone(b);
  if (da.length < 7 || db.length < 7) return false;
  return da === db || da.endsWith(db) || db.endsWith(da);
}

export async function getCurrentGuest() {
  const token = cookies().get(GUEST_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyGuestSession(token);
  if (!payload) return null;

  const guest = await prisma.guest.findUnique({
    where: { id: payload.guestId },
    select: {
      id: true,
      fullName: true,
      firstName: true,
      phoneNumber: true,
      email: true,
      nationality: true,
    },
  });

  return guest;
}