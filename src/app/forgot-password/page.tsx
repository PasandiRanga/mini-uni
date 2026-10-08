import ForgotPassword from '@/views/ForgotPassword';
import { Suspense } from 'react';

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ForgotPassword />
        </Suspense>
    );
}
