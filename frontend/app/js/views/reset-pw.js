import ToastComponent from './../components/Toast.js';
import {getCookie} from "../functions/cookie.js";

export default class ResetPw {
    constructor(props) {
        this.props = props;
        this.reset_password = this.reset_password.bind(this);
    }

    reset_password(uidb64, token) {
        const newPassword = document.getElementById("new_password").value;
        const confirmPassword = document.getElementById("confirm_password").value;
        const csrfToken = getCookie("csrftoken");

        // if (newPassword !== confirmPassword){
        //     alert("Passwords don't match.");
        //     return
        // }
        fetch(`https://localhost:8443/set_reset_password/${uidb64}/${token}`, {
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
                // toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
                sessionStorage.setItem('toastMessage', JSON.stringify({
                    title: 'Error',
                    message: data.message,
                    duration: 5000,
                    type: 'error'
                }));
            } else{
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
        const form = document.getElementById("passwordResetForm");
        if (form) {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                const uidb64 = document.getElementById('uidb64').value;
                const token = document.getElementById('token').value;
                this.reset_password(uidb64, token)
            })
        }
    }

    render() {
        document.title = 'ft_transcendence | Reset password';
        return `
        <div id="password-reset-container">
            IN RESET PASSWORD
        </div>`;
    }
//     render() {
//         document.title = 'ft_transcendence | Reset password';
//         return `
//         <div class="w-100 h-100 d-flex justify-content-center align-items-center">
// <!--            <form action="{% url 'change_reset_password' uidb64=uidb64 token=token %}" method="post"-->
//             <form class="bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card hidden"
//                   style="--bs-bg-opacity: .5;" id="passwordResetForm">
//                 <h1 class="text-justify play-bold">ft_transcendence 🏓</h1>
//                 <div class="w-100">
//                     <label for="new_password" class="visually-hidden">New password</label>
//                     <div class="input-group">
//                         <div class="input-group-text">
//                             <i class="bi bi-lock"></i>
//                         </div>
//                         <input class="form-control" type="password" name="new_password" id="new_password"
//                            minlength="8" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,12}" placeholder="New password"
//                            required>
//                     </div>
//                     <span class="helper_txt">Password must be at least 8 characters
//                         and contain 1 digit, 1 lowercase, and 1 uppercase.</span>
// <!--                    {% if errors.new_password %}-->
// <!--                        <p class="invalidColor">{{ errors.new_password.0 }}</p>-->
// <!--                    {% endif %}-->
// <!--                    <div class="valid-feedback validColor">Looks good!</div>-->
// <!--                    <div class="invalid-feedback invalidColor">Bad input!</div>-->
//                 </div>
//                 <div class="w-100">
//                     <label for="confirm_password" class="visually-hidden">Confirm new password</label>
//                     <div class="input-group">
//                         <div class="input-group-text">
//                             <i class="bi bi-lock"></i>
//                         </div>
//                         <input type="Password" name="confirm_password" id="confirm_password" class="form-control" placeholder="Confirm new password" autofocus required/>
//                     </div>
//                     <span class="helper_txt">Must match the new password.</span>
// <!--                    {% if errors.confirm_password %}-->
// <!--                        <p class="invalidColor">{{ errors.confirm_password.0 }}</p>-->
// <!--                    {% endif %}-->
// <!--                    <div class="valid-feedback validColor">Looks good!</div>-->
// <!--                    <div class="invalid-feedback invalidColor">Bad input!</div>-->
//                 </div>
//                 <button type="submit" class="btn btn-primary">Send</button>
//             </form>
//         </div>`;
//     }
}