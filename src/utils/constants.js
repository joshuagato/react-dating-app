import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

export const APP_NAME = 'StreamMatch';

export const baseURL = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL;
export const userId = Cookies.get('user_id');

export const LOGIN_TEXT = 'Sign in to Your Account';
export const SIGNUP_TEXT = 'Create Your Account';

export const SWITCH_TO_SIGNUP_TEXT = "Don't have an account? Sign up";
export const SWITCH_TO_LOGIN_TEXT = "Already have an account? Sign in";
export const SWITCH_TO_PASSWORD_RESET_TEXT = "Forgotten Your Password? Reset it Here!";
export const SWITCH_BACK_TO_LOGIN_TEXT = "Switch Back to Login";

export const VERIFY_EMAIL_TEXT = 'Enter Your Verification Code';
export const SET_UP_BASIC_DETAILS = 'Set Up Basic Profile Details';
export const RESET_PASSWORD_TEXT = 'Enter Email to Receive a Password Reset Code';
export const RESET_PASSWORD_CONFIRMATION_TEXT = 'Enter Your Request Confirmation Code';

export const SET_NEW_PASSWORD_TEXT = 'Enter New Password and Confirm';
export const UPLOAD_PICTURE_TEXT = 'Upload Pictures for Your Profile';

export const disabledColor = 'text-gray-400';
export const enabledColor = 'text-gray-800';

export const POTENTIAL_MATCH_PROFILE = 'Potential Match Profile';

export const ENCOUNTERS_TITLE = 'Encounters';
export const ENCOUNTERS_TEXT = 'Match and Start a Chat!';

export const LIKES_TITLE = 'Likes';
export const LIKES_TEXT = 'Who liked me?';

export const NEARBY_TITLE = 'Nearby';
export const NEARBY_TEXT = 'People close to me';

export const CHATS_TITLE = 'Chats';
export const CHATS_TEXT = 'My conversations with others';

export const CHAT_TITLE = 'Chat';

export const PROFILE_TITLE = 'Profile';
export const PROFILE_TEXT = 'My Profile Details';

export const verifyEmailPath = '/verify-email';
export const basicProfilePath = '/basic-profile';
export const advancedProfilePath = '/advanced-profile';
export const finalProfilePath = '/final-profile';

export const encountersPath = '/encounters';
export const likesPath = '/likes';
export const chatsPath = '/chats';
export const chatPath = '/chat';
export const nearbyPath = '/nearby';
export const profilePath = '/profile';
export const premiumPath = '/premium';

export const VERIFICATION_CHANNEL = {
    SIGNUP: 'signup', LOGIN: 'login'
}

export const ENCOUNTER_ACTION = {
    LIKE: 'like', DISLIKE: 'dislike', SUPER_LIKE: 'super-like', PASS: 'pass'
}

export const GENDER = {
    MAN: 'man', MEN: 'men', WOMAN: 'woman', WOMEN: 'women', EVERONE: 'everyone'
};


export const socket = io(baseURL, {
    withCredentials: true,
    query: { userId }
});

console.log(userId)
