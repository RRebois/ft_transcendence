from random import choice, randrange
from configFiles.globals import *

class Paddle:

    def __init__(self, x, y, high_limit, low_limit, height):
        self.x = self.original_x = x
        self.y = self.original_y = y
        self.width = PADDLE_WIDTH
        self.height = height
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
        self.y_vel = self.x_vel = 0

    async def move(self):
        if not self.x_vel:
            self.x_vel = BALL_START_VEL * choice([1, -1])
        if not self.y_vel:
            self.y_vel = randrange(15) * choice([0.1, -0.1])
        self.x += self.x_vel
        self.y += self.y_vel

    async def reset(self):
        self.x = self.original_x
        self.y = self.original_y
        self.y_vel = self.x_vel = 0


    async def accelerate(self):
        if abs(self.x_vel) >= MAX_VEL:
            return
        if self.x_vel > 0:
            self.x_vel += BALL_ACC
        else:
            self.x_vel -= BALL_ACC

    async def serialize(self):
        return {
            'x' : self.x,
            'y' : self.y,
            'radius': self.radius,
            'x_vel': self.x_vel,
            'y_vel': self.y_vel,
        }

async def find_new_direction(ball, paddle):

    ball.x_vel *= -1
    middle_paddle = paddle.height / 2
    middle_y = paddle.y + middle_paddle
    difference_in_y = middle_y - ball.y
    reduction_factor = middle_paddle / -abs(ball.x_vel)
    y_vel = difference_in_y / reduction_factor
    if abs(y_vel) < 0.1:
        y_vel = 0.1 if y_vel >= 0 else -0.1
    ball.y_vel = y_vel
    await ball.move()
    # new_x = -ball.radius if paddle.x > GAME_WIDTH // 2 else ball.radius
    # ball.x = paddle.x + new_x
    await ball.accelerate()

async def handle_collision(ball, paddles):
    if ball.y + ball.radius >= GAME_HEIGHT or ball.y - ball.radius <= 0:
        ball.y_vel *= -1
        await ball.accelerate()

    for paddle in paddles:
        await check_paddle_collision(ball, paddle)

async def check_paddle_collision(ball, paddle):
    if ball.y + ball.radius >= paddle.y and ball.y - ball.radius <= paddle.y + paddle.height:
        if (ball.x_vel < 0 and ball.x - ball.radius <= paddle.x and ball.x >= paddle.x) or \
           (ball.x_vel > 0 and ball.x + ball.radius >= paddle.x and ball.x <= paddle.x + paddle.width):
            await find_new_direction(ball, paddle)

class   PongMatch():

    def __init__(self, players_name, multiplayer=False):
        self.ball = Ball(GAME_WIDTH // 2, GAME_HEIGHT // 2, BALL_RADIUS)
        self.ph = PADDLE_HEIGHT_DUO
        if not multiplayer:
            self.paddles = [
                Paddle(PADDLE_LEFT_X, GAME_HEIGHT // 2 - self.ph //
                            2, 0, GAME_HEIGHT, self.ph),
                Paddle(PADDLE_RIGHT_X, GAME_HEIGHT // 2 - self.ph //
                            2, 0, GAME_HEIGHT, self.ph),
            ]
        else:
            self.ph = PADDLE_HEIGHT_MULTI
            self.paddles = [
                Paddle(PADDLE_LEFT_X, GAME_HEIGHT // 2 - self.ph, 0, GAME_HEIGHT // 2, self.ph),
                Paddle(PADDLE_LEFT_X, GAME_HEIGHT // 2, GAME_HEIGHT // 2, GAME_HEIGHT, self.ph),
                Paddle(PADDLE_RIGHT_X, GAME_HEIGHT // 2 - self.ph, 0, GAME_HEIGHT // 2, self.ph),
                Paddle(PADDLE_RIGHT_X, GAME_HEIGHT // 2, GAME_HEIGHT // 2, GAME_HEIGHT, self.ph),
            ]
        self.left_score = 0
        self.right_score = 0
        self.new_round = False
        self.counter = 0
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
                'paddle_height': self.ph,
                'winning_score': WINNING_SCORE,
                'new_round': self.new_round,
            }
            return coord

    async def check_score(self):
            if self.ball.x <= 0:
                self.right_score += 1
                await self.reset()
                self.new_round = True
                self.counter = WAITING_LOOPS
            elif self.ball.x >= GAME_WIDTH:
                self.left_score += 1
                await self.reset()
                self.new_round = True
                self.counter = WAITING_LOOPS

    async def paddle_movement(self, player, key_up=True):
        await self.paddles[player - 1].handle_movement(key_up)

    async def routine(self):
        self.new_round = False
        if not self.counter:
            await self.ball.move()
            await handle_collision(self.ball, self.paddles)
            await self.check_score()
        else:
            self.counter -= 1

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
