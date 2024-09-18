import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {validatePassword} from "../functions/validator.js";

export default class MyProfile {
	constructor(props) {
		this.props = props;
		this.user = props?.user;
		this.setUser = this.setUser.bind(this);
		this.handlePersonalInfoSubmit = this.handlePersonalInfoSubmit.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
	}

	setUser(user) {
		this.user = user;
	}

	setProps(newProps) {
		this.props = newProps;
	}

	checkPersonalData = (data) => {
		const nameRegex = new RegExp("^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ\\-]+$");
		const usernameRegex = new RegExp("^[a-zA-Z0-9-_]{5,12}$");
		const emailRegex = new RegExp("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$");
		let isValid = true;

		// Firstname check
		if (!nameRegex.test(data.first_name)) {
			document.getElementById('first_name').classList.add('is-invalid');
			isValid = false;
		} else {
			document.getElementById('first_name').classList.remove('is-invalid');
		}
		// Lastname check
		if (!nameRegex.test(data.last_name)) {
			document.getElementById('last_name').classList.add('is-invalid');
			isValid = false;
		} else {
			document.getElementById('last_name').classList.remove('is-invalid');
		}
		// Email check
		if (!emailRegex.test(data.email)) {
			document.getElementById('email').classList.add('is-invalid');
			isValid = false;
		} else {
			document.getElementById('email').classList.remove('is-invalid');
		}
		// Username check
		if (!usernameRegex.test(data.username)) {
			document.getElementById('username').classList.add('is-invalid');
			isValid = false;
		} else {
			document.getElementById('username').classList.remove('is-invalid');
		}
		if (!data.language || data.language === "") {
			document.getElementById('language').classList.add('is-invalid');
			isValid = false;
		}
		return isValid;
	}

	checkPasswordChange = (data) => {
		const passwordRegex = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@$ %^&*]).{8,}$");
		let isValid = true;

		if (!passwordRegex.test(data.password)) {
			document.getElementById('password').classList.add('is-invalid');
			isValid = false;
		} else {
			document.getElementById('password').classList.remove('is-invalid');
		}
		if (data.password !== data.confirm_password) {
			document.getElementById('confirm_password').classList.add('is-invalid');
			isValid = false;
		} else {
			document.getElementById('confirm_password').classList.remove('is-invalid');
		}
		return isValid;
	}

	handlePersonalInfoSubmit = (event) => {
		console.log('Personal info submit');
		event.preventDefault();
		const first_name = document.getElementById('first_name').value;
		const last_name = document.getElementById('last_name').value;
		const email = document.getElementById('email').value;
		const username = document.getElementById('username').value;
		const language = document.getElementById('language').value;
		console.log(first_name, last_name, email, username, language);
		if (!this.checkPersonalData({first_name, last_name, email, username, language})) {
			console.log("error in personal data");
			return;
		}
		const updateBtn = document.getElementById("update-btn")
		if (updateBtn)
			updateBtn.disabled = true;
		const csrfToken = getCookie('csrftoken');
		fetch('https://localhost:8443/edit_data', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include',
			body: JSON.stringify({first_name, last_name, email, username, language})
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				if (!ok) {
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
					updateBtn.disabled = false;
				} else {
					console.log('Success:', data);
					sessionStorage.setItem('toastMessage', JSON.stringify({
						title: 'Success',
						message: 'Your personal information has been updated',
						duration: 5000,
						type: 'success'
            		}));
					updateBtn.disabled = false;
					window.location.href = '/my-profile';
				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
				updateBtn.disabled = false;
			});
	}

	handleOtpSwitch = (event) => {
		event.preventDefault();
		const csrfToken = getCookie('csrftoken');
		const otp_enable = document.getElementById('2fa-enable').checked;
		const otp_switch_label = document.getElementById('2fa-enable-label');
		if (otp_enable) {
			otp_switch_label.innerText = '2FA is enabled 🔒';
		} else {
			otp_switch_label.innerText = '2FA is disabled 🔓';
		}
		fetch('https://localhost:8443/2FA', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include',
			body: JSON.stringify({'value': otp_enable})
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				if (!ok) {
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
				} else {
					console.log('Success:', data);
					if (data?.qrcode_url) {
						const qrcode_div = document.getElementById('qrcode_div');
						const qrcode_label = document.createElement('p');
						qrcode_label.innerText = 'Please scan the qrcode below into your authentication application.';
						const qrcode_img = document.createElement('img');
						qrcode_img.src = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(data.qrcode_url) + "&size=128x128";
						qrcode_img.classList.add('w-128', 'h-128');
						qrcode_img.alt = '2FA qrcode';
						qrcode_img.id = 'qrcode_img';
						qrcode_div.append(qrcode_label);
						qrcode_div.append(qrcode_img);
					} else {
						const qrcode_div = document.getElementById('qrcode_div');
						while (qrcode_div.firstChild) {
							qrcode_div.removeChild(qrcode_div.firstChild);
						}
					}
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Success', data.message, 10000, 'success');
				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			});
	}

	handlePasswordChange = (event) => {
		event.preventDefault();
		const old_password = document.getElementById('old-password').value;
		const password = document.getElementById('password').value;
		const confirm_password = document.getElementById('confirm_password').value;

		if (!this.checkPasswordChange({password, confirm_password})) {
			return;
		}
		const pwBtn = document.getElementById("pw-submit");
		if (pwBtn)
			pwBtn.disabled = true;
		fetch("https://localhost:8443/change_password", {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken')
			},
			credentials: 'include',
			body: JSON.stringify({
				'old_password': old_password,
				'new_password': password,
				'confirm_password': confirm_password
			})
		})
		.then(response => response.json().then(data => ({ok: response.ok, data})))
		.then(({ok, data}) => {
			if (!ok) {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
				pwBtn.disabled = false;
			} else {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Success', data.message, 5000, 'success');
				pwBtn.disabled = false;
			}
		})
		.catch(error => {
			console.error('Error:', error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			pwBtn.disabled = false;
		})
	}

	handleDeleteAccount = (event) => {
		event.preventDefault();
		const csrfToken = getCookie('csrftoken');
		const password = document.getElementById('delete-account-password')?.value;

		// if (!password) {
		// 	document.getElementById('delete-account-password').classList.add('is-invalid');
		// 	return;
		// }
		const deleteBtn = document.getElementById("delete-account-btn")
		if (deleteBtn)
			deleteBtn.disabled = true;
		fetch("https://localhost:8443/delete_account", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include',
			body: JSON.stringify({'password': password})
		})
		.then(response => response.json().then(data => ({ok: response.ok, data})))
		.then(({ok, data}) => {
			if (!ok) {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
				if (data.message === "Password is incorrect") {
					document.getElementById('delete-account-password').classList.add('is-invalid');
				}
				deleteBtn.disabled = false;
			} else {
				location.href = '/';
			}
		})
		.catch(error => {
			console.error('Error:', error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			deleteBtn.disabled = false;
		})
	}

	render() {
		console.log('Rendering my profile');
		console.log('user in render: ', this.user);
		return `
			<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
				<div class="h-full w-full d-flex flex-column justify-content-center align-items-center px-5" style="gap: 16px;">
					<div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-5 rounded login-card w-50" style="--bs-bg-opacity: .5;">
						<p class="text-justify play-bold fs-2">${this.user?.username} profile</p>
						<form id="personal-data-form">
							<p class="play-bold fs-5">Your personal information</p>
							<div class="row g-3">
								<div class="row g-2">
									<div class="form-floating has-validation">
									<input type="text" id="first_name" class="form-control" value="${this.user?.first_name}" required />
									<label for="first_name">Firstname<span class="text-danger">*</span></label>
									<div class="invalid-feedback">Firstname have an invalid format</div>
									</div>
								</div>
								<div class="row g-2">
									<div class="form-floating has-validation">
									<input type="text" id="last_name" class="form-control" value="${this.user?.last_name}" required />
									<label for="last_name">Lastname<span class="text-danger">*</span></label>
									<div class="invalid-feedback">Lastname have an invalid format</div>
									</div>
								</div>
								<div class="row g-2">
									<div class="form-floating has-validation">
										<input type="email" id="email" class="form-control" value="${this.user?.email}" ${this.user?.stud42 ? 'disabled' : ''} />
										<label for="email">Email<span class="text-danger">*</span></label>
									<div class="invalid-feedback">Invalid email</div>
								</div>
								<div class="row g-2">
									<div class="form-floating has-validation">
										<input type="text" id="username" class="form-control" value="${this.user?.username}" required />
										<label for="username">Username<span class="text-danger">*</span></label>
										<div class="form-text">Username has to be 5 to 12 characters long and composed only by letters, digits and hyphens (- or _)</div>
										<div class="invalid-feedback">Username have an invalid format</div>
									</div>
								</div>
								<div class="row g-2">
									<div class="form-floating has-validation">
										<select id="language" class="form-select" aria-label="Language">
											<option value="🇬🇧 English" ${this.user?.language === "🇬🇧 English" ? "selected" : ""}>🇬🇧 English</option>
											<option value="🇫🇷 French" ${this.user?.language === "🇫🇷 French" ? "selected" : ""}>🇫🇷 French</option>
											<option value="🇪🇸 Spanish" ${this.user?.language === "🇪🇸 Spanish" ? "selected" : ""}>🇪🇸 Spanish</option>
											<option value="🇵🇹 Portuguese" ${this.user?.language === "🇵🇹 Portuguese" ? "selected" : ""}>🇵🇹 Portuguese</option>
										</select>
										<label for="language">Language <span class="text-danger">*</span></label>
										<div class="invalid-feedback">Please, select a language</div>
									</div>
								</div>
								<div class="d-flex">
									<button type="submit" id="update-btn" class="btn btn-primary">Save</button>
								</div>
							</div>
						</form>
						${!this.user?.stud42 ? `
							<hr class="hr" />
							<p class="play-bold fs-5">Account security</p>
							<form id="2fa-form">
								<div class="form-check form-switch">
									<input class="form-check-input" type="checkbox" role="switch" id="2fa-enable" ${this.user?.tfa_activated === true ? "checked" : ""}>
									<label class="form-check-label" for="2fa-enable" id="2fa-enable-label">${this.user?.tfa_activated === true ? "2FA is enable 🔒" : "2FA is disable 🔓"}</label>
								</div>
								<div id="qrcode_div" class="d-flex flex-column align-items-center"></div>
							</form>
						
							<form id="password-form">
								<p class="play-bold fs-5">Change your password</p>
								<div class="row g-3">
									<div class="row g-2">
										<div class="form-floating has-validation">
											<input type="password" id="old-password" class="form-control" required />
											<label for="old-password">Old password<span class="text-danger">*</span></label>
											<div class="invalid-feedback">Invalid password</div>
										</div>
									</div>
									<div class="row g-2">
										<div class="form-floating has-validation">
											<input type="password" id="password" class="form-control" required />
											<label for="password">New password<span class="text-danger">*</span></label>
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
											<input type="password" id="confirm_password" class="form-control" required />
											<label for="confirm_password">Confirm new password<span class="text-danger">*</span></label>
											<div class="invalid-feedback">Passwords do not match</div>
										</div>
									</div>
									<div class="d-flex">
										<button type="submit" id="pw-submit" class="btn btn-primary">Change password</button>
									</div>
								</div>
							</form>
						` : ''}
	
						<div class="border border-1 py-3 px-2 rounded-2 border-danger">
							<p class="play-bold fs-5 text-danger">Danger zone</p>
							<button type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#deleteAccountModal">
								Delete my account
							</button>
							<div class="modal fade" id="deleteAccountModal" tabindex="-1" aria-labelledby="deleteAccountModal" aria-hidden="true">
								<div class="modal-dialog">
									<div class="modal-content">
										<div class="modal-header">
											<h1 class="modal-title fs-5" id="deleteAccountModalLabel">Delete your account</h1>
											<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
										</div>
										<div class="modal-body">
											<p>You are about to delete your account. This step is irreversible. Are you really sure?</p>
											${this.user?.stud42 ? ``: `
												<div class="form-floating has-validation">
													<input type="password" id="delete-account-password" class="form-control" />
													<label for="delete-account-password">Account password<span class="text-danger">*</span></label>
													<div class="invalid-feedback">Invalid password</div>
												</div>
											`}										
										</div>
										<div class="modal-footer">
											<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
											<button type="button" id="delete-account-btn" class="btn btn-danger">Delete my account</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`
	}

	setupEventListeners() {
		const personalDataForm = document.getElementById('personal-data-form');
		if (personalDataForm) {
			personalDataForm.addEventListener('submit', this.handlePersonalInfoSubmit);
		}
		const otp_switch = document.getElementById('2fa-enable');
		if (otp_switch) {
			otp_switch.addEventListener('change', this.handleOtpSwitch);
		}
		const passwordForm = document.getElementById('password-form');
		if (passwordForm) {
			passwordForm.addEventListener('submit', this.handlePasswordChange);
		}
		const deleteAccountBtn = document.getElementById('delete-account-btn');
		if (deleteAccountBtn) {
			deleteAccountBtn.addEventListener('click', this.handleDeleteAccount);
		}
		const newPassword = document.getElementById('password');
		if (newPassword) {
			newPassword.addEventListener('input', validatePassword);
		}
	}
}
