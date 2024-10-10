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
    new Route('/home', '/', homeView),
    new Route('/register', '/register', registerView),
    new Route('/pong', '/pong', matchView),
    new Route('/dashboard', '/dashboard', dashboardView),
    new Route('/my-profile', '/my-profile', profileView),
    new Route('/friends', '/friends', friendsView),
    new Route('/stats', '/stats', statsView, null, 1),
    new Route('/set-reset-password', '/set-reset-password', resetPWView, null, 2),
    new Route('/purrinha', '/purrinha', purrinhaView),
    new Route('/tournament', '/tournament', tournamentView, null, 1),
];

initializeRouter(routes);

document.addEventListener('DOMContentLoaded', initializeWebSocket);

document.addEventListener('DOMContentLoaded', () => {
    new ToastComponent();
});
