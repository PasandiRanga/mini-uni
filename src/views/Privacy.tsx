'use client';

import { LegalPage, LegalSection } from "@/views/Legal";

const Privacy = () => {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="10 November 2026"
      intro="This policy explains what information MiniUni collects, how we use it, and the choices you have. It also covers how we handle Google user data when you connect your Google Calendar."
    >
      <LegalSection id="who-we-are" heading="Who we are">
        <p>
          MiniUni is an online marketplace that connects students with verified teachers for live classes.
          This policy applies to the MiniUni website at <strong>miniuni.lk</strong> and the services offered there.
          If you have any questions, contact us at <a href="mailto:miniuni.edu@gmail.com">miniuni.edu@gmail.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="information-we-collect" heading="Information we collect">
        <p>We collect only what we need to run the service:</p>
        <ul>
          <li><strong>Account details</strong> you give us: name, email address, role (student or teacher), password (stored hashed), and your profile information.</li>
          <li><strong>Teacher details</strong>: subjects, levels, rates, availability, and any verification documents you submit to earn a Verified badge.</li>
          <li><strong>Bookings and payments</strong>: the classes you book or teach, wallet top-ups, bank slips you upload for verification, and payout details.</li>
          <li><strong>Usage data</strong>: basic logs such as pages visited and actions taken, used to keep the service secure and working.</li>
        </ul>
      </LegalSection>

      <LegalSection id="google-data" heading="Google Calendar data">
        <p>
          Connecting your Google account is <strong>optional</strong> and only offered to teachers. When you connect it, you
          grant MiniUni permission to manage events on your Google Calendar (the <strong>calendar.events</strong> scope), and
          we read your email address so we can show which account is connected.
        </p>
        <p>We use this access for a single purpose:</p>
        <ul>
          <li>When a student books one of your classes, we create a calendar event on your Google Calendar, add a Google Meet link, and invite the student as an attendee, so the class appears on both calendars with a join link.</li>
        </ul>
        <p>
          We store only the Google <strong>refresh token</strong> needed to do this and the connected email address. We do not
          read, store, or use any other part of your calendar, and we never use this data for advertising.
        </p>
      </LegalSection>

      <LegalSection id="limited-use" heading="Google API Services Limited Use disclosure">
        <p>
          MiniUni's use and transfer of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>,
          including the Limited Use requirements. Specifically, we use Google user data only to provide and improve the
          calendar and Meet features described above, we do not transfer or sell it to third parties except as needed to
          provide those features or as required by law, we do not use it for advertising, and we do not allow humans to read
          it unless we have your consent, it is needed for security, or the law requires it.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" heading="How we use your information">
        <ul>
          <li>To create and manage your account and show your profile.</li>
          <li>To match students with teachers and handle bookings, messages, and reviews.</li>
          <li>To process wallet top-ups, hold payments securely until a class is complete, and pay teachers.</li>
          <li>To send you service emails such as sign-up confirmation, booking updates, and top-up decisions.</li>
          <li>To keep MiniUni safe, prevent abuse, and meet our legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection id="sharing" heading="How we share information">
        <p>We do not sell your personal information. We share it only:</p>
        <ul>
          <li>Between a student and teacher when a booking or message makes it necessary (for example, the student is added as an attendee on a class event).</li>
          <li>With service providers who help us operate, such as hosting, database, email, and storage providers, under agreements that protect your data.</li>
          <li>When required by law or to protect the rights and safety of our users.</li>
        </ul>
      </LegalSection>

      <LegalSection id="retention" heading="Data retention and deletion">
        <p>
          We keep your information for as long as your account is active or as needed to provide the service and meet legal
          requirements. You can:
        </p>
        <ul>
          <li><strong>Disconnect Google Calendar</strong> at any time from your teacher Settings, which deletes the stored refresh token and stops any further calendar access.</li>
          <li>Revoke MiniUni's access directly from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account permissions</a> page.</li>
          <li>Request deletion of your MiniUni account and personal data by emailing <a href="mailto:miniuni.edu@gmail.com">miniuni.edu@gmail.com</a>.</li>
        </ul>
      </LegalSection>

      <LegalSection id="security" heading="Security">
        <p>
          We protect your data with industry-standard measures: encrypted connections, hashed passwords, and restricted
          access to tokens and documents. No system is perfectly secure, but we work to keep your information safe and to
          respond quickly if an issue arises.
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="Changes to this policy">
        <p>
          We may update this policy as the service evolves. When we make material changes, we will update the date at the top
          of this page and, where appropriate, notify you.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="Contact us">
        <p>
          Questions about this policy or your data? Email us at <a href="mailto:miniuni.edu@gmail.com">miniuni.edu@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default Privacy;
