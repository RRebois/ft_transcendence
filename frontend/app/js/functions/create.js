export function create_div_title(username, str, divName) {
    document.getElementById(divName).innerHTML = "";
    const   title = document.createElement('div');
    title.innerHTML = username + " " + str;

    title.className = "title_div gradient-background";
    setAttributes(title, {"name": "top", "id": "title"});

    document.querySelector(`#${divName}`).append(title);
}

export function create_previous_avatar_div(avatar) {
    const previousAvatarsContainer = document.getElementById("previous-pp-list");
    const previousAvatar = document.createElement("img");
    previousAvatar.classList.add("rounded-circle", "h-40", "w-40", "me-2");
    previousAvatar.src = avatar.url + avatar.image;
    previousAvatar.id = `previous-avatar-${avatar.id}`;
    previousAvatar.alt = "avatar";
    previousAvatarsContainer.appendChild(previousAvatar);
}

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}