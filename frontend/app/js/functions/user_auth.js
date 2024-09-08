export function isUserConnected() {
    console.log("isUserConnected called");
    return new Promise((resolve, reject) => {
        fetch('https://localhost:8443/check_jwt', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Ensure cookies are sent with the request
        })
            .then(response => response.json())
            .then(data => {
                console.log("isUserConnected response: ", data);
                if (data.user) {
                    resolve(data.user);
                } else {
                    resolve(null);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resolve(false); // Resolve false in case of an error
            });
    });
}

export async function getCsrf() {
    try {
        await fetch('https://localhost:8443/test', {
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
