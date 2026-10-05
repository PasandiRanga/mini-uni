/**
 * Levels and subjects for class posts, following the Sri Lankan school
 * system. Subject fields still accept free text, so these lists only need to
 * cover the common answers.
 */
import { AL_STREAMS } from "@/lib/profileOptions";

export { AL_STREAMS };

export const PRIMARY_GRADES = ["Grade 3", "Grade 4", "Grade 5"] as const;
export const JUNIOR_GRADES = ["Grade 6", "Grade 7", "Grade 8", "Grade 9"] as const;
export const OL = "O/L";
export const AL = "A/L";
export const UNDERGRADUATE = "Undergraduate";

/** Level picker groups, youngest first. */
export const LEVEL_GROUPS = [
  { label: "Primary", options: PRIMARY_GRADES },
  { label: "Junior secondary", options: JUNIOR_GRADES },
  { label: "Exams & beyond", options: [OL, AL, UNDERGRADUATE] },
] as const;

export const CLASS_LEVELS: readonly string[] = LEVEL_GROUPS.flatMap((g) => g.options);

const PRIMARY_SUBJECTS = [
  "Mathematics",
  "Environmental Studies",
  "English",
  "Sinhala",
  "Tamil",
  "Religion",
  "Grade 5 Scholarship",
];

const JUNIOR_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Sinhala",
  "Tamil",
  "History",
  "Geography",
  "Civic Education",
  "ICT",
  "Health & Physical Education",
  "Religion",
  "Art",
  "Music",
  "Dancing",
];

const OL_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Sinhala",
  "Tamil",
  "History",
  "Religion",
  "Business & Accounting Studies",
  "ICT",
  "Geography",
  "Civic Education",
  "Entrepreneurship Studies",
  "English Literature",
  "Sinhala Literature",
  "Health & Physical Education",
  "Agriculture & Food Technology",
  "Design & Construction Technology",
  "Art",
  "Music",
  "Dancing",
  "Drama & Theatre",
];

const AL_SUBJECTS_BY_STREAM: Record<string, string[]> = {
  "Physical Science (Maths)": ["Combined Mathematics", "Physics", "Chemistry", "ICT", "Higher Mathematics"],
  "Biological Science": ["Biology", "Chemistry", "Physics", "Agricultural Science"],
  Commerce: ["Business Studies", "Accounting", "Economics", "Business Statistics", "ICT"],
  Arts: [
    "Sinhala",
    "Tamil",
    "English",
    "Political Science",
    "Geography",
    "History",
    "Logic & Scientific Method",
    "Economics",
    "Communication & Media Studies",
    "Buddhist Civilization",
    "Home Economics",
    "Art",
    "Drama & Theatre",
    "Music",
    "Dancing",
    "Japanese",
    "French",
    "ICT",
  ],
  Technology: ["Engineering Technology", "Bio-systems Technology", "Science for Technology", "ICT", "Economics"],
};

/** Taken alongside any stream. */
const AL_COMMON_SUBJECTS = ["General English", "Common General Test"];

const UNDERGRADUATE_SUBJECTS = [
  "Computer Science",
  "Software Engineering",
  "Data Science",
  "Engineering Mathematics",
  "Statistics",
  "Physics",
  "Chemistry",
  "Accounting",
  "Economics",
  "Business Management",
  "Finance",
  "Marketing",
  "Law",
  "Medicine",
  "Psychology",
];

/** Subjects to suggest for a level (and, for A/L, a stream). */
export function subjectsFor(level: string, stream = ""): string[] {
  if ((PRIMARY_GRADES as readonly string[]).includes(level)) return PRIMARY_SUBJECTS;
  if ((JUNIOR_GRADES as readonly string[]).includes(level)) return JUNIOR_SUBJECTS;
  if (level === OL) return OL_SUBJECTS;
  if (level === AL) {
    const streamSubjects = AL_SUBJECTS_BY_STREAM[stream];
    if (streamSubjects) return [...streamSubjects, ...AL_COMMON_SUBJECTS];
    return [...new Set([...Object.values(AL_SUBJECTS_BY_STREAM).flat(), ...AL_COMMON_SUBJECTS])];
  }
  if (level === UNDERGRADUATE) return UNDERGRADUATE_SUBJECTS;
  return [...new Set([...JUNIOR_SUBJECTS, ...OL_SUBJECTS])];
}

/**
 * A post stores level and stream in one `grade` string, "A/L · Commerce", so
 * cards show both and no extra column is needed.
 */
const SEP = " · ";

export function joinGrade(level: string, stream: string): string {
  const l = level.trim();
  return l === AL && stream.trim() ? `${l}${SEP}${stream.trim()}` : l;
}

export function splitGrade(grade: string | null | undefined): { level: string; stream: string } {
  const [level = "", stream = ""] = (grade ?? "").split(SEP);
  return { level: level.trim(), stream: stream.trim() };
}

/** Filter match: picking "A/L" also finds "A/L · Commerce". */
export function gradeMatches(postGrade: string | null | undefined, filter: string): boolean {
  if (!filter.trim() || !postGrade) return true;
  const f = filter.trim().toLowerCase();
  const g = postGrade.toLowerCase();
  return g === f || splitGrade(g).level === f;
}
