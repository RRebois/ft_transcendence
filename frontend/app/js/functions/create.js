export function create_div_title(username, str, divName) {
    document.getElementById(divName).innerHTML = "";
    const   title = document.createElement('div');
    title.innerHTML = username + " " + str;

    // Add CSS to created div
    title.className = "title_div gradient-background";
    setAttributes(title, {"name": "top", "id": "title"});

    document.querySelector(`#${divName}`).append(title);

    // if (username !== document.getElementById("ownUsername").textContent.trim())
    //     create_add_friend_icon(username);
}

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}