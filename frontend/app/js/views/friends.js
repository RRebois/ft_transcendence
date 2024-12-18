import {getCookie} from "../functions/cookie";
import ToastComponent from "@js/components/Toast.js";
import {
    create_empty_friend,
    create_empty_request,
    create_friend_div_load,
    create_friend_request_div,
    create_friend_request_sent_div,
    delete_empty_friend,
    delete_empty_request
} from "@js/functions/friends_management.js";
import {applyFontSize} from "../functions/display.js";

export default class Friends {
    constructor(props) {
        this.props = props;
        this.user = null;
        this.setUser = this.setUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.send_friend_request = this.send_friend_request.bind(this);
    }

    setUser(user) {
        this.user = user;
    }

    removeUser() {
        if (this.user) this.user = null;
    }

    setProps(newProps) {
        this.props = newProps;
    }

    render() {
        return `
			<div class="d-flex w-full min-h-full flex-grow-1">
				<div class="d-flex min-h-full w-full flex-column align-items-center px-5" style="gap: 16px;">
					<div class="bg-white rounded login-card min-h-full w-75 d-flex flex-column justify-content-center align-items-center px-5 my-5" style="gap: 16px; --bs-bg-opacity: .5;">
						<p class="play-bold text-center mt-1 title">Add a friend</p>
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
							<p class="play-bold text-justify d-flex flex-column subtitle">Friend requests sent</p>
							<div id="friend-requests-sent" class="d-flex flex-column w-100"></div>
						</div><div class="w-full align-items-center text-center">
							<p class="play-bold text-justify d-flex flex-column subtitle">Friend requests received</p>
							<div id="friend-requests-received" class="d-flex flex-column w-100"></div>
						</div>
						<div class="w-full align-items-center text-center">
							<p class="play-bold text-justify d-flex flex-column subtitle">Your friends</p>
							<div id="user-friends" class="d-flex flex-column w-100"></div>
						</div>
					</div>
				</div>
			</div>
        `;
    }

    load_friends_requests_sent() {
        fetch(`https://${window.location.hostname}:8443/pending_friend_requests`, {
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
                        create_empty_request("sent");
                    } else {
                        Array.isArray(data);
                        data.map(request => {
                            delete_empty_request("sent");
                            create_friend_request_sent_div(request, data.length);
                        });
                    }
                }
            })
            .catch(error => {
                const toastComponent = new ToastComponent();
                toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
            });
        applyFontSize();
    }

    load_friends_requests() {
        fetch(`https://${window.location.hostname}:8443/get_friend_requests`, {
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
                        create_empty_request("received");
                    } else {
                        Array.isArray(data);
                        data.map(request => {
                            delete_empty_request("received");
                            create_friend_request_div(request, data.length);
                        });
                    }
                }
            })
            .catch(error => {
                const toastComponent = new ToastComponent();
                toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
            });
        applyFontSize();
    }

    load_friends_list() {
        fetch(`https://${window.location.hostname}:8443/get_friends`, {
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
                    } else {
                        Array.isArray(data);
                        data.map(friend => {
                            delete_empty_friend();
                            create_friend_div_load(friend, data.length);
                        });
                    }
                }
            })
            .catch(error => {
                const toastComponent = new ToastComponent();
                toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
            });
        applyFontSize();
    }

    setupEventListeners() {
        document.getElementById("addfriend").addEventListener("submit", this.send_friend_request);
        this.load_friends_requests();
        this.load_friends_requests_sent();
        this.load_friends_list();
        applyFontSize();
    }

    send_friend_request(event) {
        event.preventDefault();
        const requestBtn = document.getElementById("addfriend-submit");
        if (requestBtn)
            requestBtn.disabled = true;
        const input = document.getElementById("username");
        const usernameValue = input.value;
        const csrfToken = getCookie("csrftoken");
        fetch(`https://${window.location.hostname}:8443/send_friend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            credentials: "include",
            body: JSON.stringify({usernameValue})
        })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
            .then(({ok, data}) => {
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
                const toastComponent = new ToastComponent();
                toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
                requestBtn.disabled = false;
            });
        applyFontSize();
    }
}
