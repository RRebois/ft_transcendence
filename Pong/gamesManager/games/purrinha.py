
from configFiles.globals import *

class   PurrinhaMatch:

    def __init__(self, players):
        self.players = []
        for k, v in players.items():
            self.players.append(PurrinhaPlayer(k, v['id']))

    async def get_player(self, id):
        for player in self.players:
            if player.id == id:
                return player

    async def get_max_guess(self):
        return len(self.players) * MAX_QUANTITY

    async def get_final_result(self):
        sum = 0
        for player in self.players:
            sum += await player.get_quantity()
        return sum
        # return sum(await player.get_quantity() for player in self.players)

    async def get_players_data(self):
        players_data = {}
        for player in self.players:
            temp = await player.get_data()
            players_data.update(temp)
        return players_data
        # return {await player.get_data() for player in self.players}
    
    async def get_player_data(self, id):
        player = await self.get_player(id)
        data = await player.get_data()
        # player_data = data.values()
        return data[f"player{id}"]

    async def get_round_result(self):
        players_data = {}
        for player in self.players:
            temp = await player.get_final_data()
            players_data.update(temp)
        return players_data
        # return {await player.get_final_data() for player in self.players}

    async def get_player_quantity(self, id):
        if id > 0 and id <= len(self.players):
            player = await self.get_player(id)
            return await player.get_quantity()
            # return await self.get_player(id).get_quantity()

    async def get_player_guess(self, id):
        if id > 0 and id <= len(self.players):
            player = await self.get_player(id)
            return await player.get_guess()
            # return await self.get_player(id).get_guess()

    async def set_player_quantity(self, id, quantity):
        if id > 0 and id <= len(self.players):
            if quantity >= 0 and quantity <= MAX_QUANTITY:
                player = await self.get_player(id)
                await player.set_quantity(quantity)
                # await self.get_player(id).

    async def set_player_guess(self, id, guess):
        if id > 0 and id <= len(self.players):
            if guess >= 0 and guess <= await self.get_max_guess():
                player = await self.get_player(id)
                await player.set_guess(guess)
                # await self.get_player(id).

    async def reset_match(self):
        for player in self.players:
            await player.reset_player()



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

    async def get_data(self):
        return {
            f"player{self.id}": {
                "name": self.username,
                'quantity': False if self.quantity == -1 else True,
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
    
    async def reset_player(self):
        self.guess = -1
        self.quantity = -1

class   PurrinhaGame:

    def __init__(self, players):
        self.match = PurrinhaMatch(players)
        self.players_nb = len(players)
        self.numbers_to_guess = [i for i in range(self.players_nb * MAX_QUANTITY + 1)]
        self.numbers_to_guess_init = self.numbers_to_guess

    async def   get_number_to_guess(self):
        return self.numbers_to_guess

    async def   get_status(self):
        players = await self.match.get_players_data()
        status = 'guessing'
        guesses = 0
        for player in players:
            print(f'\n\n\ninside get status => {player}\n\n\n')
            if not players[player]['quantity']:
                status = 'choosing'
                break
            if players[player]['guess'] != -1:
                guesses += 1
        result = winner = 'waiting'
        if guesses == self.players_nb:
            status = 'finished'
            result = await self.match.get_final_result()
            players = await self.match.get_round_result()
            winner = 'tie'
            for player in players:
                if player['guess'] == result:
                    winner == player['name']
                    break

        return {
            'round': status,
            'players': players,
            'available_to_guess': self.numbers_to_guess,
            'result': result,
            'winner': winner,
            'player_turn': None,
            'error_message': None,
        }
    
    async def set_player_guess(self, id, guess):
        player = await self.match.get_player_data(id)
        if player['quantity']:
            if player['guess'] == -1:
                if guess in self.numbers_to_guess:
                    self.numbers_to_guess.remove(guess)
                await self.match.set_player_guess(id, guess)

    async def set_player_quantity(self, id, quantity):
        player = await self.match.get_player_data(id)
        print(f'\n\n\ninside set_player_quantity => {player}\n\n\n')
        if not player['quantity']:
            await self.match.set_player_quantity(id, quantity)

    async def play_again(self):
        await self.match.reset_match()
        self.numbers_to_guess = self.numbers_to_guess_init