import axios from "axios";

const environment = import.meta.env.VITE_REACT_APP_ENVIRONMENT;
const baseURL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const unProtectedApi = axios.create({
  baseURL,
});

const protectedApi = axios.create({
  baseURL,
});

protectedApi.interceptors.request.use((config) => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const { token } = user;
    
    if (token) {
        const modifiedConfig = { ...config };
        modifiedConfig.headers.Authorization = token;
        return modifiedConfig;
    }
    return config;

    },
    (error) => Promise.reject(error)
);

export { unProtectedApi, protectedApi };
