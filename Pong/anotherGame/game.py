from userManagement.models import User, UserData

class   PurrinhaGame:

    def __init__(self, players) -> None:
        self.players = {}
        for player in players:
            username = player['username']
            self.add_player(username)
            self.set_player_quantity(username, player['quantity'])
            self.set_player_guess(username, player['guess'])

    def add_player(self, username):
        self.players[username] = PurrinhaPlayer(username)

    def remove_player(self, username):
        self.players.pop(username)

    def get_max_guess(self):
        return len(self.players) * 3

    def launch_round(self):
        final_value = 0
        # if len(self.players) < 2:
        #     return False
        test = []
        for v in self.players.values():
            final_value += v.get_quantity()
        for k, v in self.players.items():
            test.append({k : v.get_guess()})
            # if v.get_guess() == final_value:
            #     return {"winner" : k}
        # return {"winner" : "tie"}
        return test
    
    def set_player_quantity(self, username, quantity):
        try:
            self.players[username].set_quantity(quantity)
        except:
            return False
        
    def set_player_guess(self, username, guess):
        player = self.players[username]
        # for k, v in self.players:
        #     if k == username:
        #         player = v
        #     if v.get_guess() == guess:
        #         return False
        # if player:
        player.set_guess(guess, self.get_max_guess())
    
        

class   PurrinhaPlayer:
    
    def __init__(self, username) -> None:
        self.quantity = -1
        self.guess = -1
        self.username = username
        self.sticks = [0, 1, 2, 3]

    def is_valid_number(self, quantity, nb):
        if not isinstance(quantity, int) or nb < quantity < min(self.sticks):
            return False
        return True

    def set_quantity(self, quantity):
        if not self.is_valid_number(quantity, max(self.sticks)):
            return False
        self.quantity = quantity

    def set_guess(self, guess, max_guess):
        if self.quantity < 0:
            return False
        if not self.is_valid_number(guess, max_guess):
            return False
        self.guess = guess
        
    def get_quantity(self):
        return self.quantity
    
    def get_guess(self):
        return self.guess
    
    def get_name(self):
        return self.username

    def restart_values(self):
        self.quantity = -1
        self.guess = -1
