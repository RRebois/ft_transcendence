document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', event => {
        const element = event.target;
        if (element.classList.contains("fa-square-caret-down"))
        {
            // Create expand div
            const   exDiv = document.createElement('div');
            exDiv.classList.add("displayAnim");
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
                        for (const key in user_info)
                            if (key != "stud42")
                                append_info(exDiv, key, user_info[key]);
                    });
                    element.parentElement.parentElement.append(exDiv);
                    exDiv.addEventListener("animationend", (event) => {
                        exDiv.classList.remove("displayAnim");
                        exDiv.classList.add("rmAnim");
                    });
                });
            } else if (element.id === "security") {
                console.log("security");
            }
        }
        else if (element.classList.contains("fa-square-caret-up"))
        {
            // Select div displaying infos
            var   divRM = document.getElementById(element.parentElement.parentElement.id + "Child");

            element.classList.add("fa-square-caret-down");
            element.classList.remove("fa-square-caret-up");
console.log("Before animation");
            if (divRM != null)
            {
                if (divRM.style.animationPlayState == "paused")
                    divRM.style.animationPlayState == "running";

            }
            divRM.style.display = "none";
            divRM.addEventListener("animationend", (event) => {
                divRM.remove();console.log("animation ended");
            });
            console.log("After animation ended");
            const   img = document.getElementById(element.parentElement.parentElement.id + "img");
            img.remove();
        }
    });
})

function append_info(exDiv, key, value) {
    const   infoDiv = document.createElement('div');
    const   addKey = document.createElement('span');
    const   addValue = document.createElement('span');

    addKey.classList.add("infoKey");
    addValue.classList.add("infoValue");

    addKey.innerHTML = key + ":";
    addValue.innerHTML = value;

    infoDiv.append(addKey);
    infoDiv.append(addValue);
    exDiv.append(infoDiv);
}

function load_profile_page(username) {
    const   mainDivEl = document.getElementById('mainDiv');

    // hide or display elements
    mainDivEl.style.display = 'block';
    mainDivEl.innerHTML = "";
    create_div_title(username, "profile", "mainDiv");
    document.getElementById('greetings').style.display = 'none';

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