function load_profile_page(username) {
    const   mainDivEl = document.getElementById('mainDiv');

    // hide or display elements
    mainDivEl.style.display = 'block';
    mainDivEl.innerHTML = "";
    create_div_title(username, "profile", "mainDiv");
    document.getElementById('greetings').style.display = 'none';

    // Create elements to display
    const   part1 = document.createElement('div');
    const   part2 = document.createElement('div');
    const   arrowSpan1 = document.createElement('span');
    const   arrowSpan2 = document.createElement('span');

    arrowSpan1.className = "fa-regular fa-square-caret-down";
    arrowSpan1.setAttribute("id", "info");
    arrowSpan1.style.marginLeft = "10px";
    arrowSpan2.className = "fa-regular fa-square-caret-down";
    arrowSpan2.setAttribute("id", "security");
    arrowSpan2.style.marginLeft = "10px";

    part1.classList.add("txtSectionDiv");
    part1.innerHTML = "Personal information";
    part1.append(arrowSpan1);
    mainDivEl.append(part1);

    part2.classList.add("txtSectionDiv");
    part2.innerHTML = "Account security";
    part2.append(arrowSpan2);
    mainDivEl.append(part2);



    event.preventDefault();
}