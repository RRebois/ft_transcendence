import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {appRouter} from "@js/spa-router/initializeRouter.js";
import * as bootstrap from "bootstrap";
import {initializePongWebSocket} from "../functions/websocket.js";

export default class Dashboard {
	constructor(props) {
		this.props = props;
		this.handleGameRequest = this.handleGameRequest.bind(this);
		this.user = null;
		this.setUser = this.setUser.bind(this);
		this.gameType = null;
		this.gameConnectivity = 'offline';
		this.gameNbPlayers = 'bot';
	}

	setUser(user) {
		this.user = user;
	}

	setProps(newProps) {
		this.props = newProps;
	}

	handleGameRequest = () => {
		console.log("Game request handled for game type: ", this.gameType);
		console.log("Game connectivity: ", this.gameConnectivity);
		console.log("Game number of players: ", this.gameNbPlayers);

		const game_type = this.gameType;
		let code;
		// Get game code
		switch (this.gameNbPlayers) {
			case 'bot':
				code = '10';
				break;
			case 'offline-1v1':
				code = '20';
				break;
			case 'online-1v1':
				code = '22';
				break;
			case 'online-2v2':
				code = '40';
				break;
		}
		console.log("Game code: ", code);
		if (!code || !game_type) {
			return;
		}
		const csrfToken = getCookie('csrftoken');
		console.log("before fetch");
		fetch(`https://${window.location.hostname}:8443/game/${game_type}/${code}`, {
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
					console.log("Game request success: ", data);
					data.code = code;
					const params = new URLSearchParams(data).toString();
					// Close modal
					const createMatchModal = bootstrap.Modal.getInstance(document.getElementById('create-match-modal'));
					if (createMatchModal)
						createMatchModal.hide();
						const backdrops = document.querySelectorAll('.modal-backdrop');
						backdrops.forEach(backdrop => backdrop.remove());
					appRouter.navigate(`/${game_type}?${params}`);
				}
			})
			.catch(error => {
				console.error("Error fetching friend requests: ", error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
			});

	}

	setupEventListeners() {
		const modal = document.getElementById('create-match-modal');
		if (modal) {
			modal.addEventListener('show.bs.modal', (event) => {
				const button = event.relatedTarget;
				const gameType = button.getAttribute('data-game-type');
				this.gameType = gameType;
				// Change modal title
				const modalTitle = document.getElementById('modalTitle');
				if (modalTitle) {
					modalTitle.innerText = `Play ${gameType}`;
				}
				// Handle game request
				const gameRequestBtn = document.getElementById('game-request-btn');
				if (gameRequestBtn) {
					gameRequestBtn.addEventListener('click', this.handleGameRequest);
				}
				// Get initial number of players options
				const nbPlayersContainer = document.querySelectorAll('input[name="nb-players"]');
				nbPlayersContainer.forEach(radio => {
					radio.addEventListener('change', (event) => {
						console.log("Number of players changed: ", event.target.value);
						this.gameNbPlayers = event.target.value;
					});
				});

				// Update number of players options depending on game connectivity (local / offline)
				const connectivityRadios = document.querySelectorAll('input[name="connectivity"]');
				connectivityRadios.forEach(radio => {
					radio.addEventListener('change', (event) => {
						const connectivityValue = event.target.value;
						this.gameConnectivity = connectivityValue;
						const nbPlayersContainer = document.getElementById('radio-btn-players-container');
						if (nbPlayersContainer) {
							nbPlayersContainer.innerHTML = '';
							if (connectivityValue === 'offline') {
								this.gameNbPlayers = 'bot';
								nbPlayersContainer.innerHTML = `
									<input type="radio" class="btn-check" name="nb-players" id="radio-btn-offline-bot" value="bot" autocomplete="off" checked>
									<label class="btn btn-outline-primary" for="radio-btn-offline-bot">
										<i class="bi bi-robot"></i>
										<p>1v1 against a bot</p>
									</label>
							
									<input type="radio" class="btn-check" name="nb-players" id="radio-btn-offline-1v1" value="offline-1v1" autocomplete="off">
									<label class="btn btn-outline-primary" for="radio-btn-offline-1v1">
										<i class="bi bi-keyboard"></i>
										<p>1v1 on the same keyboard</p>
									</label>
								   `;
								const nbPlayersRadios = document.querySelectorAll('input[name="nb-players"]');
								nbPlayersRadios.forEach(radio => {
									radio.addEventListener('change', (event) => {
										console.log("Number of players changed: ", event.target.value);
										this.gameNbPlayers = event.target.value;
									});
								});
							} else {
								this.gameNbPlayers = 'online-1v1';
								nbPlayersContainer.innerHTML = `
									<input type="radio" class="btn-check" name="nb-players" id="radio-btn-online-1v1" value="online-1v1" autocomplete="off" checked>
									<label class="btn btn-outline-primary" for="radio-btn-online-1v1">
										<i class="bi bi-person"></i>
										<p>1v1</p>
									</label>
							
									<input type="radio" class="btn-check" name="nb-players" id="radio-btn-online-2v2" value="online-2v2" autocomplete="off">
									<label class="btn btn-outline-primary" for="radio-btn-online-2v2">
										<i class="bi bi-people"></i>
										<p>2v2</p>
									</label>
								   `;
								const nbPlayersRadios = document.querySelectorAll('input[name="nb-players"]');
								nbPlayersRadios.forEach(radio => {
									radio.addEventListener('change', (event) => {
										console.log("Number of players changed: ", event.target.value);
										this.gameNbPlayers = event.target.value;
									});
								});
							}
						}
					});
				});

			});
		}
//		const   startPongGame = document.getElementById("game-request-btn");
//		if (startPongGame) {
//		    startPongGame.addEventListener("click", () => { // Add verification of the data selected on the modal by the player
//		        initializePongWebSocket();
//		    })
//		}
	}

    render() {
		document.title = "ft_transcendence";
		return `
		<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
            <div class="h-100 w-full d-flex flex-column justify-content-center align-items-center px-5" style="gap: 16px;">
            	<div class="d-flex flex-row justify-content-center w-full" style="gap: 16px">
            		<!-- Pong game -->
            		<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;">
            			<p class="play-bold fs-3">Pong 🏓</p>
            			<div class="d-flex flex-column justify-content-center align-items-center gap-3 w-full">
            				<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1 play-btn" data-game-type="pong" data-bs-toggle="modal" data-bs-target="#create-match-modal" style="background-color: #3b82f6">
            					<p class="play-regular fs-4 m-0 play-btn-text text-white">Play</p>
							</button>
            			</div>
					</div>
					
            		<!-- Purrinha game -->
            		<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;">
            			<p class="play-bold fs-3">Purrinha ✋</p>
            			<div class="d-flex flex-column justify-content-center align-items-center gap-3 w-full">
            				<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1 play-btn" data-game-type="purrinha" data-bs-toggle="modal" data-bs-target="#create-match-modal" style="background-color: #3b82f6">
            					<p class="play-regular fs-4 m-0 play-btn-text text-white">Play</p>
							</button>
            			</div>
					</div>
            	</div>
            	
            	<!-- Tournament -->
            	<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded" style="--bs-bg-opacity: .5;">
            		<p class="play-bold fs-3">Tournament</p>
            		<div class="d-flex">
            			<div class="d-flex flex-column justify-content-center">
            				<label for="tournament-id">Join a tournament</label>
            				<div class="input-group mb-3">
								<input type="text" class="form-control" id="tournament-id" placeholder="XXX-XXX-XXX" aria-label="Tournament ID">
								<div class="input-group-append">
									<button class="btn btn-primary" type="button">Join</button>
								</div>
							</div>
						</div>
						<div class="d-flex flex-column justify-content-center align-items-center">
							<i class="bi bi-plus-circle"></i>
							<p>Create a tournament</p>
						</div>
					</div>
            	</div>
				
				<!--	MODAL PART		-->
				<div class="modal fade" id="create-match-modal" tabindex="-1" aria-labelledby="create match modal" aria-hidden="true">
					<div class="modal-dialog">
						<div class="modal-content">
							<div class="modal-header">
								<h1 class="modal-title fs-5" id="modalTitle"></h1>
								<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
							</div>
							
							
							<div class="modal-body">
							
								<p>Choose a game type</p>
								<div class="btn-group" role="group" aria-label="Game connectivity selection">
									<input type="radio" class="btn-check" name="connectivity" id="radio-btn-offline" value="offline" autocomplete="off" checked>
									<label class="btn btn-outline-primary" for="radio-btn-offline">
										<i class="bi bi-wifi-off"></i>
										<p>Local</p>
									</label>
									
									<input type="radio" class="btn-check" name="connectivity" id="radio-btn-online" value="online" autocomplete="off">
									<label class="btn btn-outline-primary" for="radio-btn-online">
										<i class="bi bi-wifi"></i>
										<p>Online</p>
									</label>
								</div>
								
								<p>Choose a number of players</p>
								<div id="radio-btn-players-container" class="btn-group" role="group" aria-label="Game connectivity selection">
									<input type="radio" class="btn-check" name="nb-players" id="radio-btn-offline-bot" value="bot" autocomplete="off" checked>
									<label class="btn btn-outline-primary" for="radio-btn-offline-bot">
										<i class="bi bi-robot"></i>
										<p>1v1 against a bot</p>
									</label>
									
									<input type="radio" class="btn-check" name="nb-players" id="radio-btn-offline-1v1" value="offline-1v1" autocomplete="off">
									<label class="btn btn-outline-primary" for="radio-btn-offline-1v1">
										<i class="bi bi-keyboard"></i>
										<p>1v1 on the same keyboard</p>
									</label>
								</div>
							</div>
							<div class="modal-footer">
								<button type="button" class="btn text-danger" data-bs-dismiss="modal">Close</button>
								<button id="game-request-btn" type="button" class="btn btn-primary">Launch a game! 🚀</button>
							</div>
						</div>
					</div>
				</div>
            </div>
        `;
	}
}
