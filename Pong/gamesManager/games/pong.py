from random import choice, randrange

GAME_WIDTH = 600
GAME_HEIGHT = 280

WINNING_SCORE = 2

PADDLE_START_VEL = 6
BALL_START_VEL = 4
MAX_VEL = 10

BALL_ACC = 0.4

PADDLE_HEIGHT = GAME_HEIGHT // 6
PADDLE_WIDTH = PADDLE_HEIGHT // 10
PADDLE_LEFT_X = 10
PADDLE_RIGHT_X = GAME_WIDTH - PADDLE_LEFT_X - PADDLE_WIDTH

BALL_RADIUS = 10

class Paddle:

    def __init__(self, x, y, high_limit, low_limit):
        self.x = self.original_x = x
        self.y = self.original_y = y
        self.width = PADDLE_WIDTH
        self.height = PADDLE_HEIGHT
        self.high_limit = high_limit
        self.low_limit = low_limit

    async def move(self, up=True):
        if up:
            self.y -= PADDLE_START_VEL
        else:
            self.y += PADDLE_START_VEL

    async def reset(self):
        self.x = self.original_x
        self.y = self.original_y

    async def handle_movement(self, key_up=True):
        if key_up and self.y - PADDLE_START_VEL >= self.high_limit:
            await self.move(up=key_up)
        if not key_up and self.y + PADDLE_START_VEL + self.height <= self.low_limit: #GAME_HEIGHT:
            await self.move(up=key_up)

    async def serialize(self):
        return {
            'x' : self.x,
            'y' : self.y,
        }

class Ball:

    def __init__(self, x, y, radius):
        self.x = self.original_x = x
        self.y = self.original_y = y
        self.radius = radius
        self.y_vel = randrange(6) * choice([1, -1])
        self.x_vel = BALL_START_VEL * choice([1, -1])

    async def move(self):
        self.x += self.x_vel
        self.y += self.y_vel

    async def reset(self):
        self.x = self.original_x
        self.y = self.original_y
        self.y_vel = randrange(6) * choice([1, -1])
        self.x_vel = BALL_START_VEL * choice([1, -1])

    async def accelerate(self):
        if abs(self.x_vel) >= MAX_VEL:
            pass
        if self.x_vel > 0:
            self.x_vel += BALL_ACC
        else:
            self.x_vel -= BALL_ACC

    async def serialize(self):
        return {
            'x' : self.x,
            'y' : self.y,
            'radius': self.radius,
        }

async def find_new_direction(ball, paddle):

    ball.x_vel *= -1
    middle_y = paddle.y + paddle.height / 2
    difference_in_y = middle_y - ball.y
    reduction_factor = (paddle.height / 2) / ball.x_vel
    y_vel = difference_in_y / reduction_factor
    if not y_vel:
        y_vel = 0.1
    ball.y_vel = -1 * y_vel

async def handle_collision(ball, left_paddle, right_paddle, first_time=True):
    if first_time and (ball.y + ball.radius >= GAME_HEIGHT or ball.y - ball.radius <= 0):
        ball.y_vel *= -1
        await ball.accelerate()

    else:
        if ball.x_vel < 0:
            if ball.y >= left_paddle.y and ball.y <= left_paddle.y + left_paddle.height:
                if ball.x - ball.radius <= left_paddle.x + left_paddle.width:
                    await find_new_direction(ball, left_paddle)
                    await ball.accelerate()

        elif ball.x_vel >= 0:
            if ball.y >= right_paddle.y and ball.y <= right_paddle.y + right_paddle.height:
                if ball.x + ball.radius >= right_paddle.x:
                    await find_new_direction(ball, right_paddle)
                    await ball.accelerate()


class   PongMatch():

    def __init__(self, players_name, multiplayer=False):
        self.multiplayer = multiplayer
        self.ball = Ball(GAME_WIDTH // 2, GAME_HEIGHT // 2, BALL_RADIUS)
        if not multiplayer:
            self.paddles = [
                Paddle(PADDLE_LEFT_X, GAME_HEIGHT // 2 - PADDLE_HEIGHT //
                            2, 0, GAME_HEIGHT),
                Paddle(PADDLE_RIGHT_X, GAME_HEIGHT //
                             2 - PADDLE_HEIGHT // 2, 0, GAME_HEIGHT),
            ]
        else:
            self.paddles = [
                Paddle(PADDLE_LEFT_X, GAME_HEIGHT // 2 - PADDLE_HEIGHT, 0, GAME_HEIGHT // 2),
                Paddle(PADDLE_LEFT_X, GAME_HEIGHT // 2, GAME_HEIGHT // 2, GAME_HEIGHT),
                Paddle(PADDLE_RIGHT_X, GAME_HEIGHT // 2 - PADDLE_HEIGHT, 0, GAME_HEIGHT // 2),
                Paddle(PADDLE_RIGHT_X, GAME_HEIGHT // 2, GAME_HEIGHT // 2, GAME_HEIGHT),
            ]
        self.left_score = 0
        self.right_score = 0
        self.players = {f"player{v['id']}": {'name': k, 'pos': 0} for k,v in players_name.items()}


    async def get_coordinates(self):
            for i, paddle in enumerate(self.paddles):
                key = f"player{i + 1}"
                self.players[key]['pos'] = await paddle.serialize()

            ball = await self.ball.serialize()
            coord = {
                'players': self.players,
                'ball': ball,
                'left_score': self.left_score,
                'right_score': self.right_score,
                'game_width': GAME_WIDTH,
                'game_height': GAME_HEIGHT,
                'paddle_width': PADDLE_WIDTH,
                'paddle_height': PADDLE_HEIGHT,
                'winning_score': WINNING_SCORE,
            }
            return coord

    async def check_score(self):
            if self.ball.x <= 0:
                self.right_score += 1
                await self.reset()
            elif self.ball.x >= GAME_WIDTH:
                self.left_score += 1
                await self.reset()

    async def paddle_movement(self, player, key_up=True):
        await self.paddles[player - 1].handle_movement(key_up)

    async def routine(self):
        await self.ball.move()
        await handle_collision(self.ball, self.paddles[0], self.paddles[-1])
        if self.multiplayer:
            await handle_collision(self.ball, self.paddles[1], self.paddles[2], first_time=False)
        await self.check_score()

    async def reset(self):
        for paddle in self.paddles:
            await paddle.reset()
        await self.ball.reset()

    async def   play_again(self):
        self.reset()
        self.left_score = 0
        self.right_score = 0

class   PongGame():

    def __init__(self, players_name, multiplayer=False):
        self.match = PongMatch(players_name, multiplayer=multiplayer)

    async def move_player_paddle(self, player_move):
        player = player_move['player']
        move = player_move['direction'] < 0
        await self.match.paddle_movement(player=player, key_up=move)

    async def update(self):
        await self.match.routine()

    async def serialize(self):
        coord = await self.match.get_coordinates()
        return coord

    async def   reset_game(self):
        self.match.play_again()
