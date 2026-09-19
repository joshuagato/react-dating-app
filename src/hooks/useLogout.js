import Cookies from 'js-cookie';
import { useNavigate } from 'react-router';

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
        navigate('/login');
    };

    return logout;
};