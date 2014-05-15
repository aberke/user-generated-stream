from flask import Blueprint, url_for, session, request, redirect
import json

from twitter_api import searchHashtag, search

from app.auth.route_wrappers import login_required, opp_ownership_required
from app.util import dumpJSON, respond500
from app.decorators import jsonp
from app.models import User, OPP


""" 
All Routes to api are prefixed with /api
"""
api = Blueprint('api', __name__)


# -- User -------------------------------------------

@api.route('/user/all', methods=['GET'])
def GETallUsers():
	users = User.all()
	return dumpJSON([o.jsonify() for o in users])

@api.route('/user/<id>', methods=['GET'])
def GETuser(id):
	try:
		user = User.find(id)
		if user: 
			user = user.jsonify()
		return dumpJSON(user)
	except Exception as e:
		return respond500(e)


@api.route('/user/<userID>/resign-opp/<oppID>', methods=['PUT'])
@opp_ownership_required
def PUTresignOPP(opp, userID):
	""" 
	opp_ownership_required assures user in session
	opp_ownership_required throws error if opp is None

	its possible that user != user in session if Admin making request on behalf of another user
	"""
	try:
		user = User.find(userID)
		if not (user):
			raise Exception('Invalid userID {0}'.format(userID))

		user.update(pull__OPPlist=opp)
		user.save()
		opp._user = None
		opp.save()
		return dumpJSON(user.jsonify())

	except Exception as e:
		return respond500(e)


@api.route('/user/<userID>/assign-opp/<oppID>', methods=['PUT'])
@login_required
def PUTassignOPP(session_userID, userID, oppID):
	"""
	login_required injects userID from session as the first argument but instead
	care about userID in url 
		its possible that user != user in session if Admin making request on behalf of another user
	"""
	try:
		user = User.find(userID)
		if not (user and str(user.id) == session['user']['id']):
			raise Exception('Invalid userID {0}'.format(userID))
		
		opp = OPP.find(oppID)
		if not opp: raise Exception('invalid oppID')
		if opp._user: raise Exception('User cannot claim already owned OPP')
		# use add_to_set to be safer and avoid potential duplicates -- data corruption
		user.update(add_to_set__OPPlist=opp)
		user.save()
		opp._user = user
		opp.save()
		return dumpJSON(user.jsonify())

	except Exception as e:
		return respond500(e)

# ------------------------------------------- User --


# -- OPP -------------------------------------------

@api.route('/opp', methods=['POST'])
@login_required
def POSTopp(userID):
	"""  """
	data = json.loads(request.data)
	try:
		data['user'] = userID
		opp = OPP.create(data)
		return dumpJSON(opp.jsonify())
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>', methods=['DELETE'])
@opp_ownership_required
def DELETEopp(opp):
	try:
		opp.delete()
		return 'OK'
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/accept/<tweet_id>', methods=['PUT'])
@opp_ownership_required
def PUTacceptEntry(opp, tweet_id):
	entry_data = json.loads(request.data)
	try:
		opp = opp.acceptEntry(entry_data)
		return dumpJSON(opp.jsonify())
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/reject/<tweet_id>', methods=['PUT'])
def PUTrejectEntry(opp, tweet_id):
	try:
		opp = opp.rejectEntry(tweet_id)
		return dumpJSON(opp.jsonify())
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>', methods=['PUT'])
def PUTopp(opp):
	"""
	saves start date
	"""
	data = json.loads(request.data)
	try:
		opp = opp.update(data)
		return dumpJSON(opp.jsonify())
	except Exception as e:
		return respond500(e)

@api.route('/opp/<id>/search', methods=['GET'])
def GETsearchOPP(id):
	""" Keeping dictionary in session:
			{id_next_query: query-string}
	"""

	hashtag 	= request.args.get('hashtag', None)
	since 		= request.args.get('since', None)

	if not (hashtag and since):
		opp 	= OPP.find(id)
		hashtag = opp['title']
		since 	= opp['start']
	max_id = request.args.get('max_id', None)

	try:
		(data, new_max_id) = searchHashtag(hashtag, since=since, max_id=max_id)
		return dumpJSON({'data': data, 'max_id': str(new_max_id)}) # make it a string to avoid JSON rounding errors
	except Exception as e:
		return respond500(e)


@api.route('/opp/all', methods=['GET'])
def GETallOPP():
	data = OPP.all()
	return dumpJSON([o.jsonify() for o in data])


@api.route('/opp/<oppID>', methods=['GET'])
@jsonp
def GETopp(oppID):
	try:
		opp = OPP.find(oppID)
		if opp: opp = opp.jsonify()
		return dumpJSON(opp)
	except Exception as e:
		return respond500(e)













