from flask import Blueprint, url_for, Response, session, request, redirect
import config

from app.models import User
from app.twitter_client import OAuth

import json


""" 
All Routes to auth are prefixed with /auth
"""
auth = Blueprint('auth', __name__)

def setup():
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

twitter = setup()

@auth.route('/user')
def user():
	return Response(json.dumps(session['user']))

@auth.route('/logout')
def logout():
	session['user'] = None
	return redirect(request.referrer)

@auth.route('/login')
def login():
	return twitter.authorize(callback=url_for('auth.twitter_callback',
		next=request.args.get('next') or request.referrer or None))


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
	user = User.find_or_create(resp['user_id'], resp['screen_name'])
	session['user'] = user

	return redirect(next_url)

@twitter.tokengetter
def get_twitter_token(token=None):
    return session.get('twitter_token')



