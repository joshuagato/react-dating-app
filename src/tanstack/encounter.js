import { protectedApi } from "../axios";

const likeUser = async data => {
    const response = await protectedApi.post('/encounter/like-user', data);
    return response.data;
}

const dislikeUser = async data => {
    const response = await protectedApi.post('/encounter/dislike-user', data);
    return response.data;
}

const usersWhoLikeMe = async () => {
    const response = await protectedApi.get('/encounter/users-who-like-me');
    return response.data;
}

const usersWhoDisLikeMe = async () => {
    const response = await protectedApi.get('/encounter/users-who-dislike-me');
    return response.data;
}

const usersDisLikedByMe = async () => {
    const response = await protectedApi.get('/encounter/users-disliked-by-me');
    return response.data;
}


export const likeUserHandler = async data => await likeUser(data);

export const dislikeUserHandler = async data => await dislikeUser(data);

export const usersWhoLikeMeHandler = async () => await usersWhoLikeMe();

export const usersWhoDisLikeMeHandler = async () => await usersWhoDisLikeMe();

export const usersDisLikedByMeHandler = async () => await usersDisLikedByMe();

