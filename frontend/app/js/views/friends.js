import {getCookie} from "../functions/cookie";
import ToastComponent from "@js/components/Toast.js";
import {create_friend_div_load, create_friend_request_div, create_friend_request_sent_div, create_empty_request, create_empty_friend, delete_empty_request, delete_empty_friend}
	from "@js/functions/friends_management.js";

export default class Friends {
	constructor(props) {
		this.props = props;
		this.user = null;
		this.setUser = this.setUser.bind(this);
		this.send_friend_request = this.send_friend_request.bind(this);
	}

	setUser(user) {
		this.user = user;
	}

	render() {
		document.title = 'ft_transcendence | Friends'
		return `
			<div class="d-flex w-full min-h-full flex-grow-1">
				<div class="d-flex min-h-full w-full flex-column align-items-center px-5" style="gap: 16px;">
					<div class="bg-white rounded login-card min-h-full w-75 d-flex flex-column justify-content-center align-items-center px-5 mb-5 mt-5" style="gap: 16px; --bs-bg-opacity: .5;">
						<h1 class="play-bold text-center mt-1">Add a friend</h1>
						<form id="addfriend" class="d-flex mb-2">
							<input type="text" id="username" class="form-control m-1"/>
							<button type="submit" class="btn btn-primary d-flex m-1" id="addfriend-submit">
								Send 
								<i class="bi bi-person-add ms-2"></i>
							</button>
						</form>
					</div>
					<div class="min-h-full w-75 d-flex flex-column justify-content-start align-items-center mt-5" style="gap: 16px;">
						<div class="w-full align-items-center text-center">
							<p class="play-bold text-justify d-flex flex-column fs-5">Friend requests</p>
							<div id="friend-requests-sent" class="d-flex flex-column w-100"></div>
							<div id="friend-requests" class="d-flex flex-column w-100"></div>
						</div>
						<div class="w-full align-items-center text-center">
							<p class="play-bold text-justify d-flex flex-column fs-5">Your friends</p>
							<div id="user-friends" class="d-flex flex-column w-100"></div>
						</div>
					</div>
				</div>
			</div>
        `;
	}

	load_friends_requests_sent() {
		console.log("LOAD FRIEND REQUEST SENT CALLED")
		fetch("https://localhost:8443/pending_friend_requests", {
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
					if (Array.isArray(data) && data.length === 0) {
						create_empty_request();
					}
					else {
						data.map(request => {
							delete_empty_request();
							create_friend_request_sent_div(request);
						});
					}
					console.log("SUCCESS");
				}
			})
			.catch(error => {
				console.error("Error fetching friend requests: ", error);
				console.log("ERROR FRIEND REQUEST SENT");
				const toastComponent = new ToastComponent();
				toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
			});
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
					if (Array.isArray(data) && data.length === 0) {
						create_empty_request();
					}
					else {
						data.map(request => {
							delete_empty_request();
							create_friend_request_div(request);
						});
					}
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
				if (Array.isArray(data) && data.length === 0) {
						create_empty_friend();
					}
				else {
					data.map(friend => {
						delete_empty_friend();
						create_friend_div_load(friend);
					});
				}
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
		this.load_friends_requests_sent();
		this.load_friends_list();
	}

	send_friend_request(event) {
		event.preventDefault();
		const requestBtn = document.getElementById("addfriend-submit");
		if (requestBtn)
			requestBtn.disabled = true;
		const input = document.getElementById("username");
		const usernameValue = input.value;
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
				this.load_friends_requests_sent(data);
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
