export function curr_player_pick_number(value, game_code, session_id, player_id, nb_players, aw_players, websocket) {
	if (game_code === '10') {
		console.log("bot need to guess a number");
		const bot_guess = bot_guess_number(1, 3);


	} else {
		console.log("websocket: ", websocket);
		websocket.send(JSON.stringify({
			"action": "pick_initial_number",
			"game_code": game_code,
			"session_id": session_id,
			"player_id": player_id,
			"selected_value": value,
			"awaited_players": aw_players,
			"connected_players": nb_players,
		}));
		window.alert("Number picked");
	}
}


function bot_guess_number(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
