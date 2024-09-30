class PurrinhaPlayerInfo {
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

    render() {
        return `
            <div class="${this.side}-edge-container\">
                <div class="equal-elmt-y"></div>
                <div>
                    <img src="/purrinha/closed_hand_right.png" style="height: 100%; width: 100%" alt="edge-image" />
                </div>
                <div class="equal-elmt-y d-flex justify-content-center align-items-start">
                    <div style="--bs-bg-opacity: .5; width: 100%;" class="bg-white d-flex g-4 flex-column align-items-center rounded">
                        <p id="user_info-username-1"></p>
                        <p id="user_info-status-1"></p>
                    </div>
                </div>
            </div>
        `;
    }
}

// const rightEdgeComponent = new RightEdgeContainer('user_info-username-1', 'user_info-status-1', '/purrinha/closed_hand_right.png');
// document.getElementById('some-container').innerHTML = rightEdgeComponent.render();

// TOP
//     <div className="equal-elmt-x"></div>
//     <div style="height: 100%;">
//         <img src="/purrinha/closed_hand_top.png" style="max-width: 100%; max-height: 100%; width: auto; height: auto;"
//              alt="edge-image"/>
//     </div>
//
//     <div className="equal-elmt-x d-flex justify-content-start align-items-center ">
//         <div style="--bs-bg-opacity: .5" className="bg-white d-flex g-4 flex-column align-items-center rounded">
//             <p id="user_info-username-3"></p>
//         </div>
//     </div>
//
// BOTTOM
//     <div className="equal-elmt-x"></div>
//     <div style="height: 100%;">
//         <img src="/purrinha/closed_hand_bottom.png"
//              style="max-width: 100%; max-height: 100%; width: auto; height: 100%;" alt="edge-image"/>
//     </div>
//     <div className="equal-elmt-x d-flex justify-content-start align-items-center ">
//         <div style="--bs-bg-opacity: .5" className="bg-white d-flex g-4 flex-column align-items-center rounded">
//             <p id="user_info-username-4"></p>
//         </div>
//     </div>
//
// RIGHT
//     <div className="equal-elmt-y"></div>
//     <div>
//         <img src="/purrinha/closed_hand_right.png" style="height: 100%; width: 100%" alt="edge-image"/>
//     </div>
//     <div className="equal-elmt-y d-flex justify-content-center align-items-start">
//         <div style="--bs-bg-opacity: .5; width: 100%;"
//              className="bg-white d-flex g-4 flex-column align-items-center rounded">
//             <p id="user_info-username-2"></p>
//         </div>
//     </div>
//
// LEFT
//     <div className="equal-elmt-y d-flex justify-content-center align-items-end">
//         <div style="--bs-bg-opacity: .5; width: 100%;"
//              className="bg-white d-flex g-4 flex-column align-items-center rounded">
//             <p id="user_info-username-1"></p>
//         </div>
//     </div>
//     <div>
//         <img src="/purrinha/closed_hand_left.png" style="height: 100%; width: 100%" alt="edge-image"/>
//     </div>
//     <div className="equal-elmt-y"></div>
