import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import moment from "moment";
import Chart from 'chart.js/auto';

export default class Stats {
	constructor(props) {
		this.props = props;
		this.user = props.user;
		this.fetchStats = this.fetchStats.bind(this);
		this.fetchMatchHistory = this.fetchMatchHistory.bind(this);
		this.init(this.user?.username);
	}

	init = (username) => {
		this.fetchStats(username);
		this.fetchMatchHistory(username);
	}

	initEloChart = (data) => {
		const ctx = document.getElementById('eloChart').getContext('2d');
		new Chart(ctx, {
			type: 'line',
			data: {
				labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
				datasets: [{
					label: 'Pong elo 🏓',
					data: [0, 10, 5, 2, 20, 30, 45],
					borderColor: '#f02e2d',
					backgroundColor: '#f02e2d',
					fill: false
				}, {
					label: 'Purrinha elo ✋',
					data: [0, 5, 2, 15, 25, 35, 50],
					borderColor: '#f0902d',
					backgroundColor: '#f0902d',
					fill: false
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
					},
					title: {
						display: true,
						text: 'Elo progression'
					}
				}
			}
		});
	}

	fetchStats = (username) => {
		const csrfToken = getCookie('csrftoken');
		fetch(`https://localhost:8443/stats/${username}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include'
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				console.log('Stats:', data);
				if (!ok) {
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
				} else {
					console.log('Success:', data);
					this.animateProgressBar(data.elo_pong, 'pong', '#f02e2d');
					this.animateProgressBar(data.elo_purrinha, 'purrinha', '#f0902d');
				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			});
	}

	fetchMatchHistory = (username, type = "all") => {
		const csrfToken = getCookie('csrftoken');
		fetch(`https://localhost:8443/matches/${username}:${type}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include'
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				console.log('Match history:', data);
				if (!ok) {
					const toastComponent = new ToastComponent();
					toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
				} else {
					console.log('Success:', data);
					const matchHistoryContainer = document.getElementById('match-history');
					if (matchHistoryContainer) {
						matchHistoryContainer.innerHTML = '';
						if (data.length === 0) {
							const noMatchElement = document.createElement('div');
							noMatchElement.classList.add('d-flex', 'flex-row', 'justify-content-center', 'align-items-center', 'rounded', 'p-2');
							noMatchElement.innerHTML = `
								<p class="play-regular m-0">No match history.</p>
							`;
							matchHistoryContainer.appendChild(noMatchElement);
						}
						data.forEach(match => {
							const date = moment(match.timestamp);
							const matchElement = document.createElement('div');
							const background = match?.winner === username ? 'bg-victory' : 'bg-defeat';
							matchElement.classList.add('d-flex', 'flex-row', 'justify-content-between', 'play-regular', 'align-items-center', background, 'rounded', 'p-2');
							matchElement.innerHTML = `
								<div class="d-flex flex-column align-items-center">
									<p class="fs-1 m-0">${match.game === 'pong' ? '🏓' : '✋'}</p>
									<p class="fs-6 m-0">${match.game === 'pong' ? 'Pong game' : 'Purrinha game'}</p>
								</div>
								<div class="d-flex flex-column">
									<div class="d-flex flex-row">
										<div class="d-flex flex-column">
											<div class="d-flex flex-row align-items-center gap-1">
												<p class="m-0"><a href="/users/${match.players[0].username}" class="text-dark text-decoration-none">${match.players[0].username}</a></p>
												<p class="play-bold m-0 fs-1">${match.players[0].score}</p>
											</div>
										</div>
										<p class="play-bold m-0 fs-1">-</p>
										<div class="d-flex flex-column">
											<div class="d-flex flex-row align-items-center gap-1">
												<p class="play-bold m-0 fs-1">${match.players[1].score}</p>
												<p class="m-0"><a href="/users/${match.players[1].username}" class="text-dark text-decoration-none">${match.players[1].username}</a></p>
											</div>
										</div>
									</div>
									${match?.winner === username ?
										`<div class="d-flex flex-row">
											<i class="bi bi-trophy-fill" style="color: #e4ca6a;"></i>
											<p>Victory</p>
										</div>` :
										`<p>Loss</p>`
								}
								</div>
								<p class="play-regular m-0">${date.calendar()}</p>
							`;
							matchHistoryContainer.appendChild(matchElement);
						});
					}

				}
			})
			.catch(error => {
				console.error('Error:', error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
			});
	}

	animateProgressBar(elo, game, color = '#4285f4') {
		let CircularBar = document.querySelector(`.circular-bar-${game}`);
		let PercentValue = document.querySelector(`.percent-${game}`);
		if (!CircularBar || !PercentValue) {
			return;
		}
		let InitialValue = 0;
		const maxElo = 2500;
		let finaleValue = (elo / maxElo) * 100;
		let speed = 10;

		let timer = setInterval(() => {
			InitialValue += 1;

			CircularBar.style.background = `conic-gradient(${color} ${InitialValue * 3.6}deg, #e8f0f7 0deg)`;
			PercentValue.innerHTML = Math.round((InitialValue / 100) * maxElo);

			if(InitialValue >= finaleValue){
				clearInterval(timer);
			}
		}, speed)
	}

	render() {
		document.title = 'ft_transcendence | My stats';
		return `
			<div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
				<div class="h-full w-full d-flex flex-column justify-content-center align-items-center px-5" style="gap: 16px;">
					<div class="d-flex flex-column w-full" style="gap: 16px">
						<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded" style="--bs-bg-opacity: .5;">
							<p class="play-bold fs-3">My stats</p>
							<div class="d-flex flex-row w-full gap-2">
								<div class="d-flex flex-column w-1-4 gap-2">
									<div class="d-flex w-full justify-content-center align-items-center">
										<div class="wrapper">
											<div class="circular-bar circular-bar-pong">
												<div class="play-bold percent percent-pong">0</div>
												<div class="elo-label fs-6 play-regular m-0">Pong elo 🏓</div>
											</div>
										</div>
									</div>
									<div class="d-flex w-full justify-content-center align-items-center">
										<div class="wrapper">
											<div class="circular-bar circular-bar-purrinha">
												<div class="play-bold percent percent-purrinha">0</div>
												<div class="elo-label fs-6 play-regular m-0 text-center">Purrinha<br />elo ✋</div>
											</div>
										</div>
									</div>
								</div>
								<div class="d-flex w-full justify-content-center align-items-center">
									<div class="d-flex w-full h-full justify-content-center align-items-center">
										<canvas id="eloChart" style="width: 100%; height: 100%;"></canvas>
									</div>
								</div>
							</div>						
							<div class="w-full mt-5">
								<div class="d-flex flex-row justify-content-between align-items-center">
									<p class="d-flex play-bold fs-3">Match history</p>	
									<select class="form-select custom-select-filter-icon" id="game-filter" aria-label="Select a game" style="width: min-content; height: min-content;">
										<option value="all">All</option>
										<option value="pong">Pong</option>
										<option value="purrinha">Purrinha</option>
									</select>						
								</div>
								<div id="match-history"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	setupEventListeners() {
		const gameFilter = document.getElementById('game-filter');
		if (gameFilter) {
			gameFilter.addEventListener('change', (event) => {
				this.fetchMatchHistory(this.user.username, event.target.value);
			});
		}
		this.initEloChart();
	}
}
