export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { DEFAULT_COUNTRY, initialsFromFullName } from "@/lib/profileOptions";

// Every editable profile string field, grouped by the section that owns it.
const EDITABLE_FIELDS = [
  // personal
  "fullName", "nameWithInitials", "contactNumber", "contactNumber2", "address", "country", "postalCode",
  // identity
  "idType",
  // academic / professional
  "employmentStatus", "universityName", "universityCountry", "workingStatus", "profession", "employer",
  // bank details
  "bankAccountName", "bankAccountNumber", "bankName", "bankBranch",
] as const;

// GET — current teacher's full profile (+ account email)
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { teacherProfile: { include: { verificationDocs: true } } },
    });

    if (!user || !user.teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const p = user.teacherProfile as Record<string, unknown>;
    const out: Record<string, string> = { email: user.email };
    for (const field of EDITABLE_FIELDS) {
      out[field] = (p[field] as string) ?? "";
    }

    // Fill blanks from what the teacher already gave us at sign-up, so they
    // only confirm instead of retyping. Nothing is saved until they submit.
    const prefilled: string[] = [];
    const prefill = (field: string, value: string | null | undefined) => {
      if (!out[field] && value) {
        out[field] = value;
        prefilled.push(field);
      }
    };
    prefill("fullName", `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
    prefill("nameWithInitials", initialsFromFullName(out.fullName));
    prefill("contactNumber", user.phone);
    prefill("country", DEFAULT_COUNTRY);
    out.prefilled = prefilled.join(",");
    out.verificationStatus = user.teacherProfile.verificationStatus;

    // Which identity scans are already on file (for the upload UI)
    out.idFrontUploaded = user.teacherProfile.verificationDocs.some((d) => d.documentType === "ID_FRONT") ? "yes" : "";
    out.idBackUploaded = user.teacherProfile.verificationDocs.some((d) => d.documentType === "ID_BACK") ? "yes" : "";

    return NextResponse.json(out);
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — save any subset of profile fields (used by every profile section).
// Field-level requiredness is enforced client-side; overall completeness is
// reported by /api/teachers/profile-completion.
export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const data: Record<string, string> = {};
    for (const field of EDITABLE_FIELDS) {
      if (typeof body[field] === "string") data[field] = body[field].trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const profile = await prisma.teacherProfile.findUnique({ where: { userId: session.sub } });
    if (!profile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    await prisma.teacherProfile.update({ where: { userId: session.sub }, data });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving teacher profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
