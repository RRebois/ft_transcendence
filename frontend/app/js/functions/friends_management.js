import { getCookie } from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";

export function remove_friend_request_div(userId) {
	const friendRequestItem = document.getElementById(`friend-request-item-${userId}`);
	friendRequestItem.remove();
}

export function create_friend_request_div(request) {
	const friendRequestContainer = document.getElementById("friend-requests");
	const friendRequestItem = document.createElement("div");
	let statusDot;
	if (request.from_user_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	console.log("status is: ", request.from_user_status);
	console.log("Dot is: ", statusDot);
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
		<p>Sent on ${new Date(request?.time).toLocaleString()}</p>
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

export function create_friend_div(friend, userId) {
	console.log("Creating friend div: ", friend);
	const friendListContainer = document.getElementById("user-friends");
	const friendItem = document.createElement("div");
	let statusDot;
	if (friend.from_status === 'online')
		statusDot = "bg-success";
	else
		statusDot = "bg-danger";
	console.log("status is: ", friend.from_status);
	console.log("Dot is: ", statusDot);
	friendItem.classList.add("d-flex", "w-100", "justify-content-between", "align-items-center", "bg-white", "login-card", "py-2", "px-5", "rounded");
	friendItem.style.cssText = "--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto";
	friendItem.id = `friend-item-${friend?.id || userId}`;
	friendItem.innerHTML = `
        <div class="position-relative d-inline-block">
            <img src="${friend?.from_image_url}" alt="user_pp" class="h-64 w-64 rounded-circle" />
                <span style="left: 60px; top: 5px" id="friend-status-${friend?.id || userId}"
                class="position-absolute translate-middle p-2 ${statusDot} border border-light rounded-circle">
                <span id="friend-status-text-${friend?.from_user_id || userId}" class="visually-hidden">Offline</span>
            </span>
        </div>
        <p>${friend?.to_user || friend?.from_user}</p>
        <div class="status-container" data-id="${friend?.id || userId}">
            <p class="status">Status: ${friend?.to_status || friend?.from_status}</p>
        </div>
        <button class="btn btn-danger remove-friend-btn" data-id="${friend?.id || userId}">Remove</button>
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
	console.log("click on accept button ", userId);
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
			} else {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Success", data.message || "Friend request accepted", 5000);
				remove_friend_request_div(userId);
				create_friend_div(data, userId);
			}
		})
		.catch(error => {
			console.error("Error accepting friend request: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		});
}

export function decline_friend_request(event) {
	const button = event.target;
	const userId = button.getAttribute("data-id");
	console.log("click on decline button ", userId);
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
			} else {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Success", data.message || "Friend request was declined", 5000);
				remove_friend_request_div(userId);
			}
		})
		.catch(error => {
			console.error("Error declining friend request: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		});
}

export function remove_friend(event) {
	const button = event.target;
	const userId = button.getAttribute("data-id");
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
			} else {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Success", data.message || "Friend successfully removed", 5000);
				remove_friend_div(userId);
			}
		})
		.catch(error => {
			console.error("Error removing friend: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
		});
}
