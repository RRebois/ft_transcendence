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

    def move(self, up=True):
        if up:
            self.y -= PADDLE_START_VEL
        else:
            self.y += PADDLE_START_VEL

    def reset(self):
        self.x = self.original_x
        self.y = self.original_y

    def handle_movement(self, key_up=True):
        if key_up and self.y - PADDLE_START_VEL >= 0:
            self.move(up=key_up)
        if not key_up and self.y + PADDLE_START_VEL + self.height <= GAME_HEIGHT:
            self.move(up=key_up)
            
    def serialize(self):
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

    def move(self):
        self.x += self.x_vel
        self.y += self.y_vel

    def reset(self):
        self.x = self.original_x
        self.y = self.original_y
        self.y_vel = randrange(6) * choice([1, -1])
        self.x_vel = BALL_START_VEL * choice([1, -1])

    def accelerate(self):
        if abs(self.x_vel) >= MAX_VEL:
            pass
        if self.x_vel > 0:
            self.x_vel += BALL_ACC
        else:
            self.x_vel -= BALL_ACC

    def serialize(self):
        return {
            'x' : self.x,
            'y' : self.y,
        }

def find_new_direction(ball, paddle):
    
    ball.x_vel *= -1
    middle_y = paddle.y + paddle.height / 2
    difference_in_y = middle_y - ball.y
    reduction_factor = (paddle.height / 2) / ball.x_vel
    y_vel = difference_in_y / reduction_factor
    if not y_vel:
        y_vel = 0.1
    ball.y_vel = -1 * y_vel

def handle_collision(ball, left_paddle, right_paddle):
    if ball.y + ball.radius >= GAME_HEIGHT or ball.y - ball.radius <= 0:
        ball.y_vel *= -1
        ball.accelerate()

    if ball.x_vel < 0:
        if ball.y >= left_paddle.y and ball.y <= left_paddle.y + left_paddle.height:
            if ball.x - ball.radius <= left_paddle.x + left_paddle.width:
                find_new_direction(ball, left_paddle)
                ball.accelerate()

    elif ball.x_vel >= 0:
        if ball.y >= right_paddle.y and ball.y <= right_paddle.y + right_paddle.height:
            if ball.x + ball.radius >= right_paddle.x:
                find_new_direction(ball, right_paddle)
                ball.accelerate()

class   PongMatch():

    def __init__(self):
        self.ball = Ball(GAME_WIDTH // 2, GAME_HEIGHT // 2, BALL_RADIUS)
        self.left_paddle = Paddle(10, GAME_HEIGHT//2 - PADDLE_HEIGHT //
                         2, PADDLE_WIDTH, PADDLE_HEIGHT)
        self.right_paddle = Paddle(GAME_WIDTH - 10 - PADDLE_WIDTH, GAME_HEIGHT //
                          2 - PADDLE_HEIGHT//2, PADDLE_WIDTH, PADDLE_HEIGHT)
        self.left_score = 0
        self.right_score = 0

    def get_coordinates(self):
            return {
                'ball' : self.ball.serialize(),
                'player1' : self.left_paddle.serialize(),
                'player2' : self.right_paddle.serialize(),
                'player1_score' : self.left_score,
                'player2_score' : self.right_score,
            }

    def check_score(self):
            if self.ball.x <= 0:
                self.right_score += 1
                self.reset()
            elif self.ball.x >= GAME_WIDTH:
                self.left_score += 1
                self.reset()

    def paddle_movement(self, left=True, key_up=True):
        if left:
            self.left_paddle.handle_movement(key_up=key_up)
        else:
            self.right_paddle.handle_movement(key_up=key_up)

    def routine(self):
        self.ball.move()
        handle_collision(self.ball, self.left_paddle, self.right_paddle)
        self.check_score()

    def reset(self):
        self.left_paddle.reset()
        self.right_paddle.reset()
        self.ball.reset()


class   PongGame():

    def __init__(self):
        self.match = PongMatch()

    def move_player_paddle(self, player_move):
        player = player_move['player'] == 1
        move = player_move['direction'] < 0
        self.match.paddle_movement(left=player, key_up=move)

    def update(self):
        self.match.routine()

    def serialize(self):
        return self.match.get_coordinates()








# import pygame

# pygame.init()

# WIN = pygame.display.set_mode((GAME_WIDTH, GAME_HEIGHT))
# pygame.display.set_caption("Pong")

# FPS = 60

# WHITE = (255, 255, 255)
# BLACK = (0, 0, 0)


# SCORE_FONT = pygame.font.SysFont("comicsans", 50)

# def draw(win, paddles, ball, left_score, right_score):
#     win.fill(BLACK)

#     left_score_text = SCORE_FONT.render(f"{left_score}", 1, WHITE)
#     right_score_text = SCORE_FONT.render(f"{right_score}", 1, WHITE)
#     win.blit(left_score_text, (GAME_WIDTH//4 - left_score_text.get_width()//2, 20))
#     win.blit(right_score_text, (GAME_WIDTH * (3/4) -
#                                 right_score_text.get_width()//2, 20))

#     for paddle in paddles:
#         pygame.draw.rect(
#             win, WHITE, (paddle.x, paddle.y, paddle.width, paddle.height))

#     for i in range(10, GAME_HEIGHT, GAME_HEIGHT//20):
#         if i % 5 == 1:
#             continue
#         pygame.draw.rect(win, WHITE, (GAME_WIDTH//2 - 10, i, 5, GAME_HEIGHT//20))

#     pygame.draw.circle(win, WHITE, (ball.x, ball.y), ball.radius)
#     pygame.display.update()





# def main():
#     run = True
#     clock = pygame.time.Clock()
#     pong_match = PongMatch()

#     while run:
#         clock.tick(FPS)
#         coor = pong_match.get_coordinates()
#         draw(WIN, [coor['player1'], coor['player2']], coor['ball'], coor['player1_score'], coor['player2_score'])
        
#         for event in pygame.event.get():
#             if event.type == pygame.QUIT:
#                 run = False
#                 break

#         keys = pygame.key.get_pressed()
#         if keys[pygame.K_w] or keys[pygame.K_s]:
#             pong_match.paddle_movement(left=True, key_up=(not keys[pygame.K_s]))
#         if keys[pygame.K_UP] or keys[pygame.K_DOWN]:
#             pong_match.paddle_movement(left=False, key_up=keys[pygame.K_UP])
            
#         pong_match.routine()
#         won = False
#         if pong_match.left_score >= WINNING_SCORE:
#             won = True
#             win_text = "Left Player Won!"
#         elif pong_match.right_score >= WINNING_SCORE:
#             won = True
#             win_text = "Right Player Won!"

#         if won:
#             text = SCORE_FONT.render(win_text, 1, WHITE)
#             WIN.blit(text, (GAME_WIDTH//2 - text.get_width() //
#                             2, GAME_HEIGHT//2 - text.get_height()//2))
#             pygame.display.update()
#             pygame.time.delay(5000)
#             pong_match.reset()
#             pong_match.left_score = 0
#             pong_match.right_score = 0



#     pygame.quit()


# if __name__ == '__main__':
#     main()

