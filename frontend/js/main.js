import {Router} from './router';
import {isAuthenticated} from "./auth";

const app = document.getElementById('app');

const router = new Router(app);

router.addRoute('/', () => {
    if (isAuthenticated()) {
        router.navigate('/dashboard');
    } else {
        import('./pages/login.js').then(module => {
            app.innerHTML = module.;
        });
    }
})