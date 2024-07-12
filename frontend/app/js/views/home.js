export default class Home {
    constructor(props) {
        this.props = props;
    }

    fetchData() {
        fetch('https://localhost:8443/test')
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    }

    loginUser(event) {
        event.preventDefault(); // Prevent the default form submission
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-pwd').value;
        const csrfToken = this.getCSRFToken(); // Assuming getCSRFToken() method exists and fetches the CSRF token correctly

        fetch('https://localhost:8443/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken // Include CSRF token in request headers if needed
            },
            body: JSON.stringify({ username, password })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                // Handle success, e.g., redirecting the user or displaying a success message
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle errors, e.g., displaying an error message to the user
            });
    }

    // TODO: check form action link
    render() {
        this.fetchData();
        return `
         <div class="w-100 h-100 d-flex justify-content-center align-items-center">
            <form onsubmit="this.loginUser(event);" method="post" class="bg-white d-flex flex-column align-items-center py-2 px-5 rounded login-card" style="--bs-bg-opacity: .5;">
                <h1><a class="text-justify play-bold" href="/" >ft_transcendence 🏓</a></h1>
                <div class="w-100">
                    <label for="login-username" class="visually-hidden">Username</label>
                    <div class="input-group">
                        <div class="input-group-text">
                            <i class="bi bi-person"></i>
                        </div>
                        <input type="text" name="username" id="login-username" class="form-control" placeholder="username" autofocus required/>
                    </div>
                </div>
                <div class="w-100 text-end d-flex flex-column gap-1">
                    <div>
                        <label for="login-pwd" class="visually-hidden">Password</label>
                        <div class="input-group">
                            <div class="input-group-text">
                                <i class="bi bi-lock"></i>
                            </div>
                            <input type="password" name="password" id="login-pwd" class="form-control" placeholder="••••••••" required/>
                        </div>
                    </div>
                    <a href="" class="text-decoration-none" id="Alzheimer">Forgot password?</a>
                </div>
                <button type="submit" class="btn btn-primary">Log in</button>
            </form>
         </div>
        `;
    }

    style() {
        return (`
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Play:wght@400;700&family=Poppins&display=swap');
                .gap-0-5 {
                  gap: 0.125rem;
                }
                
                .gap-1 {
                  gap: 0.25rem;
                }
                
                .gap-1-5 {
                  gap: 0.375rem;
                }
                
                .gap-2 {
                  gap: 0.5rem;
                }
                
                .gap-3 {
                  gap: 0.75rem;
                }
                
                .gap-4 {
                  gap: 1rem;
                }
            </style>
        `)
    }
}
