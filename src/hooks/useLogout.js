import Cookies from 'js-cookie';
import { useNavigate } from 'react-router';
import { homePath } from '../utils/constants';

export const useLogout = () => {
    const navigate = useNavigate();

    const logout = () => {
        // Remove cookies
        Cookies.remove('token', { path: '/' });
        Cookies.remove('user_id', { path: '/' });

        // Clear local & session storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect
        navigate(homePath);
    };

    return logout;
};