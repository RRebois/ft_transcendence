export default class User {
	constructor(props) {
		this.props = props;
		this.user = user;
	}

	fetchUser = async () => {
		const csrfToken = getCookie('csrftoken');
		const response = await fetch('https://localhost:8443/users', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken
			},
			credentials: 'include'
		});
		const data = await response.json();
		console.log('User data:', data);
		return data;
	}

	setupEventListeners() {

	}

	render() {
		document.title = 'ft_transcendence | User profile';
	}

}
