export function isAuthenticated() {
    // return localStorage.getItem('token') !== null;
    return false;
}

export function login(token) {
    localStorage.setItem('token', token);
}

export function logout() {
    localStorage.removeItem('token');
}
