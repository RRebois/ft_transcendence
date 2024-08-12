import {isUserConnected} from "./user_auth.js";

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