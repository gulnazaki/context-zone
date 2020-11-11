from flask import Flask, render_template, request, redirect, session, url_for
from utils import *
import os
from werkzeug.exceptions import InternalServerError

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_KEY')

@app.route('/')
def index():
    session['token_info'], authorized = get_token(session)
    return render_template("index.html", authorized=authorized)

@app.route("/spotify-auth")
def authorization():
    sp_oauth = SpotifyOAuth(scope=SCOPE)
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route("/callback")
def callback():
    sp_oauth = SpotifyOAuth(scope=SCOPE)
    session.clear()
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code, check_cache=False)
    
    session["token_info"] = token_info
    return redirect('/')

@app.route("/context", methods=['POST'])
def relevant_playlists():
    sp = get_sp(session)
    context = request.form['keyword']

    session["context"] = context

    playlists = get_playlists_for_context(sp, context)
    return json.dumps(playlists)

@app.route("/playlists", methods=['POST'])
def statistics():
    sp = get_sp(session)
    playlist_ids = request.get_json(force=True)['playlist_ids']

    stats = get_stats_for_playlists(sp, playlist_ids)
    session["stats"] = stats

    return "done"

@app.route('/profile-user', methods=['POST'])
def profile_user():
	sp = get_sp(session)
	shallow = request.get_json(force=True)['choice']

	stats = session.get('stats')
	context = session.get('context')

	possible_tracks = get_possible_tracks(sp, stats, shallow)

	session["possible_tracks"] = possible_tracks

	return str(len(possible_tracks))

@app.route('/personalized-playlist')
def personalized_playlist():
    sp = get_sp(session)
    stats = session.get('stats')
    context = session.get('context')
    possible_tracks = session.get('possible_tracks')

    sorted_tracks = score_user_profiling(sp, stats, possible_tracks)
    playlist_urls = save_playlist(sp, context, sorted_tracks)

    return json.dumps(playlist_urls)


def get_token(session):
    token_valid = False
    token_info = session.get("token_info", {})

    if not (session.get('token_info', False)):
        token_valid = False
        return token_info, token_valid

    now = int(time.time())
    is_token_expired = session.get('token_info').get('expires_at') - now < 60

    if (is_token_expired):
        sp_oauth = spotipy.oauth2.SpotifyOAuth(scope=SCOPE)
        token_info = sp_oauth.refresh_access_token(session.get('token_info').get('refresh_token'))

    token_valid = True
    return token_info, token_valid

def get_sp(session):
    session['token_info'], authorized = get_token(session)
    if not authorized:
        return render_template("index.html", authorized=False)
    return spotipy.Spotify(auth=session.get('token_info').get('access_token'), requests_timeout=10)

@app.errorhandler(InternalServerError)
def handle_500(e):
    return "internal error", 500


if __name__ == "__main__":
	app.run(debug=False)
