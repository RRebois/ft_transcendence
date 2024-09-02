import { getCookie } from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";

export function remove_friend_request_div(userId) {
	const friendRequestItem = document.getElementById(`friend-request-item-${userId}`);
	friendRequestItem.remove();
}

export function create_friend_request_sent_div(request) {
	const friendRequestContainer = document.getElementById("friend-requests-sent");
	const friendRequestItem = document.createElement("div");
	let statusDot;
	if (request.to_user_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	friendRequestItem.classList.add("d-flex", "w-100", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-5", "rounded");
	friendRequestItem.id = `friend-request-item-${request?.to_user_id}`;
	friendRequestItem.style.cssText = "--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendRequestItem.innerHTML = `
		<div class="position-relative d-inline-block">
			<img src="${request?.to_image_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
				<span style="left: 60px; top: 5px" id="friend-status-${request?.to_user_id}"
				 class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
				<span id = "friend-status-text-${request?.to_user_id}" class="visually-hidden">Offline</span>
			</span>
		</div>
		<p>${request?.to_user || request.to_user__username}</p>
		<p>Sent : ${new Date(request?.time).toLocaleString()}</p>
		<p>${request?.status}</p>
	`;
	friendRequestContainer.appendChild(friendRequestItem);
}

export function create_friend_request_div(request) {
	const friendRequestContainer = document.getElementById("friend-requests");
	const friendRequestItem = document.createElement("div");
	let statusDot;
	if (request.from_user_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	friendRequestItem.classList.add("d-flex", "w-100", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-5", "rounded");
	friendRequestItem.id = `friend-request-item-${request?.from_user_id}`;
	friendRequestItem.style.cssText = "--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendRequestItem.innerHTML = `
		<div class="position-relative d-inline-block">
			<img src="${request?.from_image_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
				<span style="left: 60px; top: 5px" id="friend-status-${request?.from_user_id}"
				 class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
				<span id = "friend-status-text-${request?.from_user_id}" class="visually-hidden">Offline</span>
			</span>
		</div>
		<p>${request?.from_user || request.from_user__username}</p>
		<p>Received : ${new Date(request?.time).toLocaleString()}</p>
		<button class="btn btn-success confirm-request-btn" data-id="${request?.from_user_id}">Accept</button>
		<button class="btn btn-danger decline-request-btn" data-id="${request?.from_user_id}">Decline</button>
	`;
	friendRequestContainer.appendChild(friendRequestItem);
	document.querySelectorAll(".confirm-request-btn").forEach(button => {
		button.addEventListener("click", accept_friend_request);
	});
	document.querySelectorAll(".decline-request-btn").forEach(button => {
		button.addEventListener("click", decline_friend_request);
	});
}

export function create_friend_div_load(friend) {
	const friendListContainer = document.getElementById("user-friends");
	const friendItem = document.createElement("div");
	let statusDot;
	if (friend.from_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	friendItem.classList.add("d-flex", "w-100", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-5", "rounded");
	friendItem.style.cssText = "--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendItem.id = `friend-item-${friend?.from_user_id}`;
	friendItem.innerHTML = `
        <div class="position-relative d-inline-block">
            <img src="${friend?.from_image_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
                <span style="left: 60px; top: 5px" id="friend-status-${friend?.from_user_id}"
                class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
                <span id="friend-status-text-${friend?.from_user_id}" class="visually-hidden">Offline</span>
            </span>
        </div>
        <p>${friend?.from_user}</p>
        <div class="status-container" data-id="${friend?.from_user_id}">
            <p class="status">Status: ${friend?.from_status}</p>
        </div>
        <button class="btn btn-danger remove-friend-btn" data-id="${friend?.from_user_id}">Remove</button>
    `;
	friendListContainer.appendChild(friendItem);
	document.querySelectorAll(".remove-friend-btn").forEach(button => {
		button.addEventListener("click", remove_friend);
	});
}

export function create_friend_div_ws(status, id, img_url, username) {
	const friendListContainer = document.getElementById("user-friends");
	const friendItem = document.createElement("div");
	let statusDot;
	if (status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	console.log("status is: ", status);
	console.log("Dot is: ", statusDot);
	friendItem.classList.add("d-flex", "w-100", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-5", "rounded");
	friendItem.style.cssText = "--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendItem.id = `friend-item-${id}`;
	friendItem.innerHTML = `
        <div class="position-relative d-inline-block">
            <img src="${img_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
                <span style="left: 60px; top: 5px" id="friend-status-${id}"
                class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
                <span id="friend-status-text-${id}" class="visually-hidden">Offline</span>
            </span>
        </div>
        <p>${username}</p>
        <div class="status-container" data-id="${id}">
            <p class="status">Status: ${status}</p>
        </div>
        <button class="btn btn-danger remove-friend-btn" data-id="${id}">Remove</button>
    `;
	friendListContainer.appendChild(friendItem);
	document.querySelectorAll(".remove-friend-btn").forEach(button => {
		button.addEventListener("click", remove_friend);
	});
}

export function remove_friend_div(userId) {
	const friendItem = document.getElementById(`friend-item-${userId}`);
	friendItem.remove();
}

export function accept_friend_request(event) {
	const button = event.target;
	const userId = button.getAttribute("data-id");
	if (button)
		button.disabled = true;
	fetch("https://localhost:8443/accept_friend", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCookie("csrftoken")
		},
		credentials: "include",
		body: JSON.stringify({ from_id: userId })
	})
	.then(response => response.json().then(data => ({ ok: response.ok, data })))
	.then(({ ok, data }) => {
		console.log("Data: ", data);
		if (!ok) {
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
			button.disabled = false;
		} else {
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Success", data.message || "Friend request accepted", 5000);
			remove_friend_request_div(userId);
			create_friend_div_ws(data.status, data.id, data.img_url, data.username);
			button.disabled = false;
		}
	})
	.catch(error => {
		console.error("Error accepting friend request: ", error);
		const toastComponent = new ToastComponent();
		toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		button.disabled = false;
	});
}

export function decline_friend_request(event) {
	const button = event.target;
	const userId = button.getAttribute("data-id");
	if (button)
		button.disabled = true;
	fetch("https://localhost:8443/decline_friend", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCookie("csrftoken")
		},
		credentials: "include",
		body: JSON.stringify({ from_id: userId })
	})
	.then(response => response.json().then(data => ({ ok: response.ok, data })))
	.then(({ ok, data }) => {
		console.log("Data: ", data);
		if (!ok) {
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
			button.disabled = false;
		} else {
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Success", data.message || "Friend request was declined", 5000);
			remove_friend_request_div(userId);
			button.disabled = false;
		}
	})
	.catch(error => {
		console.error("Error declining friend request: ", error);
		const toastComponent = new ToastComponent();
		toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		button.disabled = false;
	});
}

export function remove_friend(event) {
	const button = event.target;
	const userId = button.getAttribute("data-id");
	if (button)
		button.disabled = true;
	console.log("click on remove button ", userId);
	fetch("https://localhost:8443/remove_friend", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCookie("csrftoken")
		},
		credentials: "include",
		body: JSON.stringify({ from_id: userId })
	})
		.then(response => response.json().then(data => ({ ok: response.ok, data })))
		.then(({ ok, data }) => {
			if (!ok) {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
				button.disabled = false;
			} else {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Success", data.message || "Friend successfully removed", 5000);
				remove_friend_div(userId);
				button.disabled = false;
			}
		})
		.catch(error => {
			console.error("Error removing friend: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
			button.disabled = false;
		});
}
