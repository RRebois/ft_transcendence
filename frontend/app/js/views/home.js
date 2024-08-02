import ToastComponent from "../components/Toast.js";
import {getCookie} from "../functions/cookie.js";
import router from "@js/router/index.js";

export default class Home {
    constructor(props) {
        this.props = props;
        // this.loginUser = this.loginUser.bind(this);
    }

    loginUser(event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-pwd').value;
        const csrfToken = getCookie('csrftoken');
        console.log("CALLING LOGIN USER");
        console.log("CSRF Token: ", csrfToken);
        console.log(username, password);

        fetch('https://localhost:8443/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken // Include CSRF token in request headers if needed
            },
            credentials: 'include',
            body: JSON.stringify({username, password})
        })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
            .then(({ok, data}) => {
                if (!ok) {
                    const toastComponent = new ToastComponent();
                    toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
                } else {
                    console.log('Success:', data);
                    // window.location.href = '/dashboard';
                    // router.navigate('/dashboard');
                    window.location.href = '/dashboard';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                const toastComponent = new ToastComponent();
                toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
            });
    }

    setupEventListeners() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', this.loginUser); // Attach the event listener
        }
    }

    // TODO: check form action link
    render() {
        document.title = 'ft_transcendence | Login';
        // document.addEventListener('DOMContentLoaded', () => {
        //     document.getElementById('login-form').addEventListener('submit', this.loginUser);
        // })

        return `
         <div class="w-100 h-100 d-flex flex-column justify-content-center align-items-center">
            <div class="bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card w-50" style="--bs-bg-opacity: .5;">
            <h1 class="text-justify play-bold fs-1" >ft_transcendence 🏓</h1>
            <form id="login-form">
                <div class="row g-2">
                    <label for="login-username" class="visually-hidden">Username</label>
                    <div class="input-group">
                        <div class="input-group-text">
                            <i class="bi bi-person"></i>
                        </div>
                        <input type="text" name="username" id="login-username" class="form-control" placeholder="username" autofocus required/>
                    </div>
                </div>
                <div class="row g-2">
                    <label for="login-pwd" class="visually-hidden">Password</label>
                    <div class="input-group">
                        <div class="input-group-text">
                            <i class="bi bi-lock"></i>
                        </div>
                        <input type="password" name="password" id="login-pwd" class="form-control" placeholder="••••••••" required/>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Log in</button>
            </form>
            <div class="padForm">
                Don't have an account? <a href="/register">Register here.</a>
            </div>
         </div>
        `;
    }

    style() {
        return (`
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Play:wght@400;700&family=Poppins&display=swap');
                .gap-0-5 {
                  gap: 0.125rem;
                }
                
                .gap-1 {
                  gap: 0.25rem;
                }
                
                .gap-1-5 {
                  gap: 0.375rem;
                }
                
                .gap-2 {
                  gap: 0.5rem;
                }
                
                .gap-3 {
                  gap: 0.75rem;
                }
                
                .gap-4 {
                  gap: 1rem;
                }
            </style>
        `)
    }
}
