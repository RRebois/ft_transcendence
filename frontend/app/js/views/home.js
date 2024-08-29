import ToastComponent from "../components/Toast.js";
import {getCookie} from "../functions/cookie.js";
import {initializeWebSocket} from "../functions/websocket.js";
import * as bootstrap from 'bootstrap'

export default class Home {
	constructor(props) {
		this.props = props;
		this.user_id = null;
		this.loginUser = this.loginUser.bind(this);
		this.checkOtp = this.checkOtp.bind(this);
		this.sendResetLink = this.sendResetLink.bind(this);
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
					if (data?.otp_required) {
						this.user_id = data.user_id;
						const otpModal = new bootstrap.Modal(document.getElementById('otpModal'));
						otpModal.show();
					} else {
                        initializeWebSocket();
						window.location.href = '/dashboard';
					}
				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			});
	}

	fortyTwoLogin() {
		fetch('https://localhost:8443/login42', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include'
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				if (!ok) {
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
					window.location.href = data.redirect_url;
				} else {
                    initializeWebSocket();
					console.log('Success:', data);
					window.location.href = data.redirect_url;
				}
			})
			.catch(error => {
					console.error('Error:', error);
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
				}
			);
	}

	checkOtp() {
		console.log("CALLING CHECK OTP");
		const otp = document.getElementById('otp').value;
		const user_id = this.user_id;
		const csrfToken = getCookie('csrftoken');
		const otpRegex = new RegExp("^[0-9]{6}$");
		console.log("sending otp: ", otp);
		console.log("user_id: ", user_id);

		if (!otp.match(otpRegex)) {
			console.log("Invalid OTP");
			document.getElementById('otp').classList.add('is-invalid');
			return;
		} else {
			console.log("Valid OTP");
			document.getElementById('otp').classList.remove('is-invalid');
		}
		console.log("fetching otp");
		fetch('https://localhost:8443/verifyotp', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include',
			body: JSON.stringify({'otp': otp, 'user_id': user_id})
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				if (!ok) {
					document.getElementById('otp').classList.add('is-invalid');
				} else {
                    initializeWebSocket();
					console.log('Success:', data);
					document.getElementById('otp').classList.remove('is-invalid');
					window.location.href = '/dashboard';
				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			});
	}

	checkEmailFormat(email) {
		const emailRegex = new RegExp("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$");
		let isValid = true;
		if (!emailRegex.test(email)) {
			document.getElementById('email').classList.add('is-invalid');
			isValid = false;
		} else {
			document.getElementById('email').classList.remove('is-invalid');
		}
		return isValid;
	}

	sendResetLink(){
		event.preventDefault();
		const csrfToken = getCookie('csrftoken');
		const email = document.getElementById('email').value;
		const emailFeedback = document.getElementById('email-feedback')
		console.log("Mail entered: '", email, "'");
		if (!this.checkEmailFormat(email)) {
			console.log("Email regex failed");
			emailFeedback.textContent = "Wrong email format";
			return ;
		}
		// TODO: mail regex
		console.log("fetching reset pw");
		fetch('https://localhost:8443/reset_password', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include',
			body: JSON.stringify({'email': email})
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				if (!ok) {
					console.log('Not success:', data);
					document.getElementById('email').classList.add('is-invalid');
					emailFeedback.textContent = data.message;
				} else {
					console.log('Success:', data);
					document.getElementById('email').classList.remove('is-invalid');
					const passwordModal = bootstrap.Modal.getInstance(document.getElementById('forgotPWModal'));
					if (passwordModal){
						passwordModal.hide();
					}
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Success', data.message, 5000, 'success');
				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			});
		console.log("End of reset pw");
	}

	setupEventListeners() {
		const form = document.getElementById('login-form');
		if (form) {
			form.addEventListener('submit', this.loginUser); // Attach the event listener
		}
		const fortyTwoLogin = document.getElementById('42login');
		if (fortyTwoLogin) {
			fortyTwoLogin.addEventListener('click', () => {
				this.fortyTwoLogin();
			});
		}
		const otpSubmit = document.getElementById('otp-submit');
		if (otpSubmit) {
			otpSubmit.addEventListener('click', this.checkOtp);
		}
		const forgotPasswordLink = document.getElementById('forgot-pwd');
		if (forgotPasswordLink) {
			forgotPasswordLink.addEventListener('click', (event) => {
				event.preventDefault(); // Prevent the default link behavior
				const forgotPWModal = new bootstrap.Modal(document.getElementById('forgotPWModal'));
				forgotPWModal.show();
			});
		}
		const forgotPWSubmit = document.getElementById('forgotPW-submit');
		if (forgotPWSubmit) {
			forgotPWSubmit.addEventListener('click', this.sendResetLink);
		}
	}

// TODO: check form action link
	render() {
		document.title = 'ft_transcendence | Login';
		return `
         <div class="w-100 min-h-screen d-flex flex-column justify-content-center align-items-center">
            <div class="bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card" style="--bs-bg-opacity: .5;">
            <h1 class="text-justify play-bold fs-1" >ft_transcendence 🏓</h1>
            <form id="login-form">
                <div class="row g-2 my-2">
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
                    <a href="" class="text-decoration-none indexLink" id="forgot-pwd">Forgot password?</a>
                </div>
                <div class="w-100 d-flex justify-content-center my-2">
                    <button type="submit" class="btn btn-primary">Log in</button>
                </div>
            </form>
            <div class="d-flex flex-row align-items-center w-100 my-2">
                <hr class="flex-grow-1">
                <span class="px-2">or</span>
                <hr class="flex-grow-1">
            </div>
            <button type="button" id="42login" class="btn btn-dark my-2">
                <img height="32" width="32" src="https://cdn.simpleicons.org/42/fff" alt="42 school logo"
                     style="margin-right: 10px"/>
                Sign in with your 42 account
            </button>
            <div class="padForm mt-2">
                Don't have an account? <a href="/register">Register here.</a>
            </div>
            
            <!-- OTP Modal -->
            <div class="modal fade" id="otpModal" tabindex="-1" aria-labelledby="otpModal" aria-hidden="true">
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-header">
							<h1 class="modal-title fs-5" id="otpModalLabel">2FA check 🔒</h1>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							<p>Enter the OTP provided by your authentication application.</p>
							<div class="form-floating has-validation">
                                <input type="text" id="otp" class="form-control" required />
                                <label for="otp">One Time Password<span class="text-danger">*</span></label>
                                <div class="invalid-feedback">OTP is invalid.</div>
                            </div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							<button type="button" id="otp-submit" class="btn btn-primary">Log in</button>
						</div>
					</div>
				</div>
			</div>
			
			<!--Forgot PW modal-->
			<div class="modal fade" id="forgotPWModal" tabindex="-1" aria-labelledby="forgotPWModal" aria-hidden="true">
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-header">
							<h1 class="modal-title fs-5" id="forgotPWModalLabel">Forgotten password</h1>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							<p>Enter your email address, you will receive a link to reset your password.</p>
							<div class="form-floating has-validation">
                                <input type="text" id="email" class="form-control" required />
                                <label for="email">Email address<span class="text-danger">*</span></label>
                                <div id="email-feedback" class="invalid-feedback">.</div>
                            </div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							<button type="button" id="forgotPW-submit" class="btn btn-primary">Send reset link</button>
						</div>
					</div>
				</div>
			</div>
         </div>
        `;
	}
}
