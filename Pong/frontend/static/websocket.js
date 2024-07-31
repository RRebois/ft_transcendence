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

// function updateFriendRequests(data){
//     console.log('In updateFriendREQUESTS');
//     load_friend_requests();
// }

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
                load_friend_requests(data);
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
