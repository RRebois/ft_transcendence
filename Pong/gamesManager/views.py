from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
import asyncio
# from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
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

def	game_manager(request, game_name, num_players, session_id=None):
	if game_name != 'pong' and game_name != 'purrinha':
		return JsonResponse({'status': 'error'})
	if 1 > num_players or num_players > 4:
		return JsonResponse({'status': 'error'})
	if session_id is not None and cache.get(session_id) is None:
		return JsonResponse({'status': 'error'})
	if session_id is None:
		session_id = f"{game_name}_{str(uuid.uuid4().hex)}"
		cache.set(session_id, {'connections': 0, 'winner': None})
		# asyncio.create_task(session_creator(session_id))
		# asyncio.run_coroutine_threadsafe(session_creator(session_id))
	# print("\n\n\n+++++++++++++++++PASSEI AQUI++++++++++++++++\n\n\n")



	# return JsonResponse({
	# 	'status': 'succes',
	# 	'game': game_name,
	# 	'awaited_players': num_players,
	# 	'session_id': session_id,
	# 	'ws_route': f'/ws/game/{game_name}/{num_players}/{session_id}/'
	# })
	return render(request, "pages/pong.html" ,{
		'status': 'succes',
		'game': game_name,
		'awaited_players': num_players,
		'session_id': session_id,
		'ws_route': f'/ws/game/{game_name}/{num_players}/{session_id}/'
	})



