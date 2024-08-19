export default class Dashboard {
	constructor(props) {
		this.props = props;
		console.log("Dashboard props:", this.props);
	}

	matchState = () => {
		const matchState = document.getElementById("online-game-switch");
		if (matchState) {
			const matchStateLabel = document.getElementById("online-game-label");
			if (matchState.checked) {
				matchStateLabel.innerText = "Online match";
			} else {
				matchStateLabel.innerText = "Local match";
			}
		}
	}

	setupEventListeners() {
		const matchState = document.getElementById("online-game-switch");
		if (matchState) {
			matchState.addEventListener("change", this.matchState);
		}
	}

	render() {
		document.title = "ft_transcendence";
		return `
            <div class="w-100 min-h-screen d-flex flex-column justify-content-center align-items-center">
            	<div class="d-flex flex-column">
            		<a role="button" class="text-decoration-none text-black d-flex flex-column justify-content-center align-items-center" data-bs-toggle="modal" data-bs-target="#create-match-modal">
                        <i class="bi bi-robot"></i>
                        <p>Lancer une partie</p>
                    </a>
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
							<i class="bi bi-robot"></i>
							<p>Créer un tournoi</p>
						</div>
					</div>
				</div>
				<!--	MODAL PART		-->
				<div class="modal fade" id="create-match-modal" tabindex="-1" aria-labelledby="create match modal" aria-hidden="true">
					<div class="modal-dialog">
						<div class="modal-content">
							<div class="modal-header">
								<h1 class="modal-title fs-5" id="exampleModalLabel">Create a match</h1>
								<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
							</div>
							<div class="modal-body">
								<div class="form-check form-switch">
									<input class="form-check-input" type="checkbox" role="switch" id="online-game-switch" checked>
									<label class="form-check-label" for="online-game-switch" id="online-game-label">Online match</label>
								</div>
								<select class="form-select" id="nb-player" aria-label="Number of players">
									<option disabled selected>Number of players</option>
									<option value="1">1 🤖</option>
									<option value="2">2 👤</option>
									<option value="4">4 👥</option>
								</select>
							</div>
							<div class="modal-footer">
								<button type="button" class="btn text-danger" data-bs-dismiss="modal">Close</button>
								<button type="button" class="btn btn-primary">Save changes</button>
							</div>
						</div>
					</div>
				</div>
            </div>
        `;
	}
}
