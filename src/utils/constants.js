import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

export const APP_NAME = 'Crushr';

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
export const profilePagePath = '/profile-page';
export const installPagePath = '/install';

export const encountersPath = '/encounters';
export const likesPath = '/likes';
export const chatsPath = '/chats';
export const chatPath = '/chat';
export const nearbyPath = '/nearby';
export const profilePath = '/profile';
export const premiumPath = '/premium';
export const homePath = '/';
export const partnerProfilePath = '/partner-profile';
export const cloudFactorPath = 'https://';

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

export const AD_EVERY_N_CARDS = 2;

console.log(userId)

export const REASON_FOR_JOINING_OPTIONS = [
    { value: 'friendship', label: 'Friendship' },
    { value: 'dating', label: 'Dating' },
    { value: 'marriage', label: 'Marriage' },
    { value: 'networking', label: 'Networking' },
    { value: 'activities', label: 'Activity partner' },
    { value: 'just_browsing', label: 'Just browsing' },
];

export const EDUCATION_LEVEL_OPTIONS = [
    { value: 'high_school', label: 'High school' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'bachelors', label: "Bachelor's" },
    { value: 'masters', label: "Master's" },
    { value: 'doctorate', label: 'Doctorate' },
    { value: 'other', label: 'Other' },
];

export const INTEREST_OPTIONS = [
    { value: 'music', label: 'Music' },
    { value: 'movies', label: 'Movies' },
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'reading', label: 'Reading' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'art', label: 'Art' },
    { value: 'technology', label: 'Technology' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'sports', label: 'Sports' },
    { value: 'nature', label: 'Nature' },
    { value: 'pets', label: 'Pets' },
    { value: 'photography', label: 'Photography' },
    { value: 'dancing', label: 'Dancing' },
];

export const LOOKING_FOR_OPTIONS = [
    { value: 'chat', label: 'Chat' },
    { value: 'friendship', label: 'Friendship' },
    { value: 'long_term', label: 'Long-term' },
    { value: 'marriage', label: 'Marriage' },
    { value: 'casual', label: 'Casual' },
    { value: 'not_sure', label: 'Not sure yet' },
];

export const RELATIONSHIP_STATUS_OPTIONS = [
    { value: 'single', label: 'Single' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
