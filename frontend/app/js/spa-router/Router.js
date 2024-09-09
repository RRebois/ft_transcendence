import {getCsrf, isUserConnected} from "@js/functions/user_auth.js";
import Navbar from "@js/components/Navbar.js";
import Route from "@js/spa-router/Route.js";

export default class Router {
	constructor(routes = [], renderNode) {
		this.routes = routes;
		this.renderNode = renderNode;
		this.navbar = new Navbar();
		this.init();
	}

	async init() {
		this.addEventListeners();
		await getCsrf();
		await this.navigate(window.location.pathname);
	}

	addEventListeners() {
		document.addEventListener('click', (e) => {
			const target = e.target.closest('[route]');
			if (target) {
				e.preventDefault();
				const path = target.getAttribute('route');
				this.navigate(path);
			}
		});

		window.addEventListener('popstate', (e) => {
			this.navigate(window.location.pathname, false);
		});
	}

	async navigate(path, pushState = true) {
		const publicRoutes = ['/', '/register', '/reset_password_confirmed', '/set-reset-password'];
		const isUserAuth = await isUserConnected();
		console.log('isUserAuth', isUserAuth);
		const route = this.routes.find(route => this.match(route, path));
		if (!route) {
			this.renderNode.innerHTML = '<h1>404 Not Found</h1>';
			return;
		}
		if (isUserAuth) {
			route.setUser(isUserAuth);
		}
		const isPublicRoute = this.isPublicRoute(publicRoutes, path);
		if (!isPublicRoute && !isUserAuth) {
			console.log("[ROUTER] redirect to /");
			window.history.pushState(null, null, '/'); // Redirect to home
			const home = this.routes.find(route => this.match(route, "/"));
			this.renderNode.innerHTML = home.renderView();
			home.setupEventListeners();
			return ;
		} else if (isPublicRoute && isUserAuth) {
			console.log("[ROUTER] redirect to /dashboard");
			window.history.pushState(null, null, '/dashboard'); // Redirect to dashboard
			const dashboard = this.routes.find(route => this.match(route, "/dashboard"));
			this.renderNode.innerHTML = dashboard.renderView();
			dashboard.setupEventListeners();
			return ;
		}

		// If route is valid, render the view
		if (route.user) {
			this.navbar.setUser(route.user);
			this.renderNode.innerHTML = this.navbar.render() + route.renderView();
			this.navbar.setupEventListeners();
		}
		else {
			this.renderNode.innerHTML = route.renderView();
		}
		route.setupEventListeners();

		// Update the browser history
		if (pushState) {
			window.history.pushState(null, null, path);
		}
	}

	// Match the route path to the current location path
	match(route, requestPath) {
		console.log("comparing ", route.path, " with ", requestPath);
		const paramNames = [];
		const [pathWithoutQuery] = requestPath.split('?'); // Ignore query parameters
		const regexPath = route.path.replace(/([:*])(\w+)/g, (full, colon, name) => {
			paramNames.push(name);
			return '([^\/]+)';
		}) + '(?:\/|$)';

		console.log("regexPath", regexPath);

		const params = {};
		const routeMatch = pathWithoutQuery.match(new RegExp(regexPath));
		console.log('routeMatch', routeMatch);
		if (routeMatch !== null) {
			routeMatch.slice(1).forEach((value, index) => {
				params[paramNames[index]] = value;
			});
			route.setProps(params);
			console.log("returning true");
			return true;
		}
		return false;
	}

	isPublicRoute(publicRoutes, path) {
		for (const route of publicRoutes) {
			const regexPath = route.replace(/([:*])(\w+)/g, (full, colon, name) => {
				return '([^\/]+)';
			}) + '(?:\/|$)';

			const routeMatch = path.match(new RegExp(regexPath));
			if (routeMatch !== null) {
				return true;
			}
		}
		return false;
	}
}

// https://localhost:4242/set-reset-password/Mw/ccxy73-1ae1e4b34d24b15f4fbc9fa8c3f1fc60
