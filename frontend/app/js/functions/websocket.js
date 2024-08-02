import {isUserConnected} from "./user_auth.js";

export async function initializeWebSocket() {
    console.log("In Init WS FRONT")
    // const response = await fetch('/get_ws_token/');
    // const jwt = await response.json();
    const isUserAuth = await isUserConnected();
    if (isUserAuth) {
        // const token = jwt.token
        console.log("In Init WS FRONT, USER AUTHENTICATED")
        const wsSelect = window.location.protocol === "https:" ? "wss://" : "ws://";
        const socket = new WebSocket(wsSelect + window.location.host + '/ws/user/');

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
            if (data.type === 'friend_req_accept')
                load_friends_list(data);
            if (data.type === 'friend_remove')
                load_friends_list(data);
            if (data.type === 'friend_delete_acc')
                load_friends_list(data);
            if (data.type === 'friend_data_edit')
                load_friends_list(data);
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
            } else {
                console.log('Connection died');
            }
            setTimeout(initializeWebSocket, 2000);
        };

        socket.onerror = function(error) {
            console.log(`WebSocket Error: ${error.message}`);
        };
    window.mySocket = socket; // to access as a global var
    }
}