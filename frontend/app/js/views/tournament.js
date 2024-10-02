import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";

export default class Tournament {
    constructor(props) {
        this.props = props;
        this.user = props?.user;
        this.setUser = this.setUser.bind(this);
        this.toast = new ToastComponent();
    }

    setUser = (user) => {
		this.user = user;
	}

    setProps = (props) => {
        this.props = props;
    }

    render() {
        document.title = `ft_transcendence | Tournament ${this.props?.id}`;
        return `
            <div class="d-flex w-full min-h-full flex-grow-1 justify-content-center align-items-center">
                <div class="h-full w-3-4 d-flex flex-row justify-content-center align-items-center px-5" style="gap: 16px;">
					<div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-5 rounded login-card w-50 h-min" style="--bs-bg-opacity: .5;">
                        <p class="play-bold fs-2">Players 🤓</p>
                        <div id="player">
                        
                        </div>
                    </div>
					<div class="bg-white d-flex g-4 flex-column align-items-center py-2 px-5 rounded login-card w-50 h-min" style="--bs-bg-opacity: .5;">
                        <p class="play-bold fs-2">Games 🎮</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
    }
}