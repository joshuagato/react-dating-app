import { protectedApi } from "../axios";

const getProfile = async () => {
    const response = await protectedApi.get('/user/profile');
    return response.data;
}

const setupBasicProfile = async data => {
    const response = await protectedApi.put('/user/basic-profile', data);
    return response.data;
}

const setupAdvancedProfile = async data => {
    const response = await protectedApi.put('/user/advanced-profile', data);
    return response.data;
}

const getPotentialMatchProfiles = async () => {
    const response = await protectedApi.get('/user/get-potential-match-profiles');
    return response.data;
}

export const getProfileHandler = async () => await getProfile();

export const setupBasicProfileHandler = async data => await setupBasicProfile(data);

export const setupAdvancedProfileHandler = async data => await setupAdvancedProfile(data);

export const getPotentialMatchProfilesHandler = async () => await getPotentialMatchProfiles();
