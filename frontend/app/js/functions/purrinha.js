import * as bootstrap from "bootstrap";
import {remove_modal_backdrops} from "./display.js";
import confetti from "canvas-confetti";

export function display_hourglass() {
    const pickInitialNumberContainer = document.getElementById('pick-initial-number');
    if (pickInitialNumberContainer) {
        pickInitialNumberContainer.remove();
    }
    const guessSumContainer = document.getElementById('guess-sum');
    if (guessSumContainer) {
        guessSumContainer.remove();
    }
    const hourglassSpinner = document.getElementById('hourglass-spinner');
    if (hourglassSpinner) {
        return;
    }
    const root = document.getElementById('game-root');
    if (root) {
        root.innerHTML += `
            <div id="hourglass-spinner" class="d-flex flex-column gap-2 align-items-center justify-content-center">
                <i class="bi bi-hourglass-split spinner" style="font-size: 2rem;"></i>
                <p>Waiting for other players...</p>
            </div>
        `;
    }
}

export function display_game_winner(data, view) {
    const root = document.getElementById('game-root');
    console.log("winner: ", data?.winner);
    console.log("view.user.username: ", view.user.username);

    const duration = 8 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {startVelocity: 30, spread: 360, ticks: 60, zIndex: 0};

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    if (data?.winner[0] === view.user.username) {
        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({...defaults, particleCount, scale: 1.5, origin: {x: randomInRange(0.1, 0.3), y: Math.random() - 0.2}});
            confetti({...defaults, particleCount, scale: 1.5, origin: {x: randomInRange(0.7, 0.9), y: Math.random() - 0.2}});
        }, 250);

        if (root) {
            root.innerHTML = `
                <div id="game-winner" class="d-flex flex-column gap-2 align-items-center justify-content-center">
                    <h1>Congratulations!</h1>
                    <p>You won the game!</p>
                    <button type="button" class="btn btn-primary" route="/dashboard">Return home</button>
                </div>
            `;
        }
    } else {
        const scalar = 2;
        const text = confetti.shapeFromText({ text: '🤡', scalar });
        confetti({
            shapes: [text],
            scalar
        });
        if (root) {
            root.innerHTML = `
                <div id="game-winner" class="d-flex flex-column gap-2 align-items-center justify-content-center">
                    <h1>Game Over</h1>
                    <p>The winner is ${data?.winner}</p>
                    <button type="button" class="btn btn-primary" route="/dashboard">Return home</button>
                </div>
            `;
        }
    }
}

export function handle_round_winner(data, view) {
    console.log("handle_round_winner called");
    update_score(data, view);

    const root = document.getElementById('game-root');
    if (root) {
        pick_initial_number(view, true);
    }
}

export function send_player_action(websocket, game_code, action, value, player, player_set_id, session_id) {
    console.log(`current player ${action}: ${value}`);
    console.log("player: ", player);
    websocket.send(JSON.stringify({
        "action": action,
        "player_id": player.id,
        "player_username": player.name,
        "selected_value": value,
        "session_id": session_id,
        "game_code": game_code,
    }));
    display_hourglass();
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

export const pick_initial_number = (view, force = false) => {
    const hourglassSpinner = document.getElementById('hourglass-spinner');
    if (hourglassSpinner) {
        if (force) {
            hourglassSpinner.remove();
        } else {
            return;
        }
    }
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
                send_player_action(window.myPurrinhaSocket, view.props.code, 'pick_initial_number', selectedValue, current_player, view.player_set_id, view.props.session_id);
            }
        });
    }
}

export const guess_sum = (data, view) => {
    const pick_init_nb_container = document.getElementById('pick-initial-number');
    if (pick_init_nb_container) {
        pick_init_nb_container.remove();
    }
    const hourglassSpinner = document.getElementById('hourglass-spinner');
    if (hourglassSpinner) {
        hourglassSpinner.remove();
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
                send_player_action(window.myPurrinhaSocket, view.props.code, 'sum_guessed', selectedValue, current_player, view.player_set_id, view.props.session_id);
            }
        });
    }
}

export function update_score(data, view) {
    const players = lst2arr(data?.game_state?.players);
    const scores = data?.game_state?.history;
    console.log("[score] scores: ", scores);
    console.log("[score] players: ", players);
    let maxScore = {score: 0, user_id: null}

    players.forEach(player => {
        const username = player.name;
        if (scores) {
            console.log("[score] username: ", username);
            console.log("[score] scores[username]: ", scores[username]);
            console.log("[score] scores.username: ", scores.username);
        }
        if (scores && scores[username] !== undefined) {
            if (scores[username] > maxScore.score) {
                maxScore.score = scores[username];
                maxScore.user_id = player.id;
            }
            const playerScore = document.getElementById(`user_info-score-${player.id}`);
            if (playerScore) {
                playerScore.innerText = scores[username];
            }
        }
    });
    if (maxScore.username) {
        const trophy = document.querySelector(`.trophy-${maxScore.user_id}`);
        if (trophy) {
            trophy.classList.add('text-warning');
        }
    }

}
