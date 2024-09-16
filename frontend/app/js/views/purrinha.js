import * as bootstrap from "bootstrap";
import {appRouter} from "@js/spa-router/initializeRouter.js";
import {curr_player_pick_number} from "@js/functions/purrinha.js";
import {initializePurrinhaWebSocket} from "@js/functions/websocket.js";

export default class PurrinhaGame {
	constructor(props) {
		console.log("============ PURRINHA WEBPAGE CONSTRUCTOR ============");
		this.props = props;
		this.user = props?.user;
		this.setUser = this.setUser.bind(this);
		this.gameSocket = null;
		this.nb_players = 0;
		this.max_value = 0;


		this.players = [];

		document.addEventListener('DOMContentLoaded', this.setupEventListeners.bind(this));
	}

	setUser = (user) => {
		this.user = user;
	}

	addProps(newProps) {
		this.props = {...this.props, ...newProps};
	}

	setProps(newProps) {
		console.log(newProps);
		this.props = newProps;
	}

	getNumberOfPlayers(game_code) {
		if (game_code === '10' || game_code === '20' || game_code === '22' || game_code === '23') {
			return 2;
		} else {
			return 4;
		}
	}

	getMaxAvailableValue(nb_players) {
		return (nb_players * 3);
	}

	pick_inital_number() {
		const root = document.getElementById('game-root');
		if (root) {
			root.innerHTML += `
				<div id="pick-initial-number">
					<p>Please, pick a number</p>
					<div class="d-flex justify-content-center">
						<div class="btn-group btn-group-lg" role="group" aria-label="Pick a number">
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
					const current_player_id = this.props.players.find(player => player.username === this.user.username).id;
					console.log("current_player_id: ", current_player_id);
					curr_player_pick_number(selectedValue, this.props.code, this.props.session_id, current_player_id, this.props.players.length, this.nb_players, this.gameSocket);
				}
			});
		}
	}

	initializeWs = async (gameCode) => {
		console.log("purrihna initializeWs called");

		let ws;
		try {
			ws = await initializePurrinhaWebSocket(gameCode, this.props?.session_id, this);
		} catch (e) {
			const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
			document.getElementById('errorModalBody').innerHTML = `
				<p>This match is not available. Please try again later.</p>
			`
			errorModal.show();
			return;
		}

		console.log("ws: ", ws);
		this.gameSocket = ws;
		this.nb_players = this.getNumberOfPlayers(this.props?.code);
		this.max_value = this.getMaxAvailableValue(this.nb_players);

		const gameRoot = document.getElementById('game-root');
		if (gameRoot) {
			if (this.nb_players === 2) {
				gameRoot.innerHTML = `
					<div class="right-edge-container">
						<div class="equal-elmt-y"></div>
						<div>
							<img src="/purrinha/closed_hand_right.png" style="height: 100%; width: 100%" alt="edge-image" />
						</div>
						<div class="equal-elmt-y d-flex justify-content-center align-items-start">
							<div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p id="user_info-username-1"></p>
								<p id="user_info-status-1">Picking a number...</p>
							</div>
						</div>
					</div>
					
					<div class="left-edge-container">
						<div class="equal-elmt-y d-flex justify-content-center align-items-end">
							<div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p id="user_info-username-2"></p>
								<p id="user_info-status-2">Picking a number...</p>
							</div>
						</div>
						<div>
							<img src="/purrinha/closed_hand_left.png" style="height: 100%; width: 100%" alt="edge-image" />
						</div>
						<div class="equal-elmt-y"></div>
					</div>
				`;
				this.pick_inital_number();
			} else if (this.nb_players === 4) {
				gameRoot.innerHTML = `
					<div class="top-edge-container">
						<div class="equal-elmt-x"></div>
						<div style="height: 100%;">
							<img src="/purrinha/closed_hand_top.png" style="max-width: 100%; max-height: 100%; width: auto; height: auto;" alt="edge-image" />
						</div>
						
						<div class="equal-elmt-x d-flex justify-content-start align-items-center ">
							<div style="--bs-bg-opacity: .5" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p id="user_info-username-3"></p>
							</div>
						</div>
					</div>
					
					<div class="bottom-edge-container">
						<div class="equal-elmt-x"></div>
						<div style="height: 100%;">
							<img src="/purrinha/closed_hand_bottom.png" style="max-width: 100%; max-height: 100%; width: auto; height: 100%;" alt="edge-image" />
						</div>
						<div class="equal-elmt-x d-flex justify-content-start align-items-center ">
							<div style="--bs-bg-opacity: .5" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p id="user_info-username-4"></p>
							</div>
						</div>
					</div>
					
					<div class="right-edge-container">
						<div class="equal-elmt-y"></div>
						<div>
							<img src="/purrinha/closed_hand_right.png" style="height: 100%; width: 100%" alt="edge-image" />
						</div>
						<div class="equal-elmt-y d-flex justify-content-center align-items-start">
							<div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p id="user_info-username-2"></p>
							</div>
						</div>
					</div>
					
					<div class="left-edge-container">
						<div class="equal-elmt-y d-flex justify-content-center align-items-end">
							<div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p id="user_info-username-1"></p>
							</div>
						</div>
						<div>
							<img src="/purrinha/closed_hand_left.png" style="height: 100%; width: 100%" alt="edge-image" />
						</div>
						<div class="equal-elmt-y"></div>
					</div>					
				`;

			}
		}
		// this.gameSocket.send(JSON.stringify({
		// 	"action": "start_game",
		// 	"game_code": this.props.code,
		// 	"session_id": this.props.session_id,
		// 	"player_id": this.props.player_id,
		// 	"player_name": this.props.player_name,
		// }));
	}

	// this.gameSocket.onmessage = (event) => {
	// 	console.log("--------------- Purrinha webSocket message received: " + event.data);
	// 	const data = JSON.parse(event.data);
	// };

	setupEventListeners() {
		console.log("purrihna setupEventListeners called");
		console.log("this.props: ", this.props);
		if (!this.props?.game || !this.props?.ws_route || !this.props?.session_id || !this?.props.code) {
			const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
			document.getElementById('errorModalBody').innerHTML = `
				<p>This match is not available. Please try again later.</p>
			`
			errorModal.show();
		}

		document.getElementById('returnHomeBtn').addEventListener('click', () => {
			console.log("click on return home");
			const errorModal = bootstrap.Modal.getInstance(document.getElementById('ErrorModal'));
			if (errorModal) {
				console.log("hide error modal");
				errorModal.hide();
			}
			appRouter.navigate("/dashboard");
		});
	}

	render() {
		console.log("purrinha render called");
		this.initializeWs(this.props?.code);
		document.title = "ft_transcendence | Purrinha";
		return `
			<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center overflow-hidden" id="game-root">
				
			</div>

			<!-- Waiting for players modal-->
			<div class="modal fade" id="lookingForPlayersModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-body">
							<p>Waiting for players...</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Unauthorized modal -->
			<div class="modal fade" id="ErrorModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
						<div id="errorModalBody" class="modal-body"></div>
						<div class="modal-footer">
							<button id="returnHomeBtn" type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Return home</button>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}
