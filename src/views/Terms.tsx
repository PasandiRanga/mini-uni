'use client';

import { LegalPage, LegalSection } from "@/views/Legal";

const Terms = () => {
  return (
    <LegalPage
      title="Terms of Service"
      updated="10 November 2026"
      intro="These terms set out the rules for using MiniUni. By creating an account or using the service, you agree to them."
    >
      <LegalSection id="about" heading="About MiniUni">
        <p>
          MiniUni is a marketplace that connects students with teachers for live classes. We provide the platform that lets
          teachers list classes and students discover, book, and pay for them. MiniUni is not the teacher and does not
          deliver the classes itself.
        </p>
      </LegalSection>

      <LegalSection id="accounts" heading="Your account">
        <ul>
          <li>You must give accurate information and keep your login details secure.</li>
          <li>You are responsible for everything that happens under your account.</li>
          <li>You must be old enough to form a binding contract, or have the consent of a parent or guardian.</li>
          <li>We may suspend or close accounts that break these terms or misuse the service.</li>
        </ul>
      </LegalSection>

      <LegalSection id="teachers" heading="Teachers">
        <ul>
          <li>You are responsible for the accuracy of your profile, your classes, and the teaching you deliver.</li>
          <li>Verification badges reflect documents you submit; you must not misrepresent your identity or qualifications.</li>
          <li>You set your own rates. MiniUni deducts a platform commission from completed bookings, shown to you before payout.</li>
          <li>Connecting Google Calendar is optional and lets us add booked classes, with a Meet link, to your calendar.</li>
        </ul>
      </LegalSection>

      <LegalSection id="students" heading="Students">
        <ul>
          <li>You agree to pay the listed price for classes you book.</li>
          <li>You should attend booked classes and treat teachers respectfully.</li>
          <li>Reviews you leave must be honest and based on your own experience.</li>
        </ul>
      </LegalSection>

      <LegalSection id="payments" heading="Payments, wallet, and refunds">
        <p>
          Payments are handled through your MiniUni wallet. You top up your wallet by bank transfer and uploading a slip,
          which an administrator verifies before crediting the amount.
        </p>
        <ul>
          <li>Payment for a booking is held securely and released to the teacher once the class is complete.</li>
          <li>If a class is cancelled or a dispute is upheld under our policies, the held amount is refunded to your wallet.</li>
          <li>Commission, payouts, and dispute outcomes follow the rules shown in the app at the time of booking.</li>
        </ul>
      </LegalSection>

      <LegalSection id="conduct" heading="Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use MiniUni for anything unlawful, harmful, or fraudulent.</li>
          <li>Harass, abuse, or impersonate others.</li>
          <li>Try to bypass payments, fees, or security measures.</li>
          <li>Disrupt or attempt to gain unauthorised access to the service.</li>
        </ul>
      </LegalSection>

      <LegalSection id="content" heading="Your content">
        <p>
          You keep ownership of the content you post, such as profiles, posts, and reviews. By posting, you grant MiniUni a
          licence to display and distribute it as needed to run the service. You are responsible for the content you post and
          must have the right to share it.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" heading="Disclaimers and liability">
        <p>
          MiniUni is provided on an "as is" basis. We do not guarantee the quality or outcome of any class, and teachers are
          independent of MiniUni. To the extent the law allows, MiniUni is not liable for indirect or consequential losses
          arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection id="termination" heading="Suspension and termination">
        <p>
          You can close your account at any time. We may suspend or end access if you break these terms or if we need to
          protect the service or its users. Some provisions, such as those on payments already due and liability, survive
          termination.
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="Changes to these terms">
        <p>
          We may update these terms as the service changes. We will update the date at the top of this page and, for material
          changes, give notice where appropriate. Continuing to use MiniUni means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="Contact us">
        <p>
          Questions about these terms? Email us at <a href="mailto:miniuni.edu@gmail.com">miniuni.edu@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default Terms;
