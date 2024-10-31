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

    get_user_info_elmt = (side) => {
        return `
            <div class="d-flex ${side === 'bottom' || side === 'top' ? 'flex-row' : 'flex-column'} gap-2 align-items-center justify-content-center" style="max-height: 100%;">
                <div class="rounded-circle ratio ratio-1x1" style="max-height: 10vh; max-width: 10vh; background-color: darkgray">
                    <img id="user_info-profile-pic-${this.game_player_id}" src="${this.player?.photo_url}" class="h-100 rounded-circle" style="object-fit: cover; max-height: 10vh; max-width: 10vh" />
                </div>
                <div style="--bs-bg-opacity: .5; min-width: 300px" class="bg-white d-flex g-4 flex-column align-items-center px-3 py-1 rounded">
                    <div class="d-flex flex-row justify-content-between w-100">
                        <p id="user_info-username-${this.game_player_id}" class="play-bold fd-5"></p>
                        <div class="d-flex flex-row gap-1">
                            <p>💭</p>
                            <p id="user_info-guess-${this.game_player_id}">-</p>
                        </div>
                    </div>
                    <p id="user_info-status-${this.game_player_id}" class="play-regular"></p>
                </div>
            </div>
        `;
    }

    render() {
        return `
            <div class="${this.side}-edge-container">
                ${this.get_user_info_elmt(this.side)}
            </div>
        `;
    }
}
