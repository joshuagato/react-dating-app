import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Mail, KeyRound, Eye, EyeOff, CircleCheck, CircleX } from "lucide-react";
import { toast } from 'react-toastify';

import { loginHandler, signUpHandler, getProfileHandler } from '../tanstack';
import { lastArrayElement, unsetErrorSetMessage, unsetMessageSetError, unsetEmailPasswordFields, 
    unsetAllErrors } from "../functions/utils";

import { useUser } from '../store';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    // const supabase = createClient();
    const supabase = {};
    // const { user, loading: authLoading } = useAuth();
    const { user, loading: authLoading } = { user: {}, loading: true };
    const navigate = useNavigate();

    // const user2 = useUser(state => state.user);
    // console.log({user2});

    useEffect(() => {
        if (user && !authLoading) {
            navigate.push("/");
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        (async () => {
            
            
        })()
    }, []); 

    async function handleAuth(e) {
        e.preventDefault();

        setLoading(true);
        unsetAllErrors(setError, setErrors);

        try {
            if (isSignUp) {
                const response = await signUpHandler({ email, password, passwordConfirmation });                

                if (response.errors) setErrors(response.errors);

                if (response.success && !response.session) {
                    unsetErrorSetMessage(setError, setMessage, response.message);
                    unsetEmailPasswordFields(setEmail, setPassword, setPasswordConfirmation);
                    toast.success(response.message, { autoClose: 5000 });
                    navigate('/verify-email');
                } else {
                    unsetMessageSetError(setMessage, setError, response.message);
                    toast.error(response.message, { autoClose: 5000 });
                }
            } else {
                const response = await loginHandler({ email, password });

                if (response.success) {
                    const profile = await getProfileHandler();
                    console.log({profile});
                    
                    unsetErrorSetMessage(setError, setMessage, response.message);
                    toast.success(response.message, { autoClose: 5000, theme: 'colored' });
                    navigate('/verify-email');
                } else {
                    unsetMessageSetError(setMessage, setError, response.message);
                    toast.error(response.message, { autoClose: 5000, theme: 'colored' });
                }
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800 px-2.5">
        <div className="md:max-w-md w-full space-y-8 p-2 sm:p-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm py-20 fade-in">
            <div className="text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text 
                    text-transparent mb-2">
                    StreamMatch
                </h1>
                <p className="text-purple-900">
                    {isSignUp
                        ? "Create Your Account"
                        : "Sign in to your account"}
                </p>
            </div>

            <form className="w-full flex flex-col items-center space-y-6" onSubmit={handleAuth}>
                <label
                    htmlFor="email"
                    className="block mb-1.5 self-start text-sm font-medium text-purple-900"
                >
                    Email
                </label>
                <div>
                    <label className="input">
                        <Mail className="h-[1em] opacity-50" />
                        <input id="email" type="email" placeholder="mail@site.com" className="w-72"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </label>
                    {errors.email && (
                    <div className="text-red-400 text-sm text-center mt-1.5 fade-in">
                        {lastArrayElement(errors.email)}
                    </div>
                )}
                </div>

                <label
                    htmlFor="password"
                    className="block mb-1.5 self-start text-sm font-medium text-purple-900"
                >
                    Password
                </label>
                <div>
                    <div className="flex">
                        <div>
                            <label className="input" htmlFor="password">
                                <KeyRound className="h-[1em] opacity-50" />
                                <input
                                    id="password"
                                    type={isShowPassword ? "text" : "password"} 
                                    placeholder="Password" required value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-56"
                                    minLength="8" className="w-56"
                                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                                    title="Must be 8 characters or more, including number, lowercase letter, uppercase letter"
                                />
                            </label>
                        </div>
                        <button type="button" className="btn btn-neutral" onClick={() => setIsShowPassword(prev => !prev)}>
                            {isShowPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>
                    {errors.password && (
                        <div className="text-red-400 text-sm text-center mt-1.5 fade-in">
                            {lastArrayElement(errors.password)}
                        </div>
                    )}
                </div>

                {isSignUp &&
                <>
                    <label
                        htmlFor="passwordConfirmation"
                        className="block mb-1.5 self-start text-sm font-medium text-purple-900 fade-in"
                    >
                        Confirmation Password
                    </label>
                    <div className="fade-in">
                        <label className="input">
                        <KeyRound className="h-[1em] opacity-50" />
                        <input
                            id="passwordConfirmation"
                            type={isShowPassword ? "text" : "password"}
                            placeholder="Confirm Password" required value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            minLength="8" className="w-72"
                            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                            title="Must be 8 characters or more, including number, lowercase letter, uppercase letter"
                        />
                        </label>
                        {errors.passwordConfirmation && (
                            <div className="text-red-400 text-sm text-left mt-1.5 fade-in">
                                {lastArrayElement(errors.passwordConfirmation)}
                            </div>
                        )}
                    </div>
                </>}

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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm 
                        font-medium text-white bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 
                        hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 
                        disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    {loading
                        ? <div className="flex items-center gap-2 fade-in"><span className="loading loading-spinner" /><span>Loading</span></div>
                        : isSignUp
                            ? <span className="fade-in">Sign Up</span>
                            : <span className="fade-in">Sign In</span>}
                </button>
            </form>

            <div className="text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-purple-600 hover:text-pink-600 cursor-pointer text-sm"
                >
                    {isSignUp
                        ? <span className="fade-in">Already have an account? Sign in</span>
                        : <span className="fade-in">Don't have an account? Sign up</span>}
                </button>
            </div>
        </div>
    </div>
  )
}

export default Auth
