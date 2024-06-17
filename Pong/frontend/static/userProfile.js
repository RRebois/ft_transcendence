document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', event => {
        const element = event.target;
        if (element.classList.contains("fa-square-caret-down"))
        {
            // Create expand div
            const   exDiv = document.createElement('div');
            exDiv.setAttribute("id", element.parentElement.parentElement.id + "Child");

            if (element.id === "info") {
                fetch("getUsernameConnected")
                .then(response => response.json())
                .then(user_connected => {
                    fetch(`user/${user_connected}/information`)
                    .then(response => response.json())
                    .then(user_info => {
                        console.log(user_info);

                        // Change arrow down to arrow up
                        element.classList.remove("fa-square-caret-down");
                        element.classList.add("fa-square-caret-up");

                        // Add img to edit info
                        const   img = document.createElement('span');
                        img.className = "fa-solid fa-user-pen displayAnimImg";
                        img.setAttribute("id", element.parentElement.parentElement.id + "img")
                        element.parentElement.append(img);

                        // Create span with all data fetched
                        const   divData = document.createElement('div');
                        divData.setAttribute('id', 'userDataDisplayed');
                        exDiv.append(divData);
                        for (const key in user_info)
                            if (key != "stud42")
                                append_info(divData, key, user_info[key]);

                        exDiv.classList.add("displayAnim");
                        element.parentElement.parentElement.append(exDiv);

                        // run animation
                        exDiv.style.animationPlayState = "running";
                        img.style.animationPlayState = "running";

                        exDiv.addEventListener("animationend", (event) => {
                            // stop animation
                            exDiv.style.animationPlayState = "paused";
                            img.style.animationPlayState = "paused";

                            // rm animation class
                            exDiv.classList.remove("displayAnim");
                            img.classList.remove("displayAnimImg");
                        });
                        exDiv.style.opacity = "1px";

                        // Add form when editing image is clicked
                        img.addEventListener('click', load_form_edit_info);
                    });
                });
            }
            else if (element.id === "security") {
                console.log("security");
            }
        }
        else if (element.classList.contains("fa-square-caret-up"))
        {
            // Select div displaying infos
            var divRM = document.getElementById(element.parentElement.parentElement.id + "Child");
            var img = document.getElementById(element.parentElement.parentElement.id + "img");

            // Add animation class
            divRM.classList.add("rmAnim");
            img.classList.add("rmAnimImg");

            // Changes div opacity
            divRM.style.opacity = "0px";

            // run animation
            divRM.style.animationPlayState = "running";
            img.style.animationPlayState = "running";

            // remove div after animation ended
            divRM.addEventListener("animationend", (event) => {
                divRM.remove();
                img.remove();
            });

            // Change arrow up to arrow down
            element.classList.add("fa-square-caret-down");
            element.classList.remove("fa-square-caret-up");
        }
    });
})

function load_form_edit_info() {
    const   infoDiv = document.getElementById('section1Child');
    const   img = document.getElementById('section1img');
    const   checkForm = document.getElementById('editForm');

    // hides displayed data to show form;
    const   divData = document.getElementById('userDataDisplayed');
    divData.style.display = 'none';

    if (checkForm == null && img != null)
    {
        const   infoKeys = document.querySelectorAll('.infoKey');
        const   infoValues = document.querySelectorAll('.infoValue');

        const   newForm = document.createElement('form');
        newForm.setAttribute('id', 'editForm');
//        newForm.action = "/edit_data";
//        newForm.setAttribute('method', 'post');

        // Csrf_token
        var csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrfmiddlewaretoken';
        csrfInput.value = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        newForm.append(csrfInput);

        const   mainDiv = [];
        const   mainSpan = [];
        const   mainInput = []
        const   names = ["first_name", "last_name", "email", "username"]
        for (let i = 0; i < document.querySelectorAll('.infoDiv').length; i++) {

            mainDiv[i] = document.createElement('div');
            mainSpan[i] = document.createElement('span');
            mainSpan[i].innerHTML = infoKeys[i].innerHTML;
            mainSpan[i].setAttribute("name", names[i]);
            mainInput[i] = document.createElement('input');
            mainInput[i].value = infoValues[i].innerHTML;

            mainDiv[i].append(mainSpan[i]);
            mainDiv[i].append(mainInput[i]);
            newForm.append(mainDiv[i]);
        }
        mainInput[0].autofocus = true;

        // Add save and cancel buttons
        const   save = document.createElement('button');
        save.setAttribute('class', "btn btn-primary");
        save.setAttribute('type', "submit");
        save.setAttribute('id', 'saveData');
        save.textContent = "Save";

        save.addEventListener('click', () => {
            const formData = new FormData(newForm);

            fetch('/edit_data', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfInput.value,
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    alert("You have successfully updated your data.");
                } else {
                    // show error msg
                    alert("Error: " + data.errors.join(", "));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("An error occurred. Please try again.")
            });
        });

        const   cancel = document.createElement('button');
        cancel.setAttribute('class', "btn btn-primary");
        cancel.setAttribute('type', "submit");
        cancel.setAttribute('id', 'cancelData');
        cancel.textContent = "Cancel";
        newForm.append(save, cancel);

        infoDiv.append(newForm);
    }
}

function append_info(exDiv, key, value) {
    const   infoDiv = document.createElement('div');
    const   addKey = document.createElement('span');
    const   addValue = document.createElement('span');

    infoDiv.classList.add("infoDiv")
    addKey.classList.add("infoKey");
    addValue.classList.add("infoValue");

    addKey.innerHTML = key + ":";
    addValue.innerHTML = value;

    infoDiv.append(addKey);
    infoDiv.append(addValue);
    exDiv.append(infoDiv);
}

function load_profile_page(username) {
    let   mainDivEl = document.getElementById('userDataDiv');

    // hide or display elements
    mainDivEl.style.display = 'block';
    mainDivEl.innerHTML = "";
    create_div_title(username, "profile", "userDataDiv");
    document.getElementById('greetings').style.display = 'none';
    document.getElementById('statsDiv').style.display = 'none';
    document.getElementById('statsDiv').innerHTML = "";

    // Create elements to display
    const   title1 = document.createElement('div');
    const   title2 = document.createElement('div');
    const   part1 = document.createElement('div');
    const   part2 = document.createElement('div');
    const   arrowSpan1 = document.createElement('span');
    const   arrowSpan2 = document.createElement('span');

    arrowSpan1.className = "fa-regular fa-square-caret-down";
    arrowSpan1.setAttribute("id", "info");
    arrowSpan1.style.margin = "0 10px";
    arrowSpan2.className = "fa-regular fa-square-caret-down";
    arrowSpan2.setAttribute("id", "security");
    arrowSpan2.style.margin = "0 10px";

    title1.setAttribute("id", "section1");
    title2.setAttribute("id", "section2");

    part1.classList.add("txtSectionDiv");
    part1.innerHTML = "Personal information";
    part1.append(arrowSpan1);
    title1.append(part1);
    mainDivEl.append(title1);

    part2.classList.add("txtSectionDiv");
    part2.innerHTML = "Account security";
    part2.append(arrowSpan2);
    title2.append(part2);
    mainDivEl.append(title2);

    event.preventDefault();
}