import {Router} from './router';
import {isAuthenticated} from "./auth";

const app = document.getElementById('app');

const router = new Router(app);

// router.addRoute('/', () => {
//     if (isAuthenticated()) {
//         console.log("user is authenticated");
//         router.navigate('/dashboard');
//     } else {
//         console.log("user is not authenticated");
//         import('./pages/login.js').then(module => {
//             app.innerHTML = module.LoginPage();
//         });
//     }
// })

router.addRoute('/', async () => {
    if (isAuthenticated()) {
        console.log("user is authenticated");
        router.navigate('/dashboard');
    } else {
        console.log("user is not authenticated");
        const module = await import('./pages/login.js');
        app.innerHTML = module.LoginPage();
    }
})

router.init();