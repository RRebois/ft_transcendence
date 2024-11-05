import ToastComponent from "../components/Toast.js";

export function isUserConnected() {
    return new Promise((resolve, reject) => {
        fetch(`https://${window.location.hostname}:8443/check_jwt`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Ensure cookies are sent with the request
        })
            .then(response => response.json())
            .then(data => {
                if (data.user) {
                    resolve(data.user, true);
                } else {
                    resolve(false);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resolve(false);
            });
    });
}

export async function getCsrf() {
    try {
        await fetch(`https://${window.location.hostname}:8443/test`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include"
        });
    } catch (e) {
        console.error('[Router] getCsrf Error :', e);
    }
}
