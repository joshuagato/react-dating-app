import { protectedApi } from "../axios";

export const getEncountersProfilesHandler = async (query) => {
    const response = await protectedApi.get(`/encounter/get-encounters-profiles?${query}`);
    return response.data;
}

export const likeUserHandler = async data => {
    const response = await protectedApi.post('/encounter/like-user', data);
    return response.data;
}

export const dislikeUserHandler = async data => {
    const response = await protectedApi.post('/encounter/dislike-user', data);
    return response.data;
}

export const usersWhoLikeMeHandler = async () => {
    const response = await protectedApi.get('/encounter/users-who-like-me');
    return response.data;
}

export const usersWhoDisLikeMeHandler = async () => {
    const response = await protectedApi.get('/encounter/users-who-dislike-me');
    return response.data;
}

export const usersDisLikedByMeHandler = async () => {
    const response = await protectedApi.get('/encounter/users-disliked-by-me');
    return response.data;
}

export const getNewLikesCountHandler = async () => {
    const response = await protectedApi.get('/encounter/get-new-likes-count');
    return response.data;
}

export const markLikesAsSeenHandler = async initiatorIds => {
    const response = await protectedApi.post('/encounter/mark-likes-seen', {
        initiator_ids: initiatorIds,
    });
    return response.data;
};

export const saveEncountersFilterHandler = async (filter) => {
    const res = await protectedApi.put('/encounter/filter', {
        max_distance_km: filter.max_distance_km,
        interested_in: filter.interested_in,
        min_age: filter.min_age,
        max_age: filter.max_age,
        online_only: filter.online_only,
        premium_only: filter.premium_only,
    });
    return res.data;
};
