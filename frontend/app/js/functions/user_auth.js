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
                if (data.isAuthenticated) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resolve(false); // Resolve false in case of an error
            });
    });
}