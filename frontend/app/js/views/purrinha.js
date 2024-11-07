import * as bootstrap from "bootstrap";
import {appRouter} from "@js/spa-router/initializeRouter.js";
import {initializePurrinhaWebSocket} from "@js/functions/websocket.js";
import PurrinhaPlayerInfo from "../components/PurrinhaPlayerInfo.js";
import {checkGameInstance} from "../functions/games_utils.js";

export default class PurrinhaGame {
    constructor(props) {
        this.props = props;
        this.user = props?.user;
        this.player_set_id = null;
        this.setUser = this.setUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.nb_players = 0;
        this.players = [];
    }

    setUser = (user) => {
        this.user = user;
    }

	removeUser() {
		if (this.user) this.user = null;
	}

	addProps(newProps) {
		this.props = {...this.props, ...newProps};
	}

    setProps(newProps) {
        this.props = newProps;
    }

    getNumberOfPlayers(game_code) {
        if (game_code === '10' || game_code === '20' || game_code === '22' || game_code === '23') {
            return 2;
        } else {
            return 4;
        }
    }

    initializeWs = async (gameCode, match_exists) => {
        if (match_exists) {
            return ;
        }
        let ws;
        try {
            ws = await initializePurrinhaWebSocket(gameCode, this.props?.session_id, this.props?.ws_route, this);
        } catch (e) {
            const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
            document.getElementById('errorModalBody').innerHTML = `
				<p>This match is not available. Please try again later.</p>
			`
            errorModal.show();
            return;
        }

        this.nb_players = this.getNumberOfPlayers(this.props?.code);

        const gameRoot = document.getElementById('game-root');
        if (gameRoot) {
            if (this.nb_players === 2) {
                const player1 = new PurrinhaPlayerInfo(this.players[0], 1);
                const player2 = new PurrinhaPlayerInfo(this.players[1], 2);
                gameRoot.innerHTML = `
                    ${player1.render()}
                    ${player2.render()}
				`;

            } else if (this.nb_players === 4) {
                const player1 = new PurrinhaPlayerInfo(this.players[0], 1);
                const player2 = new PurrinhaPlayerInfo(this.players[1], 2);
                const player3 = new PurrinhaPlayerInfo(this.players[2], 3);
                const player4 = new PurrinhaPlayerInfo(this.players[3], 4);
                gameRoot.innerHTML = `
                    ${player1.render()}
                    ${player2.render()}
                    ${player3.render()}
                    ${player4.render()}
				`;
            }
        }
    }

    setupEventListeners() {
        if (!this.props?.game || !this.props?.ws_route || !this.props?.session_id || !this?.props.code) {
            const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
            if (errorModal) {
                errorModal.innerHTML = `
				<p>This match is not available. Please try again later.</p>
			`}
            errorModal.show();
        }

        const homeBtn = document.getElementById('returnHomeBtn')
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                const errorModal = bootstrap.Modal.getInstance(document.getElementById('ErrorModal'));
                if (errorModal) {
                    errorModal.hide();
                }
                appRouter.navigate("/dashboard");
            });
        }
    }

    render() {
        let match_exists = checkGameInstance(this.props?.session_id);
        if (!match_exists) {
            this.initializeWs(this.props?.code, match_exists);
        }
        return `
			<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center overflow-hidden" id="game-root"></div>

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
