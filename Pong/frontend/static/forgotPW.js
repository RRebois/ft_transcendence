document.addEventListener('DOMContentLoaded', ()=>{
    const   alz = document.getElementById('Alzheimer');
    if (alz != null)
        alz.addEventListener('click', reset_password);

    const   formForgotPW = document.getElementById('formForgotPW');
    const   btnForgotPW = document.getElementById('submitForgotPW');

    if (btnForgotPW != null) {
        btnForgotPW.addEventListener('click', () => {
            formForgotPW.submit();
            formForgotPW.id = "loginForm";
        });
    }
})

function reset_password() {
    var parent = document.getElementById("divLoginForm");
    var parentForm = document.getElementById("loginForm");

    parentForm.id = "formForgotPW";
    parentForm.action = "/reset_password";
    parent.querySelectorAll('div').forEach(child => child.remove());
    parent.querySelectorAll('button').forEach(child => child.remove());

    // Create new elements
    var newDiv1 = document.createElement('div');
    var newDiv2 = document.createElement('div');
    var newLabel = document.createElement('label');
    var newDiv3 = document.createElement('div');
    var newDiv4 = document.createElement('div');
    var newInput = document.createElement('input');

    // Assign new div content + classes + add them to main div
    newDiv1.innerHTML = "Enter your email address, a password reset link will be sent to you."
    parentForm.append(newDiv1);

    newDiv2.classList.add("w-100");
    newLabel.classList.add("visually-hidden");
    newLabel.innerHTML = "Email";
    newLabel.setAttribute("for", "email");
    newDiv2.append(newLabel);

    newDiv4.classList.add("input-group-text");
    newDiv4.innerHTML = "<i class='bi bi-person'></i>";
    newDiv3.classList.add("input-group");

    newInput.classList.add("form-control");
    newInput.setAttribute("type", "email");
    newInput.setAttribute("name", "email");
    newInput.setAttribute("id", "email");
    newInput.setAttribute("placeholder", "Enter your email");
    newInput.autofocus = true;
    newInput.required = true;

    newDiv3.append(newDiv4);
    newDiv3.append(newInput);
    newDiv2.append(newDiv3);
    parentForm.append(newDiv2);

    var newBut = document.createElement('button');
    newBut.setAttribute('class', "btn btn-primary");
    newBut.setAttribute('type', "submit");
    newBut.setAttribute('id', 'submitForgotPW');
    newBut.textContent = "Send";
    parentForm.append(newBut);

    event.preventDefault();
}



//        <button type="submit" class="btn btn-primary">Send</button>
//        {% if login_error %}
//        <div class="alert alert-danger" role="alert">
//            {{ login_error }}
//        </div>
//        {% endif %}
//    </form>
//</div>
