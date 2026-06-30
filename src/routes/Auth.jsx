import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from '@tanstack/react-query';
import axios from "axios";
import { unProtectedApi } from "../axios";
import { loginHandler, signUpHandler } from '../tanstack';

import { useUser } from '../store';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    // const supabase = createClient();
    const supabase = {};
    // const { user, loading: authLoading } = useAuth();
    const { user, loading: authLoading } = { user: {}, loading: true };
    const router = useNavigate();

    // const user2 = useUser(state => state.user);
    // console.log({user2});

    useEffect(() => {
        if (user && !authLoading) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        (async () => {
            
            
        })()
    }, []); 

    // const response = loginHandler({});

    async function handleAuth(e) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            if (isSignUp) {
                const response = await signUpHandler({ email, password, passwordConfirmation });

                console.log({response});
                if (error) throw error;
                if (response.success && response.user && !response.session) {
                    
                    setError("Please check your email for a confirmation link");
                    setEmail('');
                    setPassword('');
                    setPasswordConfirmation('');
                    return;
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 to-teal-800">
        <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    StreamMatch
                </h1>
                <p className="text-gray-100">
                    {isSignUp
                        ? "Create Your Account"
                        : "Sign in to your account"}
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleAuth}>
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-100"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input validator mt-1 block w-full px-3 py-2 border border-gray-600 
                            rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 
                            focus:border-green-500 bg-gray-800 text-white"
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-100"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength="8"
                        className="input validator mt-1 block w-full px-3 py-2 border border-gray-600 
                            rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 
                            focus:border-green-500 bg-gray-800 text-white"
                        placeholder="Enter your password"
                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Must be 8 characters or more, including number, lowercase letter, uppercase letter"
                    />
                    
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-100"
                    >
                        Password Confirmation
                    </label>
                    <input
                        id="passwordConfirmation"
                        type="password"
                        required
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        minLength="8"
                        className="input validator mt-1 block w-full px-3 py-2 border border-gray-600 
                            rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 
                            focus:border-green-500 bg-gray-800 text-white"
                        placeholder="Enter your password confirmation"
                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Must be 8 characters or more, including number, lowercase letter, uppercase letter"
                    />
                    
                </div>

                {error && (
                    <div className="text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
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
                        ? <div className="flex items-center gap-2"><span className="loading loading-spinner" /><span>Loading</span></div>
                        : isSignUp
                            ? "Sign Up"
                            : "Sign In"}
                </button>
            </form>

            <div className="text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-purple-300 hover:text-purple-400 cursor-pointer text-sm"
                >
                    {isSignUp
                        ? "Already have an account? Sign in"
                        : "Don't have an account? Sign up"}
                </button>
            </div>
        </div>
    </div>
  )
}

export default Auth
