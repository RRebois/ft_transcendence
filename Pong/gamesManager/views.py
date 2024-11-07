from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from userManagement.views import authenticate_user
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from userManagement.models import User, UserData
from matchs.models import *
from configFiles.globals import *

import asyncio
import uuid


class MatchMaking():
    matchs = {}
    tournament = {}

    @staticmethod
    def delete_session(session_id):
        if MatchMaking.matchs.get(session_id):
            MatchMaking.matchs.pop(session_id)

    @staticmethod
    def change_session_status(session_id, is_open=True):
        if MatchMaking.matchs.get(session_id):
            MatchMaking.matchs[session_id]['status'] = 'open' if is_open else 'closed'

    @staticmethod
    def remove_players(session_data):
        session_id = session_data['session_id']
        if MatchMaking.matchs.get(session_id):
            MatchMaking.matchs[session_id]['elos'] = []
            MatchMaking.matchs[session_id]['players'] = []
            session_data['players'] = {}
            session_data['connected_players'] = 0
            cache.set(session_id, session_data)

    @staticmethod
    def add_player(session_id, username):
        if MatchMaking.matchs.get(session_id):
            if username not in ['guest', BOT_NAME]:
                try:
                    user_data = UserData.objects.get(user_id=User.objects.get(username=username))
                except:
                    return JsonResponse({"message": "User does not exist."}, status=404)
                elo = user_data.user_elo_pong[-1]['elo'] if MatchMaking.matchs[session_id]['game_name'] == 'pong' else \
                    user_data.user_elo_purrinha[-1]['elo']
                MatchMaking.matchs[session_id]['elos'].append(elo)
                MatchMaking.matchs[session_id]['players'].append(username)
                if MatchMaking.matchs[session_id]['awaited_players'] == len(MatchMaking.matchs[session_id]['players']):
                    MatchMaking.change_session_status(session_id, is_open=False)
                session_data = cache.get(session_id)
                player_id = len(session_data['players']) + 1
                session_data['players'][username] = {'id': player_id, 'connected': False}
                cache.set(session_id, session_data)

    @staticmethod
    def get_session(game_name, game_code, user):
        if game_code in [10, 20]:
            other_player = BOT_NAME if game_code == 10 else 'guest'
            session_id = MatchMaking.create_session(game_name, game_code)
            # MatchMaking.delete_session(session_id)
            session_data = cache.get(session_id)
            session_data['connected_players'] = 1
            session_data['players'][user.username] = {'id': 1, 'connected': False}
            session_data['players'][other_player] = {'id': 2, 'connected': True}
            cache.set(session_id, session_data)
            return session_id

        user_data = user.data
        user_elo = user_data.user_elo_pong[-1]['elo'] if game_name == 'pong' else user_data.user_elo_purrinha[-1]['elo']
        session_id = MatchMaking.find_match(user.username, user_elo, game_name, game_code, ELO_DIFF)
        if not session_id:
            session_id = MatchMaking.create_session(game_name, game_code)
        MatchMaking.add_player(session_id, user.username)
        return session_id

    @staticmethod
    def find_match(username, user_elo, game_name, game_code, diff):
        elo_diff = None
        matchs_open = 0
        for k, v in MatchMaking.matchs.items():
            if v['status'] == 'open' and v['elos'] and not v['tournament_name'] and username not in v['players'] \
                    and v['game_name'] == game_name and v['game_code'] == game_code:
                matchs_open += 1
                elo_diff = [abs(elo - user_elo) for elo in v['elos'] if abs(elo - user_elo) <= diff]
                if elo_diff:
                    return k
        if matchs_open == 0:
            return None
        asyncio.sleep(1)
        return MatchMaking.find_match(username, user_elo, game_name, game_code, diff + ELO_DIFF)

    @staticmethod
    def create_session(game_name, game_code, tournament_name=None):
        awaited_connections = 2
        if game_code == 40:
            awaited_connections = 4
        print("\n\n\nTournament Name in createSess: ", tournament_name)
        players = {}
        session_id = f"{game_name}_{str(uuid.uuid4().hex)}"

        if game_code not in [10, 20]:
            MatchMaking.matchs[session_id] = {
                'game_name': game_name,
                'game_code': game_code,
                'awaited_players': awaited_connections,
                'tournament_name': tournament_name,
                'status': 'open',
                'players': [],
                'elos': [],
            }

        # if usernames:
        # 	for i, username in enumerate(usernames):
        # 		players[username] = {'id': i + 1, 'connected': False}

        cache.set(session_id, {
            'players': players,
            'game': game_name,
            'awaited_players': awaited_connections,
            'connected_players': 0,
            'session_id': session_id,
            'status': 'waiting',
            'winner': None,
            'tournament_name': tournament_name,
            'game_state': 'waiting',
            'deconnection': False,
        })
        return session_id

    @staticmethod
    def create_tournament_session(tournament_name):
        try:
            tournament = Tournament.objects.get(name=tournament_name)
        except:
            return JsonResponse({"message": "Tournament does not exist."}, status=404)
        print("\n\n\nTournament Name create tournament sess: ", tournament_name)
        # matchs = [match.get_players() for match in tournament.tournament_matchs.all()]
        MatchMaking.tournament[tournament_name] = {
            # 'status': 'open',
            'number_players': tournament.number_players,
            'players': {player.username: [] for player in tournament.players.all()},
            'matchs': [
                MatchMaking.create_session('pong', 23, tournament_name) for match in
                tournament.tournament_matchs.all()
            ],
        }
        return MatchMaking.tournament[tournament_name]

    @staticmethod
    def get_tournament_match(username, tournament_name):
        tournament = MatchMaking.tournament.get(tournament_name)
        if not tournament:
            tournament = MatchMaking.create_tournament_session(tournament_name)
        else:
            print("\n\n\nTournament match found")
        if len(tournament['players'][username]) >= tournament['number_players'] - 1:
            raise ValueError("You have already played all matchs for this tournament.")
        for match in tournament['matchs']:
            if MatchMaking.matchs.get(match) and MatchMaking.matchs[match]['status'] == 'open':
                players_list = MatchMaking.matchs[match]['players']
                if not players_list or players_list[0] not in tournament['players'][username]:
                    if players_list:
                        tournament['players'][username].append(players_list[0])
                        tournament['players'][players_list[0]].append(username)
                    MatchMaking.add_player(match, username)
                    return match
        raise ValueError("This tournament is already finished.")

    @staticmethod
    def delete_tournament_session(tournament_name):
        tournament = MatchMaking.tournament.get(tournament_name)
        if tournament:
            for session in tournament['matchs']:
                MatchMaking.delete_session(session)
            MatchMaking.tournament.pop(tournament_name)


@method_decorator(csrf_protect, name='dispatch')
class GameManagerView(APIView):

    def check_data(self, game_name, game_code):
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
        if game_name == 'purrinha' and game_code == 20:
            return "This match mode is not available."
        return None

    def get(self, request, game_name, game_code):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        if user.status == "in-game":
            return JsonResponse({"message": "You are already in a game."}, status=403)
        error_message = self.check_data(game_name, game_code)
        if error_message is not None:
            return JsonResponse({"success": False, "errors": error_message})
        # username = user.username
        session_id = MatchMaking.get_session(game_name, game_code, user)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}_group",
            {
                "type": "status_change",
                "user_id": user.id,
                "status": "in-game"
            }
        )
        # user.status = "in-game"
        # user.save()
        return JsonResponse({
            'game': game_name,
            'session_id': session_id,
            'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name='dispatch')
class CheckProvidedGame(APIView):
    def get(self, request, game_name, game_code, session_id):
        print(f"\n\n\nsearching for => {session_id}\n\n\n")
        if game_name not in ['pong', 'purrinha']:
            return JsonResponse({"message": "This game does not exist."}, status=404)
        if game_code not in [10, 20, 22, 23, 40]:
            return JsonResponse({"message": "This code does not exist."}, status=404)
        print(f"\n\n\nsession id search result : {MatchMaking.matchs.get(session_id)}\n\n\n")
        if not MatchMaking.matchs.get(session_id):
            print("\n\n\nerror case 1\n\n\n")
            return JsonResponse({"message": "This session does not exist."}, status=404)
        if MatchMaking.matchs[session_id]['game_name'] != game_name:
            print("\n\n\nerror case 2\n\n\n")
            return JsonResponse({"message": "This game does not exist."}, status=404)
        return JsonResponse({
            'game': game_name,
            'session_id': session_id,
            'ws_route': f'/ws/game/{game_name}/{game_code}/{session_id}/'
        }, status=status.HTTP_200_OK)
