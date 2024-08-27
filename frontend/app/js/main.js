import initializeRouter from "./router/index.js";
import Route from "./router/Route.js";
import ToastComponent from "./components/Toast.js"

import homeView from "./views/home.js";
import registerView from "./views/register.js";
import matchView from "./views/match.js";
import dashboardView from './views/dashboard.js';
import friendsView from './views/friends.js';
import resetPWView from './views/reset-pw.js';
import { initializeWebSocket } from "@js/functions/websocket.js";
import profileView from '@views/my-profile.js';
import userView from './views/user.js';
import {getCookie} from "./functions/cookie.js";

const routes = [
    new Route('/home', '/', homeView),
    new Route('/register', '/register', registerView),
    new Route('/match', '/match', matchView),
    new Route('/dashboard', '/dashboard', dashboardView),
    new Route('/my-profile', '/my-profile', profileView),
    new Route('/user', '/user', userView),
    new Route('/friends', '/friends', friendsView),
    new Route('/set-reset-password', '/set-reset-password', resetPWView),
];

initializeRouter(routes);
document.addEventListener('DOMContentLoaded', initializeWebSocket);

document.addEventListener('DOMContentLoaded', () => {
    new ToastComponent();
});

document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;

    if (currentPath.startsWith('/set-reset-password')) {
        console.log("IN RESET PASSWORD ")
        const csrfToken = getCookie("csrftoken");
        fetch("https://localhost:8443/reset_confirmed/", {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                "X-CSRFToken": csrfToken,
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Token ok') {
                console.log("RESET PW FETCH OK")
                // If the token is valid, dynamically inject the password reset form into the page
                document.getElementById('password-reset-container').innerHTML = `
                <form id="passwordResetForm">
                    <input type="hidden" name="uidb64" value="${data.uidb64}" />
                    <input type="hidden" name="token" value="${data.token}" />

                    <label for="new_password">New Password</label>
                    <input type="password" id="new_password" name="new_password" required />

                    <label for="confirm_password">Confirm New Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" required />

                    <button type="submit">Reset Password</button>
                </form>
            `;
            } else {
                console.log("RESET PW FETCH NOT OK!!!")
                // Handle invalid or expired token
                document.getElementById('password-reset-container').innerHTML = `<p>${data.message}</p>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            console.log("RESET PW FETCH ERROR!!!")
            console.log("response is: ", data);
            document.getElementById('password-reset-container').innerHTML = `<p>An error occurred. Please try again later.</p>`;
        });
    }
})

// https://medium.com/swlh/lets-code-a-client-side-router-for-your-no-framework-spa-19da93105e10
