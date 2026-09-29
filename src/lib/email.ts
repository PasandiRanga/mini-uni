import nodemailer from "nodemailer";

/**
 * Email delivery helper.
 *
 * In production, set these env vars (any SMTP provider — Gmail, Resend, SendGrid,
 * Mailgun, etc. all expose SMTP):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If SMTP is not configured, we fall back to logging the message to the server
 * console so the full verification flow remains testable in local development.
 */

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587/STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends an email. Returns `true` if it was actually dispatched via SMTP,
 * `false` if it was only logged (dev fallback) — callers can use this to
 * surface the code in the response during local development.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<boolean> {
  if (!isSmtpConfigured()) {
    // Dev fallback — no SMTP creds present.
    console.log("\n📧 [email:dev-fallback] SMTP not configured — logging instead of sending");
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${text}\n`);
    return false;
  }

  const from = process.env.SMTP_FROM || `MiniUni <${process.env.SMTP_USER}>`;
  await getTransporter().sendMail({ from, to, subject, html, text });
  return true;
}

/** Builds the teacher verification-decision email (approved or rejected). */
export function buildVerificationStatusEmail(
  status: "APPROVED" | "REJECTED",
  firstName?: string,
  reason?: string
) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  if (status === "APPROVED") {
    return {
      subject: "You're verified on MiniUni 🎉",
      text: `${greeting}\n\nGreat news — your teacher profile has been approved. You can now post classes and start getting booked.\n\nHead to your dashboard to create your first class.`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #1a1a24;">
          <h1 style="font-size: 20px; margin: 0 0 16px;">You're verified 🎉</h1>
          <p style="color: #55555f; line-height: 1.6; margin: 0 0 16px;">${greeting} great news — your teacher profile has been <strong>approved</strong>.</p>
          <p style="color: #55555f; line-height: 1.6; margin: 0 0 24px;">You can now post classes and start getting booked. Head to your dashboard to create your first class.</p>
        </div>
      `,
    };
  }

  const reasonLine = reason ? ` Reason: ${reason}` : "";
  return {
    subject: "Your MiniUni verification needs attention",
    text: `${greeting}\n\nYour teacher profile wasn't approved yet.${reasonLine}\n\nPlease review your details and documents, then resubmit from your dashboard.`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #1a1a24;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Verification needs attention</h1>
        <p style="color: #55555f; line-height: 1.6; margin: 0 0 16px;">${greeting} your teacher profile wasn't approved yet.</p>
        ${reason ? `<div style="background: #fbeaea; border-radius: 12px; padding: 16px; margin-bottom: 20px; color: #7a2020;"><strong>Reason:</strong> ${reason}</div>` : ""}
        <p style="color: #55555f; line-height: 1.6; margin: 0;">Please review your details and documents, then resubmit from your dashboard.</p>
      </div>
    `,
  };
}

/** Builds the OTP verification email content. */
export function buildOtpEmail(code: string, firstName?: string) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  return {
    subject: "Your MiniUni verification code",
    text: `${greeting}\n\nYour MiniUni email verification code is: ${code}\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #1a1a24;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Verify your email</h1>
        <p style="color: #55555f; line-height: 1.6; margin: 0 0 24px;">${greeting} use the code below to verify your MiniUni account.</p>
        <div style="background: #f5f1e8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #2a2563;">${code}</span>
        </div>
        <p style="color: #8a8a93; font-size: 13px; line-height: 1.6; margin: 0;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>
    `,
  };
}
