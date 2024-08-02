export default class Settings {
	constructor(props) {
		this.props = props;
	}

	render() {
		return `
			<div class="d-flex flex-column justify-content-center align-items-center">
				<div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-5 rounded login-card w-50" style="--bs-bg-opacity: .5;">
                	<p class="text-justify play-bold fs-2">Settings</p>
					<form id="settings-form">
						<p class="play-bold fs-5">Account details</p>
						<div class="row g-3">
							<div class="row g-2">
								<div class="form-floating has-validation">
									<input type="text" id="username" class="form-control" value="${this.props.user.username}" required />
									<label for="username">Username<span class="text-danger">*</span></label>
									<div class="form-text">Username has to be 5 to 12 characters long and composed only by letters, digits and hyphens (- or _)</div>
									<div class="invalid-feedback">Username have an invalid format</div>
								</div>
							</div>
							
							<div class="row g-2">
								<div class="form-floating has-validation">
									<input type="email" id="email" class="form-control" value="${this.props.user.email}" ${this.props.user.stud42 ? 'disabled' : ''} />
									<label for="email">Email<span class="text-danger">*</span></label>
								<div class="invalid-feedback">Invalid email</div>
							</div>
								
							<div class="d-flex">
								<button type="submit" class="btn btn-primary">Save</button>
							</div>
						</div>
					</form>
					<hr class="hr" />
					<form id="password-form">
						<p class="play-bold fs-5">Change password</p>
                    	<div class="row g-3">
                    		<div class="row g-2">
								<div class="form-floating has-validation">
									<input type="password" id="password" class="form-control" required />
									<label for="password">New password<span class="text-danger">*</span></label>
									<ul class="list-unstyled ms-2 form-text">
										<li>
											<i id="minLength" class="bi bi-x text-danger"></i>
											Minimum 8 characters
										</li>
										<li>
											<i id="uppercase" class="bi bi-x text-danger"></i>
											At least one uppercase letter
										</li>
										<li>
											<i id="lowercase" class="bi bi-x text-danger"></i>
											At least one lowercase letter
										</li>
										<li>
											<i id="number" class="bi bi-x text-danger"></i>
											At least one number
										</li>
										<li>
											<i id="symbol" class="bi bi-x text-danger"></i>
											At least one special character (?!@$ %^&*)
										</li>
									</ul>
								</div>
							</div>
							
							<div class="row g-2">
								<div class="form-floating has-validation">
									<input type="password" id="password2" class="form-control" required />
									<label for="password2">Confirm new password<span class="text-danger">*</span></label>
									<div class="invalid-feedback">Passwords do not match</div>
								</div>
							</div>
							<div class="d-flex">
								<button type="submit" class="btn btn-primary">Change password</button>
							</div>
                    	</div>
					</form>
				</div>
			</div>
		`
	}

	setupEventListeners() {

	}
}
