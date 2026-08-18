import { protectedApi } from "../axios";

const sendMessage = async data => {
    const response = await protectedApi.post('/chat/send-message', data);
    return response.data;
}

const getChats = async () => {
    const response = await protectedApi.get('/chat/get-chats');
    return response.data;
}

const getChatMessages = async chat_id => {
    const response = await protectedApi.get(`/chat/get-chat-messages/${chat_id}`);
    return response.data;
}



export const sendMessageHandler = async data => await sendMessage(data);

export const getChatsHandler = async () => await getChats();

export const getChatMessagesHandler = async data => await getChatMessages(data);
