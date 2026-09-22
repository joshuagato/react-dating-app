import { protectedApi } from "../axios";

export const getPremiumPricesHandler = async () => {
    const { data } = await protectedApi.get('/premium/prices');
    return data;
};

export const verifyPaystackPaymentHandler = async (reference) => {
    const { data } = await protectedApi.post('/premium/paystack/verify', {
        reference,
    });
    return data;
};