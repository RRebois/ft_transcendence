from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from userManagement.views import authenticate_user

import asyncio
# from asgiref.sync import async_to_sync
# from channels.db import database_sync_to_async
import uuid



# #TODO repensar isso
# # @async_to_sync
# async def	session_creator(session_id):
# 	await database_sync_to_async(cache.set)(session_id, {'connections': 0, 'winner': None})
# 	for i in range(180):
# 		await asyncio.sleep(1)
# 	session = await database_sync_to_async(cache.get)(session_id)
# 	if session is not None:
# 		if session['connections'] == 0:
# 			await database_sync_to_async(cache.delete)(session_id)

@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
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
		# if game_code == 22:
		# 	awaited_connections == 2
		if game_code == 40:
			awaited_connections == 4

		players = {username: {'id': 1, 'connected': False}}
		# players = {username: True}	#to test
		if game_code == 10:
			players['bot'] = {'id': 2, 'connected': True}
		if game_code == 20:	# get the request to check if it's guest or friend
			players['guest'] = {'id': 2, 'connected': True}

		session_id = f"{game_name}_{str(uuid.uuid4().hex)}"
		cache.set(session_id, {
		# # 'winner': None,
		# 'status': 'waiting',
		# 'still_available': awaited_connections,
		# 'players' : players})

		'players': players,
		'game': game_name,
		'awaited_players': awaited_connections,
		'connected_players': 0 if game_code not in [10, 20] else 1,
		'session_id': session_id,
		'status': 'waiting',
		'winner': None,
		'game_handler': None,
		'game_state': 'waiting',
		})
		return session_id


	def	get(self, request, game_name, game_code, session_id=None):

		error_message = self.verify_data(game_name, game_code, session_id)
		if error_message is not None:
			return JsonResponse({"success": False, "errors": error_message})

		user = authenticate_user(request)
		username = user.username
		# username = 'AnonymousUser'
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
				# session_data['still_available'] -= 1
				cache.set(session_id, session_data)

			# asyncio.create_task(session_creator(session_id))
			# asyncio.run_coroutine_threadsafe(session_creator(session_id))
		# print("\n\n\n+++++++++++++++++PASSEI AQUI++++++++++++++++\n\n\n")



		# return JsonResponse({
		# 	'status': 'succes',
		# 	'game': game_name,
		# 	'awaited_players': game_code,
		# 	'session_id': session_id,
		# 	'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
		# })
		return render(request, "pages/pong.html" ,{
			'status': 'succes',
			'game': game_name,
			# 'awaited_players': game_code,
			'session_id': session_id,
			'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
		})



