###		PONG VARIABLES		###
GAME_WIDTH = 600
GAME_HEIGHT = 280

WINNING_SCORE = 2

PADDLE_START_VEL = 4
BALL_START_VEL = 5
MAX_VEL = 10

BALL_ACC = .2

PADDLE_HEIGHT_DUO = 60
PADDLE_HEIGHT_MULTI = 40
PADDLE_WIDTH = 10
PADDLE_LEFT_X = 10
PADDLE_RIGHT_X = 590
# PADDLE_Y_POSITION_PLAYERS = 140

BALL_RADIUS = 10
SLEEP = 0.02

# how many game loops without update the ball position to match with SLEEP (50 * SLEEP) = 1 second
WAITING_LOOPS = 50

# for the match making - to search for another player who is within this level of ELO difference
ELO_DIFF = 20

# limit of players in a tournament
TOURNAMENT_LIMIT = 4

# name of the bot in the db
BOT_NAME = 'bot'


###		PURRINHA VARIABLES		###
MAX_QUANTITY = 3

MAX_ROUND_WINS = 1
