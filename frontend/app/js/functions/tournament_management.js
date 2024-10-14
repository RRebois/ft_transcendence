import { getCookie } from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {applyFontSize} from "./display.js";

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