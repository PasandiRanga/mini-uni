import type { TeacherProfile, VerificationDocument } from "@prisma/client";

export type ProfileWithDocs = TeacherProfile & { verificationDocs: VerificationDocument[] };

/**
 * Computes how far a teacher's profile is completed across three steps:
 * personal details, identity verification, and academic/professional
 * background. Shared by the teacher-facing profile-completion endpoint and the
 * admin review queue so both agree on what "100% complete" means.
 */
export function computeProfileCompletion(p: ProfileWithDocs) {
  const has = (v: unknown) => typeof v === "string" && v.trim() !== "";
  const docTypes = p.verificationDocs.map((d) => d.documentType);

  // Step 1 — personal details
  const personalComplete =
    has(p.fullName) &&
    has(p.nameWithInitials) &&
    has(p.contactNumber) &&
    has(p.address) &&
    has(p.country) &&
    has(p.postalCode);

  // Step 2 — identity: type chosen + required scans uploaded (back required for NIC/LICENSE)
  const needsBack = p.idType === "NIC" || p.idType === "LICENSE";
  const identityComplete =
    has(p.idType) && docTypes.includes("ID_FRONT") && (!needsBack || docTypes.includes("ID_BACK"));

  // Step 3 — academic/professional (conditional on employment status)
  let academicComplete = false;
  if (p.employmentStatus === "STUDENT" || p.employmentStatus === "UNDERGRADUATE") {
    academicComplete = has(p.universityName) && has(p.universityCountry);
  } else if (p.employmentStatus === "GRADUATE") {
    academicComplete = has(p.workingStatus) && has(p.profession) && has(p.employer);
  }

  const steps = [
    { key: "personal", label: "Personal details", complete: personalComplete },
    { key: "identity", label: "Identity verification", complete: identityComplete },
    { key: "academic", label: "Academic background", complete: academicComplete },
  ];

  const completeCount = steps.filter((s) => s.complete).length;
  const percent = Math.round((completeCount / steps.length) * 100);

  return { percent, complete: percent === 100, steps };
}
