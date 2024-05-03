document.addEventListener('DOMContentLoaded', ()=>{
    (function () {
        'use strict'

        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.querySelectorAll('.needs-validation')

        // Loop over them and prevent submission
        Array.prototype.slice.call(forms)
            .forEach(function (form) {
                form.addEventListener('submit', function (event) {
                    if (!form.checkValidity()) {
                        event.preventDefault()
                        event.stopPropagation()
                    }
                    form.classList.add('was-validated')
                }, false)
            })
    })()
})
//
// function checkUserInput(str) {
//     for (const char of str) {
//         if (!(char >= 'a' && char <= 'z') &&
//             !(char >= 'A' && char <= 'Z') &&
//             !(char >= '0' && char <= '9'))
//             return false;
//     }
//     return true;
// }
//
// function checkUsernameLength(){
//     var username = document.querySelector("#validation01");
//     var helper = document.querySelector("#validationHelper01");
//     let count = username.value.length;
//     var form = document.querySelector("#registrationForm");
//
//     if ((count < 5 || count > 12) || checkUserInput(username.value) === false){
//         if (username.classList.contains("is-valid")) {
//             username.classList.replace("is-valid", "is-invalid");
//             helper.classList.replace("valid-feedback", "invalid-feedback");
//             helper.innerHTML = "Username has to between 5 and 12 characters long and include only letters and digits!";
//             form.addEventListener('submit', function (event) {
//                 event.preventDefault()
//                 event.stopPropagation()
//             })
//         }
//         else {
//             username.classList.add("is-invalid");
//             helper.classList.add("invalid-feedback");
//             helper.innerHTML = "Username has to between 5 and 12 characters long!";
//             form.addEventListener('submit', function (event) {
//                 event.preventDefault()
//                 event.stopPropagation()
//             })
//         }
//     }
//     else {
//         if (username.classList.contains("is-invalid")) {
//             username.classList.replace("is-invalid", "is-valid");
//             helper.classList.replace("invalid-feedback", "valid-feedback");
//             helper.innerHTML = "Looks good!";
//         }
//         else {
//             username.classList.add("is-valid");
//             helper.classList.add("valid-feedback");
//             helper.innerHTML = "Looks good!";
//         }
//     }
// }
//
// function checkMailInput(mail) {
//     let count = 0;
//     for (const char of mail) {
//         if (char === '@')
//             count += 1;
//     }
//     if (count === 1)
//         return true;
//     return false;
// }
//
// function checkEmail() {
//     var email = document.querySelector("#validation02");
//     let count = document.querySelector("#validation02").value.length;
//     let atCount = email.value;
//     if (checkMailInput(atCount) && count >= 3) {
//
//     }
// }