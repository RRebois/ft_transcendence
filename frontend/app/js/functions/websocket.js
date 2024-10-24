import {isUserConnected} from "./user_auth.js";
import ToastComponent from "@js/components/Toast.js";
import {
    create_empty_friend,
    create_empty_request,
    create_friend_div_ws,
    create_friend_request_div,
    remove_friend_div,
} from "@js/functions/friends_management.js";
import {load_tournaments_ws, reload_new_players} from "@js/functions/tournament_management.js";
import {remove_friend_request_div} from "./friends_management.js";
import {load_new_notifications} from "../functions/navbar_utils.js";
import {
    display_game_winner,
    display_hourglass,
    display_looking_for_players_modal,
    display_users_info,
    guess_sum, handle_round_winner,
    hide_looking_for_players_modal,
    pick_initial_number,
    update_score,
} from "./purrinha.js";


export async function initializePurrinhaWebSocket(gameCode, sessionId, ws_route, view) {
    return new Promise(async (resolve, reject) => {
        const response = await fetch(`https://${window.location.hostname}:8443/get_ws_token/`, {
            credentials: 'include',
        });
        const jwt = await response.json();
        const isUserAuth = await isUserConnected();
        if (!gameCode || !sessionId) {
            reject(new Error("Missing game code or session id"));
        }
        if (isUserAuth) {
            // fetch(`https://${window.location.hostname}:8443/game/check/purrinha/${gameCode}/${sessionId}/`, {
            //     method: 'GET',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-CSRFToken': getCookie('csrftoken'),
            //     },
            //     credentials: 'include',
            // })
            //     .then(response => {
            //         if (!response.ok) {
            //             reject(new Error("Match not available"));
            //             return;
            //         }
            //         return response.json();
            //     })
            //     .then(data => {
            //         if (!data) {
            //             return;
            //         }
            const token = jwt.token
            const wsSelect = window.location.protocol === "https:" ? "wss://" : "ws://";
            const url = wsSelect + `${window.location.hostname}:8443` + ws_route + token + '/'
            const socket = new WebSocket(url);

            socket.onopen = function (e) {
                console.log("Purrinha webSocket connection established");
                resolve(socket);
            }

            socket.onmessage = function (event) {
                const data = JSON.parse(event.data);
                console.log("[purrinha websocket] Data is:", data);

                // Case : a winner is declared
                if (data?.winner) {
                    update_score(data, view);
                    display_game_winner(data, view);
                }

                // Case: the round have a winner
                // if (data?.game_state?.winner) {
                //     update_score(data, view);
                //     handle_round_winner(data, view);
                // }

                console.log("current user is ", view?.user);

                if (data?.status === 'waiting') {
                    console.log("Waiting for players...");
                    display_looking_for_players_modal();
                } else {
                    update_score(data, view);
                    if (data?.status === 'started') {
                        console.log("Game started");
                        hide_looking_for_players_modal();
                        display_users_info(data, view);
                        if (data.game_state?.round === "choosing") {
                            pick_initial_number(view);
                        } else if (data.game_state?.round === "guessing") {
                            console.log("player_set_id is:", view?.player_set_id);
                            if (data.game_state?.player_turn === view?.player_set_id) {
                                console.log("It's your turn to guess the sum");
                                guess_sum(data, view);
                            } else {
                                display_hourglass();
                            }
                        } else if (data.game_state?.round === "finished") {
                            console.log("Round finished");
                            handle_round_winner(data, view);
                        }
                    } else if (data?.status === 'finished') {
                        console.log("Game finished");
                    }
                }


                // else
                //     if (data?.status === 'started') {
                //         console.log("Game started");
                //         hide_looking_for_players_modal();
                //         display_users_info(data, view);
                //         if (data.game_state?.round === "choosing") {
                //             pick_initial_number(view);
                //         } else if (data.game_state?.round === "guessing") {
                //             console.log("player_set_id is:", view?.player_set_id);
                //             if (data.game_state?.player_turn === view?.player_set_id) {
                //                 console.log("It's your turn to guess the sum");
                //                 guess_sum(data, view);
                //             }
                //         }
                //     } else if (data?.status === 'finished') {
                //         console.log("Game finished");
                //     }


            };

            socket.onclose = function (event) {
                if (event.wasClean) {
                    console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
                } else {
                    console.log('Connection died');
                }
            };

            socket.onerror = function (error) {
                console.log(`Purrinha webSocket Error: ${error.message}`);
                reject(error);
            };
            window.mySocket = socket; // to access as a global var
            // })
            // .catch(error => {
            //     console.error("Error:", error);
            //     reject(error);
            // });
        }
    });
}

export async function initializePongWebSocket(data, pong) {
    console.log("DATA received webso: ", data); // test si code = 33
    return new Promise(async (resolve, reject) => {
        const response = await fetch(`https://${window.location.hostname}:8443/get_ws_token/`, {
            credentials: 'include',
        });
        const jwt = await response.json();
        const isUserAuth = await isUserConnected();
        if (!data.code || !data.session_id) {
            reject(new Error("Missing game code or session id"));
        }
        if (isUserAuth) {
            console.log("\n\n\n\n\nuser is auth\n\n\n\n\n");
//            fetch(`https://${window.location.hostname}:8443/game/pong/${gameCode}/`, {
//                method: "GET",
//                headers: {
//					'Content-Type': 'application/json',
//					'X-CSRFToken': getCookie('csrftoken'),
//				},
//                credentials: 'include',
//            })
//            .then(gameResponse => {
//                if (!gameResponse.ok) {
//                    reject(new Error("Match not available"));
//                    return ;
//                }
//                return gameResponse.json();
//            })
//            .then(data => { console.log("DATA WEBSO: ", data);
            if (!data) { //data["session_id"] = sessionId;
                return;
            }
            const token = jwt.token
            // console.log("In Init WS FRONT, USER AUTHENTICATED")
            const wsSelect = window.location.protocol === "https:" ? "wss://" : "ws://";
            const url = wsSelect + `${window.location.hostname}:8443` + data.ws_route + token + '/'
            // console.log("url is:", url);
            const socket = new WebSocket(url);

            socket.onopen = function (e) {
                console.log("Pong WebSocket connection established");
                resolve(socket);
            };
            pong.init();
            let test = 0;
            socket.onmessage = function (event) {
                // console.log("Pong websocket msg received: ", event.data);
                const data = JSON.parse(event.data);

                if (data.status === "waiting") // Waiting for opponent(s)
                    pong.waiting();
                if (data.status === "ready" && test === 0) { // Waiting for display in front
                    test = 1;
                    pong.buildGameSet(data);
                }
                if (data.status === "started" || data.status === "finished")
                    pong.display(data, socket);
            };

            socket.onclose = function (event) {
                if (event.wasClean) {
                    // console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
                } else {
                    // console.log('Connection died');
                }
            };

            socket.onerror = function (error) {
                // console.log(`WebSocket Error: ${error.message}`);
                reject(error);
            };
            window.myPongSocket = socket; // to access as a global var
//            })
//            .catch(error => {
//                    console.error("Error:", error);
//                    reject(error);
//            });
        } else {
            reject(new Error("User not authenticated"));
        }
    });
}

export async function initializeWebSocket() {
    return new Promise(async (resolve, reject) => {
        if (window.mySocket) {
            console.log("Socket already initialized");
            resolve(window.mySocket);
            return;
        }
        console.log("In Init WS FRONT")
        const response = await fetch(`https://${window.location.hostname}:8443/get_ws_token/`, {
            credentials: 'include',
        });
        const jwt = await response.json();
        const isUserAuth = await isUserConnected();
        if (isUserAuth) {
            const token = jwt.token
            console.log("In Init WS FRONT, USER AUTHENTICATED")
            const wsSelect = window.location.protocol === "https:" ? "wss://" : "ws://";
            const url = wsSelect + `${window.location.hostname}:8443` + '/ws/user/' + token + '/'
            console.log("url is:", url);
            let socket = new WebSocket(wsSelect + `${window.location.hostname}:8443` + '/ws/user/' + token + '/');

            socket.onopen = function (e) {
                console.log("WebSocket connection established");
                resolve(socket);
            };
            socket.onmessage = function (event) {
                console.log("Message from server:", event.data);
                const data = JSON.parse(event.data);
                if (data.type === 'status_change') {
                    console.log("Status change detected");
                    handle_friend_status(socket, data);
                }
                if (data.type === 'test_message') {
                    console.log('Received test message:', data.message);
                }
                if (data.type === 'friend_request') {
                    console.log("Friend request received");
                    console.log("data is:", data);
                    handle_received_friend_request(socket, data);
                }
                if (data.type === 'friend_req_accept') {
                    console.log("Friend request accepted");
                    handle_friend_req_accept(socket, data);
                }
                if (data.type === 'friend_req_decline') {
                    console.log("Friend request declined");
                    handle_friend_req_decline(socket, data);
                }
                if (data.type === 'friend_remove') {
                    console.log("Friend removed");
                    handle_friend_removed(socket, data);
                }
                if (data.type === 'friend_delete_acc') {
                    console.log("Friend delete accepted");
                }
                if (data.type === 'friend_data_edit') {
                    console.log("Friend data edit");
                }
                if (data.type === 'tournament_created') {
                    handle_tournament_created(socket, data);
                }
                if (data.type === 'tournament_full') {
                    handle_tournament_full(socket, data);
                }
                if (data.type === 'tournament_new_player') {
                    handle_tournament_new_player(socket, data);
                }
                if (data.type === 'tournament_play') {
                    handle_tournament_play(socket, data);
                }
            }
            socket.onclose = function (event) {
                if (event.wasClean) {
                    console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
                } else {
                    console.log('Connection died');
                }
                socket = null;
                setTimeout(initializeWebSocket, 2000);
            };

            socket.onerror = function (error) {
                console.log(`WebSocket Error: ${error.message}`);
                socket = null;
                reject(error);
            };
            window.mySocket = socket; // to access as a global var
        } else {
            reject(new Error("User not authenticated"));
        }
    });
}

function handle_received_friend_request(socket, message) {
//    console.log("socket is:", socket);
//    console.log("message is:", message);

    const toast = new ToastComponent();
    toast.throwToast('Notification', `You have received a new friend request from ${message.from_user}`, 5000);
    create_friend_request_div(message, message.size);
    load_new_notifications();
}

function handle_friend_req_accept(socket, message) {
//    console.log("socket is:", socket);
//    console.log("message is:", message);

    const toast = new ToastComponent();
    toast.throwToast('Notification', `${message.to_user} Is now your friend!`, 5000);
    create_friend_div_ws(message.to_status, message.to_user_id, message.to_image_url, message.to_user);
    remove_friend_request_div(message.to_user_id);
    const friendRequest = document.getElementsByClassName('friend-req-sent');
    if (message.size === 1 || friendRequest.length === 0) {
        create_empty_request("sent");
    }
    load_new_notifications();
}

function handle_friend_req_decline(socket, message) {
//    console.log("socket is:", socket);
//    console.log("message is:", message);

    const toast = new ToastComponent();
    toast.throwToast('Notification', `${message.to_user} declined your friend request...`, 5000);
    remove_friend_request_div(message.to_user_id);
    const friendRequest = document.getElementsByClassName('friend-req-sent');
    if (message.size === 1 || friendRequest.length === 0) {
        create_empty_request("sent");
    }
    load_new_notifications();
}

function handle_friend_removed(socket, message) {
//    console.log("socket is:", socket);
//    console.log("message is:", message);

    remove_friend_div(message.from_user_id);
    const friend = document.getElementsByClassName('friend');
    if (message.size === 1 || friend.length === 0) {
        create_empty_friend();
    }
}

function handle_friend_status(socket, message) {
//    console.log("socket is:", socket);
//    console.log("message is:", message);
    console.log("status change detected for user:", message.user_id, "new status is:", message.status);

    const friendItem = document.querySelector(`[data-id="${message.user_id}"]`)
    if (friendItem) {
        const statusElement = friendItem.querySelector('.status');
        if (statusElement) {
            statusElement.innerText = `Status: ${message.status}`;
        }
        console.log("User id is: ", message.user_id);
        let friendID = message.user_id
        let friendStatusId = `friend-status-${message.user_id}`;
        let friendStatusTextId = `friend-status-text-${message.user_id}`;

        console.log("Constructed IDs:", friendStatusId, friendStatusTextId);
        let friendStatus = document.getElementById(friendStatusId);
        let friendStatusText = document.getElementById(friendStatusTextId);
        console.log("friendStatus is:", friendStatus);
        console.log("friendStatusText is:", friendStatusText);
        if (friendStatus && friendStatusText) {
            friendStatus.classList.remove('bg-success', 'bg-danger');
            friendStatusText.innerText = message.status;
            if (message.status === 'online') {
                friendStatus.classList.add('bg-success');
            } else {
                friendStatus.classList.add('bg-danger');
            }
        }
    }
}

async function handle_tournament_created(socket, data) {
    console.log("Tournament created socket:", socket);
    console.log("data is:", data);

    const user = await isUserConnected();
    console.log("User is:", user);
    if (user.id !== data.creator) {
        const toast = new ToastComponent();
        toast.throwToast('Notification', `${data.message}`, 5000);
        load_new_notifications();
        load_tournaments_ws();
    }
}

function handle_tournament_full(socket, data) {
    console.log("Tournament full socket:", socket);
    console.log("data is:", data);

    const toast = new ToastComponent();
    toast.throwToast('Notification', `${data.message}`, 3000);
    load_new_notifications();
}

function handle_tournament_new_player(socket, data) {
    console.log("Tournament new player socket:", socket);
    console.log("data is:", data);

    reload_new_players(data.tournament_name);
}

async function handle_tournament_play(socket, data) {
    const user = await isUserConnected();
    if (user.id !== data.creator) {
        const toast = new ToastComponent();
        toast.throwToast('Notification', `${data.message}`, 3000);
        load_new_notifications();
    }
}