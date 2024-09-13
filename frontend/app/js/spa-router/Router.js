import {getCsrf, isUserConnected} from "@js/functions/user_auth.js";
import Navbar from "@js/components/Navbar.js";

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
		// await this.navigate(window.location.pathname);
		const fullPath = window.location.pathname + window.location.search;
		await this.navigate(fullPath);
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
		// find all elements with class "modal-backdrop" and remove them
		const modalBackdrops = document.getElementsByClassName('modal-backdrop');
		if (modalBackdrops.length > 0) {
			for (let i = 0; i < modalBackdrops.length; i++) {
				modalBackdrops[i].remove();
			}
		}
		const publicRoutes = ['/', '/register', '/reset_password_confirmed', '/set-reset-password'];
		const isUserAuth = await isUserConnected();
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
			window.history.pushState(null, null, '/'); // Redirect to home
			const home = this.routes.find(route => this.match(route, "/"));
			this.renderNode.innerHTML = home.renderView();
			home.setupEventListeners();
			return ;
		} else if (isPublicRoute && isUserAuth) {
			window.history.pushState(null, null, '/dashboard'); // Redirect to dashboard
			const dashboard = this.routes.find(route => this.match(route, "/dashboard"));
			this.navbar.setUser(isUserAuth);
			this.renderNode.innerHTML = this.navbar.render() + dashboard.renderView();
			this.navbar.setupEventListeners();
			dashboard.setupEventListeners();
			return ;
		}

		// If route is valid, render the view
		if (route.user) {
			this.navbar.setUser(route.user);
			if (route.path === "/purrinha") {
				this.renderNode.innerHTML = route.renderView();
			} else {
				this.renderNode.innerHTML = this.navbar.render() + route.renderView();
			}
			this.navbar.setupEventListeners();
		}
		else {
			this.renderNode.innerHTML = route.renderView();
		}
		route.setupEventListeners();

		// Update the browser history
		const currentPath = window.location.pathname + window.location.search;
		if (currentPath === path) {
			window.history.replaceState(null, null, path);
		} else {
			const query = path.split('?')[1];
			path += query ? '?' + query : '';
			window.history.pushState(null, null, path);
		}
	}

	getQueryParams(query) {
		const params = {};
		if (!query)
			return params;
		query.split('&').forEach((param) => {
			const [key, value] = param.split('=');
			params[key] = value;
		});
		return params;
	}

	// Match the route path to the current location path
	match(route, requestPath) {
		const splitPath = requestPath.split('?');
		const pathWithoutQuery = splitPath[0];
		const query = splitPath[1];
		const regexPath = route.path.replace(/([:*])(\w+)/g, (full, colon, name) => {
			return '([^\/]+)';
		}) + '(?:\/|$)';
		let params = {};
		const routeMatch = pathWithoutQuery.match(new RegExp(regexPath));
		if (routeMatch !== null) {
			params = this.getQueryParams(query);
			route.setProps(params);
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
