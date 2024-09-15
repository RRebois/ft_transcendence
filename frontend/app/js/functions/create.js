export function create_div_title(username, str, divName) {
    document.getElementById(divName).innerHTML = "";
    const   title = document.createElement('div');
    title.innerHTML = username + " " + str;

    title.className = "title_div gradient-background";
    setAttributes(title, {"name": "top", "id": "title"});

    document.querySelector(`#${divName}`).append(title);
}

export function create_previous_avatar_div(avatar, changeAvatarCallback) {
    const AvatarsContainer = document.getElementById("previous-pp-list");
    const previousAvatarContainer = document.createElement("a");
    const previousAvatar = document.createElement("img");

    previousAvatarContainer.role = "button";
    previousAvatarContainer.classList.add("load-previous-avatar");
    previousAvatarContainer.id = `previous-avatar-btn-${avatar.id}`;

    previousAvatar.classList.add("rounded-circle", "h-40", "w-40", "me-2");
    previousAvatar.src = avatar.url + avatar.image;
    previousAvatar.id = `previous-avatar-${avatar.id}`;
    previousAvatar.alt = "avatar";
    previousAvatarContainer.appendChild(previousAvatar);
    AvatarsContainer.appendChild(previousAvatarContainer);

    previousAvatarContainer.addEventListener('click', () => {
        changeAvatarCallback(avatar.id);
    });
}

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}