function    load_change_profile_pic(username) {
    if (document.getElementById("profilePic") === null) {
        const   picDiv = document.createElement("div");
        picDiv.innerHTML = "";
        picDiv.className = "profilePicShadowBox container DivChangeImg";
        picDiv.setAttribute("id", "profilePic");

        // Title div
        const   title = document.createElement("div");
        title.innerHTML = "Change your avatar";
        title.className = "title_div gradient-background DivChangeImg";
        title.setAttribute("name", "top");
        picDiv.append(title);
        document.getElementById("content").append(picDiv);

        // Current profile image
        fetch(`getUserAvatar/${username}`)
        .then(response => response.json())
        .then(data => {
            const   divImages = document.createElement("div");
            divImages.className = "mainDivImg DivChangeImg";

            // Div for current img
            const imgPart1    = create_part_avatar("Current avatar:");
            const currentImg  = create_img_avatar(data, "Current avatar", "currentImg");

            imgPart1.append(currentImg);

            // Div for friends avatars (just to get some ideas)
            const   imgPart4 = create_part_avatar("Select a new Avatar among your friends avatars:");

            // fetch images from other users:
//            fetch("getFriendsAvatars")
//            .then(response => response.json())
//            .then(avatars => {
//                const   friend_avatars = []
//                for (let i = 0; i < avatars.length; i++) {
//                    friend_avatars[i]  = create_img_avatar(avatars[i].avatar, "Friends avatar", "friendAvatar" + `${i}`);
//                    friend_avatar[i].style.margin = "0 5px";
//                    imgPart2.append(friend_avatars[i]);
//                }
//            })

            divImages.append(imgPart1);//, imgPart2);
            picDiv.append(divImages);
        })
        .catch(error => console.error('Error fetching user avatar request: ', error));
    }
}

function    create_part_avatar(title) {
    const   part = document.createElement("div");
    part.className = "imgPartDiv DivChangeImg";

    const   partTitle = document.createElement("div");
    partTitle.className = "imgTitleDiv DivChangeImg";
    partTitle.innerHTML = title;

    part.append(partTitle);
    return part;
}

function    create_img_avatar(img, alt, id) {console.log(img);
    const   currentImg = document.createElement("img");
    setAttributes(currentImg, {"src": img, "alt": alt, "id": id,
            "width": "200vw", "height": "200vh", "class": "DivChangeImg"});

    return currentImg;
}