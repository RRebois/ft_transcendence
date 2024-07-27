document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-pwd').value;

            fetch('login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({username, password}),
            })
            .then(response => {
                return response.json().then(data => ({status: response.status, data: data}));
            })
            .then(({status, data}) => {
                if (status === 200){
                    initializeWebSocket()
                    console.log('Good')
                    if (data.redirect) {
                        window.location.href = data.redirect_url;
                }
                } else if (status !== 401) {
                    if (data.level && data.message) {
                        displayMessage(data.message, data.level);
                    }
                }
            })
            .catch(error => console.error('Error fetching send request: ', error));
        })
    }
    else {
        console.error('Login form not found');
    }
})

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        console.log("cookie is: ", cookies);
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

