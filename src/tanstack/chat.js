import { protectedApi } from "../axios";

const sendMessage = async data => {
    const response = await protectedApi.post('/chat/send-message', data);
    return response.data;
}


export const sendMessageHandler = async data => await sendMessage(data);
