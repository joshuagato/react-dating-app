import { useState } from 'react';
import { CircleX, CircleCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

import Layout from '../components/Layouts/SetupLayout';
import Email from '../components/Email';
import SubmitButton from '../components/SubmitButton';
import SwitchContextButton from '../components/SwitchContextButton';
import HelmetHeader from '../components/HelmetHeader';

import { requestPasswordResetHandler } from '../tanstack/auth';
import { SWITCH_BACK_TO_LOGIN_TEXT, RESET_PASSWORD_TEXT } from '../functions/constants';
import { unsetErrorSetMessage, unsetMessageSetError, unsetAllErrors, disableSubmitButtonFor } from '../functions/utils';

const ResetPassword = () => {
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [counting, setCounting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();

    const handlePasswordReset = async (event) => {
        event.preventDefault();

        setLoading(true);
        unsetAllErrors(setError, setErrors);

        try {
            const response = await requestPasswordResetHandler({ email });

            if (response.errors) setErrors(response.errors);

            const { success, message } = response;
            const theme = 'colored';
            const autoClose = 10000;

            if (success) {
                toast.success(message, { autoClose, theme });
                unsetErrorSetMessage(setError, setMessage, message);
                navigate('/confirm-reset-password');

            } else {
                toast.error(message, { autoClose, theme });
                unsetMessageSetError(setMessage, setError, message);
                disableSubmitButtonFor(setCounting, autoClose + 1000);
            }

        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout heading={RESET_PASSWORD_TEXT}>

            <HelmetHeader pageTitle={'Reset Password'} />

            <form className="w-full flex flex-col items-center space-y-6" onSubmit={handlePasswordReset}>
                <Email email={email} setEmail={setEmail} errors={errors} />

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

                <SubmitButton loading={loading} counting={counting}>
                    Submit Email
                </SubmitButton>
            </form>

            <SwitchContextButton textColor={'text-pink-600'} textHoverColor={'hover:text-green-600'} route={'/login'}>
                {SWITCH_BACK_TO_LOGIN_TEXT}
            </SwitchContextButton>

        </Layout>
    )
}

export default ResetPassword
