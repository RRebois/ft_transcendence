document.addEventListener('DOMContentLoaded', () => {
    (function () {
        'use strict'

        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var form = document.querySelector('.needs-validation');
        var inputs = document.querySelectorAll("input");

        // Loop over them and prevent submission
        // Array.prototype.slice.call(forms)
        inputs.forEach(function(input){
            input.addEventListener("blur", function(event){
                if (!input.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                    input.classList.remove("is-valid");
                    input.classList.add("is-invalid");
                }
                else {
                    input.classList.remove("is-invalid");
                    input.classList.add("is-valid");
                }
            })
        })

        if (form != null) {
            form.addEventListener("submit", function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add("was-validated");
            })
        }
    })()
})