import { protectedApi } from "../axios";

const getProfile = async () => {
    const response = await protectedApi.get('/user/profile');
    return response.data;
}

const getPartnerProfile = async userId => {
    const response = await protectedApi.get(`/user/partner-profile/${userId}`);
    return response.data;
}

const updateProfile = async data => {
    const response = await protectedApi.put('/user/update-profile', data);
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

const setupFinalProfile = async data => {
    const response = await protectedApi.put('/user/final-profile', data);
    return response.data;
}

const getVerificationSelfie = async () => {
    const response = await protectedApi.get('/user/verification-selfie');
    return response.data;
}

const getPotentialMatchProfiles = async () => {
    const response = await protectedApi.get('/user/get-potential-match-profiles');
    return response.data;
}

const getNearbyUsers = async () => {
    const response = await protectedApi.get('/user/get-nearby-users');
    return response.data;
}

const getPremiumStatus = async () => {
    const response = await protectedApi.get('/user/premium-status');
    return response.data;
}

const completeProfileSetup = async data => {
    const response = await protectedApi.put('/user/complete-profile-setup', data);
    return response.data;
}

const deletePicture = async id => {
    const response = await protectedApi.delete(`/user/delete-picture/${id}`);
    return response.data;
}

export const getProfileHandler = async () => await getProfile();

export const getPartnerProfileHandler = async userId => await getPartnerProfile(userId);

export const updateProfileHandler = async data => await updateProfile(data);

export const setupBasicProfileHandler = async data => await setupBasicProfile(data);

export const setupAdvancedProfileHandler = async data => await setupAdvancedProfile(data);

export const setupFinalProfileHandler = async data => await setupFinalProfile(data);

export const getVerificationSelfieHandler = async () => await getVerificationSelfie();

export const getPotentialMatchProfilesHandler = async () => await getPotentialMatchProfiles();

export const getNearbyUsersHandler = async () => await getNearbyUsers();

export const getPremiumStatusHandler = async () => await getPremiumStatus();

export const completeProfileSetupHandler = async data => await completeProfileSetup(data);

export const deletePictureHandler = async id => await deletePicture(id);