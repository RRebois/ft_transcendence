
MAX_QUANTITY = 3

class   PurrinhaMatch:
    # id = 0

    def __init__(self, players):
        self.players = []
        for k, v in players.items():
            self.players.append(PurrinhaPlayer(k, v['id']))

        # self.game_id = PurrinhaGame.id
        # PurrinhaGame.id += 1

    # def add_player(self, username):
    #     if username not in self.players:
    #         self.players[username] = PurrinhaPlayer(username)

    # def remove_players(self):
    #     self.players.clear()

    # def remove_player(self, username):
    #     self.players.pop(username)

    async def has_everyone_choose(self):
        error_list = []
        for player in self.players:
            if await player.get_quantity() == -1:
                error_list.append(player)
        return error_list

    async def get_max_guess(self):
        return len(self.players) * MAX_QUANTITY

    async def get_final_result(self):
        return sum(await player.get_quantity() for player in self.players)

    async def get_players_data(self):
        return {await player.get_final_data() for player in self.players}

    async def get_round_result(self):
        final_value = sum(await player.get_quantity() for player in self.players)
        result = {
            "final_value" : final_value,
            'players': await self.get_players_data(),
            }
        # result['winner'] = 'tie'
        # result['players'] = list(self.players)
        # for k, v in self.players.items():
        #     result[f"{k}_guess"] = v.get_guess()
        #     result[f"{k}_quantity"] = v.get_quantity()
        #     if v.get_guess() == final_value:
        #         result['winner'] = k
        return result

    async def get_player_quantity(self, id):
        if id > 0 and id <= len(self.players):
            return await self.players[id - 1].get_quantity()

    async def get_player_guess(self, id):
        if id > 0 and id <= len(self.players):
            return await self.players[id - 1].get_guess()

    async def set_player_quantity(self, id, quantity):
        if id > 0 and id <= len(self.players):
            if quantity >= 0 and quantity <= MAX_QUANTITY:
                await self.players[id - 1].set_quantity(quantity)

    async def set_player_guess(self, id, guess):
        if id > 0 and id <= len(self.players):
            if guess >= 0 and guess <= await self.get_max_guess():
                await self.players[id - 1].set_guess(guess)


    # def get_player_quantity(self, username):
    #     return self.players.get(username).get_quantity()

    # def get_player_guess(self, username):
    #     return self.players.get(username).get_guess()

    # def set_player_quantity(self, username, quantity):
    #     self.players.get(username).set_quantity(quantity)

    # def set_player_guess(self, username, guess):
    #     self.players.get(username).set_guess(guess)




class   PurrinhaPlayer:

    def __init__(self, username, id):
        self.id = id
        self.quantity = -1
        self.guess = -1
        self.username = username

    async def get_final_data(self):
        return {
            f"player{self.id}": {
                "name": self.username,
                'quantity': self.quantity,
                'guess': self.guess,
            }
        }

    async def set_quantity(self, quantity):
        self.quantity = quantity

    async def set_guess(self, guess):
        self.guess = guess

    async def get_quantity(self):
        return self.quantity

    async def get_guess(self):
        return self.guess

    async def get_name(self):
        return self.username

    async def get_id(self):
        return self.id

class   PurrinhaGame:

    def __init__(self, players):
        self.match = PurrinhaMatch(players)

    async def   get_status(self):

        return {
            'round': 'chosing', # or guessing
            'players': {},
            'available_to_guess': [],
            'guessing_players': 'chosing',
        }
