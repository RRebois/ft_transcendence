import {getCookie} from "../functions/cookie";
import ToastComponent from "@js/components/Toast.js";
import {create_friend_div_load, create_friend_request_div,} from "@js/functions/friends_management.js";

export default class Friends {
	constructor(props) {
		this.props = props;
		this.send_friend_request = this.send_friend_request.bind(this);
	}

	render() {
		document.title = 'ft_transcendence | Friends'
		return `
			<div class="d-flex w-full min-h-full flex-grow-1">
				<div class="min-h-full w-full d-flex flex-column justify-content-start align-items-center px-5" style="gap: 16px;">
					<h1 class="play-bold">Add a friend</h1>
					<form id="addfriend">
						<input type="text" id="username"/>
						<button type="submit" class="btn btn-primary" id="addfriend-submit">
							Add friend
							<i class="bi bi-person-add"></i>
						</button>
					</form>
					<div class="container">
						<p class="play-bold">Friend requests</p>
						<div id="friend-requests" class="d-flex flex-column w-100"></div>
					</div>
					<div class="container">
						<p class="play-bold">Your friends</p>
						<div id="user-friends" class="d-flex flex-column w-100"></div>
					</div>
				</div>
			</div>
        `;
	}

	load_friends_requests() {
		fetch("https://localhost:8443/get_friend_requests", {
			method: "GET",
			credentials: "include"
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				console.log("Data: ", data);
				if (!ok) {
					const toastComponent = new ToastComponent();
					toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
				} else {
					data.map(request => {
						create_friend_request_div(request);
					});
				}
			})
			.catch(error => {
				console.error("Error fetching friend requests: ", error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
			});
	}

	load_friends_list() {
		fetch("https://localhost:8443/get_friends", {
			method: "GET",
			credentials: "include"
		})
			.then(response => response.json().then(data => ({ok: response.ok, data})))
			.then(({ok, data}) => {
				if (!ok) {
					const toastComponent = new ToastComponent();
					toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
				} else {
					data.map(friend => {
						create_friend_div_load(friend);
					});
				}
			})
			.catch(error => {
				console.error("Error fetching friends list: ", error);
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
			});
	}

	setupEventListeners() {
		document.getElementById("addfriend").addEventListener("submit", this.send_friend_request);
		this.load_friends_requests();
		this.load_friends_list();
	}

	send_friend_request(event) {
		event.preventDefault();
		const requestBtn = document.getElementById("addfriend-submit")
		if (requestBtn)
			requestBtn.disabled = true;
		const usernameValue = document.getElementById("username").value;
		const csrfToken = getCookie("csrftoken");
		fetch("https://localhost:8443/send_friend", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": csrfToken
			},
			credentials: "include",
			body: JSON.stringify({usernameValue})
		})
		.then(response => response.json().then(data => ({ ok: response.ok, data })))
		.then(({ ok, data }) => {
			if (!ok) {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
				requestBtn.disabled = false;
			} else {
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Success", data.message || "Friend request sent", 5000);
				requestBtn.disabled = false;
			}
		})
		.catch(error => {
			console.error("Error sending friend request: ", error);
			const toastComponent = new ToastComponent();
			toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
			requestBtn.disabled = false;
		});
	}
}
