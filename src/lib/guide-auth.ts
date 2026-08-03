import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.GUIDE_JWT_SECRET;
export const GUIDE_COOKIE_NAME = "guide_session";
export const GUIDE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface GuideSessionPayload {
  guideId: string;
}

export function signGuideSession(guideId: string): string {
  if (!SECRET) throw new Error("GUIDE_JWT_SECRET env var is not set");
  return jwt.sign({ guideId } satisfies GuideSessionPayload, SECRET, {
    expiresIn: GUIDE_COOKIE_MAX_AGE,
  });
}

function verifyGuideSession(token: string): GuideSessionPayload | null {
  if (!SECRET) return null;
  try {
    return jwt.verify(token, SECRET) as GuideSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Reads the guide_session cookie and returns the logged-in guide's profile,
 * or null if there's no valid session. Works in Server Components, layouts,
 * and Route Handlers (anywhere next/headers' cookies() is available).
 */
export async function getCurrentGuide() {
  const token = cookies().get(GUIDE_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyGuideSession(token);
  if (!payload) return null;

  const guide = await prisma.guide.findUnique({
    where: { id: payload.guideId },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      specialization: true,
      status: true,
    },
  });

  if (!guide || guide.status !== "ACTIVE") return null;
  return guide;
}