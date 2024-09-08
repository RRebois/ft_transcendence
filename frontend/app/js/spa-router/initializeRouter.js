import Router from "./Router.js";

let appRouter;

export default function initializeRouter(routes) {
	appRouter = new Router(routes, document.getElementById('app'));

	// Intercept clicks on all elements with the 'route' attribute
	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('[route]').forEach(routeElement => {
			routeElement.addEventListener('click', (e) => {
				e.preventDefault();
				const route = e.target.getAttribute('route');
				appRouter.navigate(route);
			});
		});
	});
}

export { appRouter };
