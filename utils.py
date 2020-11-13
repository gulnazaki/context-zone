import spotipy
from spotipy.oauth2 import SpotifyOAuth
import time
import json
from urllib.parse import quote
import statistics as stat
import random
from datetime import datetime

SCOPE = 'user-top-read playlist-modify-private'
relevant_feats = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness',
                  'loudness', 'speechiness', 'tempo', 'valence']
embed_url = "https://open.spotify.com/embed/playlist/"


def get_playlists_for_context(sp, query):
    playlists = [[p['id'], p['name'], embed_url + p['id'], p['external_urls']['spotify']] for p in 
                    sp.search(q=quote(query), limit=50, type="playlist")['playlists']['items']]

    return sorted(playlists, key=lambda p: sp.playlist(p[0])['followers']['total'])

def get_stats_for_playlists(sp, playlists):
    track_ids = [t['track']['id'] for p in playlists
                 for t in sp.playlist_tracks(p, fields='items(track(id))')['items']
                                                         if t['track']['id'] is not None]
    id_chunks = [track_ids[x:x+100] for x in range(0, len(track_ids), 100)]

    features = []
    for ids in id_chunks:
        features += [f for f in sp.audio_features(ids) if f is not None]

    stats = {}
    for feat in relevant_feats:
        feature_distr = [f[feat] for f in features]
        mean = stat.mean(feature_distr)
        std = stat.stdev(feature_distr)
        stats[feat] = (mean, std)
    return stats

def get_user_profiling(sp, stats, shallow):
    min_tracks = 2000
    first_req_max = 15
    second_req_max = 27
    t0 = time.time()

    relevant_artists = set()
    possible_tracks = set()

    for idx, artist in enumerate(sp.current_user_top_artists(limit=50)['items']):
        if shallow:
            relevant_artists.add(artist['id'])
        else:
            max_related = 7 - idx//10
            for r_artist in sp.artist_related_artists(artist_id=artist['id'])['artists'][:max_related]:
                relevant_artists.add(r_artist['id'])
            
    relevant_artists = list(relevant_artists)        
    random.shuffle(relevant_artists)
    if shallow:
        relevant_artists = [[r] for r in relevant_artists]
    else:
        relevant_artists = [relevant_artists[x:x+5] for x in range(0, len(relevant_artists), 5)]

    limit = 100
    target_stats = {'target_' + k: v[0] for k,v in stats.items()}
    for artist_seed in relevant_artists:
        if (time.time() - t0) >= first_req_max and len(possible_tracks) >= min_tracks:
            break
        possible_tracks.update([t['id'] for t in sp.recommendations(seed_artists=artist_seed, limit=limit, **target_stats)['tracks']])
    
    possible_tracks = list(possible_tracks)
    random.shuffle(possible_tracks)
    target_id_chunks = [possible_tracks[x:x+100] for x in range(0, len(possible_tracks), 100)]

    targets = []
    for ids in target_id_chunks:
        if (time.time() - t0) >= second_req_max and len(targets) >= min_tracks:
            break
        targets += zip(ids, sp.audio_features(ids))

    return targets

def score_user_profiling(sp, stats, tracks):
    def score(stats, target):
        s = 0
        for feat in relevant_feats:
            mean, std = stats[feat]
            s += abs(target[feat] - mean)/std
        return s

    sorted_tracks = [t[0] for t in sorted(tracks, key=lambda x: score(stats, x[1]))]
    return sorted_tracks

def save_playlist(sp, context, sorted_tracks, shallow, size=100):
    user_id = sp.me()['id']
    dt = datetime.now().strftime("%B %d, %Y - %H:%M")
    proftype = 'close' if shallow else 'further'
    playlist = sp.user_playlist_create(user_id, 'Context Zone: {} ({})'.format(context.title(), proftype), public=False,
            description="This playlist was created with contextzone.herokuapp.com on {}, especially for you.\
                         It contains songs from artists similar to those you like, but on the same time it conveys the\
                         feeling/mood found in the playlists you chose, based on the \"{}\" context.\
                         These are the {} songs whose audio features are closer to the distribution you chose.".format(dt, context, size))
    playlist_id = playlist['id']
    playlist_url = playlist['external_urls']['spotify']
    playlist_embed_url = embed_url + playlist_id

    tracks = sorted_tracks[:size]
    sp.user_playlist_add_tracks(user_id, playlist_id, tracks)
    
    return [playlist_url, playlist_embed_url]
