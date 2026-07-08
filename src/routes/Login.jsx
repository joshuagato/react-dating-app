import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CircleCheck, CircleX } from "lucide-react";
import { toast } from 'react-toastify';

import Layout from "../components/Layout";
import Email from "../components/Email";
import Password from "../components/Password";
import SwitchContextButton from "../components/SwitchContextButton";
import SubmitButton from "../components/SubmitButton";

import { loginHandler, getProfileHandler } from '../tanstack';
import { unsetErrorSetMessage, unsetMessageSetError, unsetEmailPasswordFields, 
    unsetAllErrors } from "../functions/utils";
import { LOGIN_TEXT, SWITCH_TO_SIGNUP_TEXT, VERIFICATION_CHANNEL } from "../functions/constants";


const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isShowPassword, setIsShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
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
            const response = await loginHandler({ email, password });

            if (response.success) {
                const profile = await getProfileHandler();
                console.log({profile});
                
                unsetErrorSetMessage(setError, setMessage, response.message);
                toast.success(response.message, { autoClose: 5000, theme: 'colored' });
                navigate('/verify-email', { state: { verification_channel: VERIFICATION_CHANNEL.LOGIN } });
            } else {
                unsetMessageSetError(setMessage, setError, response.message);
                toast.error(response.message, { autoClose: 5000, theme: 'colored' });
            }
            
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

  return (
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

        <SwitchContextButton route={'/signup'}>
            {SWITCH_TO_SIGNUP_TEXT}
        </SwitchContextButton>

    </Layout>
  )
}

export default Auth
