function    load_change_profile_pic(username) {
    if (document.getElementById("profilePic") === null) {
        const   picDiv = document.createElement("div");
        picDiv.innerHTML = ""; //rm DivChangeImg from all and userDataPage
        picDiv.className = "profilePicShadowBox container DivChangeImg";
        picDiv.setAttribute("id", "profilePic");

        // Title div
        const   title = document.createElement("div");
        title.innerHTML = "Change your avatar";
        title.className = "title_div gradient-background DivChangeImg";
        title.setAttribute("name", "top");
        picDiv.append(title);
        document.getElementById("content").append(picDiv);

        const   divImages = document.createElement("div");
        divImages.className = "mainDivImg DivChangeImg";

        // Current profile image
        fetch(`getUserAvatar/${username}`)
        .then(response => response.json())
        .then(data => {

            // Div for current img
            const imgPart1    = create_part_avatar("Current avatar:");
            const currentImg  = create_img_avatar(data, "Current avatar", "currentImg");
//            currentImg.classList.add("selectedImg");

            imgPart1.append(currentImg);
            const   el2 = document.getElementById("imgPart2");
            if (el2 !== null)
                el2.before(imgPart1);
            else
                divImages.append(imgPart1);
        })
        .catch(error => console.error('Error fetching user avatar request: ', error));


        // Div for friends avatars (just to get some ideas)
        const   imgPart2 = create_part_avatar("Select one of your previous avatars:");
        imgPart2.setAttribute("id", "imgPart2");

        // fetch images from other users:
        fetch("getAllTimeUserAvatars")
        .then(response => response.json())
        .then(avatars => {console.log(avatars);
            const   user_avatars = []
            var     i = 0;
            avatars.forEach((img) => {
                console.log(img);
                console.log(img.image);
                user_avatars[i] = create_img_avatar(img.image, "User avatar", "userAvatar" + `${i}`);
                user_avatars[i].style.margin = "0 5px";
                imgPart2.append(user_avatars[i]);
                i++;
            });
            const   imgPart2Sub = document.createElement("div");
            imgPart2Sub.className = "DivChangeImg";
            imgPart2Sub.style.margin = "5px 0 0 0";
            const   validateChoice = create_btn("btn btn-primary DivChangeImg", "submit", "pickOldAvatar", "Save choice");
            validateChoice.disabled = true;
            imgPart2Sub.append(validateChoice);
            imgPart2.append(imgPart2Sub);

            // if no previous avatar, hides this section
            if (avatars.length < 1)
                imgPart2.style.display = "none";

            user_avatars.forEach((el) => {
                el.addEventListener("click", () => {console.log(el.src);
                    const   swapImg = document.getElementById("currentImg");
                    const   unselect = document.querySelector(".selectedImg");
                    if (unselect !== null) {
                        unselect.style.border = "2px solid black";
                        unselect.classList.remove("selectedImg");
                    }
                    const   changeBtn = document.getElementById("pickOldAvatar");
                    if (changeBtn.disabled === true);
                        changeBtn.disabled = false;
                    el.style.border = "3px solid red";
                    el.classList.add("selectedImg");
                })
            })
            validateChoice.addEventListener("click", () => {
                const   avatarSelected = document.querySelector(".selectedImg");
                if (avatarSelected !== null) {
                    const   formData = {
                        "data": avatarSelected.src
                    }

                    fetch("changeAvatar", {
                        method: "PUT",
                        headers: {
                            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            displayMessage(result.message, "success");
                            document.getElementById('profilePic').remove();

                            fetch(`getUserAvatar/${username}`)
                            .then(response => response.json())
                            .then(newData => {
                                document.getElementById("userImg").src = newData;
                            })
                            .catch(error => console.error('Error fetching user avatar request: ', error));
                        }
                        else {
                            displayMessage(result.message, "danger");
                        }
                    })
                    .catch(error => console.error('Error fetching change avatar request: ', error));
                }
            })
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

        const   cancelUpImg = create_btn("btn btn-danger DivChangeImg", "submit", "cancelUploadNewAvatar", "cancel");
        cancelUpImg.style.margin = "5px";
        imgPart4.append(upNewImg, cancelUpImg);

        up.append(upLabel, upInput, imgPart4);
        imgPart3.append(up);

        cancelUpImg.addEventListener("click", () => {
            document.getElementById('profilePic').remove();
        })

        upNewImg.addEventListener("click", () => {
            const   img = document.getElementById("newImageFile");
            const   formData = new FormData();
            formData.append("newImageFile", img.files[0]);

            fetch("/uploadAvatar", {
                method: "POST",
                headers: {
                    "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: formData,
            })
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    displayMessage(response.message, "success");
                    document.getElementById('profilePic').remove();

                    fetch(`getUserAvatar/${username}`)
                    .then(response => response.json())
                    .then(newData => {
                        document.getElementById("userImg").src = newData;
                    })
                    .catch(error => console.error('Error fetching user avatar request: ', error));
                }
                else
                    displayMessage(response.message, "danger");
            })
        })

        divImages.append(imgPart2, imgPart3);
        picDiv.append(divImages);
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