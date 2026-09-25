// components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router";
import Cookies from "js-cookie";
import { getSetupStatusHandler } from "../tanstack/auth"; // Replace with your standard API client instance if needed

import {
    verifyEmailPath,
    basicProfilePath,
    advancedProfilePath,
    finalProfilePath,
    profilePagePath,
    loginPath,
    VERIFICATION_CHANNEL,
} from "../utils/constants";

const ProtectedRoute = () => {
    const token = Cookies.get("token");
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [isFullyOnboarded, setIsFullyOnboarded] = useState(false);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const checkOnboardingStatus = async () => {
            try {
                const response = await getSetupStatusHandler();

                const {
                    user_id,
                    token,
                    email_verified,
                    basic_profile_setup,
                    advanced_profile_setup,
                    final_profile_setup,
                    profile_page_setup,
                    first_name,
                    last_name,
                } = response.setup;

                if (user_id) {
                    localStorage.setItem('user_id', user_id);
                }

                if (token) {
                    localStorage.setItem('token', token);
                }

                console.log({ response })

                const isFullySetup =
                    email_verified &&
                    basic_profile_setup &&
                    advanced_profile_setup &&
                    final_profile_setup &&
                    profile_page_setup;

                if (isFullySetup) {
                    setIsFullyOnboarded(true);
                } else {
                    // Evaluate incomplete steps sequentially
                    if (!email_verified) {
                        return navigate(verifyEmailPath, {
                            replace: true,
                            state: { verification_channel: VERIFICATION_CHANNEL.LOGIN },
                        });
                    }

                    if (!basic_profile_setup) {
                        return navigate(basicProfilePath, {
                            replace: true,
                            state: { first_name, last_name },
                        });
                    }

                    if (!advanced_profile_setup) {
                        return navigate(advancedProfilePath, { replace: true });
                    }

                    if (!final_profile_setup) {
                        return navigate(finalProfilePath, { replace: true });
                    }

                    if (!profile_page_setup) {
                        return navigate(profilePagePath, { replace: true });
                    }
                }
            } catch (error) {
                console.error("Failed to verify user onboarding status:", error);
                Cookies.remove("token");
                navigate(loginPath, { replace: true });
            } finally {
                setLoading(false);
            }
        };

        checkOnboardingStatus();
    }, [token, navigate, location.pathname]);

    // 1. Unauthenticated users
    if (!token) {
        return <Navigate to={loginPath} replace />;
    }

    // 2. Loading verification state
    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 3. Render child routes if onboarding checks pass
    return isFullyOnboarded ? <Outlet /> : null;
};

export default ProtectedRoute;