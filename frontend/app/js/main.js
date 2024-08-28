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
import statsView from './views/stats.js';

const routes = [
    new Route('/home', '/', homeView),
    new Route('/register', '/register', registerView),
    new Route('/match', '/match', matchView),
    new Route('/dashboard', '/dashboard', dashboardView),
    new Route('/my-profile', '/my-profile', profileView),
    new Route('/user', '/user', userView),
    new Route('/friends', '/friends', friendsView),
    new Route('/stats', '/stats', statsView),
    new Route('/set-reset-password', '/set-reset-password', resetPWView),
];

initializeRouter(routes);
document.addEventListener('DOMContentLoaded', initializeWebSocket);

document.addEventListener('DOMContentLoaded', () => {
    new ToastComponent();
});

// https://medium.com/swlh/lets-code-a-client-side-router-for-your-no-framework-spa-19da93105e10
