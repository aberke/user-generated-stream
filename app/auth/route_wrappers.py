from flask import abort, session
from functools import wraps

from config import ADMIN_WHITELIST

from app.models import OPP




def login_required(f):
	"""
	If request allowed: 
		The wrapped function will be passed the user id (string) as first argument.
	If access denied:
		aborts with 401
	"""
	@wraps(f)
	def decorated(*args, **kwargs):
		user = session['user'] if 'user' in session else None
		if not (user and 'id' in user):
			return abort(401)
			
		return f(*((user['id'],) + args), **kwargs)
	return decorated



def opp_ownership_required(f):
	""" Verifies that user is signed in and that user owns OPP in question
		Expects oppID as argument
		If no such OPP exists:
			The wrapped function will be passed None as first argument
		If request allowed:
			The wrapped function will be passed OPP as first argument
		If access denied:
			aborts with 401

		Access always granted to users in ADMIN_WHITELIST
	"""
	@wraps(f)
	def decorated(oppID, *args, **kwargs):
		user = session['user'] if 'user' in session else None
		if not (user and 'id' in user):
			return abort(401)
		
		opp = OPP.find(oppID)
		if not opp: raise Exception('No such OPP ' + oppID)

		if user['twitter_screen_name'] in ADMIN_WHITELIST:
			return f(*((opp,) + args), **kwargs)

		if not (opp._user and str(opp._user.id) == user['id']):
			return abort(401)

		return f(*((opp,) + args), **kwargs)
	return decorated
