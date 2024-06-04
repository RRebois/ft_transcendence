export class Router {
    constructor(rootElement) {
        this.routes = {};
        this.rootElement = rootElement;
        window.addEventListener('popstate', this.handlePopState.bind(this));
    }

    addRoute(path, callback) {
        this.routes[path] = callback;
    }

    navigate(path) {
        history.pushState(null, null, path);
        this.handlePopState();
    }

    handlePopState() {
        const path = location.pathname;
        if (this.routes[path]) {
            this.routes[path]();
        } else {
            this.rootElement.innerHTML = '404 Not Found';
        }
    }

    init() {
        this.handlePopState();
    }
}