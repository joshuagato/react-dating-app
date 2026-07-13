import { protectedApi } from "../axios";

const getProfile = async () => {
    const response = await protectedApi.get('/user/profile');
    return response.data;
}

const setupProfile = async data => {
    const response = await protectedApi.put('/user/profile', data);
    return response.data;
}


export const getProfileHandler = async () => await getProfile();

export const setupProfileHandler = async data => await setupProfile(data);
