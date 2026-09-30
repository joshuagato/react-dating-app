import { protectedApi } from "../axios";

export const getProfileHandler = async () => {
    const response = await protectedApi.get('/user/profile');
    return response.data;
}

export const getPartnerProfileHandler = async userId => {
    const response = await protectedApi.get(`/user/partner-profile/${userId}`);
    return response.data;
}

export const updateProfileHandler = async data => {
    const response = await protectedApi.put('/user/update-profile', data);
    return response.data;
}

export const setupBasicProfileHandler = async data => {
    const response = await protectedApi.put('/user/basic-profile', data);
    return response.data;
}

export const setupAdvancedProfileHandler = async data => {
    const response = await protectedApi.put('/user/advanced-profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export const setupFinalProfileHandler = async data => {
    const response = await protectedApi.put('/user/final-profile', data);
    return response.data;
}

export const getVerificationSelfieHandler = async () => {
    const response = await protectedApi.get('/user/verification-selfie');
    return response.data;
}

export const getPotentialMatchProfilesHandler = async () => {
    const response = await protectedApi.get('/user/get-potential-match-profiles');
    return response.data;
}

export const getNearbyUsersHandler = async () => {
    const response = await protectedApi.get('/user/get-nearby-users');
    return response.data;
}

export const getPremiumStatusHandler = async () => {
    const response = await protectedApi.get('/user/premium-status');
    return response.data;
}

export const completeProfileSetupHandler = async data => {
    const response = await protectedApi.put('/user/complete-profile-setup', data);
    return response.data;
}

export const deletePictureHandler = async id => {
    const response = await protectedApi.delete(`/user/delete-picture/${id}`);
    return response.data;
}
