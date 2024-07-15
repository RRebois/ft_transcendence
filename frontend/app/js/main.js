console.log("hello from main.js");


import router from "./router/index.js"
import Route from "./router/Route.js";
import * as bootstrap from 'bootstrap/js/index.esm.js';

import homeView from "./views/home.js";
import registerView from "./views/register.js";
import matchView from "./views/match.js";
import dashboardView from './views/dashboard.js';

const routes = [
    new Route('/home', '/', homeView),
    new Route('/register', '/register', registerView),
    new Route('/match', '/match', matchView),
    new Route('/dashboard', '/dashboard', dashboardView),
];

router(routes);


// https://medium.com/swlh/lets-code-a-client-side-router-for-your-no-framework-spa-19da93105e10
