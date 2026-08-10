import { protectedApi } from "../axios";

const likeUser = async data => {
    const response = await protectedApi.post('/encounter/like-user', data);
    return response.data;
}

const dislikeUser = async data => {
    const response = await protectedApi.post('/encounter/dislike-user', data);
    return response.data;
}

export const likeUserHandler = async data => await likeUser(data);

export const dislikeUserHandler = async data => await dislikeUser(data);
