import { getCookie } from "../functions/cookie";

export default class Friends {
    // static load_friends_page;
    constructor(props) {
        this.props = props;
        this.load_friends_page = this.load_friends_page.bind(this);
        // this.user = user;
    }

    render() {
        return `
         <div class="container">
            <form id="addfriend">
                <input type="text" id="username"/>
                <button type="submit" id="addfriend-submit">test</button>
            </form>
         </div>
        `
    }

    setupEventListeners() {
        // this.load_friends_page(this.props.user.username);
        document.getElementById('addfriend').addEventListener('submit', this.load_friends_page);
    }

    load_friends_page(event) {
        // const friendsDivElement = document.getElementById('friendsDiv');

        // document.getElementById('greetings').style.display = 'none';
        // document.getElementById('greetings').innerHTML = '';
        // document.getElementById('userDataDiv').style.display = 'none';
        // document.getElementById('userDataDiv').innerHTML = "";
        // document.getElementById('statsDiv').style.display = 'none';
        // document.getElementById('statsDiv').innerHTML = "";
        // friendsDivElement.innerHTML = "";
        // friendsDivElement.style.display = 'block';
        // create_div_title(username, "friends", "friendsDiv");
        //
        // const globalContainer = document.createElement('div');
        // const sendRequestForm = document.createElement('form');
        // const sendReqTitle = document.createElement('h1');
        // const sendReqUserBar = document.createElement('div');
        // const sendReqLabel = document.createElement('label');
        // const sendReqBar = document.createElement('div');
        // const sendReqIconDiv = document.createElement('div');
        // const sendReqIcon = document.createElement('i');
        // const sendReqInput = document.createElement('input');
        // const sendReqBtn = document.createElement('button');
        //
        // globalContainer.className = "friendPage w-100 h-100 d-flex flex-column justify-content-center align-items-center";
        // globalContainer.appendChild(sendRequestForm);
        //
        // sendRequestForm.className = "friendPage bg-white flex-column align-items-center py-2 px-5 rounded login-card";
        // sendRequestForm.style.cssText = "--bs-bg-opacity: .5; width: 50%";
        // sendRequestForm.id = "addFriend"
        // sendRequestForm.appendChild(sendReqTitle);
        // sendRequestForm.appendChild(sendReqUserBar);
        //
        // sendReqTitle.className = "text-justify play-bold";
        // sendReqTitle.innerText = "Add a friend";
        //
        // sendReqUserBar.className = "w-100";
        // sendReqUserBar.appendChild(sendReqLabel);
        // sendReqUserBar.appendChild(sendReqBar);
        //
        // sendReqLabel.className = "visually-hidden";
        // sendReqLabel.innerText = "Username";
        // sendReqLabel.setAttribute("for", "username");
        //
        // sendReqBar.className = "input-group";
        // sendReqBar.appendChild(sendReqIconDiv);
        // sendReqBar.appendChild(sendReqInput);
        // sendReqBar.appendChild(sendReqBtn);
        //
        // sendReqIconDiv.className = "input-group-text";
        // sendReqIconDiv.appendChild(sendReqIcon);
        //
        // sendReqIcon.className = "bi bi-person";
        //
        // sendReqInput.className = "form-control";
        // sendReqInput.type = 'text';
        // sendReqInput.name = 'username';
        // sendReqInput.id = 'username';
        // sendReqInput.placeholder = 'Username';
        // sendReqInput.required = true;
        //
        // sendReqBtn.className = "btn btn-primary";
        // sendReqBtn.type = "submit";
        // sendReqBtn.innerText = "Send";

        // friendsDivElement.appendChild(globalContainer);

        // const friendRequestContainer = document.createElement('div');
        // friendRequestContainer.id = 'friendRequest';
        // friendRequestContainer.classList.add('friendPage', 'w-100');
        // friendRequestContainer.style.marginTop = '30px';
        //
        // const headerReq = document.createElement('div');
        // headerReq.classList.add("txtSectionDiv");
        // headerReq.id = 'headerRequests';
        // headerReq.innerHTML = "Friend requests";
        //
        // const friendListContainer = document.createElement('div')
        // friendListContainer.id = 'friendList';
        // friendListContainer.classList.add('friendPage', 'w-100');
        // friendListContainer.style.marginTop = '30px';
        //
        // const headerFriends = document.createElement('div');
        // headerFriends.classList.add("txtSectionDiv");
        // headerFriends.id = 'headerFriends';
        // headerFriends.innerHTML = "Friends";
        //
        // friendRequestContainer.appendChild(headerReq);
        // friendListContainer.appendChild(headerFriends);
        // globalContainer.appendChild(friendRequestContainer);
        // globalContainer.appendChild(friendListContainer);

        // sendReqBtn.addEventListener('click', () => {
        // document.getElementById("addfriend").addEventListener('submit', () => {
            // event.preventDefault();
        event.preventDefault();
        console.log("HERE");
        const usernameValue = document.getElementById('username').value;
        const csrfToken = getCookie('csrftoken');
        fetch('https://localhost:8443/send_friend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({usernameValue})
        })
            .then(response => {
                console.log("Reponse: ", response.json());
                return response.json().then(data => ({status: response.status, data: data}));
            })
            .then(({status, data}) => {
                if (data.redirect) {
                    window.location.href = data.redirect_url;
                } else if (status !== 401) {
                    // sendReqInput.value = "";
                    if (data.level && data.message) {
                        console.log("Data: ", data);
                        // displayMessage(data.message, data.level);
                    }
                }
            })
            .catch(error => console.error('Error fetching send request: ', error));
        // }
        // this.load_friend_requests();
        // this.load_friends_list();
    }

    // load_friend_requests() {
    //     const friendRequestListElem = document.getElementById('friendRequest');
    //     const friendRequestHeaderElem = document.getElementById('headerRequests')
    //     fetch('https://localhost:8443/get_friend_requests', {
    //         credentials: 'include',
    //     })
    //         .then(response => {
    //             if (response.ok) {
    //                 console.log("HTTP request successful")
    //             } else {
    //                 console.log("HTTP request unsuccessful")
    //             }
    //             return response.json();
    //         })
    //         .then(data => {
    //             console.log(data);
    //             friendRequestListElem.innerHTML = '';
    //             friendRequestListElem.appendChild(friendRequestHeaderElem);
    //             if (Array.isArray(data) && data.length > 0) {
    //                 data.forEach(request => {
    //                     const friendRequestItem = document.createElement('div');
    //                     friendRequestItem.classList.add('friendPage', 'list-group-item', 'list-group-item-action', 'bg-white', 'login-card', 'py-2', 'px-5', 'rounded');
    //                     friendRequestItem.style.cssText = '--bs-bg-opacity: .5; margin-bottom: 15px; width: 50%; display: block; margin-left: auto; margin-right: auto';
    //                     friendRequestItem.innerHTML = `
    //                     <div class="d-flex w-100 justify-content-between">
    //                         <h5 class="mb-1">From: ${request.from_user__username}</h5>
    //                         <p class="mb-1">Sent: ${new Date(request.time).toLocaleString()}</p>
    //                     </div>
    //                     <p class="mb-1">Status: ${request.status}</p>
    //                     <div class="buttonsContainer">
    //                         <button type="button" class="acceptBtn btn btn-primary" style="background: #209920; border-color: #040303" data-id="${request.from_user_id}">Accept</button>
    //                         <button type="button" class="declineBtn btn btn-primary" style="background: #e3031c; border-color: #040303" data-id="${request.from_user_id}">Decline</button>
    //                     </div>
    //                 `;
    //                     friendRequestListElem.appendChild(friendRequestItem);
    //                 });
    //             } else {
    //                 const friendRequestItem = document.createElement('div');
    //                 friendRequestItem.innerHTML = `
    //                 <div>No friend request yet</div>
    //                 `;
    //                 friendRequestListElem.appendChild(friendRequestItem);
    //             }
    //
    //             document.querySelectorAll('.acceptBtn').forEach(button => {
    //                 button.addEventListener('click', function () {
    //                     const from_id = this.getAttribute('data-id');
    //                     const declineBtn = document.querySelector('.declineBtn')
    //                     fetch('https://localhost:8443/accept_friend', {
    //                         method: 'POST',
    //                         headers: {
    //                             'Content-Type': 'application/json',
    //                             'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    //                         },
    //                         credentials: 'include',
    //                         body: JSON.stringify({from_id: from_id})
    //                     })
    //                         .then(response => {
    //                             return response.json().then(data => ({status: response.status, data: data}));
    //                         })
    //                         .then(({status, data}) => {
    //                             if (data.redirect) {
    //                                 window.location.href = data.redirect_url;
    //                             } else if (status !== 401) {
    //                                 this.innerText = 'Accepted';
    //                                 this.classList.remove('btn-primary');
    //                                 this.style.background = '';
    //                                 this.classList.add('btn-success', 'acceptedBtn');
    //                                 this.disabled = true;
    //                                 declineBtn.classList.remove('btn-primary');
    //                                 declineBtn.style.background = '#a55b5b';
    //                                 declineBtn.style.color = 'white';
    //                                 declineBtn.classList.add('acceptedBtn');
    //                                 if (data.level && data.message) {
    //                                     displayMessage(data.message, data.level);
    //                                 }
    //                                 load_friends_list();
    //                                 load_friend_requests();
    //                             }
    //                         })
    //                 });
    //             });
    //
    //             document.querySelectorAll('.declineBtn').forEach(button => {
    //                 button.addEventListener('click', function () {
    //                     const from_id = this.getAttribute('data-id');
    //                     const acceptBtn = document.querySelector('.acceptBtn')
    //                     fetch('https://localhost:8443/decline_friend', {
    //                         method: 'POST',
    //                         headers: {
    //                             'Content-Type': 'application/json',
    //                             'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    //                         },
    //                         credentials: 'include',
    //                         body: JSON.stringify({from_id: from_id})
    //                     })
    //                         .then(response => {
    //                             return response.json().then(data => ({status: response.status, data: data}));
    //                         })
    //                         .then(({status, data}) => {
    //                             if (data.redirect) {
    //                                 window.location.href = data.redirect_url;
    //                             } else if (status !== 401) {
    //                                 this.innerText = 'Declined';
    //                                 this.classList.remove('btn-primary');
    //                                 this.style.background = '#a55b5b';
    //                                 this.style.color = 'white';
    //                                 this.classList.add('acceptedBtn');
    //                                 acceptBtn.classList.remove('btn-primary');
    //                                 acceptBtn.style.background = '';
    //                                 acceptBtn.classList.add('btn-success', 'acceptedBtn');
    //                                 load_friends_list();
    //                                 load_friend_requests();
    //                             }
    //                         })
    //                 });
    //             });
    //         })
    //         .catch(error => console.error('Error fetching friend requests: ', error));
    // }
    //
    // load_friends_list() {
    //     const friendListElem = document.getElementById('friendList');
    //     const friendHeaderElem = document.getElementById('headerFriends');
    //     fetch('https://localhost:8443/get_friends', {
    //         credentials: 'include',
    //     })
    //         .then(response => response.json())
    //         .then(data => {
    //             console.log(data);
    //             friendListElem.innerHTML = '';
    //             friendListElem.appendChild(friendHeaderElem);
    //             if (Array.isArray(data) && data.length > 0) {
    //                 data.forEach(request => {
    //                     const friendItem = document.createElement('div');
    //                     friendItem.classList.add('friendPage', 'list-group-item', 'list-group-item-action', 'bg-white',
    //                         'login-card', 'd-flex', 'py-2', 'px-5', 'rounded');
    //                     friendItem.setAttribute('data-id', request.id);
    //                     friendItem.style.cssText = '--bs-bg-opacity: .5; margin-bottom: 15px; justify-content: space-between; width: 50%; ' +
    //                         'display: block; margin-left: auto; margin-right: auto';
    //                     friendItem.innerHTML = `
    //                     <a class="roundBorder nav-item friendImg" style="/*display: flex*/" onclick="load_stats_page('${request.username}')" href="">
    //                         <img src="${request.image}" alt="avatar">
    //                     </a>
    //                     <a class="mb-1" style="display: flex" onclick="load_stats_page('${request.username}')" href="">${request.username}</a>
    //                     <p class="status mb-1" style="display: flex">Status: ${request.status}</p>
    //                     <button type="button" class="removeBtn btn btn-primary" style="background: #e3031c; border-color: #040303" data-id="${request.id}">Remove</button>
    //                     `;
    //                     friendListElem.appendChild(friendItem);
    //                 });
    //             } else {
    //                 const friendItem = document.createElement('div');
    //                 friendItem.innerHTML = `
    //                 <div>No friends yet</div>
    //             `;
    //                 friendListElem.appendChild(friendItem);
    //             }
    //
    //
    //             document.querySelectorAll('.removeBtn').forEach(button => {
    //                 button.addEventListener('click', function () {
    //                     const from_id = this.getAttribute('data-id');
    //                     fetch('https://localhost:8443/remove_friend', {
    //                         method: 'POST',
    //                         headers: {
    //                             'Content-Type': 'application/json',
    //                             'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    //                         },
    //                         credentials: 'include',
    //                         body: JSON.stringify({from_id: from_id})
    //                     })
    //                         .then(response => {
    //                             return response.json().then(data => ({status: response.status, data: data}));
    //                         })
    //                         .then(({status, data}) => {
    //                             if (data.redirect) {
    //                                 window.location.href = data.redirect_url;
    //                             } else if (status !== 401) {
    //                                 this.innerText = 'Removed';
    //                                 this.classList.remove('btn-primary');
    //                                 this.style.background = '#a55b5b';
    //                                 this.style.color = 'white';
    //                                 this.classList.add('acceptedBtn');
    //                                 if (data.level && data.message) {
    //                                     displayMessage(data.message, data.level);
    //                                 }
    //                                 load_friends_list();
    //                             }
    //                         })
    //                 });
    //             });
    //         })
    //         .catch(error => console.error('Error fetching friend list: ', error));
    // }

    // displayMessage(message, level) {
    //     const messagesContainer = document.getElementById('messagesContainer');
    //     const alertDiv = document.createElement('div');
    //     alertDiv.className = `alertSize alert alert-${level}`;
    //     alertDiv.role = 'alert';
    //     alertDiv.innerText = message;
    //     messagesContainer.appendChild(alertDiv);
    //     setTimeout(() => {
    //         if (alertDiv && alertDiv.parentNode) {
    //             alertDiv.parentNode.removeChild(alertDiv);
    //         }
    //     }, 5000);
	// }
}
