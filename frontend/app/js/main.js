import Route from "./spa-router/Route.js";
import ToastComponent from "./components/Toast.js"

import homeView from "./views/home.js";
import registerView from "./views/register.js";
import matchView from "./views/pong.js";
import dashboardView from './views/dashboard.js';
import friendsView from './views/friends.js';
import resetPWView from './views/reset-pw.js';
import {initializeWebSocket} from "@js/functions/websocket.js";
import profileView from '@views/my-profile.js';
import statsView from './views/stats.js';
import purrinhaView from './views/purrinha.js';
import tournamentView from './views/tournament.js';
import initializeRouter from "@js/spa-router/initializeRouter.js";
import {applyFontSize} from "./functions/display.js";

const routes = [
    new Route('Login', '/', homeView),
    new Route('Register', '/register', registerView),
    new Route('Pong', '/pong', matchView),
    new Route('', '/dashboard', dashboardView),
    new Route('Profile', '/my-profile', profileView),
    new Route('Friends', '/friends', friendsView),
    new Route('Stats', '/stats', statsView, null, 1),
    new Route('Reset password', '/set-reset-password', resetPWView, null, 2),
    new Route('Purrinha', '/purrinha', purrinhaView),
    new Route('Tournois', '/tournament', tournamentView, null, 1),
];

initializeRouter(routes);

document.addEventListener('DOMContentLoaded', initializeWebSocket);

document.addEventListener('DOMContentLoaded', () => {
    new ToastComponent();
});
