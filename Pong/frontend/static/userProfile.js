document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', () => {
        const element = event.target;
        if (element.classList.contains("fa-square-caret-down") || element.classList.contains("fa-square-caret-up"))
            display_user_data(element);
    });
})

// a remodifier, mettre les fetchs dans le if square caret down pour pas fetch si on close els onglets
function    display_user_data(element) {
    // fetch user_connected and all of his information
    if ((element.id === "info" || element.id === "security")
        && element.classList.contains("fa-square-caret-down"))
    {
        // Change arrow down to arrow up
        element.classList.remove("fa-square-caret-down");
        element.classList.add("fa-square-caret-up");

        fetch("getUsernameConnected")
        .then(response => response.json())
        .then(user_connected => {
            fetch(`user/${user_connected}/information`)
            .then(response => response.json())
            .then(user_info => {
                // Create expand div
                const   exDiv = document.createElement('div');
                setAttributes(exDiv, {"id": element.parentElement.parentElement.id + "Child", "class": "divProfile"});
                exDiv.classList.add("displayAnimImg"); //rm

                if (element.id === "info") {
                    // Add img to edit info
                    const   img = document.createElement('span');
                    img.className = "fa-solid fa-user-pen displayAnimImg";
                    setAttributes(img, {"id": element.parentElement.parentElement.id + "img"})
                    element.parentElement.append(img);

                    // Create span with all data fetched
                    const   divData = document.createElement('div');
                    setAttributes(divData, {'id': 'userDataDisplayed'});
                    divData.className = "subDivProfile form-check form-switch w-100 h-100 justify-content-center align-items-center flex-column py-2 px-5 rounded login-card";
                    divData.setAttribute("style", "--bs-bg-opacity: 0.5;");
                    exDiv.append(divData);

                    for (const key in user_info)
                        if (key != "stud42" && key != "2fa")
                            append_info(divData, key, user_info[key]);
                        else if (key === "stud42")
                            isStud = user_info[key];
                    element.parentElement.parentElement.append(exDiv);

                    // run animation
                    exDiv.style.animationPlayState = "running";
                    img.style.animationPlayState = "running";
                    element.setAttribute("id", "infoDisabled");

                    exDiv.addEventListener("animationend", (event) => {
                        // stop animation
                        exDiv.style.animationPlayState = "paused";
                        img.style.animationPlayState = "paused";

                        // rm animation class
                        exDiv.classList.remove("displayAnimImg"); //rm img
                        img.classList.remove("displayAnimImg");

                        element.setAttribute("id", "info");
                    });
                    exDiv.style.opacity = "1px";

                    // Add form when editing image is clicked
                    img.addEventListener("click", () => {
                        load_form_edit_info();
                    })
                }
                else if (element.id === "security") {
                    document.getElementById("section3").style.display = "block";

                    element.parentElement.parentElement.append(exDiv);

                    // Create div to contain change password and 2FA
                    const   togDiv = document.createElement('div');
                    togDiv.className = "subDivProfile form-check form-switch w-100 h-100 d-flex justify-content-center align-items-center flex-column py-2 px-5 rounded login-card";
                    togDiv.setAttribute("style", "--bs-bg-opacity: 0.5;");
                    togDiv.style.marginBottom = "5px";

                    // Create div to have input and label for 2FA
                    const   divInpLab = document.createElement("div");
                    const   togLabel = document.createElement('label');
                    setAttributes(togLabel, {'for': 'flexSwitchCheckDefault', 'id': 'togLab'});
                    togLabel.className = "form-check-label";

                    const   togInput = document.createElement('input');
                    setAttributes(togInput, {'type': 'checkbox', 'id': 'flexSwitchCheckDefault'});
                    togInput.className = "form-check-input";

                    const   key2fa = user_info["2fa"];
                    if (key2fa) {
                        togInput.checked = true;
                        togLabel.innerHTML = "2FA Activated.";
                    }
                    else {
                        togInput.checked = false;
                        togLabel.innerHTML = "2FA Deactivated."
                    }
                    let new2fa = key2fa;
                    togInput.addEventListener('click', () => {
                        new2fa = !new2fa;
                        fetch("/2FA", {
                            method: 'PUT',
                            headers: {
                                'content-Type': 'application/json',
                                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                            },
                            body: JSON.stringify({ value: new2fa })
                        })
                        .then(response => {
                            if (response.ok) { console.log("HTTP request successful")}
                            else { console.log("HTTP request unsuccessful")}
                            return response.json();
                        })
                        .then(data => {
                            if (data.message)
                                displayMessage(data.message, "success");
                            if (new2fa) {
                                togInput.checked = true;
                                togLabel.innerHTML = "2FA activated.";
                                const   QR = document.createElement('div');
                                setAttributes(QR, {'id': 'QRcode'});
                                QR.classList.add('QRcss');
                                QR.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(data.qr_url) + '&size=100x100" alt="QR Code" />';
                                divInpLab.append(QR);
                                togDiv.append(divInpLab);
                            }
                            else {
                                togInput.checked = false;
                                togLabel.innerHTML = "2FA deactivated."
                                const rmQR = document.querySelector('#QRcode');
                                if (rmQR != null)
                                    rmQR.remove();
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching 2FA requests: ', error)
                        });
                        event.preventDefault();
                    });

                    divInpLab.append(togInput, togLabel);
                    togDiv.append(divInpLab);
                    exDiv.append(togDiv);

                    // Change password display
                    fetch("getStudStatus")
                    .then(response => response.json())
                    .then(isStud => {
                        if (!isStud)
                            create_change_password(exDiv);
                        create_delete_account(exDiv);
                    })
                    .catch(error => console.error('Error fetching delete account request: ', error));

                    // run animation
                    exDiv.style.animationPlayState = "running";
                    element.setAttribute("id", "securityDisabled");
                    exDiv.addEventListener("animationend", (event) => {
                        // stop animation
                        exDiv.style.animationPlayState = "paused";

                        // rm animation class
                        exDiv.classList.remove("displayAnimImg"); //rm

                        // allow click again
                        element.setAttribute("id", "security");
                    });
                }
            })
            .catch(err => {
                console.log(err);
            });
        })
        .catch(err => {
            console.log(err);
        });
    }
    else if (element.classList.contains("fa-square-caret-up") &&
        (element.id === 'info' || element.id === 'security'))
    {
        if (element.id === "info")
        {
            // Select div displaying infos
            var divRM = document.getElementById(element.parentElement.parentElement.id + "Child");
            var img = document.getElementById(element.parentElement.parentElement.id + "img");

            // Add animation class
            divRM.classList.add("rmAnimImg");//rm img
            img.classList.add("rmAnimImg");

            //            divRM.style.opacity = '0px';
            // run animation
            divRM.style.animationPlayState = "running";
            img.style.animationPlayState = "running";
            element.setAttribute("id", "infoDisabled");

            // remove div after animation ended
            divRM.addEventListener("animationend", (event) => {
                divRM.remove();
                img.remove();
                element.setAttribute("id", "info");
            });
        }
        else if (element.id === "security") {
            // Select div displaying infos
            var divRM = document.getElementById(element.parentElement.parentElement.id + "Child");
            // Add animation class
            divRM.classList.add("rmAnimImg");//rm img

            // run animation
            divRM.style.animationPlayState = "running";
            element.setAttribute("id", "securityDisabled");

            // remove div after animation ended
            divRM.addEventListener("animationend", (event) => {
                divRM.remove();
                document.getElementById('section3').style.display = 'none';
                element.setAttribute("id", "security");
            });
        }

        // Change arrow up to arrow down
        element.classList.add("fa-square-caret-down");
        element.classList.remove("fa-square-caret-up");
    }
}

function    create_change_password(mainDiv) {
    const   check = document.getElementById("formChangePW");

    if (check === null) {
        const   formDiv = document.createElement("div");
        formDiv.className = "subDivProfile w-100 h-100 d-flex justify-content-center align-items-center flex-column py-2 px-5 rounded login-card";
        formDiv.setAttribute("style", "--bs-bg-opacity: 0.5;");
        formDiv.style.marginBottom = "5px";
        formDiv.setAttribute("id", "formChangePW");

        const   divTitle = document.createElement("h1");
        divTitle.className = "text-justify play-bold";
        divTitle.innerHTML = "Change password";

        const   old = create_div_pattern("old_password", "Old password");
        const   newPW = create_div_pattern("new_password", "New password");
        const   confirm = create_div_pattern("confirm_password", "Confirm new password");

        const   btnPW = create_btn("btn btn-primary", "submit", "changePassword", "Change password");
        btnPW.style.margin = "0px 10px;";

        btnPW.addEventListener("click", () => {
            const formData = {
                "old_password": document.getElementById("old_password").value,
                "new_password": document.getElementById("new_password").value,
                "confirm_password": document.getElementById("confirm_password").value
            }
            fetch("change_password", {
                method: "PUT",
                headers: {
                    "content-Type": "application/json",
                    "X-CSRFToken": document.querySelector("meta[name='csrf-token']").getAttribute("content"),
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (response.ok) { console.log("HTTP request successful") }
                else { console.log("HTTP request unsuccessful") }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    displayMessage("You have successfully changed your password.", "success");
                }
                else {
                    displayMessage(data.errors, "danger");
                }
            })
            .catch (err => {
                console.log(err);
                displayMessage(err, "danger");
            });
        });
        formDiv.append(divTitle, old, newPW, confirm, btnPW);
        mainDiv.append(formDiv);
    }
    else {
        check.remove();
    }
}

function    create_delete_account(mainDiv) {
    const   deleteDiv = document.createElement("div");
    setAttributes(deleteDiv, {"id": "deleteAccount"});
    deleteDiv.className = "subDivProfile w-100 h-100 d-flex justify-content-center align-items-center flex-column py-2 px-5 rounded login-card";
    deleteDiv.setAttribute("style", "--bs-bg-opacity: 0.5;");

    const   deleteBtn = document.createElement("btn");
    deleteBtn.setAttribute("id", "delBtn");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.disabled = false;
    deleteBtn.textContent = "Delete your account";

    deleteDiv.append(deleteBtn);
    mainDiv.append(deleteDiv);

    deleteBtn.addEventListener("click", () => {
        deleteBtn.disabled = true;
        deleteBtn.classList.add("disabled");

        if (document.getElementById("confirmationDiv") === null) {
            const   confirmationDiv = document.createElement("div");
            setAttributes(confirmationDiv, {"id": "confirmationDiv", "class": "deletion"})
            confirmationDiv.innerHTML = "Are you sure you want to delete your account? This action cannot be undone."

            // save and cancel button
            const   del = create_btn("btn btn-danger", "submit", "del", "Yes, I am sure!");
            del.style.margin = "5px 0";
            del.disabled = true;

            const   cancelDiv = document.createElement("div");
            cancelDiv.style.textAlign = "center";
            const   cancel = create_btn("btn btn-primary", "submit", "stop", "Changed my mind.");
            cancel.style.margin= "5px 0";

            // For non 42 students, add input to enter password
            var delInputDiv;
            fetch("getStudStatus")
            .then(response => response.json())
            .then(stud => {
                if (!stud)
                    delInputDiv = create_div_pattern("enterPW", "Enter your password");
                else
                    delInputDiv = document.createElement("div");
                delInputDiv.append(del);
                cancelDiv.append(cancel);
                confirmationDiv.append(delInputDiv, cancelDiv);

                deleteDiv.append(confirmationDiv);
                setTimeout(() => {
                    del.disabled = false;
                }, 3000);

                cancel.addEventListener("click", () => {
                    if (confirmationDiv != null)
                        confirmationDiv.remove();
                    deleteBtn.disabled = false;
                    deleteBtn.classList.remove("disabled");
                })
                del.addEventListener("click", () => {
                    fetch("/getUsernameConnected")
                    .then(response => response.json())
                    .then(username => {
                        var formData;
                        if (!stud)
                            formData = {
                                "password": document.getElementById("enterPW").value
                            }
                        else
                            formData = {}
                        fetch('delete_account', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                            },
                            body: JSON.stringify(formData)
                        })
                        .then(response => response.json())
                        .then(data => {console.log("data")
                            if (data.success) {
                                displayMessage(data.message, "success");
                            }
                            else {
                                displayMessage(data.errors, "danger");
                            }
                        })
                        .catch(error => console.error('Error fetching delete account request: ', error));
                    })
                    .catch(error => console.error('Error fetching username request: ', error));
                })
            })
            .catch(error => console.error('Error fetching student status request: ', error));
        }
    })
}

function    create_div_pattern(str, str2) {
    const   subDiv = document.createElement("div");
    const   label = document.createElement("label");
    const   divGroup = document.createElement("div");
    const   divGroupSub = document.createElement("div");
    const   item = document.createElement("i");
    const   input = document.createElement("input");
    const   span = document.createElement("span");
    const   valid = document.createElement("div");
    const   invalid = document.createElement("div");

    subDiv.className = "w-100";
    setAttributes(label, {"for": str, "class": "visually-hidden", "value": str2});
    divGroup.className = "input-group";
    divGroupSub.className = "input-group-text";
    item.className = "bi bi-lock";
    setAttributes(input, {"type": "password", "name": str, "id": str, "class": "form-control", "placeholder": str2});
    input.required = true;

    // Check input validity
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

    if (str === "old_password") {
        input.autofocus = true;
    }
    else if (str === "new_password") {
        setAttributes(input, {"minlength": "8", "pattern": "(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{5,12}"});
        span.className = "helper_txt";
        span.innerHTML = "Password must be at least 8 characters and contain 1 digit, 1 lowercase, and 1 uppercase.";
    }
    else if (str === "confirm_password") {
        setAttributes(input, {"minlength": "8", "pattern": "(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{5,12}"});
        span.className = "helper_txt";
        span.innerHTML = "Must match new password input.";
    }

    if (str !== "old_password") {
        valid.className = "valid-feedback validColor";
        valid.innerHTML = "Looks good!";
        invalid.className = "invalid-feedback invalidColor";
        invalid.innerHTML = "Bad input!";
    }
    divGroupSub.append(item);
    divGroup.append(divGroupSub, input);
    subDiv.append(label, divGroup, span, valid, invalid);
    return subDiv;
}

function    create_btn(classTxt, type, id, str) {
    const   btn = document.createElement("button");
    setAttributes(btn, {"class": classTxt, "type": type, "id": id});
    btn.textContent = str;
    return (btn);
}

function    load_form_edit_info() {
    const   infoDiv = document.getElementById('section1Child');
    const   checkForm = document.getElementById('editForm');

    // hides displayed data to show form;
    const   divData = document.getElementById('userDataDisplayed');
    divData.style.display = 'none';

    if (checkForm === null)
    {
        const   infoKeys = document.querySelectorAll('.infoKey');
        const   infoValues = document.querySelectorAll('.infoValue');
        const   newForm = document.createElement('div');
        newForm.className = "subDivProfile w-100 h-100 d-flex justify-content-center align-items-center flex-column py-2 px-5 rounded login-card";
        newForm.setAttribute("style", "--bs-bg-opacity: 0.5;");
        setAttributes(newForm, {'id': 'editForm'});

        const   mainDiv = [];
        const   mainSpan = [];
        const   mainInput = []
        var   names = {"First name": "first_name",
                          "Last name": "last_name",
                          "Email": "email",
                          "Username": "username",
                          "Language": "language"}

        fetch("getUsernameConnected")
        .then(response => response.json())
        .then(user_connected => {
            fetch(`user/${user_connected}/information`)
            .then(response => response.json())
            .then(user_info => {
                var i = 0;
                for (const key in names) {
                    if (key in names) {
                        mainDiv[i] = document.createElement('div');
                        mainDiv[i].classList.add('infoDiv');
                        mainSpan[i] = document.createElement('span');
                        mainSpan[i].innerHTML = key + ":";
                        mainSpan[i].classList.add('infoKey');
                        if (key === "stud42" && user_info[key] === true && names[key] === "email") {
                            mainInput[i] = document.createElement('span');
                            mainInput[i].innerHTML = document.getElementById(key).innerHTML;
                            mainInput[i].innerHTML = user_info[key];
                        }
                        else {
                            mainInput[i] = document.createElement('input');
                            mainInput[i].innerHTML = document.getElementById(key);
                            mainInput[i].value = user_info[key];
                        }
                        if (names[key] === "language") {
                            mainInput[i] = document.createElement("select");
                            create_options_select_language(mainInput[i], user_info[key]);
                        }
                        setAttributes(mainInput[i], {"name": names[key], "id": names[key]});
                        mainInput[i].style.width = "fit-content";

                        mainDiv[i].append(mainSpan[i], mainInput[i]);
                        mainDiv[i].style.textAlign = "center";
                        newForm.append(mainDiv[i]);
                        i++;
                    }
                }

                // create Div for both buttons
                const   butDiv = document.createElement('div');

                // Add save and cancel buttons
                const   save = create_btn("btn btn-primary", "submit", "saveData", "Save");
                save.style.marginRight = '5px';

                save.addEventListener('click', () => {
                    const   select_div = document.getElementById('language');
                    const formData = {
                        'first_name': document.getElementById('first_name').value,
                        'last_name': document.getElementById('last_name').value,
                        'username': document.getElementById('username').value,
                        'email': document.getElementById('email').value,
                        'language': select_div.options[select_div.selectedIndex].value
                    }
                    fetch("edit_data", {
                        method: 'PUT',
                        headers: {
                            'content-Type': 'application/json',
                            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                        },
                        body: JSON.stringify(formData)
                    })
                    .then(response => {
                        if (response.ok) { console.log("HTTP request successful") }
                        else { console.log("HTTP request unsuccessful") }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            // Show success message
                            displayMessage("You have successfully updated your data.", "success");

                            fetch(`user/${document.getElementById('username').value}/information`)
                            .then(response => response.json())
                            .then(user_info => {
                                for (const key in user_info) {
                                    switch(key) {
                                        case 'First name':
                                            document.getElementById("First name").innerHTML = user_info[key];
                                            break;
                                        case 'Last name':
                                            document.getElementById("Last name").innerHTML = user_info[key];
                                            break;
                                        case 'Email':
                                            document.getElementById("Email").innerHTML = user_info[key];
                                            break;
                                        case 'Username':
                                            // update username in navbar
                                            var updateUsername = document.getElementById('ownUsername');
                                            const arrow = document.getElementById('arrowUsername');
                                            updateUsername.innerHTML = user_info[key] + "  ";
                                            updateUsername.append(arrow);

                                            //update username in title
                                            var updateTitle = document.querySelector('.title_div');
                                            updateTitle.innerHTML = user_info[key] + " profile";

                                            //update username in form
                                            document.getElementById("Username").innerHTML = user_info[key];
                                            break;
                                        case 'Language':
                                            document.getElementById("Language").innerHTML = user_info[key];
                                        default:
                                            break;
                                    }
                                }
                                divData.style.display = 'block';
                                newForm.remove();
                            })
                            .catch (err => {
                                console.log(err);
                                displayMessage(err, "danger");
                            });
                        }
                        else {
                            displayMessage(data.errors, "danger");
                        }
                    })
                    .catch(error => {
                        displayMessage(error, "danger");
                    });
                    event.preventDefault();
                });

                const   cancel = create_btn("btn btn-primary", "submit", "cancelData", "Cancel");
                cancel.style.marginLeft = '5px';

                cancel.addEventListener('click', () => {
                    divData.style.display = 'block';
                    newForm.remove();
                    event.preventDefault();
                });

                butDiv.append(save, cancel);
                butDiv.style.textAlign = 'center';
                butDiv.style.marginTop = '5px';
                newForm.append(butDiv);

                infoDiv.append(newForm);
            })
            .catch(err => displayMessage(err, "danger"));
        })
        .catch(err => displayMessage(err, "danger"));
    }
}

function    create_options_select_language(input, str) {
    // Available languages
    language_choices = ['🇬🇧 English', '🇫🇷 French', '🇪🇸 Spanish', '🇵🇹 Portuguese'];

    for (let i = 0; i < language_choices.length; i++) {
        const   opt = document.createElement("option");
        opt.value = language_choices[i];
        opt.text = language_choices[i];
        if (str === language_choices[i])
            opt.selected = true;
        input.append(opt);
    }
}

function    append_info(exDiv, key, value) {
    const   infoDiv = document.createElement('div');
    const   addKey = document.createElement('span');
    const   addValue = document.createElement('span');

    infoDiv.classList.add("infoDiv")
    addKey.classList.add("infoKey");
    addValue.classList.add("infoValue");
    setAttributes(addValue, {'id': `${key}`});

    addKey.innerHTML = key + ":";
    addValue.innerHTML = value;

    infoDiv.append(addKey);
    infoDiv.append(addValue);
    exDiv.append(infoDiv);
}

function    load_profile_page(username) {
    let   mainDivEl = document.getElementById('userDataDiv');

    // hide or display elements
    mainDivEl.style.display = 'block';
    mainDivEl.innerHTML = "";
    create_div_title(username, "profile", "userDataDiv");
    document.getElementById('greetings').style.display = 'none';
    document.getElementById('statsDiv').style.display = 'none';
    document.getElementById('statsDiv').innerHTML = "";
    document.getElementById('friendsDiv').style.display = 'none';
    document.getElementById('friendsDiv').innerHTML = "";

    // Create elements to display
    const   title1 = document.createElement('div');
    const   title2 = document.createElement('div');
    const   title3 = document.createElement('div');
    const   part1 = document.createElement('div');
    const   part2 = document.createElement('div');
    const   part3 = document.createElement('div');
    const   arrowSpan1 = document.createElement('span');
    const   arrowSpan2 = document.createElement('span');

    arrowSpan1.className = "fa-regular fa-square-caret-up";
    setAttributes(arrowSpan1, {"id": "info"});
    arrowSpan1.style.margin = "0 10px";

    arrowSpan2.className = "fa-regular fa-square-caret-down";
    setAttributes(arrowSpan2, {"id": "security"});
    arrowSpan2.style.margin = "0 10px";

    setAttributes(title1, {"id": "section1"});
    setAttributes(title2, {"id": "section2"});
    setAttributes(title3, {"id": "section3"});

    part1.classList.add("txtSectionDiv");
    part1.innerHTML = "Personal information";
    part1.append(arrowSpan1);
    title1.append(part1);

    fetch(`user/${username}/information`)
    .then(response => response.json())
    .then(user_info => { console.log(user_info);
        // Create expand div
        const   exDiv = document.createElement('div');
        setAttributes(exDiv, {"id": "section1Child", "class": "divProfile"});

        // Add img to edit info
        const   img = document.createElement('span');
        img.className = "fa-solid fa-user-pen displayAnimImg";
        setAttributes(img, {"id": "section1img"})
        part1.append(img);

        // Create span with all data fetched
        const   divData = document.createElement('div');
        setAttributes(divData, {'id': 'userDataDisplayed'});
        divData.className = "subDivProfile form-check form-switch w-100 h-100 justify-content-center align-items-center flex-column py-2 px-5 rounded login-card";
        divData.setAttribute("style", "--bs-bg-opacity: 0.5;");
        exDiv.append(divData);

        for (const key in user_info)
            if (key != "stud42" && key != "2fa")
                append_info(divData, key, user_info[key]);
            else if (key === "stud42")
                isStud = user_info[key];
        title1.append(exDiv);

        // run animation
        exDiv.style.animationPlayState = "running";
        img.style.animationPlayState = "running";

        exDiv.style.opacity = "1px";

        // Add form when editing image is clicked
        img.addEventListener("click", () => {
            load_form_edit_info();
        })
    })
    .catch(err => {
        console.log(err);
    });

    part2.classList.add("txtSectionDiv");
    part2.innerHTML = "Account security";
    part2.append(arrowSpan2);
    title2.append(part2);

    part3.classList.add("txtSectionDiv");
    part3.style.borderBottom = '0px';
    title3.append(part3);
    title3.style.display = 'none';
    mainDivEl.append(title1, title2, title3);
}