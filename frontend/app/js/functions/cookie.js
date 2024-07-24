export function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


export async function is_user_auth() {
    const csrf_token = getCookie('csrftoken');
    const jwt_token = getCookie('jwt_access');
    const res = await fetch('https://localhost:8443/jwt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf_token,
            'Authorization': `Bearer ${jwt_token}`,
        },
        credentials: 'include',
    });
    console.log("jwt auth res : ", res);
}