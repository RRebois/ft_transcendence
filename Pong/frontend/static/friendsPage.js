// document.addEventListener("DOMContentLoaded", () => {
//     const friendPage = document.getElementById("friendsPage");
//     if (friendPage != null)
//         friendPage.addEventListener('click', )
// })

function load_friends_page(username) {
    const friendsDivElement = document.getElementById('friendsDiv')

    friendsDivElement.innerHTML = "";
    create_div_title(username, "friends", "friendsDiv");
    document.getElementById('greetings').style.display = 'none';

    const globalContainer = document.createElement('div');
    const sendRequest = document.createElement('form');
    const sendReqTitle = document.createElement('h1');
    const sendReqUserBar = document.createElement('div');
    const sendReqLabel = document.createElement('label');
    const sendReqBar = document.createElement('div');
    const sendReqIconDiv = document.createElement('div');
    const sendReqIcon = document.createElement('i');
    const sendReqInput = document.createElement('input');
    const sendReqBtn = document.createElement('button');

    globalContainer.className = "w-100 h-100 d-flex flex-column justify-content-center align-items-center";
    globalContainer.appendChild(sendRequest);

    sendRequest.className = "friendPage bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card";
    sendRequest.action = "{% url 'send_friend' %}";
    sendRequest.method = 'post';
    sendRequest.style.cssText = "--bs-bg-opacity: .5;";
    sendRequest.id = "addFriend"
    sendRequest.appendChild(sendReqTitle);
    sendRequest.appendChild(sendReqUserBar);

    sendReqTitle.className = "text-justify play-bold";
    sendReqTitle.innerText = "Add a friend";

    sendReqUserBar.className = "w-100";
    sendReqUserBar.appendChild(sendReqLabel);
    sendReqUserBar.appendChild(sendReqBar);

    sendReqLabel.className = "visually-hidden";
    sendReqLabel.innerText = "Username";
    sendReqLabel.setAttribute("for", "username");

    sendReqBar.className = "input-group";
    sendReqBar.appendChild(sendReqIconDiv);
    sendReqBar.appendChild(sendReqInput);
    sendReqBar.appendChild(sendReqBtn);

    sendReqIconDiv.className = "input-group-text";
    sendReqIconDiv.appendChild(sendReqIcon);

    sendReqIcon.className = "bi bi-person";

    sendReqInput.className = "form-control";
    sendReqInput.type = 'text';
    sendReqInput.name = 'username';
    sendReqInput.id = 'username';
    sendReqInput.placeholder = 'Username';
    sendReqInput.required = true;

    sendReqBtn.className = "btn btn-primary";
    sendReqBtn.type = "submit";
    sendReqBtn.innerText = "Send";

    friendsDivElement.appendChild(globalContainer);

    // Friend request container
    const friendRequestContainer = document.createElement('div');
    friendRequestContainer.id = 'friendRequest';
    friendRequestContainer.classList.add('friendPage');
    globalContainer.appendChild(friendRequestContainer);

    fetch('get_friend_requests')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            friendRequestContainer.innerHTML = '';

            data.forEach(request => {
                const friendRequestItem = document.createElement('div');
                friendRequestItem.classList.add('friendPage', 'list-group-item', 'list-group-item-action', 'bg-white', 'login-card', 'd-flex', 'py-2', 'px-5', 'rounded');
                friendRequestItem.style.cssText = '--bs-bg-opacity: .5; margin-bottom: 15px';
                friendRequestItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">From: ${request.from_user__username}</h5>
                        <p class="mb-1">Sent: ${new Date(request.time).toLocaleString()}</p>
                    </div>
                    <p class="mb-1">Status: ${request.status}</p>
                    <div class="buttonsContainer">
                        <button type="button" class="acceptBtn btn btn-primary" style="background: #209920; border-color: #040303" data-id="${request.from_user_id}">Accept</button>
                        <button type="button" class="declineBtn btn btn-primary" style="background: #e3031c; border-color: #040303" data-id="${request.from_user_id}">Decline</button>
                    </div>
                `;
                friendRequestContainer.appendChild(friendRequestItem);
            });

            document.querySelectorAll('.acceptBtn').forEach(button => {
                button.addEventListener('click', function () {
                    const from_id = this.getAttribute('data-id');
                    fetch('accept_friend', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': '{{ csrf_token }}'
                        },
                        body: JSON.stringify({from_id: from_id})
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (response.ok) {
                                this.innerText = 'Accepted';
                                this.classList.remove('btn-primary');
                                this.style.background = '';
                                this.classList.add('btn-success', 'acceptedBtn');
                                this.disabled = true;
                                if (data.level && data.message) {
                                    displayMessage(data.message, data.level);
                                }
                            } else {
                                throw new Error(data.message || 'Unknown error occurred.');
                            }
                        })
                        .catch(error => console.error('Error accepting friend request:', error));
                });
            });

            document.querySelectorAll('.declineBtn').forEach(button => {
                button.addEventListener('click', function () {
                    const from_id = this.getAttribute('data-id');
                    fetch('decline_friend', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': '{{ csrf_token }}'
                        },
                        body: JSON.stringify({from_id: from_id})
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (response.ok) {
                                this.innerText = 'Declined';
                                this.classList.remove('btn-primary');
                                this.style.background = '';
                                this.classList.add('acceptedBtn');
                                this.disabled = true;
                            } else {
                                throw new Error(data.message || 'Unknown error occurred.');
                            }
                        })
                        .catch(error => console.error('Error declining friend request:', error));
                });
            });
        })
        .catch(error => console.error('Error fetching friend requests:', error));
}

function displayMessage(message, level) {
    const messagesContainer = document.getElementById('messagesContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alertSize alert alert-${level}`;
    alertDiv.role = 'alert';
    alertDiv.innerText = message;
    messagesContainer.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
