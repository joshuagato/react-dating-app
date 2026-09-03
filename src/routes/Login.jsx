import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CircleCheck, CircleX } from "lucide-react";
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';

import Layout from "../components/Layouts/SetupLayout";
import Email from "../components/Email";
import Password from "../components/Password";
import SwitchContextButton from "../components/SwitchContextButton";
import SubmitButton from "../components/SubmitButton";
import HelmetHeader from "../components/HelmetHeader";

import { loginHandler, googleAuthHandler } from '../tanstack/auth';
import { getProfileHandler } from '../tanstack/user';
import {
    unsetErrorSetMessage, unsetMessageSetError, unsetEmailPasswordField,
    unsetAllErrors, connectSocket
} from "../utils/functions";
import {
    LOGIN_TEXT, SWITCH_TO_SIGNUP_TEXT, VERIFICATION_CHANNEL, SWITCH_TO_PASSWORD_RESET_TEXT,
    encountersPath, verifyEmailPath, basicProfilePath, advancedProfilePath, finalProfilePath, baseURL
} from "../utils/constants";


const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

    // Reusable redirect & socket handler post-auth
    const handleAuthSuccess = async (response) => {
        const profile = await getProfileHandler();
        console.log({ profile });

        unsetErrorSetMessage(setError, setMessage, response.message);
        unsetEmailPasswordField(setEmail, setPassword);
        toast.success(response.message, { autoClose: 7000, theme: 'colored' });

        const { user_id, email_verified, basic_profile_setup, advanced_profile_setup,
            final_profile_setup, first_name, last_name } = response;
        connectSocket(baseURL, user_id);

        if (email_verified && basic_profile_setup && advanced_profile_setup && final_profile_setup) {
            navigate(encountersPath, { replace: true });
        } else {
            if (!email_verified)
                return navigate(verifyEmailPath, { replace: true, state: { verification_channel: VERIFICATION_CHANNEL.LOGIN } });

            if (!basic_profile_setup) return navigate(basicProfilePath, { replace: true, state: { first_name, last_name } });

            if (!advanced_profile_setup) return navigate(advancedProfilePath, { replace: true });

            if (!final_profile_setup) return navigate(finalProfilePath, { replace: true });
        }
    };

    async function handleAuth(event) {
        event.preventDefault();

        setLoading(true);
        unsetAllErrors(setError, setErrors);

        try {
            const response = await loginHandler({ email, password });

            if (response.errors) setErrors(response.errors);

            if (response.success) {
                await handleAuthSuccess(response);
            } else {
                unsetMessageSetError(setMessage, setError, response.message);
                toast.error(response.message, { autoClose: 7000, theme: 'colored' });
            }

        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }

    // Google Login Success Handler
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        unsetAllErrors(setError, setErrors);

        try {
            // Send JWT ID token from Google to Express backend
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
            <HelmetHeader pageTitle={'Login'} />

            <Layout heading={LOGIN_TEXT}>

                <form className="w-full flex flex-col items-center space-y-6" onSubmit={handleAuth}>
                    <Email email={email} setEmail={setEmail} errors={errors} />

                    <Password password={password} setPassword={setPassword} isShowPassword={isShowPassword}
                        setIsShowPassword={setIsShowPassword} errors={errors}>
                        Password
                    </Password>

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
                        Sign In
                    </SubmitButton>
                </form>

                {/* Divider */}
                <div className="w-full flex items-center my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-xs font-semibold">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Google Sign-In Button */}
                <div className="w-full flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error('Google Sign-In failed', { autoClose: 5000, theme: 'colored' })}
                        useOneTap
                        shape="pill"
                        width="100%"
                    />
                </div>

                <SwitchContextButton textColor={'text-pink-600'} textHoverColor={'hover:text-green-600'} route={'/reset-password'}>
                    {SWITCH_TO_PASSWORD_RESET_TEXT}
                </SwitchContextButton>

                <SwitchContextButton textColor={'text-purple-600'} textHoverColor={'hover:text-emerald-600'} route={'/signup'}>
                    {SWITCH_TO_SIGNUP_TEXT}
                </SwitchContextButton>

            </Layout>
        </>
    );
};

export default Auth;