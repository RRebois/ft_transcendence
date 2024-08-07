
max_quantity = 3

class   PurrinhaGame:
    id = 0
    
    def __init__(self) -> None:
        self.players = {}
        self.game_id = PurrinhaGame.id
        PurrinhaGame.id += 1

    def add_player(self, username):
        if username not in self.players:
            self.players[username] = PurrinhaPlayer(username)

    def remove_players(self):
        self.players.clear()

    def remove_player(self, username):
        self.players.pop(username)

    def get_max_guess(self):
        return len(self.players) * 3

    def get_round_result(self):
        final_value = sum(player.get_quantity() for player in self.players.values())
        result = {"final_value" : final_value}
        result['winner'] = 'tie'
        result['players'] = list(self.players)
        for k, v in self.players.items():
            result[f"{k}_guess"] = v.get_guess()
            result[f"{k}_quantity"] = v.get_quantity()
            if v.get_guess() == final_value:
                result['winner'] = k
        return result
    
    def get_player_quantity(self, username):
        return self.players.get(username).get_quantity()
    
    def get_player_guess(self, username):
        return self.players.get(username).get_guess()

    def set_player_quantity(self, username, quantity):
        self.players.get(username).set_quantity(quantity)
        
    def set_player_guess(self, username, guess):
        self.players.get(username).set_guess(guess)
       
    
        

class   PurrinhaPlayer:
    
    def __init__(self, username) -> None:
        self.quantity = -1
        self.guess = -1
        self.username = username
    
    def __repr__(self):
        return f"name = {self.username} quantity = {self.quantity} guess = {self.guess}"

    def set_quantity(self, quantity):
        self.quantity = quantity

    def set_guess(self, guess):
        self.guess = guess
        
    def get_quantity(self):
        return int(self.quantity)
    
    def get_guess(self):
        return int(self.guess)
    
    def get_name(self):
        return self.username
