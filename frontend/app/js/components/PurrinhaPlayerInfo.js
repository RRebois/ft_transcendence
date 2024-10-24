export default class PurrinhaPlayerInfo {
    constructor(player, game_player_id) {
        this.player = player;
        this.game_player_id = game_player_id;
        this.side = this.id2side(this.game_player_id);

    }

    id2side = (id) => {
        switch (id) {
            case 1:
                return 'left';
            case 2:
                return 'right';
            case 3:
                return 'top';
            default:
                return 'bottom';
        }
    }

    get_void_equal_elmt = (side) => {
        if (side === 'top' || side === 'bottom') {
            return `<div class="equal-elmt-x"></div>`;
        } else {
            return `<div class="equal-elmt-y"></div>`;
        }
    }

    get_img_elmt = (side) => {
        if (side === 'top' || side === 'bottom') {
            return `   
                <div class="d-flex flex-grow-1 ${side === 'bottom' ? 'align-items-end' : 'align-items-start'}" style="height: 100%;">
                    <img src="/purrinha/closed_hand_${this.side}.png" style="max-width: 100%; max-height: 100%; width: ${this.side === 'bottom' ? 'auto' : '100%'}; height: auto;"
                    alt="purrinha ${this.side} hand"/>
                </div>
            `;
        } else {
            return `
                <div>
                    <img src="/purrinha/closed_hand_${this.side}.png" style="height: 100%; width: 100%" alt="purrinha ${this.side} hand"/>
                </div>
            `;
        }
    }

    get_user_info_elmt = (side) => {
        if (side === 'top' || side === 'bottom') {
            return `
                <div class="equal-elmt-x mx-3 d-flex justify-content-start align-items-center">
                    <div style="--bs-bg-opacity: .5; min-width: 300px" class="bg-white d-flex g-4 flex-column align-items-center px-3 py-1 rounded">
                        <div class="d-flex flex-row justify-content-between w-100" >
                            <p id="user_info-username-${this.game_player_id}"></p>
                            <div class="d-flex flex-row gap-1">
                                <i class="trophy-${this.game_player_id} bi bi-trophy-fill"></i>
                                <p id="user_info-score-${this.game_player_id}">0</p>
                            </div>
                        </div>
                        <p id="user_info-status-${this.game_player_id}"></p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="equal-elmt-y my-3 d-flex justify-content-center align-items-${this.side === 'right' ? 'start' : 'end'}">
                    <div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center px-3 py-1 rounded">
                        <div class="d-flex flex-row justify-content-between w-100">
                            <p id="user_info-username-${this.game_player_id}"></p>
                            <div class="d-flex flex-row gap-1">
                                <i class="trophy-${this.game_player_id} bi bi-trophy-fill"></i>
                                <p id="user_info-score-${this.game_player_id}">0</p>
                            </div>
                        </div>
                        <p id="user_info-status-${this.game_player_id}"></p>
                    </div>
                </div>
            `;
        }
    }


    render() {
        console.log('rendering player info');
        console.log('this.side: ', this.side);
        console.log("this.player: ", this.player);
        return `
            <div class="${this.side}-edge-container ${this.side === 'bottom' && "d-flex flex-row"}">
                ${this.side === 'top' || this.side === 'bottom' || this.side === 'right' ? this.get_void_equal_elmt(this.side) : ''}
                ${this.side === 'top' || this.side === 'bottom' || this.side === 'right' ? this.get_img_elmt(this.side) : this.get_user_info_elmt(this.side)}
                ${this.side === 'top' || this.side === 'bottom' || this.side === 'right' ? this.get_user_info_elmt(this.side) : this.get_img_elmt(this.side)}
                ${this.side === 'left' ? this.get_void_equal_elmt(this.side) : ''}
            </div>
        `;
    }
}

// const rightEdgeComponent = new RightEdgeContainer('user_info-username-1', 'user_info-status-1', '/purrinha/closed_hand_right.png');
// document.getElementById('some-container').innerHTML = rightEdgeComponent.render();
