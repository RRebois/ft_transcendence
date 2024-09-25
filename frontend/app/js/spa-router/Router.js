import {getCsrf, isUserConnected} from "@js/functions/user_auth.js";
import Navbar from "@js/components/Navbar.js";
import {remove_modal_backdrops} from "@js/functions/display.js";

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
		await this.navigate(window.location.pathname + window.location.search);
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
		console.log("IN NAVIGATE");
		console.log("Real current path is: ", window.location.pathname);
		// find all elements with class "modal-backdrop" and remove them
		remove_modal_backdrops();
		const publicRoutes = ['/', '/register', '/reset_password_confirmed', '/set-reset-password'];
		const isUserAuth = await isUserConnected();
		console.log('isUserAuth', isUserAuth);
		const route = this.routes.find(route => this.match(route, path));
		if (!route) {
			this.renderNode.innerHTML = '' +
				'<h1 class="mb-6 play-bold" style="font-size: 6rem">404</h1>' +
				'<img src="/homer.webp" alt="homer simpson disappearing" class="rounded w-1-2 mb-4" />' +
				'<li><a role="button" route="/" class="btn btn-primary btn-lg">Return home</a></li>';
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
			if (window.mySocket && window.mySocket.readyState === WebSocket.OPEN) {
				window.mySocket.close();
				console.log('WebSocket connection closed');
			}
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
			if (route.path === "/purrinha" || route.path === "/pong") {
				console.log("Path is /purrinha or /pong");
				console.log("Destination path is: ", path);
				this.renderNode.innerHTML = route.renderView(path);
			} else {
				console.log("Current path is: ", window.location.pathname);
				if (window.location.pathname === "/pong" && window.myPongSocket && window.myPongSocket.readyState === WebSocket.OPEN) {
					window.myPongSocket.close();
					console.log('Pong websocket connection closed');
				}
				else if (window.location.pathname === "/purrinha" && window.myPurrinhaSocket && window.myPurrinhaSocket.readyState === WebSocket.OPEN) {
					window.myPurrinhaSocket.close();
					console.log('Purrinha websocket connection closed');
				}
				console.log("Destination path is: ", path);
				this.renderNode.innerHTML = this.navbar.render() + route.renderView(path);
			}
			this.navbar.setupEventListeners();
		}
		else {
			this.renderNode.innerHTML = route.renderView(path);
		}
		route.setupEventListeners(path);

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
		return Object.fromEntries(new URLSearchParams(query).entries());
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
