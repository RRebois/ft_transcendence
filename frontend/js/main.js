// https://medium.com/swlh/lets-code-a-client-side-router-for-your-no-framework-spa-19da93105e10
import router from "./router/index.js"
import Route from "./router/Route.js";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@css/style.css'

import homeView from "./views/home.js";
import registerView from "./views/register.js";

const routes = [
    new Route('/home', '/', homeView),
    new Route('/register', '/register', registerView)
];

router(routes);