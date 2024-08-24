export default class ResetPw {
    constructor(props) {
        this.props = props;
    }

    render() {
        return `    
        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
            <form action="{% url 'change_reset_password' uidb64=uidb64 token=token %}" method="post"
                  class="bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card hidden"
                  style="--bs-bg-opacity: .5;" id="passwordResetForm">
                {% csrf_token %}
                <h1 class="text-justify play-bold">ft_transcendence 🏓</h1>
                <div class="w-100">
                    <label for="new_password" class="visually-hidden">New password</label>
                    <div class="input-group">
                        <div class="input-group-text">
                            <i class="bi bi-lock"></i>
                        </div>
                        <input class="form-control" type="password" name="new_password" id="new_password"
                           minlength="8" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,12}" placeholder="New password"
                           required>
                    </div>
                    <span class="helper_txt">Password must be at least 8 characters
                        and contain 1 digit, 1 lowercase, and 1 uppercase.</span>
                    {% if errors.new_password %}
                        <p class="invalidColor">{{ errors.new_password.0 }}</p>
                    {% endif %}
                    <div class="valid-feedback validColor">Looks good!</div>
                    <div class="invalid-feedback invalidColor">Bad input!</div>
                <div class="w-100">
                    <label for="confirm_password" class="visually-hidden">Confirm new password</label>
                    <div class="input-group">
                        <div class="input-group-text">
                            <i class="bi bi-lock"></i>
                        </div>
                        <input type="Password" name="confirm_password" id="confirm_password" class="form-control" placeholder="Confirm new password" autofocus required/>
                    </div>
                    <span class="helper_txt">Must match the new pasword.</span>
                    {% if errors.confirm_password %}
                        <p class="invalidColor">{{ errors.confirm_password.0 }}</p>
                    {% endif %}
                    <div class="valid-feedback validColor">Looks good!</div>
                    <div class="invalid-feedback invalidColor">Bad input!</div>
                </div>
                <button type="submit" class="btn btn-primary">Send</button>
            </form>
        </div>`;
    }
}