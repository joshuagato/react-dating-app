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

const profile = async () => {
    const response = await protectedApi.get('/auth/profile');
    return response.data;
}

const verifyEmail = async verificationData => {
    const response = await protectedApi.post('/auth/verify-email', verificationData);
    return response.data;
}



export const loginHandler = async data => await authentication('login', data);


export const signUpHandler = async data => await authentication('signup', data);


export const getProfileHandler = async () => await profile();


export const verifyEmailHandler = async data => await verifyEmail(data);