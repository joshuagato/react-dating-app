import { io } from 'socket.io-client';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import CryptoJS from 'crypto-js';

export const organizeErrors = errorsArray => {
    const errorsData = {};

    errorsArray.forEach(error => {
        if (Object.keys(errorsData).includes(error['path'])) {
            // errorsData[error['path']].push(error['msg']);
            errorsData[error['path']] = [...errorsData[error['path']], error['msg']];
        } else {
            errorsData[error['path']] = [error['msg']];
        }
    })

    return errorsData;
}

export const lastArrayElement = array => array[array.length - 1];

export const disableSubmitButtonFor = (setCounting, timeout) => {
    setCounting(true);
    setTimeout(() => setCounting(false), timeout);
}

export const unsetErrorSetMessage = (setError, setMessage, message) => {
    setError('');
    setMessage(message);
}

export const unsetMessageSetError = (setMessage, setError, message) => {
    setMessage('');
    setError(message);
}

export const unsetEmailPasswordFields = (setEmail, setPassword, setPasswordConfirmation) => {
    setEmail('');
    setPassword('');
    setPasswordConfirmation('');
}

export const unsetEmailPasswordField = (setEmail, setPassword) => {
    setEmail('');
    setPassword('');
}

export const unsetPasswordFields = (setPassword, setPasswordConfirmation) => {
    setPassword('');
    setPasswordConfirmation('');
}

export const unsetAllErrors = (setError, setErrors) => {
    setError("");
    setErrors({});
}

export const makeLabelTextId = string => string.split(' ').join('_').toLowerCase();

const inactiveColour = '#909397';
const inactiveTextColour = 'text-[#909397]';

const activeColour = '#000';
const activeTextColour = 'text-[#000]';

const isPathName = (pathName, currentPathName) => pathName.toString() === currentPathName.toString();

export const chooseColour = (pathName, currentPathName) => isPathName(pathName, currentPathName) ? activeColour : inactiveColour;
export const chooseTextColour = (pathName, currentPathName) => isPathName(pathName, currentPathName) ? activeTextColour : inactiveTextColour;

export const pathMatched = isPathName;

export const connectSocket = (baseURL, userId) => {
    const socket = io(baseURL, {
        withCredentials: true,
        query: { userId }
    });

    return socket;
}

export const writeName = (user1, user2, user0) => {
    // First Message => When CurrentMessageSender != NextMessageSender 
    if (user1.toString() !== user2.toString() && user0.toString() === '') return true;

    // First Message => When CurrentMessageSender == NextMessageSender
    if (user1.toString() === user2.toString() && user0.toString() === '') return true;



    // Middle Message (1-2-1) => When CurrentMessageSender != NextMessageSender >> and PrevMessageSender == NextMessageSender
    if (user1.toString() !== user2.toString() && user0.toString() !== '' && user2.toString() !== '' && user0.toString() === user2.toString()) return true;

    // Middle Message (1-1-2) =>  When CurrentMessageSender != NextMessageSender >> and PrevMessageSender != NextMessageSender
    if (user1.toString() !== user2.toString() && user0.toString() !== '' && user2.toString() !== '' && user0.toString() !== user2.toString()) return false;

    // Middle Message (2-1-1) =>  When CurrentMessageSender == NextMessageSender >> and PrevMessageSender != CurrentMessageSender
    if (user1.toString() === user2.toString() && user0.toString() !== '' && user0.toString() !== user1.toString()) return true;



    // Last Message => When CurrentMessageSender != NextMessageSender >> and PrevMessageSender != CurrentMessageSender
    if (user1.toString() !== user2.toString() && user2.toString() === '' && user0.toString() !== user1.toString()) return true;

    // Last Message => When CurrentMessageSender != NextMessageSender >> and PrevMessageSender == CurrentMessageSender
    if (user1.toString() !== user2.toString() && user2.toString() === '' && user0.toString() === user1.toString()) return false;
}

export const isSameDate = (message0, message1) => {
    return message0?.sent_at?.split('T')[0].toString() === message1.sent_at?.split('T')[0].toString();
}

export function formatMessageDate(dateInput, isLastMessage = false) {
    if (!dateInput) return '';

    const date = new Date(dateInput);
    const now = new Date();

    // 1. Today
    if (!isLastMessage && isToday(date)) {
        return 'Today';
    }

    if (isLastMessage && isToday(date)) {
        return timeTo12Hour(dateInput);
    }

    // 2. Yesterday
    if (isYesterday(date)) {
        return 'Yesterday';
    }

    // Difference in calendar days between now and the date
    const daysAgo = differenceInDays(now, date);

    // 3. Within the last 7 days (e.g., 2 to 7 days ago)
    if (daysAgo >= 1 && daysAgo <= 7) {
        return format(date, 'eeee'); // Returns 'Friday', 'Thursday', etc.
    }

    if (isLastMessage) return format(date, 'MMM d, y');

    // 4. Older than 7 days
    return format(date, 'MMMM d, y');
}

export function formatLastSeenDate(dateInput) {
    if (!dateInput) return '';

    const date = new Date(dateInput);
    const now = new Date();
    const timeIn12Hours = timeTo12Hour(dateInput);

    // 1. Today
    if (isToday(date)) {
        return `Today, ${timeIn12Hours}`;
    }

    // 2. Yesterday
    if (isYesterday(date)) {
        return `Yesterday, ${timeIn12Hours}`;
    }

    // Difference in calendar days between now and the date
    const daysAgo = differenceInDays(now, date);

    // 3. Within the last 7 days (e.g., 2 to 7 days ago)
    if (daysAgo >= 1 && daysAgo <= 7) {
        return `${format(date, 'eeee')}, ${timeIn12Hours}`; // Returns 'Friday', 'Thursday', etc.
    }

    // 4. Older than 7 days
    return `${format(date, 'MMM d, y')}, ${timeIn12Hours}`;
}

export const timeTo12Hour = time => {
    const date = new Date(time);
    // const timeString = new Date(time).toLocaleTimeString('en-US', {
    const timeString = new Intl.DateTimeFormat(navigator.language || 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
        // });
    }).format(date);

    return timeString
}

export const buildPictureUrl = (baseUrl, pictureUrl) => `${baseUrl}/${pictureUrl}`;

export const isCurrentUser = (currentUserId, otherUserId) => {
    if (!currentUserId || !otherUserId) return false;
    return currentUserId.toString() === otherUserId.toString();
};

export const getUserProfile = (userId, profiles) => {
    if (!userId || !profiles || profiles.length === 0) return null;
    return profiles.find(profile => profile.id.toString() === userId.toString());
};

export const isSame = (user1, user2) => {
    if (!user1 || !user2) return false;
    return user1.toString() === user2.toString();
};


const SECRET_KEY = import.meta.env.VITE_REACT_APP_CRYPTO_SECRET_KEY;

// Encrypt plain text to cipher text
export const encryptText = (plainText) => {
    try {
        const cipherText = CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
        return cipherText;
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
};

// Decrypt cipher text back to plain text
export const decryptText = (cipherText) => {
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};