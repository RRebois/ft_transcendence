console.log("hello from main.js");


import router from "./router/index.js"
import Route from "./router/Route.js";

import homeView from "./views/home.js";
import registerView from "./views/register.js";
import matchView from "./views/match.js";

const routes = [
    new Route('/home', '/', homeView),
    new Route('/register', '/register', registerView),
    new Route('/match', '/match', matchView)
];

router(routes);


// https://medium.com/swlh/lets-code-a-client-side-router-for-your-no-framework-spa-19da93105e10
