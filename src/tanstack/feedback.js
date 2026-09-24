// tanstack/feedback.js
import { protectedApi } from '../axios';

export const submitFeedbackHandler = async ({ title, body }) => {
    const response = await protectedApi.post('/feedback/send', { title, body });
    return response.data;
};

export const getMyFeedbackHandler = async () => {
    const response = await protectedApi.get('/feedback/get');
    return response.data;
};