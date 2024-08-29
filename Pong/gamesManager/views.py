from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from userManagement.views import authenticate_user

import uuid




@method_decorator(csrf_protect, name='dispatch')
class	GameManagerView(APIView):

	def	verify_data(self, game_name, game_code, session_id):
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
			return JsonResponse({"message": error_message}, status=400)

		user = authenticate_user(request)
		username = user.username
		if session_id is None:
			session_id = self.create_session(request, game_name, game_code, username)
		else:
			session_data = cache.get(session_id)
			players = session_data['players']
			connections = session_data['connected_players']
			if connections == session_data['awaited_players']:
				return JsonResponse({"message": "This game is full."}, status=400)
			if username in players and players[username]['connected']:
				return JsonResponse({"message": "You are already in this game."}, status=400)
			if username not in players:
				session_data['players'][username] = {'id': connections + 1, 'connected': False}
				cache.set(session_id, session_data)




		if game_name == 'purrinha':
			return render(request, "pages/purrinha.html" ,{
				'status': 'succes',
				'game': game_name,
				'session_id': session_id,
				'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
			})
		return render(request, "pages/pong.html" ,{
			'status': 'succes',
			'game': game_name,
			'session_id': session_id,
			'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
		})



