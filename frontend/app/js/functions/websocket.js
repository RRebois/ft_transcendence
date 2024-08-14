import {isUserConnected} from "./user_auth.js";
import ToastComponent from "@js/components/Toast.js";

export async function initializeWebSocket() {
    return new Promise(async (resolve, reject) => {
        console.log("In Init WS FRONT")
        const response = await fetch('https://localhost:8443/get_ws_token/', {
            credentials: 'include',
        });
        const jwt = await response.json();
        const isUserAuth = await isUserConnected();
        if (isUserAuth) {
            const token = jwt.token
            console.log("In Init WS FRONT, USER AUTHENTICATED")
            const wsSelect = window.location.protocol === "https:" ? "wss://" : "ws://";
            const url = wsSelect + "localhost:8443" + '/ws/user/' + token + '/'
            console.log("url is:", url);
            const socket = new WebSocket(wsSelect + "localhost:8443" + '/ws/user/' + token + '/');

            socket.onopen = function (e) {
                console.log("WebSocket connection established");
                resolve(socket);
            };

            socket.onmessage = function (event) {
                console.log("Message from server:", event.data);
                const data = JSON.parse(event.data);
                if (data.type === 'status_change') {
                    updateFriendStatus(data.user_id, data.status);
                }
                if (data.type === 'test_message') {
                    console.log('Received test message:', data.message);
                }
                if (data.type === 'friend_request')     // received friend request
                    handle_received_friend_request(socket, data);
                if (data.type === 'friend_req_accept')  // accept friend request
                    load_friends_list(data);
                if (data.type === 'friend_remove')      // remove friend
                    load_friends_list(data);
                // TODO : handle friend request decline
                if (data.type === 'friend_delete_acc')
                    load_friends_list(data);
                if (data.type === 'friend_data_edit')
                    load_friends_list(data);
            };

            socket.onclose = function (event) {
                if (event.wasClean) {
                    console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
                } else {
                    console.log('Connection died');
                }
                setTimeout(initializeWebSocket, 2000);
            };

            socket.onerror = function (error) {
                console.log(`WebSocket Error: ${error.message}`);
                reject(error);
            };
            window.mySocket = socket; // to access as a global var
        }
         else {
            reject(new Error("User not authenticated"));
        }
    });
}

async function handle_received_friend_request(socket, message) {
    console.log("socket is:", socket);
    console.log("message is:", message);

    const toast = new ToastComponent();
    toast.throwToast('received-friend-request', 'You have received a friend request', 5000);

    const friend_request_container = document.getElementById('friend-requests');
    if (friend_request_container) {
        const friendItem = document.createElement('div');
        friendItem.classList.add('d-flex', 'w-100', 'justify-content-between', 'align-items-center', 'bg-white', 'login-card', 'py-2', 'px-5', 'rounded');
        friendItem.style.cssText = '--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto';
        friendItem.innerHTML = `
            <img src="${friend.profile_image || "https://w0.peakpx.com/wallpaper/357/667/HD-wallpaper-ghost-profile-thumbnail.jpg"}" alt="user_pp" class="h-80 w-80 rounded-circle">
            <p>${friend.username}</p>
            <p>Status: ${friend.status}</p>
            <button class="btn btn-danger remove-friend-btn" data-id="${friend.id}">Remove</button>
        `;
        friend_request_container.appendChild(friendItem);
    }
}
