export function  validatePassword() {
    console.log("Validating password");
    const password = document.getElementById('password').value;
    const minLength = document.getElementById('minLength');
    const uppercase = document.getElementById('uppercase');
    const lowercase = document.getElementById('lowercase');
    const number = document.getElementById('number');
    const symbol = document.getElementById('symbol');

    if (password.length >= 8) {
        minLength.classList.replace('bi-x', 'bi-check');
        minLength.classList.replace('text-danger', 'text-success');
    } else {
        minLength.classList.replace('bi-check', 'bi-x');
        minLength.classList.replace('text-success', 'text-danger');
    }

    if (/[A-Z]/.test(password)) {
        uppercase.classList.replace('bi-x', 'bi-check');
        uppercase.classList.replace('text-danger', 'text-success');
    } else {
        uppercase.classList.replace('bi-check', 'bi-x');
        uppercase.classList.replace('text-success', 'text-danger');
    }

    if (/[a-z]/.test(password)) {
        lowercase.classList.replace('bi-x', 'bi-check');
        lowercase.classList.replace('text-danger', 'text-success');
    } else {
        lowercase.classList.replace('bi-check', 'bi-x');
        lowercase.classList.replace('text-success', 'text-danger');
    }

    if (/[0-9]/.test(password)) {
        number.classList.replace('bi-x', 'bi-check');
        number.classList.replace('text-danger', 'text-success');
    } else {
        number.classList.replace('bi-check', 'bi-x');
        number.classList.replace('text-success', 'text-danger');
    }

    if (/[?!@$ %^&*]/.test(password)) {
        symbol.classList.replace('bi-x', 'bi-check');
        symbol.classList.replace('text-danger', 'text-success');
    } else {
        symbol.classList.replace('bi-check', 'bi-x');
        symbol.classList.replace('text-success', 'text-danger');
    }

}

export function passwordMatching(){
    console.log("In password Matching")
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    let isValid = true;

    if (password !== confirm_password) {
        document.getElementById('confirm_password').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('confirm_password').classList.remove('is-invalid');
    }
    console.log("isValid is: ", isValid);
    return isValid;
}