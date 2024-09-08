import * as bootstrap from "bootstrap";

export default class PurrinhaGame {
	constructor(props) {
		this.props = props;
		this.user = props?.user;
		this.setUser = this.setUser.bind(this);
		document.addEventListener('DOMContentLoaded', this.setupEventListeners.bind(this));
	}

	setUser = (user) => {
		this.user = user;
	}

	setupEventListeners() {
		const lookingForPlayersModal = new bootstrap.Modal(document.getElementById('lookingForPlayersModal'));
		lookingForPlayersModal.show();
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
		`;
	}
}
