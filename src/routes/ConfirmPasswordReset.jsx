import { useState } from 'react';
import { CircleCheck, CircleX } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from 'react-toastify';

import { confirmPasswordResetHandler } from '../tanstack/auth';
import { unsetMessageSetError, unsetErrorSetMessage, unsetAllErrors } from '../functions/utils';
import { RESET_PASSWORD_CONFIRMATION_TEXT } from '../functions/constants';

import CountdownTimer from '../components/CountdownTimer';
import SubmitButton from '../components/SubmitButton';
import Layout from '../components/Layouts/SetupLayout';
import HelmetHeader from '../components/HelmetHeader';

const ConfirmPasswordReset = () => {
    const [loading, setLoading] = useState(false);
    const [verification_code, setCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [counting, setCounting] = useState(false);

    const navigate = useNavigate();

    async function handleVerification(event) {
        event.preventDefault();

        setLoading(true);
        setError('');

        try {
            const response = await confirmPasswordResetHandler({ verification_code });
            const { success, message, exceededLimit } = response;

            if (success) {
                toast.success(message, { autoClose: 10000, theme: 'colored' });
                unsetErrorSetMessage(setError, setMessage, message);
                navigate('/set-new-password');
            } else {
                toast.error(message, { autoClose: 10000, theme: 'colored' });
                unsetMessageSetError(setMessage, setError, message);

                if (!exceededLimit) return setCode('');

                navigate('/set-new-password');
                setCounting(true);
            }

        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout heading={RESET_PASSWORD_CONFIRMATION_TEXT}>

            <HelmetHeader pageTitle={'Confirm Reset Password'} />

            <form className="w-full flex flex-col items-center space-y-12" onSubmit={handleVerification}>
                <label className="otp otp-lg sm:otp-xl otp-success">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>

                    <input type="text" autoComplete="one-time-code" inputMode="numeric" maxLength="6" pattern="[0-9]{6}"
                        value={verification_code} onChange={e => setCode(e.target.value)} required />
                </label>

                {error && (
                    <div role="alert" className="alert alert-error fade-in">
                        <CircleX />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div role="alert" className="alert alert-success fade-in">
                        <CircleCheck />
                        <span>{message}</span>
                    </div>
                )}

                {counting && <CountdownTimer counting={counting} setCounting={setCounting} />}

                <SubmitButton loading={loading} counting={counting}>
                    Submit Code
                </SubmitButton>
            </form>
        </Layout>
    )
}

export default ConfirmPasswordReset;
