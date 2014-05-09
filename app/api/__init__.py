from flask import Blueprint, url_for, session, request
import json

from twitter_api import searchHashtag, search

from app.util import dumpJSON, respond500
from app.decorators import jsonp
from app.models import User, OPP


""" 
All Routes to api are prefixed with /api
"""
api = Blueprint('api', __name__)

# -- User -------------------------------------------

@api.route('/user/all')
def GETallUsers():
	users = User.all()
	return dumpJSON(users)

@api.route('/user/<id>')
def GETuser(id):
	user = User.find(id)
	return dumpJSON(user)

# ------------------------------------------- User --


# -- OPP -------------------------------------------

@api.route('/opp', methods=['POST'])
def POSTopp():
	data = json.loads(request.data)
	try:
		opp = OPP.create(data)
		return dumpJSON(opp)
	except Exception as e:
		return respond500(e)

@api.route('/opp/<id>', methods=['DELETE'])
def DELETEopp(id):
	try:
		OPP.remove(id)
		return 'OK'
	except Exception as e:
		return respond500(e)

@api.route('/opp/<id>/accept/<tweet_id>', methods=['PUT'])
def PUTacceptEntry(id, tweet_id):
	entry_data = json.loads(request.data)
	print('PUTacceptEntry',tweet_id, entry_data)
	try:
		opp = OPP.acceptEntry(id, entry_data)
		return dumpJSON(opp)
	except Exception as e:
		return respond500(e)

@api.route('/opp/<id>/reject/<tweet_id>', methods=['PUT'])
def PUTrejectEntry(id, tweet_id):
	try:
		opp = OPP.rejectEntry(id, tweet_id)
		return dumpJSON(opp)
	except Exception as e:
		return respond500(e)


@api.route('/opp/<id>/search/next', methods=['GET'])
def GETsearchOPPnext(id):
	""" 
	Picks up where GETsearchOPP left off
	"""
	query = session[id + '_next_query'] if (id + '_next_query') in session else None
	(data, next_query) = search(query)
	session[id + '_next_query'] = next_query
	return dumpJSON(data)


@api.route('/opp/<id>/search', methods=['GET'])
def GETsearchOPP(id):
	""" Keeping dictionary in session:
			{id_next_query: query-string}
	"""
	opp = OPP.find(id)
	print('GETsearchOPP', opp, opp['title'], opp['start'])
	(data, next_query) = searchHashtag(opp['title'], since=opp['start'])

	session[id + '_next_query'] = next_query

	return dumpJSON(data)


@api.route('/opp/all', methods=['GET'])
def GETallOPP():
	data = OPP.all()
	return dumpJSON(data)



@api.route('/opp/<id>', methods=['GET'])
@jsonp
def GETopp(id):
	opp = OPP.find(id)
	return dumpJSON(opp)






