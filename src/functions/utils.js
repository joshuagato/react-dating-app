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

export const unsetPasswordFields = (setPassword, setPasswordConfirmation) => {
    setPassword('');
    setPasswordConfirmation('');
}

export const unsetAllErrors = (setError, setErrors) => {
    setError("");
    setErrors({});
}