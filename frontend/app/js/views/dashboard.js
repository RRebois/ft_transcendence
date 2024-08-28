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
            <div class="h-full bg-danger d-flex flex-column justify-content-center align-items-center px-5" style="gap: 16px;">
            	<div class="d-flex flex-row justify-content-center w-full" style="gap: 16px">
            		<!-- Pong game -->
            		<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;">
            			<p class="play-bold fs-3">Pong 🏓</p>
            			<div class="d-flex flex-column justify-content-center align-items-center gap-3 w-full">
            				<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1 play-btn" style="background-color: #3b82f6">
            					<p class="play-regular fs-4 m-0 play-btn-text text-white">Play</p>
							</button>
							
							<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1" style="background-color: #dbeafe">
            					<p class="play-regular fs-4 m-0">Create a game</p>
							</button>
            			</div>
					</div>
					
            		<!-- Purrinha game -->
            		<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;">
            			<p class="play-bold fs-3">Purrinha ✋</p>
            			<div class="d-flex flex-column justify-content-center align-items-center gap-3 w-full">
            				<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1 play-btn" style="background-color: #3b82f6">
            					<p class="play-regular fs-4 m-0 play-btn-text text-white">Play</p>
							</button>
							
							<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1" style="background-color: #dbeafe">
            					<p class="play-regular fs-4 m-0">Create a game</p>
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
            	
            	
            	<div class="d-flex flex-column">
            		<a role="button" class="text-decoration-none text-black d-flex flex-column justify-content-center align-items-center" data-bs-toggle="modal" data-bs-target="#create-match-modal">
                        <i class="bi bi-robot"></i>
                        <p>Lancer une partie</p>
                    </a>
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
