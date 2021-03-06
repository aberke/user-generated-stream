from flask import Blueprint, session, request
import json

import twitter_api
import instagram_api

from app.auth.route_wrappers import login_required, opp_ownership_required
from app.util import dumpJSON, respond500, respond200
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

# ***** The following PUTs made with JSONP on widget pages -- need GET ****
@api.route('/stat/<statID>/increment/<count>', methods=['GET', 'PUT'])
def PUTstatIncrement(statID, count):
	try:
		Stat.increment([statID], count)
		return respond200()
	except Exception as e:
		return respond500(e)

# on completion of a poll, opp makes requests:
# 	/stat/upvote/statID-statID-
# 	/stat/downvote/statID-statID-
@api.route('/stat/upvote/<statIDs>', methods=['GET', 'PUT'])
def PUTstatUpvote(statIDs):
	statID_list = statIDs.split('-')
	try:
		Stat.increment(statID_list, "up_count")
		return respond200()
	except Exception as e:
		return respond500(e)

@api.route('/stat/downvote/<statIDs>', methods=['GET', 'PUT'])
def PUTstatDownvote(statIDs):
	statID_list = statIDs.split('-')
	try:
		Stat.increment(statID_list, "down_count")
		return respond200()
	except Exception as e:
		return respond500(e)

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

@api.route('/opp/<oppID>/entry', methods=['POST'])
@opp_ownership_required
def POSTentry(opp):
	entry_data = json.loads(request.data)
	try:
		entry = opp.createEntry(entry_data)
		return dumpJSON(entry.jsonify())
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/entry/<entryID>', methods=['DELETE'])
@opp_ownership_required
def DELETEentry(opp, entryID):
	try:
		opp.deleteEntry(entryID)
		return respond200()
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/entry/<entryID>', methods=['PUT'])
@opp_ownership_required
def PUTentry(opp, entryID):
	entry_data = json.loads(request.data)
	try:
		entry = opp.updateEntry(entryID, entry_data)
		return respond200()
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/accept/<entryID>', methods=['PUT'])
@opp_ownership_required
def PUTacceptEntry(opp, entryID):
	entry_data = json.loads(request.data)
	try:
		opp.acceptEntry(entry_data)
		return respond200()
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>/reject/<entryID>', methods=['PUT'])
@opp_ownership_required
def PUTrejectEntry(opp, entryID):
	try:
		opp.rejectEntry(entryID)
		return respond200()
	except Exception as e:
		return respond500(e)

@api.route('/opp/<oppID>', methods=['PUT'])
@opp_ownership_required
def PUTopp(opp):
	""" saves start date """
	data = json.loads(request.data)
	try:
		opp.update(data)
		return respond200()
	except Exception as e:
		return respond500(e)

@api.route('/opp/<id>/search', methods=['GET'])
def GETsearchOPP(id):
	""" Keeping dictionary in session:
			{id_next_query: query-string}
	"""
	hashtag 	= request.args.get('hashtag', None)
	since 		= request.args.get('since', None)
	source		= request.args.get('source', 'twitter')

	if not (hashtag and since):
		opp 	= OPP.find(id)
		hashtag = opp['title']
		since 	= opp['start']
	max_id = request.args.get('max_id', None)

	try:
		if source == 'instagram':
			(data, next_max_id) = instagram_api.search_hashtag(hashtag, since, max_id=max_id)
		else:
			(data, next_max_id) = twitter_api.search_hashtag(hashtag, since, max_id=max_id)
		
		return dumpJSON({'data': data, 'next_max_id': str(next_max_id)}) # make it a string to avoid JSON rounding errors
	except Exception as e:
		return respond500(e)




# - for testing ------------------------------------------------
@api.route('/error', methods=['GET', 'POST', 'PUT', 'DELETE'])
def errorRoute():
	try:
		raise Exception('TEST Exception')
	except Exception as e:
		return respond500(e)











