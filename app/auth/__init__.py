from flask import Blueprint, url_for, Response, abort, session, request, redirect
import json

import config

from app.util import dumpJSON, respond500
from app.models import User, OPP
from app.twitter_client import OAuth

# opp_ownership_required not used in this file - importing here other files to import from app.auth
from route_wrappers import login_required, opp_ownership_required



""" 
All Routes to auth are prefixed with /auth
"""
auth = Blueprint('auth', __name__)

def setup_twitter():
	oauth = OAuth()
	twitter = oauth.remote_app('twitter',
		base_url='https://api.twitter.com/1.1/',
		request_token_url='https://api.twitter.com/oauth/request_token',
		access_token_url='https://api.twitter.com/oauth/access_token',
		authorize_url='https://api.twitter.com/oauth/authenticate',
		consumer_key=config.TWITTER_CONSUMER_KEY,
		consumer_secret=config.TWITTER_CONSUMER_SECRET
	)
	return twitter

twitter = setup_twitter()

@auth.route('/user')
def user():
	user = session['user'] if 'user' in session else None
	return dumpJSON(user)

@auth.route('/logout')
@login_required
def logout(userID):
	session['user'] = None
	return redirect('/')

@auth.route('/login', methods=['GET', 'POST'])
def login():
	""" POST Testing: data is {'twitter_id': xx, 'twitter_screen_name': xx}
			go straight to session_insert_user and redirect
		GET Otherwise: go through twitter 3-way handshake dance
	"""
	next_url = (request.args.get('next') or request.referrer or '/')
	
	if config.ENVIRONMENT == "TESTING":
		user_data = json.loads(request.data)
		session_insert_user(user_data['twitter_id'], user_data['twitter_screen_name'])
		return redirect(next_url)

	return twitter.authorize(callback=url_for('auth.twitter_callback',
		next=next_url))

def session_insert_user(twitter_id, twitter_screen_name):
	""" Separated out of twitter_callback so that it can be used in tests """
	user = User.find_or_create(twitter_id, twitter_screen_name)
	session['user'] = user.jsonify()

@auth.route('/twitter-callback')
@twitter.authorized_handler
def twitter_callback(resp):
	next_url = request.args.get('next') or '/'
	if resp is None:
		return redirect(next_url)

	session['twitter_token'] = (
		resp['oauth_token'],
		resp['oauth_token_secret']
	)
	session_insert_user(resp['user_id'], resp['screen_name'])

	return redirect(next_url)

@twitter.tokengetter
def get_twitter_token(token=None):
    return session.get('twitter_token')












