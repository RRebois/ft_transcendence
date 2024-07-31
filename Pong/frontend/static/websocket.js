function updateFriendStatus(userId, status) {
    console.log('In updateFriendStatus with userId:', userId, 'and status:', status);
    const friendItem = document.querySelector(`[data-id="${userId}"]`);
    if (friendItem) {
        console.log('Found friendItem for userId:', userId);
        const statusElement = friendItem.querySelector('.status');
        if (statusElement) {
            console.log('Found statusElement for userId:', userId);
            statusElement.textContent = `Status: ${status}`;
        } else {
            console.log('statusElement not found for userId:', userId);
        }
    } else {
        console.log('friendItem not found for userId:', userId);
    }
}

function updateFriendRequests(data){
    console.log('In updateFriendREQUESTS');
    const friendRequestListElem = document.getElementById('friendRequest');
    const friendRequestHeaderElem = document.getElementById('headerRequests');

    const friendRequestItem = document.createElement('div');
    friendRequestItem.classList.add('friendPage', 'list-group-item', 'list-group-item-action', 'bg-white', 'login-card', 'd-flex', 'py-2', 'px-5', 'rounded');
    friendRequestItem.style.cssText = '--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto';
    friendRequestItem.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">From: ${data.from_user}</h5>
            <p class="mb-1">Sent: ${new Date(data.time).toLocaleString()}</p>
        </div>
        <p class="mb-1">Status: ${data.status}</p>
        <div class="buttonsContainer">
            <button type="button" class="acceptBtn btn btn-primary" style="background: #209920; border-color: #040303" data-id="${data.from_user_id}">Accept</button>
            <button type="button" class="declineBtn btn btn-primary" style="background: #e3031c; border-color: #040303" data-id="${data.from_user_id}">Decline</button>
        </div>
    `;

    friendRequestListElem.innerHTML = '';
    friendRequestListElem.appendChild(friendRequestHeaderElem);
    friendRequestListElem.appendChild(friendRequestItem);

    document.querySelectorAll('.acceptBtn').forEach(button => {
        button.addEventListener('click', function () {
            const from_id = this.getAttribute('data-id');
            const declineBtn = document.querySelector('.declineBtn');
            fetch('accept_friend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({from_id: from_id})
            })
            .then(response => response.json().then(data => ({ status: response.status, data: data })))
            .then(({ status, data }) => {
                if (data.redirect) {
                    window.location.href = data.redirect_url;
                } else if (status !== 401) {
                    this.innerText = 'Accepted';
                    this.classList.remove('btn-primary');
                    this.style.background = '';
                    this.classList.add('btn-success', 'acceptedBtn');
                    this.disabled = true;
                    declineBtn.classList.remove('btn-primary');
                    declineBtn.style.background = '#a55b5b';
                    declineBtn.style.color = 'white';
                    declineBtn.classList.add('acceptedBtn');
                    if (data.level && data.message) {
                        displayMessage(data.message, data.level);
                    }
                    load_friends_list();
                    load_friend_requests();
                }
            });
        });
    });

    document.querySelectorAll('.declineBtn').forEach(button => {
        button.addEventListener('click', function () {
            const from_id = this.getAttribute('data-id');
            const acceptBtn = document.querySelector('.acceptBtn');
            fetch('decline_friend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({from_id: from_id})
            })
            .then(response => response.json().then(data => ({ status: response.status, data: data })))
            .then(({ status, data }) => {
                if (data.redirect) {
                    window.location.href = data.redirect_url;
                } else if (status !== 401) {
                    this.innerText = 'Declined';
                    this.classList.remove('btn-primary');
                    this.style.background = '#a55b5b';
                    this.style.color = 'white';
                    this.classList.add('acceptedBtn');
                    acceptBtn.classList.remove('btn-primary');
                    acceptBtn.style.background = '';
                    acceptBtn.classList.add('btn-success', 'acceptedBtn');
                    load_friends_list();
                    load_friend_requests();
                }
            });
        });
    });
}

async function initializeWebSocket() {
    const response = await fetch('/get_ws_token/');
    const jwt = await response.json();
    if (response.ok) {
        const token = jwt.token
        console.log("token is :", token)
        const wsSelect = window.location.protocol === "https:" ? "wss://" : "ws://";
        const socket = new WebSocket(wsSelect + window.location.host + '/ws/user/' + token + '/');

        socket.onopen = function(e) {
            console.log("WebSocket connection established");
        };

        socket.onmessage = function(event) {
            console.log("Message from server:", event.data);
            const data = JSON.parse(event.data);
            if (data.type === 'status_change') {
                updateFriendStatus(data.user_id, data.status);
            }
            if (data.type === 'test_message') {
                console.log('Received test message:', data.message);
            }
            if (data.type === 'friend_request')
                updateFriendRequests(data);
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
            } else {
                console.log('Connection died');
            }
            setTimeout(initializeWebSocket, 3000);
        };

        socket.onerror = function(error) {
            console.log(`WebSocket Error: ${error.message}`);
        };
    window.mySocket = socket; // to access as a global var
    }
}

// to try to reconnect on refresh
document.addEventListener('DOMContentLoaded', initializeWebSocket);
