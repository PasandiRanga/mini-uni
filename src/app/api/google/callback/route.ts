export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/googleCalendar";

const readCookie = (request: Request, name: string) =>
  (request.headers.get("cookie") || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);

/** Google redirects the teacher back here with a one-time code. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const settings = `${origin}/teacher/dashboard?tab=settings`;
  const done = (status: string) => {
    const res = NextResponse.redirect(`${settings}&google=${status}`);
    res.cookies.set("g_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  };

  const session = await getSessionFromRequest(request);
  if (!session?.sub || session.role !== "TEACHER") {
    return NextResponse.redirect(`${origin}/auth`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = readCookie(request, "g_oauth_state");

  if (url.searchParams.get("error")) return done("denied");
  if (!code || !state || !cookieState || state !== cookieState) return done("error");

  try {
    const { refreshToken, email } = await exchangeCodeForTokens(code, origin);
    if (!refreshToken) return done("error"); // no offline access granted
    await prisma.googleAccount.upsert({
      where: { userId: session.sub },
      create: { userId: session.sub, refreshToken, email },
      update: { refreshToken, email },
    });
    return done("connected");
  } catch (err) {
    console.error("Google callback failed:", err);
    return done("error");
  }
}
