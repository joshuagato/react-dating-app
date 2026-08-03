import { useState } from 'react';
import { CircleCheck, CircleX } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { toast } from 'react-toastify';

import { verifyEmailHandler } from '../tanstack/auth';
import { unsetMessageSetError, unsetErrorSetMessage } from '../functions/utils';
import { VERIFY_EMAIL_TEXT, basicProfilePath } from '../functions/constants';

import CountdownTimer from '../components/CountdownTimer';
import SubmitButton from '../components/SubmitButton';
import Layout from '../components/Layouts/SetupLayout';
import HelmetHeader from '../components/HelmetHeader';

const Verify = () => {
    const [loading, setLoading] = useState(false);
    const [verification_code, setCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [counting, setCounting] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const verification_channel = location.state?.verification_channel;

    async function handleVerification(event) {
        event.preventDefault();

        setLoading(true);
        // unsetAllErrors(setError, setErrors);

        try {
            const response = await verifyEmailHandler({ verification_code, verification_channel });
            const { success, message, exceededLimit } = response;

            if (success) {
                toast.success(message, { autoClose: 10000, theme: 'colored' });
                unsetErrorSetMessage(setError, setMessage, message);
                navigate(basicProfilePath);

            } else {
                toast.error(message, { autoClose: 10000, theme: 'colored' });
                unsetMessageSetError(setMessage, setError, message);

                if (!exceededLimit) return setCode('');

                setCounting(true);
            }

        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout heading={VERIFY_EMAIL_TEXT}>

            <HelmetHeader pageTitle={'Verify Email'} />

            <form className="w-full flex flex-col items-center space-y-12" onSubmit={handleVerification}>
                <label className="otp otp-xl otp-success">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>

                    <input type="text" autoComplete="one-time-code" inputMode="numeric" maxLength="4" pattern="[0-9]{4}"
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

export default Verify;
