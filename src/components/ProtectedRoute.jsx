// components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router";
import { getSetupStatusHandler } from "../tanstack/auth";
import {
    verifyEmailPath,
    basicProfilePath,
    advancedProfilePath,
    finalProfilePath,
    profilePagePath,
    loginPath,
    VERIFICATION_CHANNEL,
    userToken,
} from "../utils/constants";

const ProtectedRoute = () => {
    const token = userToken || localStorage.getItem('token');
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const checkOnboardingStatus = async () => {
            try {
                const response = await getSetupStatusHandler();
                const setup = response?.setup || {};

                const {
                    user_id,
                    token: newToken,
                    email_verified,
                    basic_profile_setup,
                    advanced_profile_setup,
                    final_profile_setup,
                    profile_page_setup,
                    first_name,
                    last_name,
                } = setup;

                if (user_id) localStorage.setItem('user_id', user_id);
                if (newToken) localStorage.setItem('token', newToken);

                const isFullySetup =
                    email_verified &&
                    basic_profile_setup &&
                    advanced_profile_setup &&
                    final_profile_setup &&
                    profile_page_setup;

                const currentPath = location.pathname;

                if (!isFullySetup) {
                    let targetPath = null;
                    let navState = {};

                    if (!email_verified) {
                        targetPath = verifyEmailPath;
                        navState = { verification_channel: VERIFICATION_CHANNEL.LOGIN };
                    } else if (!basic_profile_setup) {
                        targetPath = basicProfilePath;
                        navState = { first_name, last_name };
                    } else if (!advanced_profile_setup) {
                        targetPath = advancedProfilePath;
                    } else if (!final_profile_setup) {
                        targetPath = finalProfilePath;
                    } else if (!profile_page_setup) {
                        targetPath = profilePagePath;
                    }

                    // Avoid re-navigating if the user is ALREADY on the correct setup step
                    if (targetPath && currentPath !== targetPath) {
                        return navigate(targetPath, { replace: true, state: navState });
                    }
                }
            } catch (error) {
                console.error("Failed to verify user onboarding status:", error);
                navigate(loginPath, { replace: true });
            } finally {
                setLoading(false);
            }
        };

        checkOnboardingStatus();
    }, [token, location.pathname, navigate]);

    if (!token) {
        return <Navigate to={loginPath} replace />;
    }

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Always render child routes when authentication check passes
    return <Outlet />;
};

export default ProtectedRoute;