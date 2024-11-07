import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {appRouter} from "@js/spa-router/initializeRouter.js";

export default class Tournament {
    constructor(props) {
        this.props = props;
        this.participant = false;
        this.playerFinished = false;
        this.user = props?.user;
        this.setUser = this.setUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.toast = new ToastComponent();
    }

    setUser = (user) => {
		this.user = user;
	}

    removeUser() {
        if (this.user) this.user = null;
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
                    // this.toast.throwToast("Success", data.message || "You have joined the tournament", 5000, "success");
                    document.getElementById('join-tournament').classList.add('disabled');
                    // appRouter.navigate(window.location.pathname, false);
                }
            })
            .catch(error => {
                console.error("Error joining tournament: ", error);
                this.toast.throwToast("Error", "Network error or server is unreachable", 5000, "error");
            });
        });
    }

    play_tournament() {
        const csrfToken = getCookie('csrftoken');
        document.getElementById('play-tournament').addEventListener('click', () => {
            fetch(`https://${window.location.hostname}:8443/tournament/play/${this.props.id}`, {
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
                    this.toast.throwToast("Error", data.message || "Something went wrong", 5000, "error");
                } else {
                    // this.toast.throwToast("Success", data.message || "You are in tournament matchmaking", 5000, "success");
                    document.getElementById('play-tournament').classList.add('disabled');
                    const params = new URLSearchParams(data).toString();
                    appRouter.navigate(`/${data.game}?${params}`);
                }
            })
            .catch(error => {
                console.error("Error joining tournament: ", error);
                this.toast.throwToast("Error", "Network error or server is unreachable", 5000, "error");
            });
        });
    }

    checkUserParticipate(tournament) {
        for (let i = 0; i < tournament.players.length; i++)
            if (tournament.players[i].Username === this.user.username)
                return (true);
        return (false);
    }

    load_games(tournament) { console.log("Tournament info: ", tournament);
        const gameDiv = document.getElementById('games');
        gameDiv.innerHTML = '';
        tournament.matchs.forEach(match => { console.log(match)
            var isParticipant = this.checkUserParticipate(tournament);
            var background;
            if (match.is_finished && isParticipant)
                if (match?.winner.Username === this.user.username &&
                    (this.user.username === match?.players[0].Username || this.user.username === match?.players[1].Username))
                    background = 'bg-victory'
                else if (match?.winner.Username !== this.user.username &&
                    (this.user.username === match?.players[0].Username || this.user.username === match?.players[1].Username))
                    background = 'bg-defeat';
                else
                    background = 'bg-tournament';
            else
                background = 'bg-tournament';
            const   gameElement = document.createElement('div');
            gameElement.classList.add(background, 'player-card', 'd-flex', 'flex-wrap', 'flex-row', 'align-items-center', 'justify-content-evenly', 'rounded', 'px-3', 'py-2', 'm-1')
            gameElement.innerHTML = `
                    <div id="user-1" class="d-flex flex-column align-items-center justify-content-center w-128">
                        <p class="mx-2 my-1 play-bold">${match?.players[0].Username}</p>
                        <img src="${match?.players[0].img}" alt="user avatar image" class="h-64 w-64 rounded-circle" />
                    </div>
                    <div class="d-flex flex-column align-items-center justify-content-center mx-4">
                        <p class="play-bold">Score:</p>
                        <p class="m-0">${match?.players[0]?.score} - ${match?.players[1]?.score}</p>
                    </div>
                    <div id="user-2" class="d-flex flex-column align-items-center justify-content-center w-128">
                        <p class="mx-2 my-1 play-bold">${match?.players[1].Username}</p>
                        <img src="${match?.players[1].img}" alt="user avatar image" class="h-64 w-64 rounded-circle" />
                    </div>
            `;
            gameDiv.appendChild(gameElement);
        });
    }

    fetch_matchs_played(tournament, player) {
        let counter = 0;
        tournament.matchs.forEach(match => {
            if ((match.players[0].Username === player.Username || match.players[1].Username === player.Username)
                && match.is_finished)
                    counter++;
        });
        return counter;
    }

    load_players(tournament) {
        const   playerDiv = document.getElementById('players');
        playerDiv.innerHTML = '';
        tournament.players.forEach(player => {
            const   matchsPlayed = this.fetch_matchs_played(tournament, player);
            const   playerElement = document.createElement('div');
            playerElement.classList.add('player-card', 'd-flex', 'flex-wrap', 'flex-row', 'align-items-center', 'justify-content-evenly', 'bg-tournament', 'rounded', 'px-3', 'py-2', 'm-1')
            player['Username'] === tournament.winner ?
                playerElement.innerHTML = `
                    <div id="user-id" class="d-flex flex-column align-items-center justify-content-center w-128">
                        <p class="mx-2 my-1 play-bold">${player?.Username} <i class="bi bi-trophy-fill" style="color: #e4ca6a;"></i></p>
                        <img src="${player.img}" alt="user avatar image" class="h-64 w-64 rounded-circle" />
                    </div>
                    <div class="d-flex flex-column align-items-center justify-content-center mx-4">
                        <p class="play-bold">Elo:</p>
                        <p class="m-0">${Math.round(player?.stats.pong.elo[player?.stats.pong.elo.length - 1].elo)}</p>
                    </div>
                    <div class="d-flex flex-column align-items-center justify-content-center w-128">
                        <p class="play-bold">Matchs played:</p>
                        <p class="m-0">${matchsPlayed}/${tournament.nb_players - 1}</p>
                    </div>
                ` :
                playerElement.innerHTML = `
                    <div id="user-id" class="d-flex flex-column align-items-center justify-content-center w-128">
                        <p class="mx-2 my-1 play-bold">${player?.Username}</p>
                        <img src="${player.img}" alt="user avatar image" class="h-64 w-64 rounded-circle" />
                    </div>
                    <div class="d-flex flex-column align-items-center justify-content-center mx-4">
                        <p class="play-bold">Elo:</p>
                        <p class="m-0">${Math.round(player?.stats.pong.elo[player?.stats.pong.elo.length - 1].elo)}</p>
                    </div>
                    <div class="d-flex flex-column align-items-center justify-content-center w-128">
                        <p class="play-bold">Matchs played:</p>
                        <p class="m-0">${matchsPlayed}/${tournament.nb_players - 1}</p>
                    </div>
                `;
            playerDiv.appendChild(playerElement);
        });
    }

    setup_join_play_btn(tournament) {
        this.playerFinished = false;
        const   joinBtn = document.getElementById('join-tournament');
        const   playBtn = document.getElementById('play-tournament');
        tournament.players.forEach(player => {
            if (player.Username === this.user.username) {
                joinBtn.classList.add('disabled');
                this.participant = true;
                const   matchsPlayed = this.fetch_matchs_played(tournament, player);
                if (matchsPlayed === tournament.nb_players - 1) {
                    playBtn.hidden = true;
                    joinBtn.hidden = true;
                    this.playerFinished = true;
                }
            }
        });
        if (tournament.status === "finished" || this.playerFinished) {
            playBtn.classList.add('disabled');
            playBtn.hidden = true;
            joinBtn.hidden = true;
        }
        else if (tournament.status === "waiting for players"){
            playBtn.hidden = true;
            joinBtn.hidden = false;
        }
        else {
            if (this.participant) {
                playBtn.hidden = false;
                joinBtn.hidden = true;
            }
            else {
                playBtn.hidden = true;
                joinBtn.hidden = true;
            }
        }
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
                if (data.message === "Tournament does not exist.")
                    appRouter.render404Page(window.location.pathname);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
			} else {
                this.tournamentObj = data;
                this.load_players(data);
                this.load_games(data);
                this.setup_join_play_btn(data);
            }
        })
        .catch(error => {
			console.error("Error fetching tournaments: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		});
        this.join_tournament();
        this.play_tournament();
    }

    render() {
        return `
            <div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
                <div class="h-100 w-full d-flex flex-column justify-content-evenly align-items-center px-5" style="gap: 64px;">
                    <div id="tournament_Name" class="bg-white min-w-fit d-flex g-4 flex-column align-items-center py-2 px-3 m-3 rounded login-card w-50 position-relative h-min" style="--bs-bg-opacity: .5;">
                        <div class="d-flex w-100 align-items-center">
                            <p class="play-bold fs-1 m-0 text-center flex-grow-1">${this.props?.id}</p>
                            <button type="button" id="join-tournament" class="btn btn-primary ms-auto" hidden>Join +</button>
                            <button type="button" id="play-tournament" class="btn btn-primary ms-auto" hidden>Play</button>
                        </div>
                    </div>
                    <div class="h-full w-full d-flex flex-row flex-wrap justify-content-evenly align-items-stretch"">
                        <div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-3 rounded login-card w-fit h-max-tournament m-3" style="--bs-bg-opacity: .5;">
                            <p class="play-bold fs-2">Players 🤓</p>
                            <div id="players" class="overflow-auto">
                            </div>
                        </div>
                        <div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-3 rounded login-card w-fit h-max-tournament m-3" style="--bs-bg-opacity: .5;">
                            <p class="play-bold fs-2">Games 🎮</p>
                            <div id="games" class="overflow-auto">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
