// Function chaining

const login = () => {
    return 'login';
}

const signup = () => {
    return 'signup';
}

export const auth = () => {
    return login;
}


export const auth = () => {
    return signup;
}
