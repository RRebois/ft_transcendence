###		PONG VARIABLES		###
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
SLEEP = 0.02


# for the match making - to search for another player who is within this level of ELO difference
ELO_DIFF = 20

# limit of players in a tournament
TOURNAMENT_LIMIT = 4

# name of the bot in the db
BOT_NAME = 'bot'


###		PURRINHA VARIABLES		###
MAX_QUANTITY = 3

MAX_ROUND_WINS = 3