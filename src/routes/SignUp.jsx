import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CircleCheck, CircleX } from "lucide-react";
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';

import Layout from "../components/Layouts/SetupLayout";
import Email from "../components/Email";
import Password from "../components/Password";
import ConfirmPassword from "../components/ConfirmPassword";
import SubmitButton from "../components/SubmitButton";
import SwitchContextButton from "../components/SwitchContextButton";
import HelmetHeader from "../components/HelmetHeader";

import { signUpHandler, googleAuthHandler } from '../tanstack/auth';
import { getProfileHandler } from '../tanstack/user';
import {
    unsetErrorSetMessage, unsetMessageSetError, unsetEmailPasswordFields,
    unsetEmailPasswordField, unsetAllErrors, connectSocket
} from "../utils/functions";
import {
    SIGNUP_TEXT, SWITCH_TO_LOGIN_TEXT, VERIFICATION_CHANNEL,
    verifyEmailPath, encountersPath, basicProfilePath, advancedProfilePath, finalProfilePath, baseURL
} from "../utils/constants";

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

    // Handle authentication success (Shared logic)
    const handleAuthSuccess = async (response) => {
        const profile = await getProfileHandler();

        unsetErrorSetMessage(setError, setMessage, response.message);
        unsetEmailPasswordField(setEmail, setPassword);
        toast.success(response.message, { autoClose: 7000, theme: 'colored' });

        const { user_id, email_verified, basic_profile_setup, advanced_profile_setup,
            final_profile_setup, first_name, last_name } = response;
        connectSocket(baseURL, user_id);

        if (email_verified && basic_profile_setup && advanced_profile_setup) {
            navigate(encountersPath, { replace: true });
        } else {
            if (!email_verified)
                return navigate(verifyEmailPath, { replace: true, state: { verification_channel: VERIFICATION_CHANNEL.LOGIN } });

            if (!basic_profile_setup)
                return navigate(basicProfilePath, { replace: true, state: { first_name, last_name } });

            if (!advanced_profile_setup)
                return navigate(advancedProfilePath, { replace: true });

            if (!final_profile_setup)
                return navigate(finalProfilePath, { replace: true });
        }
    };

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
                navigate(verifyEmailPath, { replace: true, state: { verification_channel: VERIFICATION_CHANNEL.SIGNUP } });
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

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        unsetAllErrors(setError, setErrors);

        try {
            const response = await googleAuthHandler({ idToken: credentialResponse.credential });

            if (response.success) {
                await handleAuthSuccess(response);
            } else {
                unsetMessageSetError(setMessage, setError, response.message);
                toast.error(response.message, { autoClose: 7000, theme: 'colored' });
            }
        } catch (error) {
            toast.error(error.message || 'Google Auth Failed', { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    };

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

                {/* Divider */}
                <div className="w-full flex items-center my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-xs font-semibold">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Google Sign-Up Button */}
                <div className="w-full flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error('Google Sign-Up failed', { autoClose: 5000, theme: 'colored' })}
                        useOneTap
                        shape="pill"
                        width="100%"
                        text="signup_with"
                    />
                </div>

                <SwitchContextButton textColor={'text-purple-600'} textHoverColor={'hover:text-emerald-600'} route={'/login'}>
                    {SWITCH_TO_LOGIN_TEXT}
                </SwitchContextButton>

            </Layout>
        </>
    );
};

export default SignUp;