import { redirect } from 'next/navigation';

// Onboarding is now the step-by-step profile completion wizard.
export default function TeacherOnboardingPage() {
    redirect('/teacher/profile-completion');
}
