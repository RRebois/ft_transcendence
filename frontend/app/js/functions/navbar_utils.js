import ToastComponent from '@js/components/Toast.js';
import { getCookie } from './cookie.js';

export function create_previous_avatar_div(avatar, changeAvatarCallback) {
    const AvatarsContainer = document.getElementById("previous-pp-list");
    if (AvatarsContainer) {
        const previousAvatarContainer = document.createElement("a");
        const previousAvatar = document.createElement("img");

        previousAvatarContainer.role = "button";
        previousAvatarContainer.classList.add("load-previous-avatar");
        previousAvatarContainer.id = `previous-avatar-btn-${avatar.id}`;

        previousAvatar.classList.add("rounded-circle", "h-40", "w-40", "me-2");
        previousAvatar.src = avatar.url + avatar.image;
        previousAvatar.id = `previous-avatar-${avatar.id}`;
        previousAvatar.alt = "avatar";
        previousAvatarContainer.appendChild(previousAvatar);
        AvatarsContainer.appendChild(previousAvatarContainer);

        previousAvatarContainer.addEventListener('click', () => {
            changeAvatarCallback(avatar.id);
        });
    }
}

export function load_new_notifications() {
		const csrfToken = getCookie('csrftoken');
		fetch(`https://${window.location.hostname}:8443/get_notifications`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include',
		})
		.then(response => response.json().then(data => ({ok: response.ok, data})))
		.then(({ok, data}) => {
			if (!ok) {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast('Error', data.message || 'Something went wrong', 5000, 'error');
			} else {
				const dropdownNotif = document.getElementById('dropdownNotif');
                if (dropdownNotif) {
                    dropdownNotif.innerHTML = "";
                    data.forEach(notification => {
                        const notifElem = document.createElement('li');
                        notifElem.classList.add('bg-notif', 'dropdown-item');
                        notifElem.innerHTML = `
                            <p class="fw-light fst-italic notif-time text-end m-0 me-2">${new Date(notification?.time).toLocaleString()}</p>
                            <a class="text-wrap dropdown-item text">${notification?.message}</a>
                            <div class="dropdown-divider p-0 m-0"></div>
                        `;
                        dropdownNotif.appendChild(notifElem);
				    });
                }
                const notifDot = document.getElementById('new-notif');
                if (notifDot) {
                    notifDot.hidden = false;
                }
			}
		})
		.catch(error => {
			const toastComponent = new ToastComponent();
			toastComponent.throwToast('Error', 'Network error or server is unreachable', 5000, 'error');
		});
	}