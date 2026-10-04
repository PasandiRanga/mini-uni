/**
 * Suggestion lists for the teacher profile forms. Every field that uses them
 * still accepts free text, so these only need to cover the common answers.
 */

export const COUNTRIES = [
  "Sri Lanka",
  "India",
  "Maldives",
  "Australia",
  "Bangladesh",
  "Canada",
  "China",
  "Germany",
  "Japan",
  "Malaysia",
  "New Zealand",
  "Pakistan",
  "Qatar",
  "Saudi Arabia",
  "Singapore",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
] as const;

export const DEFAULT_COUNTRY = "Sri Lanka";

/** State universities, under the University Grants Commission. */
export const SL_STATE_UNIVERSITIES = [
  "University of Colombo",
  "University of Peradeniya",
  "University of Moratuwa",
  "University of Sri Jayewardenepura",
  "University of Kelaniya",
  "University of Ruhuna",
  "University of Jaffna",
  "Eastern University, Sri Lanka",
  "South Eastern University of Sri Lanka",
  "Rajarata University of Sri Lanka",
  "Sabaragamuwa University of Sri Lanka",
  "Wayamba University of Sri Lanka",
  "Uva Wellassa University",
  "University of the Visual and Performing Arts",
  "University of Vavuniya",
  "Open University of Sri Lanka",
  "Gampaha Wickramarachchi University of Indigenous Medicine",
  "General Sir John Kotelawala Defence University",
  "Buddhist and Pali University of Sri Lanka",
  "Ocean University of Sri Lanka",
] as const;

/** Private and non-state degree-awarding institutes. */
export const SL_PRIVATE_UNIVERSITIES = [
  "Sri Lanka Institute of Information Technology (SLIIT)",
  "Informatics Institute of Technology (IIT)",
  "NSBM Green University",
  "Sri Lanka Technological Campus (SLTC)",
  "KIU",
  "CINEC Campus",
  "APIIT Sri Lanka",
  "ICBT Campus",
  "BCAS Campus",
  "ESOFT Metro Campus",
  "Horizon Campus",
  "Saegis Campus",
  "NIBM",
  "Aquinas College of Higher Studies",
  "Royal Institute of Colombo",
  "Imperial Institute of Higher Education (IIHE)",
  "ACBT",
] as const;

export const SRI_LANKAN_UNIVERSITIES: readonly string[] = [...SL_STATE_UNIVERSITIES, ...SL_PRIVATE_UNIVERSITIES];

/** University picker groups: state first, then private. */
export const UNIVERSITY_GROUPS = [
  { label: "State universities", options: SL_STATE_UNIVERSITIES },
  { label: "Private universities & campuses", options: SL_PRIVATE_UNIVERSITIES },
] as const;

/** True for a university on the Sri Lankan lists (its country is then known). */
export const isSriLankanUniversity = (name: string) =>
  SRI_LANKAN_UNIVERSITIES.some((u) => u.toLowerCase() === name.trim().toLowerCase());

export const AL_STREAMS = [
  "Physical Science (Maths)",
  "Biological Science",
  "Commerce",
  "Arts",
  "Technology",
] as const;

/** A/L exam years a current school student could be sitting: this year and the next three. */
export function examYearOptions(now = new Date()): string[] {
  const year = now.getFullYear();
  return [0, 1, 2, 3].map((offset) => String(year + offset));
}

export const WORKING_STATUSES = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Freelance",
  "Not currently working",
] as const;

export const PROFESSIONS = [
  "School teacher",
  "University lecturer",
  "Private tutor",
  "Software engineer",
  "Engineer",
  "Doctor",
  "Pharmacist",
  "Nurse",
  "Accountant",
  "Lawyer",
  "Architect",
  "Scientist",
  "Business analyst",
  "Banker",
  "Designer",
] as const;

/**
 * "Jane Amara Perera" → "J. A. Perera": every name but the last becomes an
 * initial. A single name is returned unchanged.
 */
export function initialsFromFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map((p) => `${p[0].toUpperCase()}.`);
  return `${initials.join(" ")} ${last}`;
}
