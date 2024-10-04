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

    load_players(tournament) {
        console.log("LoadPlayers fct data is: ", tournament);
        if (!tournament || !tournament.players) {
            console.log("Invalid tournament object or players not found");
            return;
        }
        const playerDiv = document.getElementById('player');
        playerDiv.innerHTML = '';
        tournament.players.forEach(playerName => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-card';
            playerElement.innerText = playerName;
            playerDiv.appendChild(playerElement);
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
            }
        })
        .catch(error => {
			console.error("Error fetching tournaments: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		});
    }

    render() {
        document.title = `ft_transcendence | Tournament ${this.props?.id}`;
        return `
            <div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
                <div class="h-100 w-full d-flex flex-column justify-content-evenly align-items-center px-5" style="gap: 64px;">
                    <div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-3 rounded login-card w-50 h-min" style="--bs-bg-opacity: .5;">
                        <p class="play-bold fs-1 m-0">${this.props?.id}</p>
                    </div>
                    <div class="h-full w-full d-flex flex-row justify-content-evenly align-items-center"">
                        <div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-3 rounded login-card w-fit h-min" style="--bs-bg-opacity: .5;">
                            <p class="play-bold fs-2">Players 🤓</p>
                            <div id="player">
                            </div>
                        </div>
                        <div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-3 rounded login-card w-fit h-min" style="--bs-bg-opacity: .5;">
                            <p class="play-bold fs-2">Games 🎮</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}