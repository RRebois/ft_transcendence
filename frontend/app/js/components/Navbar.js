import { getCookie } from "@js/functions/cookie.js";

export default class Navbar {
	constructor(user = null) {
		this.user = user;
	}

	logoutUser = async (event) => {
		event.preventDefault();
		const csrfToken = getCookie('csrftoken');
		fetch('https://localhost:8443/logout', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include'
		}).then(response => {
			console.log('Logout response:', response);
			window.location.href = '/';
		}).catch(error => {
			console.error('Logout error:', error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
		})
	}

	render() {
		return `
			<nav class="navbar navbar-expand-lg bg-light">
				<div class="container-fluid">
					<a href="/dashboard" class="navbar-brand play-bold">ft_transcendence 🏓</a>
					<div class="dropdown">
						<button class="btn dropdown-toggle d-flex align-items-center" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
							<img src="${this.user?.image_url}" class="rounded-circle h-40 w-40 me-2" alt="avatar">
							<p class="d-none d-md-block mb-0 me-2">${this.user?.username}</p>
						</button>
						<ul class="dropdown-menu">
							<li><a class="dropdown-item" href="#">My profile</a></li>
							<li><a class="dropdown-item" href="#">My stats</a></li>
							<li><a class="dropdown-item" href="#">Friends</a></li>
							<li><hr class="dropdown-divider"></li>
							<li><a class="dropdown-item" href="/settings">Settings</a></li>
							<li><a role="button" id="logout-btn" class="dropdown-item text-danger">Logout</a></li>
						</ul>
					</div>               
				</div>
			</nav>
        `;
	}

	setupEventListeners() {
		const logout = document.getElementById('logout-btn');
		if (logout) {
			logout.addEventListener('click', this.logoutUser);
		}
	}
}
