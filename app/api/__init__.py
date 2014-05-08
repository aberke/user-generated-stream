from flask import Blueprint, url_for, session, request

from app.util import dumpJSON
from app.decorators import jsonp


""" 
All Routes to api are prefixed with /api
"""
api = Blueprint('api', __name__)

# -- User -------------------------------------------
from app.models import User

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
		return opp
	except Exception as e:
		return Response(e, 500)



@api.route('/opp/<id>/search', methods=['GET'])
def GETsearchOPP():
	data = searchHashtag(data['name'])

	return dumpJSON(data)


@api.route('/opp/all', methods=['GET'])
def GETallOPP():
	data = [{
			'_id': 1,
			'title': 'wizards',
			'start': '2013-12-4',
		},{
			'_id': 2,
			'title': 'wizards',
			'start': '2013-12-4',
		},{
			'_id': 3,
			'title': 'wizards',
			'start': '2013-12-4',
		}
	]
	return dumpJSON(data)



@api.route('/opp/<id>', methods=['GET'])
@jsonp
def GETopp(id):
	data = {
		'_id': id,
		'title': 'wizards',
		'entryList': [{
			'_OPP' : id,
			'tweet_id': 1,
			'tweet_text': 'Here is a picture of a #wizard blah blah blah blah blah blah, and yada yada yada weroihwoeirh',
			'username': 'AlexandraBerke',
			'img_url': '/forbidden.jpg',
			'date': '',
			'shares': 8,
			'retweets': 2,
		},{
			'_OPP' : id,
			'tweet_id': 2,
			'tweet_text': 'We code like a #wizard blah blah blah blah blah blah, and yada yada yada weroihwoeirh',
			'username': 'OtherPerson',
			'img_url': '/img/labs.png',
			'date': '',
			'shares': 8,
			'retweets': 2,
		},{
			'_OPP' : id,
			'tweet_id': 3,
			'tweet_text': 'Labs is like a #wizard blah blah blah blah blah blah, and yada yada yada weroihwoeirh',
			'username': 'SomeoneElse',
			'img_url': '/img/huffpostLABS_outline.png',
			'date': '',
			'shares': 8,
			'retweets': 2,
		},]
	}
	return dumpJSON(data)


