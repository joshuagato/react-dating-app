import { useQuery } from '@tanstack/react-query';
import axios from "axios";
import { unProtectedApi } from "../axios";

const authentication = async (operation, authData) => {
    let route = '';

    if (operation === 'login')
        route = '/auth/login';

    else if (operation === 'signup')
        route = '/auth/signup';

    const response = await unProtectedApi.post(route, authData);
    return response.data;
}


export const loginHandler = async data => await authentication('login', data);


export const signUpHandler = async data => await authentication('signup', data);