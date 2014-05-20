from flask import Blueprint, session, request, Response
import json

from twitter_api import searchHashtag, search

from app.auth.route_wrappers import login_required, opp_ownership_required
from app.util import dumpJSON, respond500
from app.decorators import jsonp
from app.models import User, OPP, Stat


""" 
All Routes to api are prefixed with /api
"""
api = Blueprint('api', __name__)


# -- Stat -------------------------------------------

@api.route('/stat/all', methods=['GET'])
def GETallStats():
	stats = Stat.all()
	return dumpJSON([s.jsonify() for s in stats])

@api.route('/stat/<statID>', methods=['GET'])
def GETstat(statID):
	stat = Stat.find(statID)
	if stat:
		stat = stat.jsonify()
	return dumpJSON(stat)

# --- below PUT's made with JSONP on widget pages - need GET ----
@api.route('/stat/<statID>/increment-fb-count', methods=['GET', 'PUT'])
def PUTstatIncrementFB(statID):
	Stat.objects(id=statID).update_one(inc__fb_count=1)
	return Response(status=200)

@api.route('/stat/<statID>/increment-twitter-count', methods=['GET', 'PUT'])
def PUTstatIncrementTwitter(statID):
	Stat.objects(id=statID).update_one(inc__twitter_count=1)
	return Response(status=200)

# -------------------------------------------- Stat -

# -- User -------------------------------------------

@api.route('/user/all', methods=['GET'])
def GETallUsers():
	users = User.all()
	return dumpJSON([o.jsonify() for o in users])

@api.route('/user/<userID>', methods=['GET'])
def GETuser(userID):
	try:
		user = User.find(userID)
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


@api.route('/opp', methods=['POST'])
@login_required
def POSTopp(userID):
	"""  """
	data = json.loads(request.data)
	try:
		user = User.find(userID)
		opp = OPP(user=user, json_data=data)
		opp.save()
		user.update(add_to_set__OPPlist=opp)
		return dumpJSON(opp.jsonify())
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>', methods=['DELETE'])
@opp_ownership_required
def DELETEopp(opp):
	try:
		if opp._user: # opp will have a User unless admin making request and got through opp_ownership_required
			opp._user.update(pull__OPPlist=opp)
		opp.remove() # responsible for removing stats
		return 'OK'
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/accept/<tweet_id>', methods=['PUT'])
@opp_ownership_required
def PUTacceptEntry(opp, tweet_id):
	entry_data = json.loads(request.data)
	try:
		opp.acceptEntry(entry_data)
		return Response(status=200)
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/reject/<tweet_id>', methods=['PUT'])
@opp_ownership_required
def PUTrejectEntry(opp, tweet_id):
	try:
		opp.rejectEntry(tweet_id)
		return Response(status=200)
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>', methods=['PUT'])
@opp_ownership_required
def PUTopp(opp):
	""" saves start date """
	data = json.loads(request.data)
	try:
		opp = opp.update(data)
		opp.save()
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




# - for testing ------------------------------------------------
@api.route('/error', methods=['GET', 'POST', 'PUT', 'DELETE'])
def errorRoute():
	try:
		raise Exception('TEST Exception')
	except Exception as e:
		return respond500(e)











