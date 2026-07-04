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

export const setMessageUnsetError = (setError, setMessage, response) => {
    setError('');
    setMessage(response.message);
}

export const setErrorUnsetMessage = (setMessage, setError, response) => {
    setMessage('');
    setError(response.message);
}