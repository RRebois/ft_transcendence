import * as bootstrap from "bootstrap";
import {initializePurrinhaWebSocket} from "@js/functions/websocket.js";

export default class PurrinhaGame {
	constructor(props) {
		const urlParams = new URLSearchParams(window.location.search);
		this.props = Object.fromEntries(urlParams.entries());
		console.log(this.props);
		this.user = props.user;
		this.gameSocket = initializePurrinhaWebSocket(this.props.code);
		document.addEventListener('DOMContentLoaded', this.setupEventListeners.bind(this));
	}

	setupEventListeners() {
		if (!this.props.game || !this.props.ws_route || !this.props.session_id || !this.props.code) {
			const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
			document.getElementById('errorModalBody').innerHTML = `
				<p>This match is not available. Please try again later.</p>
			`
			errorModal.show();
		}

		else {
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
			<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
            	<div class="h-100 w-full d-flex flex-column justify-content-center align-items-center px-5" style="gap: 16px;">
            		<div class="d-flex flex-row justify-content-center w-full" style="gap: 16px">
						
					</div>
				</div>
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
