import * as bootstrap from "bootstrap";
import {initializePurrinhaWebSocket} from "@js/functions/websocket.js";

export default class PurrinhaGame {
	constructor(props) {
		const urlParams = new URLSearchParams(window.location.search);
		this.props = Object.fromEntries(urlParams.entries());
		console.log(this.props);
		this.user = props.user;
		this.gameSocket = null;
		this.nb_players = this.getNumberOfPlayers(this.props?.code);
		this.max_value = this.getMaxAvailableValue(this.nb_players);
		this.initializeWs(this.props?.code);
		document.addEventListener('DOMContentLoaded', this.setupEventListeners.bind(this));
	}

	getNumberOfPlayers(game_code) {
		if (game_code === '10' || game_code === '20' || game_code === '22' || game_code === '23') {
			return 2;
		} else {
			return 4;
		}
	}

	getMaxAvailableValue(nb_players) {
		console.log("nb_players: ", nb_players);
		return (nb_players * 3);
	}


	initializeWs = async (gameCode) => {
		const ws = await initializePurrinhaWebSocket(gameCode);
		console.log("ws: ", ws);
		this.gameSocket = ws;

		const gameRoot = document.getElementById('game-root');
		if (gameRoot) {
			// canvas.innerHTML = `
			// 	<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;">
			// 		<p>Choosing...</p>
			// 		<div class="mb-3">
			// 			<label for="input-player" class="form-label">Pick a number</label>
			// 			<input type="number" min="0" max=${this.max_value} value=${0} class="form-control" id="input-player" aria-describedby="basic-addon4">
			// 			<div class="form-text" id="basic-addon4">Pick a number between 0 and ${this.max_value}. You can't choose same number as an opponent</div>
			// 		</div>
			// 	</div>
			// 	<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;">
			// 		<p>Choosing...</p>
			// 		<div class="mb-3">
			// 			<label for="input-player" class="form-label">Pick a number</label>
			// 			<input type="number" min="0" max=${this.max_value} value=${0} class="form-control" id="input-player" aria-describedby="basic-addon4">
			// 			<div class="form-text" id="basic-addon4">Pick a number between 0 and ${this.max_value}. You can't choose same number as an opponent</div>
			// 		</div>
			// 	</div>
			// `;
			if (this.nb_players === 2) {
				gameRoot.innerHTML = `
					<div class="right-edge-container">
						<div class="equal-elmt-y"></div>
						<div>
							<img src="/purrinha/closed_hand_right.png" style="height: 100%; width: 100%" alt="edge-image" />
						</div>
						<div class="equal-elmt-y d-flex justify-content-center align-items-start">
							<div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p>USERNAME</p>
							</div>
						</div>
					</div>
					
					<div class="left-edge-container">
						<div class="equal-elmt-y d-flex justify-content-center align-items-end">
							<div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p>USERNAME</p>
							</div>
						</div>
						<div>
							<img src="/purrinha/closed_hand_left.png" style="height: 100%; width: 100%" alt="edge-image" />
						</div>
						<div class="equal-elmt-y"></div>
					</div>
				`;
			} else if (this.nb_players === 4) {
				gameRoot.innerHTML = `
<!--					<div class="top-edge-container">-->
<!--						<span style="flex-basis: 33.333333%;"></span>-->
<!--						<img src="/purrinha/closed_hand_top.png" class="top-edge d-flex" alt="edge-image" />-->
<!--						<div style="flex-basis: 33.333333%; &#45;&#45;bs-bg-opacity: .5;" class="bg-white d-flex g-4 flex-column align-items-center py-2 px-5 rounded login-card w-50">-->
<!--							<p>USERNAME</p>-->
<!--							<p>Choosing a number... 💭</p>-->
<!--						</div>-->
<!--					</div>-->
<!--					-->
<!--					-->
<!--					<div class="bottom-edge-container">-->
<!--						<div style="flex-basis: 33.333333%; &#45;&#45;bs-bg-opacity: .5;" class="bg-white d-flex g-4 flex-column align-items-center py-2 px-5 rounded login-card w-50">-->
<!--							<p>USERNAME</p>-->
<!--							<p>Choosing a number... 💭</p>-->
<!--						</div>-->
<!--						<img src="/purrinha/closed_hand_bottom.png" class="bottom-edge d-flex" alt="edge-image" />-->
<!--						<span style="flex-basis: 33.333333%;"></span>-->
<!--					</div>-->
					
					<div class="top-edge-container">
						<div class="equal-elmt-x"></div>
						<div style="height: 100%;">
							<img src="/purrinha/closed_hand_top.png" style="max-width: 100%; max-height: 100%; width: auto; height: auto;" alt="edge-image" />
						</div>
						
						<div class="equal-elmt-x d-flex justify-content-start align-items-center ">
							<div style="--bs-bg-opacity: .5" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p>USERNAME</p>
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
								<p>USERNAME</p>
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
								<p>USERNAME</p>
							</div>
						</div>
					</div>
					
					<div class="left-edge-container">
						<div class="equal-elmt-y d-flex justify-content-center align-items-end">
							<div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
								<p>USERNAME</p>
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

	// ws.onmessage = (event) => {
	// 	console.log("--------------- Purrinha webSocket message received: " + event.data);
	// 	const data = JSON.parse(event.data);
	// };


	setupEventListeners() {
		if (!this.props.game || !this.props.ws_route || !this.props.session_id || !this.props.code) {
			const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
			document.getElementById('errorModalBody').innerHTML = `
				<p>This match is not available. Please try again later.</p>
			`
			errorModal.show();
		} else {
			const lookingForPlayersModal = new bootstrap.Modal(document.getElementById('lookingForPlayersModal'));
			lookingForPlayersModal.show();
		}

		document.getElementById('returnHomeBtn').addEventListener('click', () => {
			window.location.href = '/';
		});
	}

	render() {
		document.title = "ft_transcendence | Purrinha";
		return `
			<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center overflow-hidden" id="game-root">
			</div>

			<!-- Waiting for players modal-->
			<div class="modal fade" id="lookingForPlayersModal" tabindex="-1" aria-hidden="true">
				<div class="modal-dialog">
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
