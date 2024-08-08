from random import choice, randrange

GAME_WIDTH = 800
GAME_HEIGHT = 400

WINNING_SCORE = 10

PADDLE_START_VEL = 6
BALL_START_VEL = 4
MAX_VEL = 10

BALL_ACC = 0.2

PADDLE_HEIGHT = GAME_HEIGHT // 6
PADDLE_WIDTH = PADDLE_HEIGHT // 10

BALL_RADIUS = PADDLE_HEIGHT // 14

class Paddle:

    def __init__(self, x, y, width, height):
        self.x = self.original_x = x
        self.y = self.original_y = y
        self.width = width
        self.height = height

    async def move(self, up=True):
        if up:
            self.y -= PADDLE_START_VEL
        else:
            self.y += PADDLE_START_VEL

    async def reset(self):
        self.x = self.original_x
        self.y = self.original_y

    async def handle_movement(self, key_up=True):
        if key_up and self.y - PADDLE_START_VEL >= 0:
            await self.move(up=key_up)
        if not key_up and self.y + PADDLE_START_VEL + self.height <= GAME_HEIGHT:
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
        self.x_vel = BALL_START_VEL * choice([1, -1])
        self.y_vel = randrange(6) * choice([1, -1])

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

async def handle_collision(ball, left_paddle, right_paddle):
    if ball.y + ball.radius >= GAME_HEIGHT or ball.y - ball.radius <= 0:
        ball.y_vel *= -1
        await ball.accelerate()

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

    def __init__(self, players_name):
        self.ball = Ball(GAME_WIDTH // 2, GAME_HEIGHT // 2, BALL_RADIUS)
        self.left_paddle = Paddle(10, GAME_HEIGHT//2 - PADDLE_HEIGHT //
                         2, PADDLE_WIDTH, PADDLE_HEIGHT)
        self.right_paddle = Paddle(GAME_WIDTH - 10 - PADDLE_WIDTH, GAME_HEIGHT //
                          2 - PADDLE_HEIGHT//2, PADDLE_WIDTH, PADDLE_HEIGHT)
        self.left_score = 0
        self.right_score = 0
        self.players_name = players_name


    async def get_coordinates(self):
            right_paddle = await self.right_paddle.serialize()
            left_paddle = await self.left_paddle.serialize()
            ball = await self.ball.serialize()
            coord = {
                'ball' : ball,
                'player1' : left_paddle,
                'player2' : right_paddle,
                'player1_score' : self.left_score,
                'player2_score' : self.right_score,
                'game_width': GAME_WIDTH,
                'game_height': GAME_HEIGHT,
                'paddle_width': PADDLE_WIDTH,
                'paddle_height': PADDLE_HEIGHT,
                'ball_radius': BALL_RADIUS,
            }
            for i, name in enumerate(self.players_name):
                key_name = f"player{i + 1}_name"
                coord[key_name] = name
            return coord

    async def check_score(self):
            if self.ball.x <= 0:
                self.right_score += 1
                await self.reset()
            elif self.ball.x >= GAME_WIDTH:
                self.left_score += 1
                await self.reset()

    async def paddle_movement(self, left=True, key_up=True):
        if left:
            await self.left_paddle.handle_movement(key_up=key_up)
        else:
            await self.right_paddle.handle_movement(key_up=key_up)

    async def routine(self):
        await self.ball.move()
        await handle_collision(self.ball, self.left_paddle, self.right_paddle)
        await self.check_score()

    async def reset(self):
        await self.left_paddle.reset()
        await self.right_paddle.reset()
        await self.ball.reset()


class   PongGame():

    def __init__(self, players_name):
        self.match = PongMatch(players_name)

    async def move_player_paddle(self, player_move):
        player = player_move['player'] == 1
        move = player_move['direction'] < 0
        if player_move['direction'] != 0:
            await self.match.paddle_movement(left=player, key_up=move)

    async def update(self):
        await self.match.routine()

    async def serialize(self):
        coord = await self.match.get_coordinates()
        return coord
