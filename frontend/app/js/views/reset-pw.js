import ToastComponent from './../components/Toast.js';
import {getCookie} from "../functions/cookie.js";
import {validatePassword} from "../functions/validator.js";
import {passwordMatching} from "../functions/validator.js";

export default class ResetPw {
    constructor(props) {
        this.props = props;
        this.user = null;
        this.setUser = this.setUser.bind(this);
        this.reset_password = this.reset_password.bind(this);
    }

    setUser = (user) => {
        this.user = user;
    }

    setProps(newProps) {
        this.props = newProps;
    }

    init_reset_form(){
        const currentPath = window.location.pathname;
        console.log("current path: ", currentPath);
        const eachpath = currentPath.split('/');
        if (currentPath.startsWith('/set-reset-password')) {
            console.log("IN RESET PASSWORD ")
            const csrfToken = getCookie("csrftoken");
            fetch(`https://${window.location.hostname}:8443/reset_password_confirmed/` + eachpath[2] +"/" + eachpath[3] + "/" , {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRFToken": csrfToken,
                },
            })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				if (!ok) {
				    sessionStorage.setItem('toastMessage', JSON.stringify({
                        title: 'Error',
                        message: data.message,
                        duration: 5000,
                        type: 'error'
                    }));
                    window.location.href = '/';
                } else {
					console.log("RESET PW FETCH OK")
                    const container = document.getElementById('password-reset-container');
                    if (container) {
                        container.innerHTML = `
                        <div class="w-100 min-h-screen d-flex flex-column justify-content-center align-items-center">
                            <div class="bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card w-50" style="--bs-bg-opacity: .5;">
                                <p class="text-justify play-bold fs-2">Reset password</p>
                                <form id="passwordResetForm">
                                    <div class="row g-3">
                                        <input id="uidb64" type="hidden" name="uidb64" value="${data.uidb64}" />
                                        <input id="token" type="hidden" name="token" value="${data.token}" />
                    
                                        <div class="row g-2">
                                            <div class="form-floating has-validation">
                                                <input type="password" id="password" name="new_password" class="form-control" required />
                                                <label for="new_password">New Password<span class="text-danger">*</span></label>
                                                <ul class="list-unstyled ms-2 form-text">
                                                    <li>
                                                        <i id="minLength" class="bi bi-x text-danger"></i>
                                                        Minimum 8 characters
                                                    </li>
                                                    <li>
                                                        <i id="uppercase" class="bi bi-x text-danger"></i>
                                                        At least one uppercase letter
                                                    </li>
                                                    <li>
                                                        <i id="lowercase" class="bi bi-x text-danger"></i>
                                                        At least one lowercase letter
                                                    </li>
                                                    <li>
                                                        <i id="number" class="bi bi-x text-danger"></i>
                                                        At least one number
                                                    </li>
                                                    <li>
                                                        <i id="symbol" class="bi bi-x text-danger"></i>
                                                        At least one special character (?!@$ %^&*)
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                
                                        <div class="row g-2">
                                            <div class="form-floating has-validation">
                                                <input type="password" id="confirm_password" name="confirm_password" class="form-control" required />
                                                <label for="confirm_password">Confirm New Password<span class="text-danger">*</span></label>
                                                <div class="invalid-feedback">Passwords do not match</div>
                                            </div>
                                        </div>
                                        <button type="submit" class="btn btn-primary">Reset Password</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        `;

                        document.getElementById('password').addEventListener('input', validatePassword);

                        const form = document.getElementById("passwordResetForm");
                        if (form) {
                            form.addEventListener('submit', passwordMatching);
                            form.addEventListener("submit", (event) => {
                                event.preventDefault();
                                const uidb64 = document.getElementById('uidb64').value;
                                const token = document.getElementById('token').value;
                                this.reset_password(uidb64, token)
                            })
                        }
                    }
				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			})
        }
    }

    reset_password(uidb64, token) {
        const newPassword = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm_password").value;
        const csrfToken = getCookie("csrftoken");

        if (!passwordMatching) {
            return;
        }
        fetch(`https://${window.location.hostname}:8443/change_reset_password/${uidb64}/${token}/`, {
            method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": csrfToken
			},
			credentials: "include",
            body: JSON.stringify({new_password: newPassword, confirm_password: confirmPassword})
        })
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ok, data}) => {
            if (!ok) {
                sessionStorage.setItem('toastMessage', JSON.stringify({
                    title: 'Error',
                    message: data.message,
                    duration: 5000,
                    type: 'error'
                }));
            } else {
                sessionStorage.setItem('toastMessage', JSON.stringify({
                    title: 'Success',
                    message: data.message,
                    duration: 5000,
                    type: 'success'
                }));
                window.location.href = "/";
            }
        })
        .catch(error => {
            console.error("Error resetting password: ", error);
            sessionStorage.setItem('toastMessage', JSON.stringify({
                title: 'Error',
                message: "Network error or server is unreachable",
                duration: 5000,
                type: 'error'
            }));
        });
    }

    setupEventListeners() {
        this.init_reset_form();
    }

    render() {
        document.title = 'ft_transcendence | Reset password';
        return `
        <div id="password-reset-container">
        </div>`;
    }
}
