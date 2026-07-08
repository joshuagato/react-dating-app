import { useState, useEffect } from 'react';
import { CircleCheck, CircleX } from "lucide-react";
import { useLocation } from "react-router";
import { toast } from 'react-toastify';

import { verifyEmailHandler } from '../tanstack/auth';
import { unsetMessageSetError, unsetErrorSetMessage } from '../functions/utils';
import { VERIFY_EMAIL_TEXT } from '../functions/constants';
import CountdownTimer from '../components/CountdownTimer';
import SubmitButton from '../components/SubmitButton';
import Layout from '../components/Layout';

const Verify = () => {
    const [loading, setLoading] = useState(false);
    const [verification_code, setCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [counting, setCounting] = useState(false);

    const location = useLocation();
    
    const verification_channel = location.state?.verification_channel;

    async function handleVerification(event) {
        event.preventDefault();

        setLoading(true);
        // unsetAllErrors(setError, setErrors);

        try {
            const response = await verifyEmailHandler({ verification_code, verification_channel });
            const { success, message, exceededLimit } = response;

            if (!success) {
                
                toast.error(message, { autoClose: 5000, theme: 'colored' });
                unsetMessageSetError(setMessage, setError, message);

                if (!exceededLimit) return setCode('');

                return setCounting(true);
            }

            toast.success(message, { autoClose: 5000, theme: 'colored' });
            unsetErrorSetMessage(setError, setMessage, message);
            
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <Layout heading={VERIFY_EMAIL_TEXT}>

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
