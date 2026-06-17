export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { CURRENCIES } from "@/lib/currency";

// GET — current account currency
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { currency: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error("currency GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — change account currency. Does not convert existing balances; affects
// formatting and the currency of future posts/payments.
export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { currency } = await request.json();
    if (!CURRENCIES.includes(currency)) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }
    await prisma.user.update({ where: { id: session.sub }, data: { currency } });
    return NextResponse.json({ success: true, currency });
  } catch (error) {
    console.error("currency PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
