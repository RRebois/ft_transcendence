import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import moment from "moment";
import Chart from 'chart.js/auto';
import {applyFontSize} from "../functions/display.js";

export default class Stats {
	constructor(props) {
		this.props = props;
		this.user = props?.user;
		this.setUser = this.setUser.bind(this);
		this.removeUser = this.removeUser.bind(this);
		this.fetchStats = this.fetchStats.bind(this);
		this.fetchMatchHistory = this.fetchMatchHistory.bind(this);
		this.chartInstance = null;
		// this.init(this.user?.username);
	}

	setUser = (user) => {
		this.user = user;
	}

	removeUser() {
		if (this.user) this.user = null;
	}

	setProps(newProps) {
		this.props = newProps;
	}

	initEloChart = (data) => {
		const ctx = document.getElementById('eloChart').getContext('2d');

		const getEloData = (eloArray) => {
			const extractedElo = eloArray.map(entry => entry?.elo || 900).reverse();
			while (extractedElo.length < 16) {
				extractedElo.push(900);
			}
			return extractedElo.slice(0, 16).reverse();
		}

		const pongElo = getEloData(data.pong.elo);
		const purrinhaElo = getEloData(data.purrinha.elo);

		this.chartInstance = new Chart(ctx, {
			type: 'line',
			data: {
				labels: ['L.M. -15', 'L.M. -14', 'L.M. -13', 'L.M. -12', 'L.M. -11', 'L.M. -10', 'L.M. -9', 'L.M. -8', 'L.M. -7', 'L.M. -6', 'L.M. -5', 'L.M. -4', 'L.M. -3', 'L.M. -2', 'L.M. -1', 'Last match'],
				datasets: [{
					label: 'Pong elo 🏓',
					data: pongElo,
					borderColor: '#f02e2d',
					backgroundColor: '#f02e2d',
					fill: false
				}, {
					label: 'Purrinha elo ✋',
					data: purrinhaElo,
					borderColor: '#f0902d',
					backgroundColor: '#f0902d',
					fill: false
				}]
			},
			options: {
				responsive: true,
				aspectRatio: 1.3,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						position: 'top',
					},
					title: {
						display: true,
						text: 'Elo progression'
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: "Previous matches"
						}
					},
					y: {
						title: {
							display: true,
							text: "Elo"
						},
						suggestedMin: 0,
						suggestedMax: 2000,
					}
				},
			}
		});
	}

	fetchStats = (username) => {
		const csrfToken = getCookie('csrftoken');
		fetch(`https://${window.location.hostname}:8443/stats/${username}`, {
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
				toastComponent.throwToast('Error', data.message, 5000, 'error');
			} else {
				this.animateProgressBar(data.pong.elo[data.pong.elo.length - 1].elo, 'pong', '#f02e2d');
				this.animateProgressBar(data.purrinha.elo[data.purrinha.elo.length - 1].elo, 'purrinha', '#f0902d');
				this.initEloChart(data);
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
		fetch(`https://${window.location.hostname}:8443/matches/${username}:${type}`, {
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
				toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
			} else {
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
						const   date = moment(match.timestamp, "MMM DD YYYY, hh:mm A");
						const   matchElement = document.createElement('div');
						const   background = match?.winner.includes(username) ? 'bg-victory' : 'bg-defeat';
						const   count = match.count;
						const   victoryMsg = match?.deconnection ? " Victory by forfeit" : " Victory";
						const   defeatMsg = match?.deconnection ? "Forfeit" : "Defeat"
						matchElement.classList.add('d-flex', 'my-2', 'flex-row', 'overflow-hidden', 'justify-content-between', 'play-regular', 'align-items-center', background, 'rounded', 'p-2');

						if (count === 2) {
                            matchElement.innerHTML = `
                                <div class="d-flex flex-column align-items-center">
                                    <p class="fs-1 m-0">${match.game === 'pong' ? '🏓' : '✋'}</p>
                                    <p class="fs-6 m-0">${match.game === 'pong' ? 'Pong game' : 'Purrinha game'}</p>
                                </div>

                                <div class="d-flex flex-column">
                                    <div class="d-flex flex-row">
                                        <div class="d-flex flex-column">
                                            <div class="d-flex flex-row align-items-center gap-1">
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[0]?.username}">${match?.players[0]?.username}</p>
                                                    <p class="play-bold m-0 fs-1">${match?.players[0]?.score}</p>
                                            </div>
                                        </div>
                                        <p class="play-bold m-0 fs-1">-</p>
                                        <div class="d-flex flex-column">
                                            <div class="d-flex flex-row align-items-center gap-1">
                                                    <p class="play-bold m-0 fs-1">${match?.players[1]?.score}</p>
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[1]?.username}">${match?.players[1]?.username}</p>
                                            </div>
                                        </div>
                                    </div>
                                        ${match?.winner.includes(username) ?
                                            `<div class="d-flex flex-row">
                                                <i class="bi bi-trophy-fill" style="color: #e4ca6a;"></i>
                                                <p>${victoryMsg}</p>
                                            </div>` :
                                            `<p>${defeatMsg}</p>`
                                        }
                                </div>
                                <p class="play-regular m-0">${date.calendar()}</p>
                            `;
                        }
                        else {
                            matchElement.innerHTML = `
                                <div class="d-flex flex-column align-items-center">
                                    <p class="fs-1 m-0">${match.game === 'pong' ? '🏓' : '✋'}</p>
                                    <p class="fs-6 m-0">${match.game === 'pong' ? 'Pong game' : 'Purrinha game'}</p>
                                </div>
                            `;
                            if (match.game === 'pong') {
                                matchElement.innerHTML += `
                                    <div class="d-flex flex-column">
                                        <div class="d-flex flex-row">
                                            <div class="d-flex flex-column">
                                                <div class="d-flex flex-row align-items-center gap-1">
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[0]?.username}">${match?.players[0]?.username}</p>
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[1]?.username}">${match?.players[1]?.username}</p>
                                                    <p class="play-bold m-0 fs-1">${match.players[0].score}</p>
                                                </div>
                                            </div>
                                            <p class="play-bold m-0 fs-1">-</p>
                                            <div class="d-flex flex-column">
                                                <div class="d-flex flex-row align-items-center gap-1">
                                                    <p class="play-bold m-0 fs-1">${match.players[2].score}</p>
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[2]?.username}">${match?.players[2]?.username}</p>
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[3]?.username}">${match?.players[3]?.username}</p>
                                                </div>
                                            </div>
                                        </div>
                                        ${match?.winner.includes(username) ?
                                            `<div class="d-flex flex-row">
                                                <i class="bi bi-trophy-fill" style="color: #e4ca6a;"></i>
                                                <p>Victory</p>
                                            </div>` :
                                            `<p>Defeat</p>`
                                        }
                                    </div>
                                    <p class="play-regular m-0">${date.calendar()}</p>
                                `;
                            }
                            else {
                                matchElement.innerHTML += `
                                    <div class="d-flex flex-column">
                                        <div class="d-flex flex-row">
                                            <div class="d-flex flex-column">
                                                <div class="d-flex flex-row align-items-center gap-1">
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.winner.username}">${match?.winner.username}</p>
                                                    <p class="play-bold m-0 fs-1">${match?.winner.score}</p>
                                                </div>
                                            </div>
                                            <p class="play-bold m-0 fs-1">-</p>
                                            <div class="d-flex flex-column">
                                                <div class="d-flex flex-row align-items-center gap-1">
                                                    <p class="play-bold m-0 fs-1">${match.players[2].score}</p>
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[2]?.username}">${match?.players[2]?.username}</p>
                                                    <p class="m-0 cursor-click text-dark" route="/stats/${match?.players[3]?.username}">${match?.players[3]?.username}</p>
                                                </div>
                                            </div>
                                        </div>
                                        ${match?.winner.includes(username) ?
                                            `<div class="d-flex flex-row">
                                                <i class="bi bi-trophy-fill" style="color: #e4ca6a;"></i>
                                                <p>Victory</p>
                                            </div>` :
                                            `<p>Defeat</p>`
                                        }
                                    </div>
                                    <p class="play-regular m-0">${date.calendar()}</p>
                                `;
                            }
                        }
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
		applyFontSize();
	}

	animateProgressBar(elo, game, color = '#4285f4') {
		let CircularBar = document.querySelector(`.circular-bar-${game}`);
		let PercentValue = document.querySelector(`.percent-${game}`);
		if (!CircularBar || !PercentValue) {
			return;
		}
		let InitialValue = 0;
		const maxElo = 2000;
		let finaleValue = (elo / maxElo) * 100;
		let speed = 10;

		let timer = setInterval(() => {
			InitialValue += 1;

			CircularBar.style.background = `conic-gradient(${color} ${InitialValue * 3.6}deg, #e8f0f7 0deg)`;
			PercentValue.innerHTML = Math.round(elo);

			if(InitialValue >= finaleValue){
				clearInterval(timer);
			}
		}, speed)
	}

	fetchUser = async (username) => {
		const csrfToken = getCookie('csrftoken');
		try {
			const response = await fetch(`https://${window.location.hostname}:8443/isUserExisting/${username}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken
				},
				credentials: 'include',
			});
			const data = await response.json();
			if (!response.ok || !data) {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
				return null;
			}
			return data;
		}
		catch (error) {
			console.error('Error fetching user:', error);
			return null;
		}
	};

	render() {
		// document.title = `ft_transcendence | ${this.props?.username} stats`;
		return `
			<div class="d-flex w-3-4 min-h-full flex-grow-1 justify-content-center align-items-center" id="statsContainer">
				<div class="h-full w-full d-flex flex-column justify-content-center align-items-center px-5 my-5" style="gap: 16px;">
					<div class="d-flex flex-column w-full" style="gap: 16px">
						<div class="w-full bg-white d-flex flex-column align-items-center py-2 px-5 rounded" style="--bs-bg-opacity: .5;">
							<p class="play-bold title">${this.props?.username} stats</p>
							<div class="d-flex flex-row w-full gap-2 justify-content-center">
								<div id="circles" class="d-flex flex-column justify-content-around gap-2" style="flex: 1 1 25%; min-width: 135px; max-width: 25%;">
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
								<div id="canvasContainer" class="d-flex flex-fill h-full justify-content-center align-self-center align-items-center" style="flex: 1 1 0; min-width: 0;">
									<div class="d-flex w-full h-full flex-fill justify-content-center align-items-center">
										<canvas id="eloChart" style="width: 100%; height: 100%;"></canvas>
									</div>
								</div>
							</div>						
							<div class="w-full mt-5">
								<div class="d-flex flex-row justify-content-between align-items-center overflow-hidden">
									<p class="d-flex play-bold title">Match history</p>	
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

	setupEventListeners =  async () => {
		const username = this?.props?.username;
		const user = await this.fetchUser(username);

		applyFontSize();
		if (user) {
			this.fetchStats(username);
			this.fetchMatchHistory(username);
			const gameFilter = document.getElementById('game-filter');
			if (gameFilter) {
				gameFilter.addEventListener('change', (event) => {
					this.fetchMatchHistory(username, event.target.value);
				});
			}
			window.addEventListener('resize', () => {
			if (this.chartInstance) {
			  this.chartInstance.resize();
			}
		  });
		}
		else{
			//document.title = 'User not found';
        	const contentContainer = document.getElementById("canvasContainer");
        	contentContainer.innerHTML = '<h1>User not found</h1>';
		}
	}
}
