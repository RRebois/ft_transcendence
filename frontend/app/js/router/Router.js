import {isUserConnected} from "@js/functions/user_auth.js";

export default class Router {
    constructor(routes = [], renderNode) {
        this.routes = routes;
        this.renderNode = renderNode;
        this.init()
    }

    async init() {
        await this.getCsrf();
        await this.navigate(location.pathname + location.hash);
    }

    async getCsrf() {
        try {
            await fetch('https://localhost:8443/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include"
            });
        } catch (e) {
            console.error('[Router] getCsrf Error :', e);
        }
    }

    addRoutes(routes) {
        this.routes = [...this.routes, ...routes];
    }

    match(route, requestPath) {
        let paramNames = [];

        let regexPath = route.path.replace(/([:*])(\w+)/g, (full, colon, name) => {
            paramNames.push(name);
            return '([^\/]+)';
        }) + '(?:\/|$)';
        // console.log("regex path: ", regexPath);

        let params = {};
        let routeMatch = requestPath.match(new RegExp(regexPath));
        if (routeMatch !== null) {
            params = routeMatch.slice(1).reduce((params, value, index) => {
                if (params === null) {
                    params = {};
                }
                params[paramNames[index]] = value;
                return params;
            }, null);
        }
        route.setProps(params);
        return routeMatch;
    }

    navigate = async (path) => {
        console.log("navigating to ", path);
        const publicRoutes = ['/', '/register'];
        const isUserAuth = await isUserConnected();
        console.log("isUserAuth: ", isUserAuth);

        const route = this.routes.filter(route => this.match(route, path))[0];
        route.setUser(isUserAuth);
        if (!route) {
            console.log("404 Not Found");
            this.renderNode.innerHTML = '<h1>404 Not Found</h1>';
        } else {
            if (!publicRoutes.includes(path) && !isUserAuth) {
                console.log("401 Unauthorized");
                this.renderNode.innerHTML = '<h1>401 Unauthorized</h1>';
                window.location.href = '/';
            } else if (publicRoutes.includes(path) && isUserAuth) {
                console.log("Route found but unauthorized: ", route);
                window.location.href = '/dashboard';
            } else {
                console.log("Route found and authorized: ", route);
                this.renderNode.innerHTML = route.renderView();
                route.setupEventListeners();
            }
        }
    }
}
