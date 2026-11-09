/**
 * Google Calendar + Meet, per teacher.
 * -------------------------------------
 * A teacher connects their own Google account once (OAuth). We keep only the
 * refresh token; an access token is minted from it on demand. When a class is
 * booked, we create an event on the teacher's calendar with a Meet link and the
 * student as an attendee, so it lands on both their Google calendars.
 *
 * Nothing here throws for a missing config or a disconnected teacher : a class
 * must still confirm even if the calendar step can't run.
 */

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

/** calendar.events to create the class; openid+email so we can show which account connected. */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export const isGoogleConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);

/** Where Google sends the teacher back; must match a redirect URI in the OAuth client. */
export const redirectUri = (origin: string) => `${origin}/api/google/callback`;

/** The consent screen URL. `offline` + `consent` guarantee a refresh token. */
export function buildAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/** Swaps the one-time code for tokens. Returns the refresh token and the connected email. */
export async function exchangeCodeForTokens(code: string, origin: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  const data: TokenResponse = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google sign-in failed");
  }

  let email: string | null = null;
  try {
    const info = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (info.ok) email = (await info.json())?.email ?? null;
  } catch {
    /* email is only for display : ignore if it fails */
  }

  return { refreshToken: data.refresh_token ?? null, email };
}

/** Mints a fresh access token from a stored refresh token. */
async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data: TokenResponse = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Couldn't refresh Google access");
  }
  return data.access_token;
}

interface ClassEventInput {
  refreshToken: string;
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  teacherEmail: string;
  studentEmail: string;
}

/**
 * Creates the class on the teacher's calendar with a Meet link, inviting the
 * student. Returns the Meet link (and event id). Google emails both attendees
 * the invite because of sendUpdates=all.
 */
export async function createClassEvent(input: ClassEventInput) {
  const accessToken = await getAccessToken(input.refreshToken);

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startISO },
        end: { dateTime: input.endISO },
        attendees: [{ email: input.teacherEmail }, { email: input.studentEmail }],
        conferenceData: {
          createRequest: {
            // Any unique id; Google dedupes a retried create on the same id.
            requestId: `miniuni-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Couldn't create the calendar event");
  }

  const hangoutLink: string | null =
    data.hangoutLink ||
    data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ||
    null;

  return { hangoutLink, eventId: data.id as string };
}
