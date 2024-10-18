import * as bootstrap from "bootstrap";
import {remove_modal_backdrops} from "./display.js";

export function send_player_action(websocket, game_code, action, value, player, player_set_id, session_id) {
    console.log(`current player ${action}: ${value}`);
    websocket.send(JSON.stringify({
        "action": action,
        "player_id": player.id,
        "player_username": player.name,
        "selected_value": value,
        "session_id": session_id,
        "game_code": game_code,
    }));
}

export function display_looking_for_players_modal() {
    let lookingForPlayersModal = bootstrap.Modal.getInstance(document.getElementById('lookingForPlayersModal'));
    if (!lookingForPlayersModal) {
        lookingForPlayersModal = new bootstrap.Modal(document.getElementById('lookingForPlayersModal'));
    }
    lookingForPlayersModal.show();
}

export function hide_looking_for_players_modal() {
    console.log("hide_looking_for_players_modal called");
    const waitingModal = bootstrap.Modal.getInstance(document.getElementById('lookingForPlayersModal'));
    if (waitingModal) {
        console.log("waiting modal found");
        waitingModal.hide();
    }
    remove_modal_backdrops();
}

const lst2arr = (lst) => {
    return Object.entries(lst).map(([key, value]) => ({
        ...value,
        username: key
    }));
}

const get_player_description = (player, game_state) => {
    if (game_state?.round === "choosing") {
        if (player?.quantity === false) {
            return "Choosing a number...";
        } else {
            return "Number picked";
        }
    }
    if (game_state?.round === "guessing") {
        if (player?.id === game_state?.player_turn) {
            return "Guessing the sum...";
        } else {
            return "Waiting...";
        }
    }
    return "Waiting...";
}

export const display_users_info = (data, view) => {
    const players = lst2arr(data?.game_state?.players);
    players.forEach(player => {
        if (player.name === view.user.username) {
            view.player_set_id = player.id;
        }
    });
    view.addProps({players});
    players.forEach(player => {
        const id = player.id;
        const playerUsername = document.getElementById(`user_info-username-${id}`);
        if (playerUsername) {
            playerUsername.innerText = player.name;
        }

        const playerAction = document.getElementById(`user_info-status-${id}`);
        if (playerAction) {
            playerAction.innerText = get_player_description(player, data?.game_state);
        }
    });
}

export const pick_initial_number = (view) => {
    const pickInitialNumberContainer = document.getElementById('pick-initial-number');
    if (pickInitialNumberContainer) {
        return;
    }
    const root = document.getElementById('game-root');
    if (root) {
        root.innerHTML += `
				<div id="pick-initial-number">
					<p>Please, pick a number</p>
					<div class="d-flex justify-content-center">
						<div class="btn-group btn-group-lg" role="group" aria-label="Pick a number">
						    <input type="radio" class="btn-check" name="initial-choice" id="initial-choice-0" value="0" autocomplete="off">
							<label class="btn btn-outline-dark" for="initial-choice-0">0</label>
							<input type="radio" class="btn-check" name="initial-choice" id="initial-choice-1" value="1" autocomplete="off">
							<label class="btn btn-outline-dark" for="initial-choice-1">1</label>
							<input type="radio" class="btn-check" name="initial-choice" id="initial-choice-2" value="2" autocomplete="off">
							<label class="btn btn-outline-dark" for="initial-choice-2">2</label>
							<input type="radio" class="btn-check" name="initial-choice" id="initial-choice-3" value="3" autocomplete="off">
							<label class="btn btn-outline-dark" for="initial-choice-3">3</label>
						</div>
					</div>
					<button id="pick-initial-number-btn" class="btn btn-primary">Pick</button>
				</div>
			`;
        document.getElementById('pick-initial-number-btn').addEventListener('click', () => {
            const selected = document.querySelector('input[name="initial-choice"]:checked');
            if (selected) {
                const selectedValue = parseInt(selected.value);
                console.log("selectedValue: ", selectedValue);
                console.log("view.props: ", view.props);
                const current_player = view.props.players.find(player => player.name === view.user.username);
                console.log("current_player: ", current_player);
                send_player_action(view.gameSocket, view.props.code, 'pick_initial_number', selectedValue, current_player, view.player_set_id, view.props.session_id);
            }
        });
    }
}

export const guess_sum = (data, view) => {
    const pick_init_nb_container = document.getElementById('pick-initial-number');
    if (pick_init_nb_container) {
        pick_init_nb_container.remove();
    }
    const gameRoot = document.getElementById('game-root');
    if (gameRoot) {
        const guessSumContainer = document.getElementById('guess-sum');
        if (guessSumContainer) {
            return;
        }
        gameRoot.innerHTML += `
            <div id="guess-sum">
                <div class="d-flex justify-content-center">
                    <div class="btn-group btn-group-lg" role="group" aria-label="Select your guess">
                    ${data?.game_state?.available_to_guess.map(value => {
            return `
                            <input type="radio" class="btn-check" name="guess-choice" id="guess-choice-${value}" value="${value}" autocomplete="off">
                            <label class="btn btn-outline-dark" for="guess-choice-${value}">${value}</label>
                        `;
        })}
                    </div>
                </div>
                <button id="guess-sum-btn" class="btn btn-primary">Guess</button>
            </div>     
        `;
        document.getElementById('guess-sum-btn').addEventListener('click', () => {
            const guessed_sum = document.querySelector('input[name="guess-choice"]:checked');
            if (guessed_sum) {
                const selectedValue = parseInt(guessed_sum.value);
                const current_player = view.props.players.find(player => player.name === view.user.username);
                console.log("SENDING GUESS: ", selectedValue);
                send_player_action(view.gameSocket, view.props.code, 'sum_guessed', selectedValue, current_player, view.player_set_id, view.props.session_id);
            }
        });
    }
}

export function update_score(data, view) {
    const players = lst2arr(data?.game_state?.players);
    const scores = data?.game_state?.history;
    console.log("[score] scores: ", scores);
    console.log("[score] players: ", players);

    players.forEach(player => {
        const username = player.name;
        if (scores) {
            console.log("[score] username: ", username);
            console.log("[score] scores[username]: ", scores[username]);
            console.log("[score] scores.username: ", scores.username);
        }
        if (scores && scores[username] !== undefined) {
            const playerScore = document.getElementById(`user_info-score-${player.id}`);
            if (playerScore) {
                playerScore.innerText = scores[username];
            }
        }
    });
}

function bot_guess_number(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

