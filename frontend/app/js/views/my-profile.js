import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {validatePassword} from "../functions/validator.js";
import {applyFontSize, changeFontSize} from "../functions/display.js";
import {appRouter} from "../spa-router/initializeRouter.js";

export default class MyProfile {
    constructor(props) {
        this.props = props;
        this.user = props?.user;
        this.setUser = this.setUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.handlePersonalInfoSubmit = this.handlePersonalInfoSubmit.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
    }

    setUser(user) {
        this.user = user;
    }

    removeUser() {
        if (this.user) this.user = null;
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
        event.preventDefault();
        const first_name = document.getElementById('first_name').value;
        const last_name = document.getElementById('last_name').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        if (!this.checkPersonalData({first_name, last_name, email, username})) {
            return;
        }
        const updateBtn = document.getElementById("update-btn")
        if (updateBtn)
            updateBtn.disabled = true;
        const csrfToken = getCookie('csrftoken');
        fetch(`https://${window.location.hostname}:8443/edit_data`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({first_name, last_name, email, username})
        })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
            .then(({ok, data}) => {
                if (!ok) {
                    const toastComponent = new ToastComponent();
                    toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
                    updateBtn.disabled = false;
                } else {
                    updateBtn.disabled = false;
                    appRouter.navigate('/my-profile');
                }
            })
            .catch(error => {
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
        fetch(`https://${window.location.hostname}:8443/2FA`, {
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
                    if (data?.qrcode_url) {
                        const qrcode_div = document.getElementById('qrcode_div');
                        const qrcode_label = document.createElement('p');
                        qrcode_label.innerText = 'Please scan the qrcode below into your authentication application. You also have received a mail with the qrcode attached.';
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
                }
            })
            .catch(error => {
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
        fetch(`https://${window.location.hostname}:8443/change_password`, {
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
                const toastComponent = new ToastComponent();
                toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
                pwBtn.disabled = false;
            })
    }

    render() {
        return `
			<div class="d-flex w-full h-full flex-grow-1 justify-content-center align-items-center">
				<div class="h-full w-full d-flex flex-column justify-content-center align-items-center px-5" style="gap: 16px;">
					<div class="bg-white w-50 h-3-4 d-flex g-4 flex-column align-items-center py-2 px-5 rounded login-card my-5" style="--bs-bg-opacity: .5;">
						<p class="text-justify play-bold title">${this.user?.username} profile</p>
						<form id="personal-data-form">
							<p class="play-bold subtitle">Your personal information</p>
							<div class="row g-3">
								<div class="row g-2">
									<div class="form-floating has-validation">
									<input type="text" id="first_name" class="form-control" value="${this.user?.first_name}" required ${this.user?.stud42 ? 'disabled' : ''}/>
									<label for="first_name">Firstname<span class="text-danger">*</span></label>
									<div class="invalid-feedback clue-text">Firstname have an invalid format</div>
									</div>
								</div>
								<div class="row g-2">
									<div class="form-floating has-validation">
                                        <input type="text" id="last_name" class="form-control" value="${this.user?.last_name}" required ${this.user?.stud42 ? 'disabled' : ''}/>
                                        <label for="last_name">Lastname<span class="text-danger">*</span></label>
                                        <div class="invalid-feedback clue-text">Lastname have an invalid format</div>
                                    </div>
								</div>
								<div class="row g-2">
									<div class="form-floating has-validation">
										<input type="email" id="email" class="form-control" value="${this.user?.email}" ${this.user?.stud42 ? 'disabled' : ''} />
										<label for="email">Email<span class="text-danger">*</span></label>
									    <div class="invalid-feedback clue-text">Invalid email</div>
								    </div>
								</div>
								
								<div class="row g-2">
									<div class="form-floating has-validation">
										<input type="text" id="username" class="form-control" value="${this.user?.username}" required ${this.user?.stud42 ? 'disabled' : ''}/>
										<label for="username">Username<span class="text-danger">*</span></label>
										<div class="form-text">Username has to be 5 to 12 characters long and composed only by letters, digits and hyphens (- or _)</div>
										<div class="invalid-feedback clue-text">Username have an invalid format</div>
									</div>
								</div>
								<div class="d-flex">
									<button type="submit" id="update-btn" class="btn btn-primary">Save</button>
								</div>
							</div>
						</form>
						
						<!-- Custom font choice -->
						<div class="w-100 mt-5">
							<p class="play-bold subtitle">Accessibility</p>
							<div class="btn-group" role="group" aria-label="Website font size">
								<input type="radio" class="btn-check" name="font-size" value="sm" id="font-size-sm" autocomplete="off">
								<label class="btn btn-outline-primary" for="font-size-sm">sm</label>
								<input type="radio" class="btn-check" name="font-size" value="md" id="font-size-md" autocomplete="off">
								<label class="btn btn-outline-primary" for="font-size-md">md</label>
								<input type="radio" class="btn-check" name="font-size" value="lg" id="font-size-lg" autocomplete="off">
								<label class="btn btn-outline-primary" for="font-size-lg">lg</label>
							</div>
						</div>
						
						${!this.user?.stud42 ? `
							<div class="w-100 mt-5">
                                <p class="play-bold subtitle">Account security</p>
                                <form id="2fa-form">
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" role="switch" id="2fa-enable" ${this.user?.tfa_activated === true ? "checked" : ""}>
                                        <label class="form-check-label" for="2fa-enable" id="2fa-enable-label">${this.user?.tfa_activated === true ? "2FA is enabled 🔒" : "2FA is disabled 🔓"}</label>
                                    </div>
                                    <div id="qrcode_div" class="d-flex flex-column align-items-center"></div>
                                </form>
                            </div>
						
						    <div class="w-100 mt-5 mb-2">
                                <form id="password-form">
                                    <p class="play-bold subtitle">Change your password</p>
                                    <div class="row g-3">
                                        <div class="row g-2">
                                            <div class="form-floating has-validation">
                                                <input type="password" id="old-password" class="form-control" required />
                                                <label for="old-password">Old password<span class="text-danger">*</span></label>
                                                <div class="invalid-feedback clue-text">Invalid password</div>
                                            </div>
                                        </div>
                                        <div class="row g-2">
                                            <div class="form-floating has-validation">
                                                <input type="password" id="password" class="form-control" required />
                                                <label for="password">New password<span class="text-danger">*</span></label>
                                                <ul class="list-unstyled ms-2 form-text clue-text">
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
                                                <div class="invalid-feedback clue-text">Passwords do not match</div>
                                            </div>
                                        </div>
                                        <div class="d-flex">
                                            <button type="submit" id="pw-submit" class="btn btn-primary">Change password</button>
                                        </div>
                                    </div>
                                </form>
							</div>
						` : ''}
						
						${this.user?.stud42 ? `
							<div class="w-100 mt-5 mb-2">
                                <p class="play-bold subtitle">Account security</p>
                                <span class="play-regular">For 42 users security concerns, check that directly on your 42 intra.</span>
                            </div>
						` : ''}
					</div>
				</div>
			</div>
		`
    }

    setupEventListeners() {
        applyFontSize();
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
        const newPassword = document.getElementById('password');
        if (newPassword) {
            newPassword.addEventListener('input', validatePassword);
        }
        const savedFontSize = localStorage.getItem('fontSize') || 'md';
        document.querySelector(`input[name="font-size"][value="${savedFontSize}"]`).checked = true;
        document.querySelectorAll('input[name="font-size"]').forEach((radio) => {
            radio.addEventListener('change', function () {
                if (this.checked) {
                    const selectedSize = this.value;
                    changeFontSize(selectedSize);
                }
            });
        });
    }
}
