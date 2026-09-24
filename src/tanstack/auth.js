import { unProtectedApi, protectedApi } from "../axios";

export const googleAuthHandler = async data => {
    const response = await unProtectedApi.post('/auth/google-auth', data);
    return response.data;
}

const authentication = async (operation, authData) => {
    let route = '';

    if (operation === 'login')
        route = '/auth/login';

    else if (operation === 'signup')
        route = '/auth/signup';

    const response = await unProtectedApi.post(route, authData);
    return response.data;
}

export const verifyEmailHandler = async verificationData => {
    const response = await protectedApi.patch('/auth/verify-email', verificationData);
    return response.data;
}

export const requestPasswordResetHandler = async requestData => {
    const response = await unProtectedApi.patch('/auth/request-password-reset', requestData);
    return response.data;
}

export const confirmPasswordResetHandler = async requestData => {
    const response = await protectedApi.post('/auth/confirm-password-reset', requestData);
    return response.data;
}

export const resetPasswordHandler = async requestData => {
    const response = await protectedApi.post('/auth/reset-password', requestData);
    return response.data;
}

export const getSetupStatusHandler = async () => {
    const response = await protectedApi.get('/auth/setup-status');
    return response.data;
};


export const loginHandler = async data => await authentication('login', data);

export const signUpHandler = async data => await authentication('signup', data);