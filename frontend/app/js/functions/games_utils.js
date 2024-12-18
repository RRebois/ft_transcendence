import {getCookie} from "./cookie.js";
import * as bootstrap from "bootstrap";

export function checkGameInstance(session_id) {
    const csrfToken = getCookie('csrftoken');
    if (!session_id) {
        return false;
        }
    fetch(`https://${window.location.hostname}:8443/match/${session_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        credentials: 'include'
    })
    .then(response => response.json().then(data => ({ok: response.ok, data})))
    .then(({ok, data}) => {
        if (!ok) {
            const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
            document.getElementById('errorModalBody').innerHTML = `
                <p>This match is not available or already finished. Please try again later.</p>
            `
            errorModal.show();
            return true;
        } else {
            return false;
        }
    })
    .catch(error => {
        const toastComponent = new ToastComponent();
        toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
    });
}