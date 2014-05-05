from flask import Flask, send_file, Response

import json

import config
from models import setupDB, test
from decorators import jsonp



app = Flask('OPP', static_url_path='')
app.config.from_object('config')


setupDB(app)

@app.route('/')
def base():
	return send_file('static/html/base.html')

@app.route('/w')
def widget():
	return send_file('static/widget/widget.html')


@app.route('/auth/user')
def user():
	return 'null'


@app.route('/api/opp/<id>')
@jsonp
def GETopp(id):
	test()
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
	response_headers = {'Content-Type': 'application/json'}
	return Response(json.dumps(data), 200, response_headers)










###### Run! ######
if __name__ == '__main__':
	app.run(host=config.host, port=config.port, debug=config.debug)
	print('running!')
    