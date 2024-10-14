import { getCookie } from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {applyFontSize} from "./display.js";
import {appRouter} from "@js/spa-router/initializeRouter.js";

export function load_tournaments_ws(type = "all") {
    const csrfToken = getCookie('csrftoken');
    if (type === 'user') {
        type = this.user.username;
    }
    fetch(`https://${window.location.hostname}:8443/tournament/history/${type}`, {
        method: 'GET',
        header: {
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
            const carouselInner = document.querySelector('.carousel-inner');
            const carouselIndicators = document.querySelector('.carousel-indicators');

            if (carouselInner && carouselIndicators) {
                carouselInner.innerHTML = '';
                carouselIndicators.innerHTML = '';

                if (data.length === 0) {
                    carouselInner.innerHTML = `
                        <div class="d-flex justify-content-center align-items-center text-center w-full h-full">
                            <p class="play-bold fs-4 m-0">No tournament found</p>
                        </div>
                    `;
                } else {
                    data.forEach((tournament, index) => {
                        const isActive = index === 0 ? 'active' : '';
                        const slide = generate_tournament_slide(tournament, isActive);
                        carouselInner.insertAdjacentHTML('beforeend', slide);

                        carouselIndicators.insertAdjacentHTML('beforeend', `
                            <button type="button" data-bs-target="#carouselTournament" 
                                data-bs-slide-to="${index}" 
                                class="${isActive}" 
                                aria-label="Slide ${index + 1}"></button>
                        `);
                    });
                }
            }
        }
    })
    .catch(error => {
        console.error("Error fetching tournaments: ", error);
        const toastComponent = new ToastComponent();
        toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
    });
}

function generate_tournament_slide(tournament, isActive) {
    const status = tournament.status;
    const playerCount = tournament.players.length;
    const winner = tournament.winner !== 'unknown' ? `Winner: ${tournament.winner}` : '';

    let statusHTML;
    if (status === 'waiting for players') {
        statusHTML = `<div class="status open">Open to join - ${playerCount} player(s) registered</div>`;
    } else if (status === 'running') {
        statusHTML = `<div class="status closed">Closed - Tournament is ongoing</div>`;
    } else {
        statusHTML = `<div class="status finished">Finished ${winner}</div>`;
    }

    return `
        <div class="carousel-item ${isActive}">
            <div class="tournament-slide d-flex flex-column justify-content-center align-items-center">
                <p class="fs-3 play-bold m-1 cursor-click" route="/tournament/${tournament.name}">${tournament.name}</p>
                ${statusHTML}
            </div>
        </div>
    `;
}

export function reload_new_players(tournament_name){
    if (window.location.pathname === `/tournament/${tournament_name}`) {
        appRouter.navigate(window.location.pathname);
    }
}

// export function load_players_ws() {
//     const playerDiv = document.getElementById('players');
//         if (playerDiv) {
//             playerDiv.innerHTML = '';
//             tournament.players.forEach(player => {
//                 const matchsPlayed = this.fetch_matchs_played(tournament, player);
//                 const playerElement = document.createElement('div');
//                 playerElement.classList.add('player-card', 'd-flex', 'flex-wrap', 'flex-row', 'align-items-center', 'justify-content-evenly', 'bg-tournament', 'rounded', 'px-3', 'py-2', 'm-1')
//                 playerElement.innerHTML = `
//                     <div id="user-id" class="d-flex flex-column align-items-center justify-content-center w-128">
//                         <p class="mx-2 my-1 play-bold">${player?.Username}</p>
//                         <img src="${player.img}" alt="user avatar image" class="h-64 w-64 rounded-circle" />
//                     </div>
//                     <div class="d-flex flex-column align-items-center justify-content-center mx-4">
//                         <p class="play-bold">Elo:</p>
//                         <p class="m-0">${player?.stats.pong.elo[0].elo}</p>
//                     </div>
//                     <div class="d-flex flex-column align-items-center justify-content-center w-128">
//                         <p class="play-bold">Matchs played:</p>
//                         <p class="m-0">${matchsPlayed}</p>
//                     </div>
//                 `;
//                 playerDiv.appendChild(playerElement);
//             });
//         }
// }
//
// function fetch_matchs_played(tournament, player) {
//         let counter = 0;
//         tournament.matchs.forEach(match => {
//             if ((match.player1 === player.Username || match.player2 === player.Username) && match.isFinished === "True") {
//                 counter++;
//             }
//         });
//         return counter;
//     }
