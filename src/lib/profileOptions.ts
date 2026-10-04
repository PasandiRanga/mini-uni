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

export const SRI_LANKAN_UNIVERSITIES = [
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
  "Open University of Sri Lanka",
  "University of Vavuniya",
  "Gampaha Wickramarachchi University of Indigenous Medicine",
  "General Sir John Kotelawala Defence University",
  "Sri Lanka Institute of Information Technology (SLIIT)",
  "Informatics Institute of Technology (IIT)",
  "NSBM Green University",
  "Sri Lanka Technological Campus (SLTC)",
  "CINEC Campus",
  "APIIT Sri Lanka",
  "ESOFT Metro Campus",
  "Horizon Campus",
] as const;

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
