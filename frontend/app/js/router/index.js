import Router from "./Router.js";

export default function initializeRouter(routes) {
    const router = new Router(routes, document.getElementById('app'));

    // Setup click event listeners for all elements with a 'route' attribute
    document.addEventListener('DOMContentLoaded', (e) => {
        document.querySelectorAll('[route]')
            .forEach(routeElement => routeElement.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent the default anchor behavior
                const route = e.target.getAttribute('route');
                try {
                    await router.navigate(route);
                } catch (error) {
                    console.error('Navigation error:', error);
                }
            }, false));
    });

    // Listen for hash changes to enable SPA routing
    window.addEventListener('hashchange', async (e) => {
        e.preventDefault(); // This is more about consistency; default action is typically not prevented for hashchange
        const newPath = e.target.location.hash.substr(1);
        try {
            await router.navigate(newPath);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    });
}
