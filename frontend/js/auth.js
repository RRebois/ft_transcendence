export function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

export function login(token) {
    localStorage.setItem('token', token);
}

export function logout() {
    localStorage.removeItem('token');
}
