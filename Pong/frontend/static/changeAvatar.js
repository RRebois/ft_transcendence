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
            currentImg.classList.add("selectedImg");

            imgPart1.append(currentImg);

            // Div for friends avatars (just to get some ideas)
            const   imgPart2 = create_part_avatar("Select one of your previous avatar:");

            // fetch images from other users:
            fetch("getAllTimeUserAvatars")
            .then(response => response.json())
            .then(avatars => {console.log(avatars);
                const   user_avatars = []
                for (let i = 0; i < avatars.length; i++) {
                    user_avatars[i]  = create_img_avatar(avatars[i].avatar, "User avatar", "userAvatar" + `${i}`);
                    user_avatar[i].style.margin = "0 5px";
                    imgPart2.append(user_avatars[i]);
                }
            })

            // Div to upload a new avatar
            const   imgPart3 = create_part_avatar("Upload a brand new avatar:");
            const   up = document.createElement("div");
            up.className = "input-group DivChangeImg";

            const   upLabel = document.createElement("label");
            setAttributes(upLabel, {"class": "input-group-text DivChangeImg", "for": "newImageFile"});
            upLabel.innerHTML = "Upload"
            const   upInput = document.createElement("input");
            setAttributes(upInput, {"type": "file", "class": "form-control DivChangeImg", "name": "newImageFile",
            "id": "newImageFile", "accept": "image/*"});

            const   imgPart4 = document.createElement("div");
            imgPart4.className = "DivChangeImg";
            imgPart4.style.textAlign = "center";
            imgPart4.style.width = "100%";
            const   upNewImg = create_btn("btn btn-primary DivChangeImg", "submit", "uploadNewAvatar", "upload");
            upNewImg.style.margin = "5px";
            upNewImg.disabled = true;
            const   cancelUpImg = create_btn("btn btn-danger DivChangeImg", "submit", "cancelUploadNewAvatar", "cancel");
            cancelUpImg.style.margin = "5px";
            imgPart4.append(upNewImg, cancelUpImg);

            up.append(upLabel, upInput, imgPart4);
            imgPart3.append(up);

            cancelUpImg.addEventListener("click", () => {
                document.getElementById('profilePic').remove();
            })

            upNewImg.addEventListener("click", () => {
                const   formData = {
                    'newAvatar': document.querySelector(".selectedImg")
                }
                fetch("uploadAvatar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayMessage(data.message, data.level);
                        document.getElementById('profilePic').remove();
                        // + fetch to upload new img
                    }
                    else
                        displayMessage(data.message, data.level);
                })
            })

            divImages.append(imgPart1, imgPart2, imgPart3);
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