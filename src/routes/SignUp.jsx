import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CircleCheck, CircleX } from "lucide-react";
import { toast } from 'react-toastify';

import Layout from "../components/Layouts/SetupLayout";
import Email from "../components/Email";
import Password from "../components/Password";
import ConfirmPassword from "../components/ConfirmPassword";
import SubmitButton from "../components/SubmitButton";
import SwitchContextButton from "../components/SwitchContextButton";
import HelmetHeader from "../components/HelmetHeader";

import { signUpHandler } from '../tanstack/auth';
import {
    unsetErrorSetMessage, unsetMessageSetError, unsetEmailPasswordFields,
    unsetAllErrors
} from "../functions/utils";
import { SIGNUP_TEXT, SWITCH_TO_LOGIN_TEXT, VERIFICATION_CHANNEL } from "../functions/constants";


const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isShowPassword, setIsShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const { user, loading: authLoading } = { user: {}, loading: true };
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !authLoading) {
            navigate.push("/");
        }
    }, [user, authLoading, navigate]);

    async function handleAuth(event) {
        event.preventDefault();

        setLoading(true);
        unsetAllErrors(setError, setErrors);

        try {
            const response = await signUpHandler({ email, password, passwordConfirmation });

            if (response.errors) setErrors(response.errors);

            if (response.success && !response.session) {
                unsetErrorSetMessage(setError, setMessage, response.message);
                unsetEmailPasswordFields(setEmail, setPassword, setPasswordConfirmation);
                toast.success(response.message, { autoClose: 5000 });
                navigate('/verify-email', { replace: true, state: { verification_channel: VERIFICATION_CHANNEL.SIGNUP } });
            } else {
                unsetMessageSetError(setMessage, setError, response.message);
                toast.error(response.message, { autoClose: 5000 });
            }
        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <HelmetHeader pageTitle={'Sign Up'} />
            <Layout heading={SIGNUP_TEXT}>

                <form className="w-full flex flex-col items-center space-y-6" onSubmit={handleAuth}>
                    <Email email={email} setEmail={setEmail} errors={errors} />

                    <Password password={password} setPassword={setPassword} isShowPassword={isShowPassword}
                        setIsShowPassword={setIsShowPassword} errors={errors}>
                        Password
                    </Password>

                    <ConfirmPassword passwordConfirmation={passwordConfirmation} setPasswordConfirmation={setPasswordConfirmation}
                        isShowPassword={isShowPassword} errors={errors}>
                        Confirm Password
                    </ConfirmPassword>

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

                    <SubmitButton loading={loading}>
                        Sign Up
                    </SubmitButton>
                </form>

                <SwitchContextButton textColor={'text-purple-600'} textHoverColor={'hover:text-emerald-600'} route={'/login'}>
                    {SWITCH_TO_LOGIN_TEXT}
                </SwitchContextButton>

            </Layout>
        </>
    )
}

export default SignUp;
