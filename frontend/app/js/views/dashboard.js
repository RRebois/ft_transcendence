// import {getCookie} from "@js/functions/cookie.js";
// import ToastComponent from "@js/components/Toast.js";
// import {appRouter} from "@js/spa-router/initializeRouter.js";
// import * as bootstrap from "bootstrap";
// import {applyFontSize} from "../functions/display.js";
//
// export default class Dashboard {
// 	constructor(props) {
// 		this.props = props;
// 		this.handleGameRequest = this.handleGameRequest.bind(this);
// 		this.user = null;
// 		this.setUser = this.setUser.bind(this);
// 		this.pongGameConnectivity = 'offline';
// 		this.pongGameNbPlayers = 'bot';
// 		this.purrinhaGameConnectivity = 'offline';
// 		this.purrinhaGameNbPlayers = 'bot';
// 		this.tournamentNbPlayers = '3';
// 		this.load_tournaments= this.load_tournaments.bind(this);
// 	}
//
// 	setUser(user) {
// 		this.user = user;
// 	}
//
// 	setProps(newProps) {
// 		this.props = newProps;
// 	}
//
//     validateInput(name) {
// 		const nameRegex = new RegExp("^[a-zA-Z0-9-_]{3,15}$");
// 		let isValid = true;
//
// 		 if (!nameRegex.test(name)) {
//             document.getElementById('tournament-name').classList.add('is-invalid');
//             isValid = false;
//         } else {
//             document.getElementById('tournament-name').classList.remove('is-invalid');
//         }
// 		 return isValid;
// 	}
//
// 	handleTournamentCreation = () => {
// 		console.log("Tournament creation handled");
// 		const nbPlayers = this.tournamentNbPlayers;
// 		console.log("Number of players: ", nbPlayers);
// 		const csrfToken = getCookie('csrftoken');
// 		const tournamentName = document.getElementById('tournament-name').value;
// 		if (!this.validateInput(tournamentName)) {
// 			return;
// 		}
// 		const createTournamentModal = bootstrap.Modal.getInstance(document.getElementById('create-tournament-modal'));
// 		if (createTournamentModal) {
// 			createTournamentModal.hide();
// 			const backdrops = document.querySelectorAll('.modal-backdrop');
// 			backdrops.forEach(backdrop => backdrop.remove());
// 		}
// 		fetch(`https://${window.location.hostname}:8443/tournament/create`, {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json',
// 				'X-CSRFToken': csrfToken
// 			},
// 			credentials: 'include',
// 			body: JSON.stringify({
// 				'nb_players': nbPlayers,
// 				'name': document.getElementById('tournament-name').value,
// 			})
// 		})
// 		.then(response => response.json().then(data => ({ok: response.ok, data})))
// 		.then(({ok, data}) => {
// 			if (!ok) {
// 				console.log("Tournament creation error: ", data);
// 				const toastComponent = new ToastComponent();
// 				toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
// 			} else {
// 				console.log("Tournament creation success: ", data);
// 				const params = new URLSearchParams(data).toString();
// 					console.log("Params: ", params);
// 					appRouter.navigate(`/tournament/${data.name}`);
// 			}
// 		})
// 		.catch(error => {
// 			console.error("Error fetching tournament creation: ", error);
// 			const toastComponent = new ToastComponent();
// 			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
// 		});
// 	}
//
//     getGameCode = (nb_players) => {
// 		let code = null;
// 		switch (nb_players) {
// 			case 'bot':
// 				code = '10';
// 				break;
// 			case 'offline-1v1':
// 				code = '20';
// 				break;
// 			case 'online-1v1':
// 				code = '22';
// 				break;
// 			case 'online-2v2':
// 				code = '40';
// 				break;
// 			default:
// 				code = null;
// 		}
// 		return code;
// 	}
//
//
// 	handleGameRequest = (game_type) => {
// 		let code = null;
// 		if (game_type === 'pong') {
// 			code = this.getGameCode(this.pongGameNbPlayers);
// 		} else {
// 			code = this.getGameCode(this.purrinhaGameNbPlayers);
// 		}
// 		if (!code || !game_type) {
// 			return;
// 		}
// 		const csrfToken = getCookie('csrftoken');
// 		fetch(`https://${window.location.hostname}:8443/game/${game_type}/${code}`, {
// 			method: 'GET',
// 			headers: {
// 				'Content-Type': 'application/json',
// 				'X-CSRFToken': csrfToken
// 			},
// 			credentials: 'include'
// 		})
// 			.then(response => response.json().then(data => ({ok: response.ok, data})))
// 			.then(({ok, data}) => {
// 				if (!ok) {
// 					const toastComponent = new ToastComponent();
// 					toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
// 				} else {
// 					console.log("Game request success: ", data);
// 					data.code = code;
// 					const params = new URLSearchParams(data).toString();
// 					// Close modal
// 					const createMatchModal = bootstrap.Modal.getInstance(document.getElementById('create-match-modal'));
// 					if (createMatchModal)
// 						createMatchModal.hide();
// 						const backdrops = document.querySelectorAll('.modal-backdrop');
// 						backdrops.forEach(backdrop => backdrop.remove());
// 					appRouter.navigate(`/${game_type}?${params}`);
// 				}
// 			})
// 			.catch(error => {
// 				console.error("Error fetching friend requests: ", error);
// 				const toastComponent = new ToastComponent();
// 				toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
// 			});
// 	}
//
// 	load_tournaments(type = "all") {
// 		const csrfToken = getCookie('csrftoken');
// 		if (type === 'user') {
// 			type = this.user.username;
// 		}
// 		fetch(`https://${window.location.hostname}:8443/tournament/history/${type}`, {
// 			method: 'GET',
// 			header: {
// 				'Content-Type': 'application/json',
// 				'X-CSRFToken': csrfToken
// 			},
// 			credentials: 'include'
// 		})
// 		.then(response => response.json().then(data => ({ok: response.ok, data})))
// 		.then(({ok, data}) => {
// 			if (!ok) {
// 				const toastComponent = new ToastComponent();
// 				toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
// 			} else {
// 				const carouselInner = document.querySelector('.carousel-inner');
// 				const carouselIndicators = document.querySelector('.carousel-indicators');
//
// 				if (carouselInner && carouselIndicators) {
// 					carouselInner.innerHTML = '';
// 					carouselIndicators.innerHTML = '';
//
// 					if (data.length === 0) {
// 						carouselInner.innerHTML = `
// 							<div class="d-flex justify-content-center align-items-center text-center w-full h-full">
// 								<p class="play-bold fs-4 m-0">No tournament found</p>
// 							</div>
// 						`;
// 					} else {
// 						data.forEach((tournament, index) => {
// 							const isActive = index === 0 ? 'active' : '';
// 							const slide = this.generate_tournament_slide(tournament, isActive);
// 							carouselInner.insertAdjacentHTML('beforeend', slide);
//
// 							carouselIndicators.insertAdjacentHTML('beforeend', `
// 								<button type="button" data-bs-target="#carouselTournament"
// 									data-bs-slide-to="${index}"
// 									class="${isActive}"
// 									aria-label="Slide ${index + 1}"></button>
// 							`);
// 						});
// 					}
// 				}
// 			}
// 		})
// 		.catch(error => {
// 			console.error("Error fetching tournaments: ", error);
// 			const toastComponent = new ToastComponent();
// 			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
// 		});
// 	}
//
// 	generate_tournament_slide(tournament, isActive) {
//     	const status = tournament.status;
// 		const playerCount = tournament.players.length;
// 		const winner = tournament.winner !== 'unknown' ? `Winner: ${tournament.winner}` : '';
//
// 		let statusHTML;
// 		if (status === 'waiting for players') {
// 			statusHTML = `<div class="status open">Open to join - ${playerCount} player(s) registered</div>`;
// 		} else if (status === 'running') {
// 			statusHTML = `<div class="status closed">Closed - Tournament is ongoing</div>`;
// 		} else {
// 			statusHTML = `<div class="status finished">Finished ${winner}</div>`;
// 		}
//
// 		return `
// 			<div class="carousel-item ${isActive}">
// 				<div class="tournament-slide d-flex flex-column justify-content-center align-items-center">
// 					<p class="fs-3 play-bold m-1 cursor-click" route="/tournament/${tournament.name}">${tournament.name}</p>
// 					${statusHTML}
// 				</div>
// 			</div>
// 		`;
// 	}
//
// 	setupEventListeners() {
// 		const pong_modal = document.getElementById('create-pong-match-modal');
// 		if (pong_modal) {
// 			pong_modal.addEventListener('show.bs.modal', (event) => {
// 				// Handle game request
// 				const pongGameRequestBtn = document.getElementById('pong-game-request-btn');
// 				if (pongGameRequestBtn) {
// 					if (!pongGameRequestBtn.hasAttribute('data-listener')) {
// 						pongGameRequestBtn.addEventListener('click', () => this.handleGameRequest('pong'));
// 						pongGameRequestBtn.setAttribute('data-listener', 'true');
// 					}
// 				}
// 				// Get initial number of players options
// 				const nbPlayersContainer = document.querySelectorAll('input[name="pong-nb-players"]');
// 				nbPlayersContainer.forEach(radio => {
// 					radio.addEventListener('change', (event) => {
// 						this.pongGameNbPlayers = event.target.value;
// 					});
// 				});
// 				// Update number of players options depending on game connectivity (local / offline)
// 				const connectivityRadios = document.querySelectorAll('input[name="pong-connectivity"]');
// 				connectivityRadios.forEach(radio => {
// 					radio.addEventListener('change', (event) => {
// 						const connectivityValue = this.pongGameConnectivity = event.target.value;
// 						const nbPlayersContainer = document.getElementById('pong-radio-btn-players-container');
// 						if (nbPlayersContainer) {
// 							nbPlayersContainer.innerHTML = '';
// 							if (connectivityValue === 'offline') {
// 								this.pongGameNbPlayers = 'bot';
// 								nbPlayersContainer.innerHTML = `
//                                     <input type="radio" class="btn-check" name="pong-nb-players" id="pong-radio-btn-offline-bot" value="bot" autocomplete="off" checked>
//                                     <label class="btn btn-outline-primary" for="pong-radio-btn-offline-bot">
//                                         <i class="bi bi-robot"></i>
//                                         <p>1v1 against a bot</p>
//                                     </label>
//                                     <input type="radio" class="btn-check" name="pong-nb-players" id="pong-radio-btn-offline-1v1" value="offline-1v1" autocomplete="off">
//                                     <label class="btn btn-outline-primary" for="pong-radio-btn-offline-1v1">
//                                         <i class="bi bi-keyboard"></i>
//                                         <p>1v1 on the same keyboard</p>
//                                     </label>
//                                    `;
// 								const nbPlayersRadios = document.querySelectorAll('input[name="pong-nb-players"]');
// 								nbPlayersRadios.forEach(radio => {
// 									radio.addEventListener('change', (event) => {
// 										this.pongGameNbPlayers = event.target.value;
// 									});
// 								});
// 							} else {
// 								this.pongGameNbPlayers = 'online-1v1';
// 								nbPlayersContainer.innerHTML = `
//                                     <input type="radio" class="btn-check" name="pong-nb-players" id="pong-radio-btn-online-1v1" value="online-1v1" autocomplete="off" checked>
//                                     <label class="btn btn-outline-primary" for="pong-radio-btn-online-1v1">
//                                         <i class="bi bi-person"></i>
//                                         <p>1v1</p>
//                                     </label>
//
//                                     <input type="radio" class="btn-check" name="pong-nb-players" id="pong-radio-btn-online-2v2" value="online-2v2" autocomplete="off">
//                                     <label class="btn btn-outline-primary" for="pong-radio-btn-online-2v2">
//                                         <i class="bi bi-people"></i>
//                                         <p>2v2</p>
//                                     </label>
//                                    `;
// 								const nbPlayersRadios = document.querySelectorAll('input[name="pong-nb-players"]');
// 								nbPlayersRadios.forEach(radio => {
// 									radio.addEventListener('change', (event) => {
// 										this.pongGameNbPlayers = event.target.value;
// 									});
// 								});
// 							}
// 						}
// 					});
// 				});
// 			});
// 			applyFontSize();
// 		}
//
// 		const purrinha_modal = document.getElementById('create-purrinha-match-modal');
// 		if (purrinha_modal) {
// 			purrinha_modal.addEventListener('show.bs.modal', (event) => {
// 				// Handle game request
// 				const purrinhaGameRequestBtn = document.getElementById('purrinha-game-request-btn');
// 				if (purrinhaGameRequestBtn) {
// 					if (!purrinhaGameRequestBtn.hasAttribute('data-listener')) {
// 						purrinhaGameRequestBtn.addEventListener('click', () => this.handleGameRequest('purrinha'));
// 						purrinhaGameRequestBtn.setAttribute('data-listener', 'true');
// 					}
// 				}
// 				// Get initial number of players options
// 				const nbPlayersContainer = document.querySelectorAll('input[name="purrinha-nb-players"]');
// 				nbPlayersContainer.forEach(radio => {
// 					radio.addEventListener('change', (event) => {
// 						this.purrinhaGameNbPlayers = event.target.value;
// 					});
// 				});
// 				// Update number of players options depending on game connectivity (local / offline)
// 				const connectivityRadios = document.querySelectorAll('input[name="purrinha-connectivity"]');
// 				connectivityRadios.forEach(radio => {
// 					radio.addEventListener('change', (event) => {
// 						const connectivityValue = this.purrinhaGameConnectivity = event.target.value;
// 						const nbPlayersContainer = document.getElementById('purrinha-radio-btn-players-container');
// 						if (nbPlayersContainer) {
// 							nbPlayersContainer.innerHTML = '';
// 							if (connectivityValue === 'offline') {
// 								this.purrinhaGameNbPlayers = 'bot';
// 								nbPlayersContainer.innerHTML = `
//                                     <input type="radio" class="btn-check" name="purrinha-nb-players" id="purrinha-radio-btn-offline-bot" value="bot" autocomplete="off" checked>
//                                     <label class="btn btn-outline-primary" for="purrinha-radio-btn-offline-bot">
//                                         <i class="bi bi-robot"></i>
//                                         <p>1v1 against a bot</p>
//                                     </label>
//                                    `;
// 								const nbPlayersRadios = document.querySelectorAll('input[name="purrinha-nb-players"]');
// 								nbPlayersRadios.forEach(radio => {
// 									radio.addEventListener('change', (event) => {
// 										this.purrinhaGameNbPlayers = event.target.value;
// 									});
// 								});
// 							} else {
// 								this.purrinhaGameNbPlayers = 'online-1v1';
// 								nbPlayersContainer.innerHTML = `
//                                     <input type="radio" class="btn-check" name="purrinha-nb-players" id="purrinha-radio-btn-online-1v1" value="online-1v1" autocomplete="off" checked>
//                                     <label class="btn btn-outline-primary" for="purrinha-radio-btn-online-1v1">
//                                         <i class="bi bi-person"></i>
//                                         <p>1v1</p>
//                                     </label>
//
//                                     <input type="radio" class="btn-check" name="purrinha-nb-players" id="purrinha-radio-btn-online-2v2" value="online-2v2" autocomplete="off">
//                                     <label class="btn btn-outline-primary" for="purrinha-radio-btn-online-2v2">
//                                         <i class="bi bi-people"></i>
//                                         <p>2v2</p>
//                                     </label>
//                                    `;
// 								const nbPlayersRadios = document.querySelectorAll('input[name="purrinha-nb-players"]');
// 								nbPlayersRadios.forEach(radio => {
// 									radio.addEventListener('change', (event) => {
// 										this.purrinhaGameNbPlayers = event.target.value;
// 									});
// 								});
// 							}
// 						}
// 					});
// 				});
// 			});
// 		}
// 		const tournamentModal = document.getElementById('create-tournament-modal');
// 		if (tournamentModal) {
// 			tournamentModal.addEventListener('show.bs.modal', (event) => {
// 				const nbPlayersContainer = document.querySelectorAll('input[name="players"]');
// 				nbPlayersContainer.forEach(radio => {
// 					radio.addEventListener('change', (event) => {
// 						console.log("Number of players changed: ", event.target.value);
// 						this.tournamentNbPlayers = event.target.value;
// 					});
// 				});
//
// 				const tournamentCreationBtn = document.getElementById('tournament-creation-btn');
// 				if (tournamentCreationBtn) {
// 					tournamentCreationBtn.addEventListener('click', this.handleTournamentCreation);
// 				}
// 			});
// 		}
// 		const tournamentFilter = document.getElementById('tournament-filter');
// 		if (tournamentFilter) {
// 			tournamentFilter.addEventListener('change', (event) => {
// 				const type = event.target.value;
// 				this.load_tournaments(event.target.value);
// 			});
// 		}
// 		this.load_tournaments("all");
// 	}
//
// 	render() {
// 		// document.title = "ft_transcendence";
// 		return `
// 		<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
//             <div class="h-100 w-full d-flex flex-column justify-content-center align-items-center px-5" style="gap: 32px;">
//             	<div class="d-flex flex-row justify-content-center w-3-4" style="gap: 32px">
//
//             		<!-- Pong game -->
//             		<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;"
//             		data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip"
//             		title="A 3D adaptation of one of the oldest video game. Play offline against a bot or a friend, or online on 1v1 or 2v2.">
//             			<p class="play-bold title">Pong 🏓</p>
//             			<div class="d-flex flex-column justify-content-center align-items-center gap-3 w-full">
//             				<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1 play-btn" data-bs-toggle="modal" data-bs-target="#create-pong-match-modal" style="background-color: #3b82f6">
//             					<p class="play-regular cta-text m-0 play-btn-text text-white">Play</p>
// 							</button>
//             			</div>
// 					</div>
//
//             		<!-- Purrinha game -->
//             		<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded gap-3" style="--bs-bg-opacity: .5;"
//             		data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" title="A classic bar game! You have 3 tokens at disposal.
//             			Each player select from 0 to 3 to hide in its hand. The goal is to guess the total selected by all the players. The closest to the total wins the round.">
//             			<p class="play-bold title">Purrinha ✋</p>
//             			<div class="d-flex flex-column justify-content-center align-items-center gap-3 w-full">
//             				<button type="button" class="btn d-flex justify-content-center align-items-center w-fit px-4 py-1 play-btn" data-bs-toggle="modal" data-bs-target="#create-purrinha-match-modal" style="background-color: #3b82f6">
//             					<p class="play-regular cta-text m-0 play-btn-text text-white">Play</p>
// 							</button>
//             			</div>
// 					</div>
//             	</div>
//
//             	<!-- Tournament -->
//             	<div class="w-3-4 bg-white d-flex flex-column align-items-center py-4 px-4 rounded overflow-auto" style="--bs-bg-opacity: .5;"
// 					<div class="w-full">
// 						<p class="play-bold fs-2">Pong tournament 🏆</p>
// 						<div class="d-flex flex-row flex-wrap align-items-center justify-content-evenly w-full">
// 							<div class="d-flex flex-column m-3 align-items-center">
// 								<div id="carouselTournament" class="carousel slide w-350 d-flex flex-column justify-content-center px-5 bg-tournament rounded p-3" data-bs-ride="carousel">
// 									<div class="carousel-indicators m-0"></div>
// 									<div class="carousel-inner"></div>
// 									<button class="carousel-control-prev" type="button" data-bs-target="#carouselTournament" data-bs-slide="prev">
// 										<span class="carousel-control-prev-icon" aria-hidden="true"></span>
// 										<span class="visually-hidden">Previous</span>
// 									</button>
// 									<button class="carousel-control-next" type="button" data-bs-target="#carouselTournament" data-bs-slide="next">
// 										<span class="carousel-control-next-icon" aria-hidden="true"></span>
// 										<span class="visually-hidden">Next</span>
// 									</button>
// 								</div>
// 								<select class="form-select custom-select-filter-icon m-2" id="tournament-filter" aria-label="Select filter" style="width: min-content; height: min-content;">
// 									<option value="all">All</option>
// 									<option value="user">Yours</option>
// 									<option value="open">Opened</option>
// 								</select>
// 							</div>
// 							<div class="d-flex flex-column justify-content-center align-items-center p-3">
// 								<button type="button" class="btn d-flex justify-content-center align-items-center w-fit py-1 play-btn" data-bs-toggle="modal" data-bs-target="#create-tournament-modal" style="background-color: #3b82f6">
// 									<i class="bi bi-plus-circle mx-3"></i>
// 									<p class="fs-4 m-1 text-white">New tournament</p>
// 								</button>
// 							</div>
// 						</div>
// 					</div>
//             	</div>
//
// 				<!--	Pong modal	-->
// 				<div class="modal fade" id="create-pong-match-modal" tabindex="-1" aria-labelledby="create pong match modal" aria-hidden="true">
// 					<div class="modal-dialog">
// 						<div class="modal-content">
// 							<div class="modal-header">
// 								<h1 class="modal-title title">Play pong 🏓</h1>
// 								<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
// 							</div>
// 							<div class="modal-body">
// 								<div class="mb-3">
// 									<p class="text mb-1">Choose a game type</p>
// 									<div class="btn-group" role="group" aria-label="Game connectivity selection">
// 										<input type="radio" class="btn-check" name="pong-connectivity" id="pong-radio-btn-offline" value="offline" autocomplete="off" checked>
// 										<label class="btn btn-outline-primary" for="pong-radio-btn-offline">
// 											<i class="bi bi-wifi-off"></i>
// 											<p>Local</p>
// 										</label>
// 										<input type="radio" class="btn-check" name="pong-connectivity" id="pong-radio-btn-online" value="online" autocomplete="off">
// 										<label class="btn btn-outline-primary" for="pong-radio-btn-online">
// 											<i class="bi bi-wifi"></i>
// 											<p>Online</p>
// 										</label>
// 									</div>
// 								</div>
// 								<div class="mb-3">
// 									<p class="text mb-1">Choose a number of players</p>
// 									<div id="pong-radio-btn-players-container" class="btn-group" role="group" aria-label="Game connectivity selection">
// 										<input type="radio" class="btn-check" name="pong-nb-players" id="pong-radio-btn-offline-bot" value="bot" autocomplete="off" checked>
// 										<label class="btn btn-outline-primary" for="pong-radio-btn-offline-bot">
// 											<i class="bi bi-robot"></i>
// 											<p>1v1 against a bot</p>
// 										</label>
// 										<input type="radio" class="btn-check" name="pong-nb-players" id="pong-radio-btn-offline-1v1" value="offline-1v1" autocomplete="off">
// 										<label class="btn btn-outline-primary" for="pong-radio-btn-offline-1v1">
// 											<i class="bi bi-keyboard"></i>
// 											<p>1v1 on the same keyboard</p>
// 										</label>
// 									</div>
// 								</div>
// 							</div>
// 							<div class="modal-footer">
// 								<button type="button" class="btn text-danger" data-bs-dismiss="modal">Close</button>
// 								<button id="pong-game-request-btn" type="button" class="btn btn-primary">Launch a game! 🚀</button>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
//
// 				<!--	Purrinha modal	-->
// 				<div class="modal fade" id="create-purrinha-match-modal" tabindex="-1" aria-labelledby="create purrinha match modal" aria-hidden="true">
// 					<div class="modal-dialog">
// 						<div class="modal-content">
// 							<div class="modal-header">
// 								<h1 class="modal-title title">Play purrinha ✋</h1>
// 								<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
// 							</div>
// 							<div class="modal-body">
// 								<div class="mb-3">
// 									<p class="text mb-1">Choose a game type</p>
// 									<div class="btn-group" role="group" aria-label="Game connectivity selection">
// 										<input type="radio" class="btn-check" name="purrinha-connectivity" id="purrinha-radio-btn-offline" value="offline" autocomplete="off" checked>
// 										<label class="btn btn-outline-primary" for="purrinha-radio-btn-offline">
// 											<i class="bi bi-wifi-off"></i>
// 											<p>Local</p>
// 										</label>
// 										<input type="radio" class="btn-check" name="purrinha-connectivity" id="purrinha-radio-btn-online" value="online" autocomplete="off">
// 										<label class="btn btn-outline-primary" for="purrinha-radio-btn-online">
// 											<i class="bi bi-wifi"></i>
// 											<p>Online</p>
// 										</label>
// 									</div>
// 								</div>
// 								<div class="mb-3">
// 									<p class="text mb-1">Choose a number of players</p>
// 									<div id="purrinha-radio-btn-players-container" class="btn-group" role="group" aria-label="Game connectivity selection">
// 										<input type="radio" class="btn-check" name="purrinha-nb-players" id="purrinha-radio-btn-offline-bot" value="bot" autocomplete="off" checked>
// 										<label class="btn btn-outline-primary" for="purrinha-radio-btn-offline-bot">
// 											<i class="bi bi-robot"></i>
// 											<p>1v1 against a bot</p>
// 										</label>
// 									</div>
// 								</div>
// 							</div>
// 							<div class="modal-footer">
// 								<button type="button" class="btn text-danger" data-bs-dismiss="modal">Close</button>
// 								<button id="purrinha-game-request-btn" type="button" class="btn btn-primary">Launch a game! 🚀</button>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
//
// 				<div class="modal fade" id="create-tournament-modal" tabindex="-1" aria-labelledby="create tournament modal" aria-hidden="true">
// 					<div class="modal-dialog">
// 						<div class="modal-content">
// 							<div class="modal-header">
// 								<h1 class="modal-title fs-5">Pong tournament settings</h1>
// 								<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
// 							</div>
//
// 							<div class="modal-body">
// 								<p class="mb-3">Choose the number of players</p>
// 								<div id="radio-btn-players-container" class="btn-group" role="group" aria-label="Game connectivity selection">
// 									<input type="radio" class="btn-check" name="players" id="radio-btn-3p" value="3" autocomplete="off" checked>
// 									<label class="btn btn-outline-primary" for="radio-btn-3p">
// 										<i class="bi bi-person-fill"></i>
// 										<i class="bi bi-person-fill"></i>
// 										<i class="bi bi-person-fill"></i>
// 										<p class="m-2">3 players</p>
// 									</label>
//
// 									<input type="radio" class="btn-check" name="players" id="radio-btn-4p" value="4" autocomplete="off">
// 									<label class="btn btn-outline-primary" for="radio-btn-4p">
// 										<i class="bi bi-person-fill"></i>
// 										<i class="bi bi-person-fill"></i>
// 										<i class="bi bi-person-fill"></i>
// 										<i class="bi bi-person-fill"></i>
// 										<p class="m-2">4 players</p>
// 									</label>
// 								</div>
// 							</div>
//
// 							<div class="row g-2 m-3">
// 								<p class="mb-3">Choose the number of players</p>
// 								<div class="form-floating has-validation">
// 									<input type="text" id="tournament-name" class="form-control" required />
// 									<label for="name">Name<span class="text-danger">*</span></label>
// 									<div class="form-text">Username has to be 3 to 15 characters long and composed only by letters, digits and hyphens (- or _)</div>
// 									<div class="invalid-feedback">Name have an invalid format</div>
// 								</div>
// 							</div>
//
// 							<div class = "modal-infos">
// 							<p class="mx-3 fst-italic">The tournaments are organized on the round-robin system, which means each participant plays once against everyone</p>
// 							</div>
//
// 							<div class="modal-footer">
// 								<button type="button" class="btn text-danger" data-bs-dismiss="modal">Close</button>
// 								<button id="tournament-creation-btn" type="button" class="btn btn-primary">Start tournament! 🚀</button>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
//             </div>
//         `;
// 	}
// }

import {getCsrf, isUserConnected} from "@js/functions/user_auth.js";
import Navbar from "@js/components/Navbar.js";
import {remove_modal_backdrops} from "@js/functions/display.js";

export default class Router {
    constructor(routes = [], renderNode) {
        this.routes = routes;
        this.renderNode = renderNode;
        this.navbar = new Navbar();
        this.historyStack = [];
        this.init();
    }

    async init() {
        this.addEventListeners();
        await getCsrf();
        this.historyStack.unshift(window.location.pathname + window.location.search)
        await this.navigate(window.location.pathname + window.location.search);
    }

    addEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[route]');
            if (target) {
                e.preventDefault();
                const path = target.getAttribute('route');
                this.navigate(path);
            }
        });

        window.addEventListener('popstate', (e) => {
            this.navigate(window.location.pathname, false);
        });
    }

    async navigate(path, pushState = true) {
        if (path !== "/") {
            path = path.replace(/\/+$/, ''); // Remove trailing slashes
        }
        // find all elements with class "modal-backdrop" and remove them
        remove_modal_backdrops();
        const publicRoutes = ['/', '/register', '/reset_password_confirmed', '/set-reset-password'];
        const isUserAuth = await isUserConnected();
        const route = this.routes.find(route => this.match(route, path));
        if (!route) {
            this.historyStack.unshift(path);
            window.history.pushState(null, null, path);
            this.renderNode.innerHTML = '' +
                '<h1 class="mb-6 play-bold" style="font-size: 6rem">404</h1>' +
                '<img src="/homer.webp" alt="homer simpson disappearing" class="rounded w-1-2 mb-4" />' +
                '<li style="list-style-type:none;"><a role="button" route="/" class="btn btn-primary btn-lg">Return home</a></li>';
            return;
        }
        if (isUserAuth) {
            route.setUser(isUserAuth);
        }
        const isPublicRoute = this.isPublicRoute(publicRoutes, path);
        if (!isPublicRoute && !isUserAuth) {
            this.historyStack.unshift("/");
            window.history.pushState(null, null, '/'); // Redirect to home
            const home = this.routes.find(route => this.match(route, "/"));
            this.renderNode.innerHTML = home.renderView();
            home.setupEventListeners();
            if (window.mySocket && window.mySocket.readyState === WebSocket.OPEN) {
                window.mySocket.close();
                console.log('WebSocket connection closed');
            }
            return ;
        } else if (isPublicRoute && isUserAuth) {
            this.historyStack.unshift("/dashboard");
            window.history.pushState(null, null, '/dashboard'); // Redirect to dashboard
            const dashboard = this.routes.find(route => this.match(route, "/dashboard"));
            this.navbar.setUser(isUserAuth);
            if (window.myPongSocket && window.myPongSocket.readyState === WebSocket.OPEN) {
                window.myPongSocket.close();
                console.log('Pong websocket connection closed');
            }
            else if (window.myPurrinhaSocket && window.myPurrinhaSocket.readyState === WebSocket.OPEN) {
                window.myPurrinhaSocket.close();
                console.log('Purrinha websocket connection closed');
            }
            console.log("Destination path is: ", path);
            this.renderNode.innerHTML = this.navbar.render() + dashboard.renderView();
            this.navbar.setupEventListeners();
            dashboard.setupEventListeners();
            return ;
        }

        // If route is valid, render the view
        if (route.user) {
            this.navbar.setUser(route.user);
            if (route.path === "/purrinha" || route.path === "/pong") {
                this.renderNode.innerHTML = route.renderView(path);
            } else {
                console.log("Current path is: ", window.location.pathname);
                if (window.myPongSocket && window.myPongSocket.readyState === WebSocket.OPEN) {
                    window.myPongSocket.close();
                    console.log('Pong websocket connection closed');
                }
                else if (window.myPurrinhaSocket && window.myPurrinhaSocket.readyState === WebSocket.OPEN) {
                    window.myPurrinhaSocket.close();
                    console.log('Purrinha websocket connection closed');
                }
                console.log("Destination path is: ", path);
                this.renderNode.innerHTML = this.navbar.render() + route.renderView(path);
            }
            this.navbar.setupEventListeners();
        }
        else {
            this.renderNode.innerHTML = route.renderView(path);
        }
        route.setupEventListeners(path);

        // Update the browser history
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath === path || (currentPath.startsWith('/pong') && path.startsWith('/pong')) || (currentPath.startsWith('/purrinha') && path.startsWith('/purrinha'))) {
            window.history.replaceState(null, null, path);
        } else {
            const query = path.split('?')[1];
            path += query ? '?' + query : '';
            this.historyStack.unshift(path);
            window.history.pushState(null, null, path);
        }
    }

    getQueryParams(query) {
        return Object.fromEntries(new URLSearchParams(query).entries());
    }

    getURLParameters(path) {
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        const splited = path.split('/');
        const parameters = [];
        for (let i = 1; i < splited.length; i++) {
            const part = splited[i];
            parameters.push(part);
        }
        return parameters;
    }

    // Match the route path to the current location path
    match(route, requestPath) {
        const splitPath = requestPath.split('?');
        const pathWithoutQuery = splitPath[0];
        const query = splitPath[1];
        if (requestPath.search("//") !== -1) {
            return false;
        }
        const parameters = this.getURLParameters(requestPath);
        if (parameters.length !== route.parameters()) {
            return false;
        }
        const regexPath = route.path.replace(/([:*])(\w+)/g, (full, colon, name) => {
            return '([^\/]+)';
        }) + '(?:\/|$)';
        let params = {};
        const routeMatch = pathWithoutQuery.match(new RegExp(regexPath));
        if (routeMatch !== null) {
            params = this.getQueryParams(query);
            if (route.path === '/stats') {
                params.username = parameters[0];
            }
            else if (route.path === '/tournament') {
                params.id = parameters[0];
            }
            route.setProps(params);
            return true;
        }
        return false;
    }

    isPublicRoute(publicRoutes, path) {
        for (const route of publicRoutes) {
            const regexPath = route.replace(/([:*])(\w+)/g, (full, colon, name) => {
                return '([^\/]+)';
            }) + '(?:\/|$)';
            const routeMatch = path.match(new RegExp(regexPath));
            if (routeMatch !== null) {
                return true;
            }
        }
        return false;
    }
}