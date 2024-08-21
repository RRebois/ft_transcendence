export default class PongMatch {
	constructor(props) {
		this.props = props;
		this.user = props.user;
		this.handlePersonalInfoSubmit = this.handlePersonalInfoSubmit.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
	}

	//websockedt