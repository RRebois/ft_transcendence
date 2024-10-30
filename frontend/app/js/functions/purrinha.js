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

function getScoreTable(players, winner) {
    return `
        <table class="table w-100">
            <thead>
                <tr>
                    <th scope="col">Username</th>
                    <th scope="col">Guess</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(player => {
                    return `
                        <tr>
                            <td>${player.name === winner ? player.name + ' 👑' : player.name}</td>
                            <td>${player.guess}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

export function display_game_winner(data, view) {
    const root = document.getElementById('game-root');
    const players = lst2arr(data?.game_state?.players);

    const duration = 5 * 1000;
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
            confetti({
                ...defaults,
                particleCount,
                scale: 1.5,
                origin: {x: randomInRange(0.1, 0.3), y: Math.random() - 0.2}
            });
            confetti({
                ...defaults,
                particleCount,
                scale: 1.5,
                origin: {x: randomInRange(0.7, 0.9), y: Math.random() - 0.2}
            });
        }, 250);

        if (root) {
            root.innerHTML = `
                <div id="game-winner" class="d-flex flex-column gap-2 align-items-center justify-content-center">
                    <p class="fs-1 play-bold m-1">Congratulations!</p>
                    <p class="fs-3 play-regular">You won the game!</p>
                    <p class="fs-5 play-regular">The sum was ${data?.game_state.result}</p>
                    ${getScoreTable(players, data?.winner[0])}
                    <button type="button" class="btn btn-primary" route="/dashboard">Return home</button>
                </div>
            `;
        }
    } else {
        const scalar = 2;
        const text = confetti.shapeFromText({text: '🤡', scalar});
        confetti({
            shapes: [text],
            scalar
        });
        if (root) {
            root.innerHTML = `
                <div id="game-winner" class="d-flex flex-column gap-2 align-items-center justify-content-center">
                    <p class="fs-1 play-bold m-1">Game Over</p>
                    <p class="fs-3 play-regular">${data?.winner} is the winner</p>
                    <p class="fs-5 play-regular">The sum was ${data?.game_state.result}</p>
                    ${getScoreTable(players, data?.winner[0])}
                    <button type="button" class="btn btn-primary" route="/dashboard">Return home</button>
                </div>
            `;
        }
    }
}

export function handle_round_winner(data, view) {
    update_score(data, view);

    const root = document.getElementById('game-root');
    if (root) {
        pick_initial_number(view, true);
    }
}

export function send_player_action(websocket, game_code, action, value, player, player_set_id, session_id) {
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
    const waitingModal = bootstrap.Modal.getInstance(document.getElementById('lookingForPlayersModal'));
    if (waitingModal) {
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
            if (player?.guess && player?.guess !== -1)
                return `Chose ${player?.guess} as sum.`;
            else
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

export const pick_initial_number = (view, tie = false) => {
    const hourglassSpinner = document.getElementById('hourglass-spinner');
    if (hourglassSpinner) {
        if (tie) {
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
    const choices = [0, 1, 2, 3];
    if (root) {
        root.innerHTML += `
            <div id="pick-initial-number" class="d-flex flex-column justify-content-center align-items-center" style="gap:100px">
                ${tie ? `
                    <div class="monitor-table">
                        <div class="monitor-wrapper">
                            <div class="monitor">
                                <p>It&apos;s a tie! New round.</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
                <div class="d-flex flex-column justify-content-center align-items-center">
                    <p class="play-bold fs-2">Please, pick a number</p>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="purrinha-choices-grid">
                           ${choices.map(value => {
                            return `
                                <div>
                                    <input type="radio" class="btn btn-check rounded-circle" name="initial-choice" id="initial-choice-${value}" value="${value}" autocomplete="off">
                                    <label class="btn btn-outline-dark" for="initial-choice-${value}">${value}</label>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    </div>
                    <button id="pick-initial-number-btn" class="btn btn-primary" disabled>Pick</button>
                </div>
                ${tie ? `<div style="height:80px; background-color: #8360C3"></div>` : ``}
            </div>
        `;
        document.querySelectorAll('input[name="initial-choice"]').forEach((input) => {
            input.addEventListener('change', () => {
                document.getElementById('pick-initial-number-btn').disabled = false;
            });
        });
        document.getElementById('pick-initial-number-btn').addEventListener('click', () => {
            const selected = document.querySelector('input[name="initial-choice"]:checked');
            if (selected) {
                const selectedValue = parseInt(selected.value);
                const current_player = view.props.players.find(player => player.name === view.user.username);
                send_player_action(window.myPurrinhaSocket, view.props.code, 'pick_initial_number', selectedValue, current_player, view.player_set_id, view.props.session_id);
            }
        });
    }
}

export const guess_sum = (data, view, socket) => {
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
            <div id="guess-sum" class="d-flex flex-column justify-content-center align-items-center">
                <p class="play-bold fs-2">Guess the sum 🔮</p>
                <div class="d-flex justify-content-center align-items-center">
                    <div class="purrinha-choices-grid">
                       ${data?.game_state?.available_to_guess.map(value => {
                        return `
                            <div>
                                <input type="radio" class="btn btn-check rounded-circle" name="guess-choice" id="guess-choice-${value}" value="${value}" autocomplete="off">
                                <label class="btn btn-outline-dark" for="guess-choice-${value}">${value}</label>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <button id="guess-sum-btn" class="btn btn-primary" disabled>Guess</button>
            </div>`;
        document.querySelectorAll('input[name="guess-choice"]').forEach((input) => {
            input.addEventListener('change', () => {
                document.getElementById('guess-sum-btn').disabled = false;
            });
        });
        document.getElementById('guess-sum-btn').addEventListener('click', () => {
            const guessed_sum = document.querySelector('input[name="guess-choice"]:checked');
            if (guessed_sum) {
                const selectedValue = parseInt(guessed_sum.value);
                const current_player = view.props.players.find(player => player.name === view.user.username);
                send_player_action(window.myPurrinhaSocket, view.props.code, 'sum_guessed', selectedValue, current_player, view.player_set_id, view.props.session_id);
            }
        });
    }
}

export function update_score(data, view) {
    const players = lst2arr(data?.game_state?.players);
    const scores = data?.game_state?.history;
    let maxScore = {score: 0, user_id: null}

    players.forEach(player => {
        const username = player.name;
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
