export default class Router {

    /**
     *
     * @param routes Array of routes
     * @param renderNode Where the view will be injected
     */
    constructor(routes = [], renderNode) {
        this.routes = routes;
        this.renderNode = renderNode;
        this.navigate(location.pathname + location.hash);
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