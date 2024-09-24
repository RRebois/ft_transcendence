import { getCookie } from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {appRouter} from "@js/spa-router/initializeRouter.js";

export function remove_friend_request_div(userId) {
	const friendRequestItem = document.getElementById(`friend-request-item-${userId}`);
	friendRequestItem.remove();
}

export function create_empty_request(option) {
	const friendRequestContainer = document.getElementById(`friend-requests-${option}`);
	const friendRequestEmpty = document.getElementById(`empty-request-${option}`)
	if (friendRequestEmpty)
		return ;
	const friendRequestItem = document.createElement("div");
	friendRequestItem.id = `empty-request-${option}`;
	friendRequestItem.classList.add("d-flex", "w-100", "mb-3", "justify-content-center", "align-items-center", "bg-white", "login-card", "py-2", "px-2", "rounded");
	friendRequestItem.style.cssText = "--bs-bg-opacity: .5; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendRequestItem.innerHTML = `
		<span class="">Wow such emtpy ! 🐻</span>
	`;
	friendRequestContainer.appendChild(friendRequestItem);
}

export function create_empty_friend() {
	const friendContainer = document.getElementById("user-friends");
	const friendEmpty = document.getElementById(`empty-friend`)
	if (friendEmpty)
		return ;
	const friendItem = document.createElement("div");
	friendItem.id = `empty-friend`;
	friendItem.classList.add("d-flex", "w-100", "mb-3", "justify-content-center", "align-items-center", "bg-white", "login-card", "py-2", "px-2", "rounded");
	friendItem.style.cssText = "--bs-bg-opacity: .5; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendItem.innerHTML = `
		<span class="">Wow such emtpy ! 🐻</span>
	`;
	friendContainer.appendChild(friendItem);
}

export function delete_empty_request(option) {
	const requestEmpty = document.getElementById(`empty-request-${option}`)
	if (requestEmpty) {
		requestEmpty.remove();
	}
}

export function delete_empty_friend() {
	const friendEmpty = document.getElementById(`empty-friend`)
	if (friendEmpty) {
		friendEmpty.remove();
	}
}

export function create_friend_request_sent_div(request, size) {
	const friendRequestContainer = document.getElementById("friend-requests-sent");
	const friendRequestExists = document.getElementById(`friend-request-item-${request?.to_user_id}`)
	if (friendRequestExists)
		return ;
	const requestEmpty = document.getElementById(`empty-request`)
	if (requestEmpty)
		delete_empty_request("sent");
	const friendRequestItem = document.createElement("div");
	let statusDot;
	if (request.to_user_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	friendRequestItem.classList.add("friend-req-sent", "d-flex", "w-100", "mb-3", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-2", "rounded");
	friendRequestItem.id = `friend-request-item-${request?.to_user_id}`;
	friendRequestItem.style.cssText = "--bs-bg-opacity: .5; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendRequestItem.innerHTML = `
		<div class="position-relative d-inline-block m-2 cursor-click">
			<a route="/stats/${request?.to_user__username}">
				<img src="${request?.to_image_url}" alt="user_pp" class="h-64 w-64 rounded-circle"/>
					<span style="left: 60px; top: 5px" id="friend-status-${request?.to_user_id}" data-id=${request?.to_user_id}
					 class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle ">
					<span id = "friend-status-text-${request?.to_user_id}" class="visually-hidden">Offline</span>
				</span>
			</a>
		</div>
		<p class="m-2 cursor-click" route="/stats/${request?.to_user__username}">${request?.to_user || request.to_user__username}</p>
		<p class="m-2">Sent : ${new Date(request?.time).toLocaleString()}</p>
		<p class="m-2">${request?.status}</p>
	`;
	friendRequestContainer.appendChild(friendRequestItem);
}

export function create_friend_request_div(request, size) {
	const friendRequestContainer = document.getElementById("friend-requests-received");
	const friendRequestItem = document.createElement("div");
	const requestEmpty = document.getElementById(`empty-request-received`)
	if (requestEmpty)
		delete_empty_request("received");
	let statusDot;
	if (request.from_user_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	friendRequestItem.classList.add("friend-req-received", "d-flex", "w-100", "mb-3", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-2", "rounded");
	friendRequestItem.id = `friend-request-item-${request?.from_user_id}`;
	friendRequestItem.style.cssText = "--bs-bg-opacity: .5; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendRequestItem.innerHTML = `
		<div class="position-relative d-inline-block m-2 cursor-click">
			<a route="/stats/${request?.from_user || request.from_user__username}">
				<img src="${request?.from_image_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
					<span style="left: 60px; top: 5px" id="friend-status-${request?.from_user_id}"
					 class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
					<span id = "friend-status-text-${request?.from_user_id}" class="visually-hidden">Offline</span>
				</span>
			</a>
		</div>
		<p class="m-2 cursor-click" route="/stats/${request?.from_user || request.from_user__username}">${request?.from_user || request.from_user__username}</p>
		<p class="m-2">Received : ${new Date(request?.time).toLocaleString()}</p>
		<div class="d-flex flex-column m-1">
			<button class="m-1 btn btn-success confirm-request-btn" data-id="${request?.from_user_id}">Accept</button>
			<button class="m-1 btn btn-danger decline-request-btn" data-id="${request?.from_user_id}">Decline</button>
		</div>
	`;
	friendRequestContainer.appendChild(friendRequestItem);
	document.querySelectorAll(".confirm-request-btn").forEach(button => {
		button.addEventListener("click", (event) => accept_friend_request(event, size));
	});
	document.querySelectorAll(".decline-request-btn").forEach(button => {
		button.addEventListener("click", (event) => decline_friend_request(event, size));
	});
}

export function create_friend_div_load(friend) {
	const friendListContainer = document.getElementById("user-friends");
	const friendItem = document.createElement("div");
	let statusDot;
	const friendEmpty = document.getElementById(`empty-friend`)
	if (friendEmpty)
		friendEmpty.remove();
	if (friend.from_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	friendItem.classList.add("friend", "d-flex", "w-100", "mb-3", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-2", "rounded");
	friendItem.style.cssText = "--bs-bg-opacity: .5; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendItem.id = `friend-item-${friend?.from_user_id}`;
	friendItem.innerHTML = `
        <div class="position-relative d-inline-block mx-2 my-1 cursor-click">
        	<a route="/stats/${friend?.from_user}">
				<img src="${friend?.from_image_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
					<span style="left: 60px; top: 5px" id="friend-status-${friend?.from_user_id}"
					class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
					<span id="friend-status-text-${friend?.from_user_id}" class="visually-hidden">Offline</span>
				</span>
			</a>
        </div>
        <p class="mx-2 my-1 cursor-click" route="/stats/${friend?.from_user}">${friend?.from_user}</p>
        <div class="status-container mx-2 my-1" data-id="${friend?.from_user_id}">
            <p class="status mx-2 my-1">Status: ${friend?.from_status}</p>
        </div>
        <button class="btn btn-danger remove-friend-btn m-2" data-id="${friend?.from_user_id}">Remove</button>
    `;
	friendListContainer.appendChild(friendItem);
	document.querySelectorAll(".remove-friend-btn").forEach(button => {
		button.addEventListener("click", remove_friend);
	});
}

export function create_friend_div_ws(status, id, img_url, username, size) {
	const friendListContainer = document.getElementById("user-friends");
	const friendItem = document.createElement("div");
	const friendEmpty = document.getElementById(`empty-friend`)
	if (friendEmpty)
		friendEmpty.remove();
	if (size === 1)
		create_empty_request("sent");
	let statusDot;
	if (status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	friendItem.classList.add("friend", "d-flex", "w-100", "mb-3", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-2", "rounded");
	friendItem.style.cssText = "--bs-bg-opacity: .5; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendItem.id = `friend-item-${id}`;
	friendItem.innerHTML = `
        <div class="position-relative d-inline-block mx-2 my-1 cursor-click">
        	<a route="/stats/${username}">
				<img src="${img_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
					<span style="left: 60px; top: 5px" id="friend-status-${id}"
					class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
					<span id="friend-status-text-${id}" class="visually-hidden">Offline</span>
				</span>
			</a>
        </div>
        <p class="mx-2 my-1 cursor-click" route="/stats/${username}">${username}</p>
        <div class="status-container mx-2 my-1" data-id="${id}">
            <p class="status mx-2 my-1">Status: ${status}</p>
        </div>
        <button class="btn btn-danger remove-friend-btn m-2" data-id="${id}">Remove</button>
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

export function accept_friend_request(event, size) {
	const button = event.target;
	const userId = button.getAttribute("data-id");
	if (button)
		button.disabled = true;
	fetch(`https://${window.location.hostname}:8443/accept_friend`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCookie("csrftoken")
		},
		credentials: "include",
		body: JSON.stringify({ 'from_id': userId, 'size': size })
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
			const friendRequest = document.getElementsByClassName('friend-req-received');
			if (size === 1 || friendRequest.length === 0)
				create_empty_request("received");
			create_friend_div_ws(data.status, data.id, data.img_url, data.username, size);
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

export function decline_friend_request(event, size) {
	const button = event.target;
	const userId = button.getAttribute("data-id");
	if (button)
		button.disabled = true;
	fetch(`https://${window.location.hostname}:8443/decline_friend`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCookie("csrftoken")
		},
		credentials: "include",
		body: JSON.stringify({ 'from_id': userId, 'size': size })
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
			const friendRequest = document.getElementsByClassName('friend-req-received');
			if (size === 1 || friendRequest.length === 0)
				create_empty_request("received");
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
	fetch(`https://${window.location.hostname}:8443/remove_friend`, {
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
			const friend = document.getElementsByClassName('friend');
			if (data.size === 1 || friend.length === 0) {
				create_empty_friend();
			}
		}
	})
	.catch(error => {
		console.error("Error removing friend: ", error);
		const toastComponent = new ToastComponent();
		toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		button.disabled = false;
	});
}
