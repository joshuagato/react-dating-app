import { protectedApi } from "../axios";

const getProfile = async () => {
    const response = await protectedApi.get('/user/profile');
    return response.data;
}


export const getProfileHandler = async () => await getProfile();
