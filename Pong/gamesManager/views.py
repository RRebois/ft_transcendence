from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from userManagement.views import authenticate_user
from rest_framework import status
from userManagement.models import User, UserData

import asyncio
import uuid

ELO_DIFF = 20

class	MatchMaking():
	matchs = {}

	@staticmethod
	def	delete_session(session_id):
		if MatchMaking.matchs.get(session_id):
			MatchMaking.matchs.pop(session_id)

	@staticmethod
	def	change_session_status(session_id, open=True):
		if MatchMaking.matchs.get(session_id):
			MatchMaking.matchs[session_id]['status'] = 'open' if open else 'closed'

	@staticmethod
	def	add_player(session_id, username):
		if MatchMaking.matchs.get(session_id):
			if username not in ['guest', 'bot']:
				user_data = UserData.objects.get(user_id=User.objects.get(username=username))
				elo = user_data.user_elo_pong[-1]['elo'] if MatchMaking.matchs[session_id]['game_name'] == 'pong' else user_data.user_elo_purrinha[-1]['elo']
				MatchMaking.matchs[session_id]['players'].append(elo)
				if MatchMaking.matchs[session_id]['awaited_players'] == len(MatchMaking.matchs[session_id]['players']):
					MatchMaking.change_session_status(session_id, open=False)
				session_data = cache.get(session_id)
				id = len(session_data['players']) + 1
				session_data['players'][username] = {'id': id, 'connected': False}
				cache.set(session_id, session_data)

	@staticmethod
	def	get_session(game_name, game_code, username):
		if game_code in [10, 20]:
			usernames = [username, 'bot' if game_code == 10 else 'guest']
			session_id = MatchMaking.create_session(game_name, game_code, usernames)
			MatchMaking.delete_session(session_id)
			session_data = cache.get(session_id)
			session_data['connected_players'] = 1
			cache.set(session_id, session_data)
			return session_id

		user_data = UserData.objects.get(user_id=User.objects.get(username=username))
		user_elo = user_data.user_elo_pong[-1]['elo'] if game_name == 'pong' else user_data.user_elo_purrinha[-1]['elo']
		session_id = MatchMaking.find_match(user_elo, game_name, game_code, ELO_DIFF)
		if not session_id:
			session_id = MatchMaking.create_session(game_name, game_code)
		MatchMaking.add_player(session_id, username)
		return session_id



	@staticmethod
	def	find_match(user_elo, game_name, game_code, diff):
		elo_diff = None
		matchs_open = 0
		for k, v in MatchMaking.matchs.items():
			if v['status'] == 'open' and v['players'] and not v['tournament_id']\
						and v['game_name'] == game_name and v['game_code'] == game_code:
				matchs_open += 1
				elo_diff = [abs(elo - user_elo) for elo in v['players'] if abs(elo - user_elo) <= diff]
				if elo_diff:
					return k
		if matchs_open == 0:
			return None
		asyncio.sleep(1)
		return MatchMaking.find_match(user_elo, game_name, game_code, diff + ELO_DIFF)



	@staticmethod
	def	create_session(game_name, game_code, usernames=None, tournament=False, tournament_id=None):
			awaited_connections = 2
			if game_code == 40:
				awaited_connections = 4

			players = {}
			session_id = f"{game_name}_{str(uuid.uuid4().hex)}"
			if tournament and tournament_id is None:
				tournament_id = f"tournament_{str(uuid.uuid4().hex)}"

			MatchMaking.matchs[session_id] = {
				'game_name': game_name,
				'game_code': game_code,
				'awaited_players': awaited_connections,
				'tournament_id': tournament_id,
				'status': 'open',
				'players': [],
			}

			if usernames:
				for i, username in enumerate(usernames):
					players[username] = {'id': i + 1, 'connected': False}

			cache.set(session_id, {

			'players': players,
			'game': game_name,
			'awaited_players': awaited_connections,
			'connected_players': 0,
			'session_id': session_id,
			'status': 'waiting',
			'winner': None,
			'tournament_id': tournament_id,
			'game_state': 'waiting',
			})
			return session_id


@method_decorator(csrf_protect, name='dispatch')
class GameManagerView(APIView):

	def	check_data(self, game_name, game_code):
		if game_name not in ['pong', 'purrinha']:
			return "This game does not exist."
		# 10 => alone vs bot
		# 20 => local vs a 'guest' player (don't count for statistics)
		# 21 => local vs a friend (password needed) [not doing anymore - may cause security issues]
		# 22 => remote 1 vs 1
		# 23 => remote 1 vs 1 (tournament mode)
		# 40 => remote 2 vs 2
		if game_code not in [10, 20, 22, 23, 40]:
			return "This code does not exist."
		return None

	def	get(self, request, game_name, game_code):

		error_message = self.check_data(game_name, game_code)
		if error_message is not None:
			return JsonResponse({"success": False, "errors": error_message})

		user = authenticate_user(request)
		username = user.username
		session_id = MatchMaking.get_session(game_name, game_code, username)

		return JsonResponse({
			'game': game_name,
			'session_id': session_id,
			'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
		}, status=status.HTTP_200_OK)