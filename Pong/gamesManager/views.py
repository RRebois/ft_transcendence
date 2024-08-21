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

import uuid

def	verify_data(game_name, game_code, session_id=None):
	if game_name not in ['pong', 'purrinha']:
		return "This game does not exists."
	# 10 => alone vs bot
	# 20 => local vs a 'guest' player (don't count for statistics)
	# 21 => local vs a friend (password needed) [not doing anymore - may cause security issues]
	# 22 => remote 1 vs 1
	# 23 => remote 1 vs 1 (tournament mode)
	# 40 => remote 2 vs 2
	if game_code not in [10, 20, 22, 23, 40]:
		return "This code does not exists."
	if session_id is not None and cache.get(session_id) is None:
		return "This session does not exists."
	return None

@method_decorator(csrf_protect, name='dispatch')
class	MatchMaking(APIView):
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
				elo = user_data.user_elo_pong[-1] if MatchMaking.matchs[session_id]['game_name'] == 'pong' else user_data.user_elo_purrinha[-1]
				MatchMaking.matchs[session_id]['players'].update({username: elo})

	@staticmethod
	def	get_session(game_name, game_code, username):
		# for in MatchMaking.matchs to find if there is an open match
		# if open match look for the match with the closest elo
		# if no open match creates one
		# check the game_code in the case of bot or local
		pass

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
				'tournament_id': tournament_id,
				'status': 'open',
				'players': players,
			}
					
			if usernames:
				for i, username in enumerate(usernames):
					# MatchMaking.add_player(session_id, username)
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
# @method_decorator(login_required(login_url='login'), name='dispatch')
class GameManagerView(APIView):

	def	verify_data(self, game_name, game_code, session_id):
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
		if session_id is not None and cache.get(session_id) is None:
			return "This session does not exist."
		return None

	def	create_session(self, request, game_name, game_code, username):
		awaited_connections = 2
		if game_code == 40:
			awaited_connections = 4

		players = {username: {'id': 1, 'connected': False}}
		if game_code == 10:
			players['bot'] = {'id': 2, 'connected': True}
		if game_code == 20:
			players['guest'] = {'id': 2, 'connected': True}

		# if game_code == 40:
		# 	players['guest1'] = {'id': 2, 'connected': True}
		# 	players['guest2'] = {'id': 3, 'connected': True}
		# 	players['guest3'] = {'id': 4, 'connected': True}


		session_id = f"{game_name}_{str(uuid.uuid4().hex)}"
		cache.set(session_id, {

		'players': players,
		'game': game_name,
		'awaited_players': awaited_connections,
		# 'connected_players': 3 if game_code == 40 else 1,
		'connected_players': 0 if game_code not in [10, 20] else 1,
		'session_id': session_id,
		'status': 'waiting',
		'winner': None,
		'game_state': 'waiting',
		})
		return session_id


	def	get(self, request, game_name, game_code, session_id=None):

		error_message = self.verify_data(game_name, game_code, session_id)
		if error_message is not None:
			return JsonResponse({"success": False, "errors": error_message})

		user = authenticate_user(request)
		username = user.username
		if session_id is None:
			session_id = self.create_session(request, game_name, game_code, username)
		else:
			session_data = cache.get(session_id)
			players = session_data['players']
			connections = session_data['connected_players']
			if connections == session_data['awaited_players']:
				return JsonResponse({"success": False, "errors": 'No more connexions are allowed'})
			if username in players and players[username]['connected']:
				return JsonResponse({"success": False, "errors": 'You are already connected'})
			if username not in players:
				session_data['players'][username] = {'id': connections + 1, 'connected': False}
				cache.set(session_id, session_data)



		# return JsonResponse({
		# 	'status': 'succes',
		# 	'game': game_name,
		# 	'session_id': session_id,
		# 	'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
		# })
		# if game_name == 'purrinha':
		# 	return render(request, "pages/purrinha.html" ,{
		# 		'status': 'succes',
		# 		'game': game_name,
		# 		'session_id': session_id,
		# 		'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
		# 	})
		return JsonResponse({
			'game': game_name,
			'session_id': session_id,
			'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
		}, status=status.HTTP_200_OK)



