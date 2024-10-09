import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";

export default class Tournament {
    constructor(props) {
        this.props = props;
        this.user = props?.user;
        this.setUser = this.setUser.bind(this);
        this.toast = new ToastComponent();
    }

    setUser = (user) => {
		this.user = user;
	}

    setProps = (props) => {
        this.props = props;
    }

    join_tournament() {
        const csrfToken = getCookie('csrftoken');
        document.getElementById('join-tournament').addEventListener('click', () => {
            fetch(`https://${window.location.hostname}:8443/tournament/join/${this.props.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'include'
            })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
            .then(({ok, data}) => {
                if (!ok) {
                    this.toast.throwToast("Error", data.message || "Something went wrong", 5000, "error");
                } else {
                    this.toast.throwToast("Success", data.message || "You have joined the tournament", 5000, "success");
                    document.getElementById('join-tournament').classList.add('disabled');
                }
            })
            .catch(error => {
                console.error("Error joining tournament: ", error);
                this.toast.throwToast("Error", "Network error or server is unreachable", 5000, "error");
            });
        });
    }

    load_games(tournament) {
        const gameDiv = document.getElementById('games');
        gameDiv.innerHTML = '';
        tournament.matchs.forEach(match => {
            console.log("match: ", match);
            const gameElement = document.createElement('div');
            gameElement.classList.add('player-card', 'd-flex', 'flex-row', 'align-items-center', 'justify-content-between', 'bg-tournament', 'rounded', 'px-3', 'py-2', 'm-1')
            gameElement.innerHTML = `
                <div class="d-flex w-100 align-items-center">
                    <div id="user-1" class="d-flex flex-row align-items-center justify-content-start">
                        <img src="${match?.players[0].img}" alt="user_pp" class="h-64 w-64 rounded-circle" />
                        <p class="mx-2 my-1 play-bold">${match?.players[0].Username}</p>
                    </div>
                    <div class="d-flex flex-column align-items-center justify-content-center mx-3">
                        <p class="play-bold m-0">Score:</p>
                        <p class="m-0">${match?.players[0]?.score} - ${match?.players[1]?.score}</p>
                    </div>
                    <div id="user-2" class="d-flex flex-row align-items-center justify-content-end">
                        <p class="mx-2 my-1 play-bold">${match?.players[1].Username}</p>
                        <img src="${match?.players[1].img}" alt="user_pp" class="h-64 w-64 rounded-circle" />
                    </div>
                </div>
            `;
            gameDiv.appendChild(gameElement);
        });
    }

    fetch_matchs_played(tournament, player) {
        let counter = 0;
        tournament.matchs.forEach(match => {
            if ((match.player1 === player.Username || match.player2 === player.Username) && match.isFinished === "True") {
                counter++;
            }
        });
        return counter;
    }

    load_players(tournament) {
        const playerDiv = document.getElementById('players');
        playerDiv.innerHTML = '';
        tournament.players.forEach(player => {
            const matchsPlayed = this.fetch_matchs_played(tournament, player);
            const playerElement = document.createElement('div');
            playerElement.classList.add('player-card', 'd-flex', 'flex-row', 'align-items-center', 'justify-content-between', 'bg-tournament', 'rounded', 'px-3','py-2', 'm-1')
            playerElement.innerHTML = `
                <div id="user-id" class="d-flex flex-column align-items-center justify-content-center">
                    <p class="mx-2 my-1 play-bold">${player?.Username}</p>
                    <img src="${player.img}" alt="user_pp" class="h-64 w-64 rounded-circle" />
                </div>
                <div class="d-flex flex-column align-items-center justify-content-center mx-4">
                    <p class="play-bold">Elo:</p>
                    <p class="m-0">${player?.stats.pong.elo[0].elo}</p>
                </div>
                <div class="d-flex flex-column align-items-center justify-content-center">
                    <p class="play-bold">Matchs played:</p>
                    <p class="m-0">${matchsPlayed}</p>
                </div>
            `;
            playerDiv.appendChild(playerElement);
        });
    }

    setup_join_btn(tournament) {
        tournament.players.forEach(player => {
            if (player.Username === this.user.username) {
                document.getElementById('join-tournament').classList.add('disabled');
            }
        });
    }

    setupEventListeners() {
        const csrfToken = getCookie('csrftoken');
        fetch(`https://${window.location.hostname}:8443/tournament/display/${this.props.id}`, {
            method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include'
		})
		.then(response => response.json().then(data => ({ok: response.ok, data})))
		.then(({ok, data}) => {
			if (!ok) {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
			} else {
                console.log("data is: ", data);
                this.tournamentObj = data;
                this.load_players(data);
                this.load_games(data);
                this.setup_join_btn(data);
            }
        })
        .catch(error => {
			console.error("Error fetching tournaments: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		});
        this.join_tournament();
    }

    render() {
        document.title = `ft_transcendence | Tournament ${this.props?.id}`;
        return `
            <div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
                <div class="h-100 w-full d-flex flex-column justify-content-evenly align-items-center px-5" style="gap: 64px;">
                    <div id="tournament_Name" class="bg-white d-flex g-4 flex-column align-items-center py-2 px-3 m-3 rounded login-card w-50 position-relative h-min" style="--bs-bg-opacity: .5;">
                        <div class="d-flex w-100 align-items-center">
                            <p class="play-bold fs-1 m-0 text-center flex-grow-1">${this.props?.id}</p>
                            <button type="button" id="join-tournament" class="btn btn-primary ms-auto">Join +</button>
                        </div>
                    </div>
                    <div class="h-full w-full d-flex flex-row flex-wrap justify-content-evenly align-items-stretch"">
                        <div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-3 rounded login-card w-fit h-max-tournament m-3" style="--bs-bg-opacity: .5;">
                            <p class="play-bold fs-2">Players 🤓</p>
                            <div id="players">
                            </div>
                        </div>
                        <div class="bg-white d-flex g-4 flex-column align-items-center justify-content-start py-2 px-3 rounded login-card w-auto h-max-tournament m-3" style="--bs-bg-opacity: .5;">
                            <p class="play-bold fs-2" class="ms-auto">Games 🎮</p>
                            <div id="games" class="d-flex flex-column flex-grow-1 overflow-auto">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}