import { NextResponse } from "next/server";
import { GUIDE_COOKIE_NAME } from "@/lib/guide-auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(GUIDE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}