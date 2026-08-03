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