import ToastComponent from './../components/Toast.js';
import {getCookie} from "../functions/cookie.js";
import {validatePassword} from "../functions/validator.js";
import {applyFontSize} from "../functions/display.js";
import {appRouter} from "../spa-router/initializeRouter.js";

export default class Register {
    constructor(props) {
        this.props = props;
        this.user = null;
        this.setUser = this.setUser.bind(this);
        this.registerUser = this.registerUser.bind(this);
    }

    setUser = (user) => {
        this.user = user;
    }

    setProps(newProps) {
        this.props = newProps;
    }

    validateInputs(firstname, lastname, username, email, password, confirm_password) {
        const nameRegex = new RegExp("^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ\\-]+$");
        const usernameRegex = new RegExp("^[a-zA-Z0-9-_]{5,12}$");
        const passwordRegex = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@$ %^&*]).{8,}$");
        const emailRegex = new RegExp("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$");
        let isValid = true;

        // Firstname validation
        if (!nameRegex.test(firstname)) {
            document.getElementById('first_name').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('first_name').classList.remove('is-invalid');
        }

        // Lastname validation
        if (!nameRegex.test(lastname)) {
            document.getElementById('last_name').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('last_name').classList.remove('is-invalid');
        }

        // Username validation
        if (!usernameRegex.test(username)) {
            document.getElementById('username').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('username').classList.remove('is-invalid');
        }

        // Email validation
        if (!emailRegex.test(email)) {
            document.getElementById('email').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('email').classList.remove('is-invalid');
        }

        // Password validation
        if (!passwordRegex.test(password)) {
            document.getElementById('password').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('password').classList.remove('is-invalid');
        }

        // Confirm password validation
        if (password !== confirm_password) {
            document.getElementById('password2').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('password2').classList.remove('is-invalid');
        }
        console.log("isValid: ", isValid);
        return isValid;
    }

    registerUser(event) {
        event.preventDefault();
        const firstname = document.getElementById('first_name').value;
        const lastname = document.getElementById('last_name').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const password2 = document.getElementById('password2').value;
        const profilePicture = document.getElementById('profile-picture').files[0];

        const formData = new FormData();
        formData.append('first_name', firstname);
        formData.append('last_name', lastname);
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('password2', password2);
        formData.append('imageFile', profilePicture);

        console.log(firstname, lastname, username, email, password, password2, profilePicture);
        if (!this.validateInputs(firstname, lastname, username, email, password, password2)) {
            return;
        }
        const registerBtn = document.getElementById("register-btn");
        if (registerBtn)
            registerBtn.disabled = true;
        const csrfToken = getCookie('csrftoken');
        console.log("CSRF Token: ", csrfToken);
        fetch(`https://${window.location.hostname}:8443/register`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken // Include CSRF token in request headers if needed
            },
            credentials: 'include',
            body: formData
        })
        .then(response => response.json().then(data => ({ok: response.ok, data})))
        .then(({ok, data}) => {
            console.log("Response: ", data);
            if (!ok) {
                const toastComponent = new ToastComponent();
                toastComponent.throwToast('Error', data || 'Something went wrong', 5000, 'error');
                registerBtn.disabled = false;
            } else {
                registerBtn.disabled = false;
                // window.location.href = '/dashboard';
                appRouter.navigate('/dashboard');
            }
        })
        .catch(error => {
            const toastComponent = new ToastComponent();
            toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
            registerBtn.disabled = false;
        });
    }

     setupEventListeners() {
        document.getElementById('register-form').addEventListener('submit', this.registerUser);
        document.getElementById('password').addEventListener('input', validatePassword);
        applyFontSize();
    }

     render() {
        // document.title = 'ft_transcendence | Register';
        return `
        <div class="w-100 min-h-screen d-flex flex-column justify-content-center align-items-center">
            <div class="bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card w-50" style="--bs-bg-opacity: .5;">
                <p class="text-justify play-bold title">Créer un compte</p>
                <form id="register-form">
                    <div class="row g-3">
                        <div class="row g-2">
                            <!-- Firstname input -->
                            <div class="col-md">
                                <div class="form-floating has-validation">
                                    <input type="text" id="first_name" class="form-control" required />
                                    <label for="first_name">Firstname<span class="text-danger">*</span></label>
                                    <div class="invalid-feedback clue-text">Firstname have an invalid format</div>
                                </div>
                            </div>
                            
                            <!-- Lastname input -->
                            <div class="col-md">
                                <div class="form-floating has-validation">
                                    <input type="text" id="last_name" class="form-control" required />
                                    <label for="last_name">Lastname<span class="text-danger">*</span></label>
                                    <div class="invalid-feedback clue-text">Lastname have an invalid format</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Username input -->
                        <div class="row g-2">
                            <div class="form-floating has-validation">
                                <input type="text" id="username" class="form-control" required />
                                <label for="username">Username<span class="text-danger">*</span></label>
                                <div class="form-text">Username has to be 5 to 12 characters long and composed only by letters, digits and hyphens (- or _)</div>
                                <div class="invalid-feedback clue-text">Username have an invalid format</div>
                            </div>
                        </div>
                        
                        <!-- Email input -->
                        <div class="row g-2">
                            <div class="form-floating has-validation">
                                <input type="email" id="email" class="form-control" required />
                                <label for="email">Email<span class="text-danger">*</span></label>
                                <div class="invalid-feedback clue-text">Invalid email</div>
                            </div>
                        </div>
                        
                        <!-- Password input -->
                        <div class="row g-2">
                            <div class="form-floating has-validation">
                                <input type="password" id="password" class="form-control" required />
                                <label for="password">Password<span class="text-danger">*</span></label>
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
                        
                        <!-- Confirm password input -->
                        <div class="row g-2">
                            <div class="form-floating has-validation">
                                <input type="password" id="password2" class="form-control" required />
                                <label for="password2">Confirm password<span class="text-danger">*</span></label>
                                <div class="invalid-feedback clue-text">Passwords do not match</div>
                            </div>
                        </div>
                        
                        <!-- Profile picture input -->
                        <div class="row g-2">
                            <label for="profile-picture" class="form-label">Profile picture</label>
                            <input type="file" id="profile-picture" accept=".png, .jpg, .jpeg" class="form-control" />
                            <div class="form-text clue-text">Supported format: <code>png</code>, <code>jpg</code> and <code>jpeg</code></div>
                            <div class="invalid-feedback clue-text">test</div>
                        </div>
                        
                        <!-- Submit button -->
                        <button type="submit" id="register-btn" class="btn btn-primary">Create an account</button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }
}
