import {getCookie} from "../functions/cookie.js";

export default class Router {

    /**
     *
     * @param routes Array of routes
     * @param renderNode Where the view will be injected
     */
    constructor(routes = [], renderNode) {
        this.routes = routes;
        this.renderNode = renderNode;
        this.initializeConnexion();
        this.navigate(location.pathname + location.hash);
    }

    initializeConnexion() {
        console.log("CALL /TEST");
        fetch('https://localhost:8443/test', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
        const csrf_token = getCookie('csrftoken');
        console.log('csrf token: ', csrf_token);
        const jwt_token = getCookie('jwt_access');
        console.log('jwt_token');
        const res = fetch('https://localhost:8443/jwt', {
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

    addRoutes(routes) {
        this.routes = [...this.routes, ...routes];
    }

    match(route, requestPath) {
        let paramNames = [];

        let regexPath = route.path.replace(/([:*])(\w+)/g, (full, colon, name) => {
            paramNames.push(name);
            return '([^\/]+)';
        }) + '(?:\/|$)';
        console.log("regex path: ", regexPath);

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

    navigate(path) {
        const route = this.routes.filter(route => this.match(route, path))[0];
        if (!route) {
            this.renderNode.innerHTML = '<h1>404 Not Found</h1>';
        } else {
            this.renderNode.innerHTML = route.renderView();
        }
    }
}