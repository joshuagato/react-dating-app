import { unProtectedApi, protectedApi } from "../axios";

const authentication = async (operation, authData) => {
    let route = '';

    if (operation === 'login')
        route = '/auth/login';

    else if (operation === 'signup')
        route = '/auth/signup';

    const response = await unProtectedApi.post(route, authData);
    return response.data;
}

const verifyEmail = async verificationData => {
    const response = await protectedApi.patch('/auth/verify-email', verificationData);
    return response.data;
}

const requestPasswordReset = async requestData => {
    const response = await protectedApi.patch('/auth/request-password-reset', requestData);
    return response.data;
}

const confirmPasswordReset = async requestData => {
    const response = await protectedApi.post('/auth/confirm-password-reset', requestData);
    return response.data;
}

const resetPassword = async requestData => {
    const response = await protectedApi.post('/auth/reset-password', requestData);
    return response.data;
}



export const loginHandler = async data => await authentication('login', data);

export const signUpHandler = async data => await authentication('signup', data);

export const verifyEmailHandler = async data => await verifyEmail(data);

export const requestPasswordResetHandler = async data => await requestPasswordReset(data);

export const confirmPasswordResetHandler = async data => await confirmPasswordReset(data);

export const resetPasswordHandler = async data => await resetPassword(data);