from flask.ext.pymongo import PyMongo

"""
With Mongo

OPP
	_id
	title
	entryList
	rejectedEntries -- list of ids of tweets -- tweet_id's

Entry
	_id
	_OPP  -- id of OPP
	tweet_id
	username 		
	tweet_text		
	img_url
	retweets

Stat
	_id
	_Entry -- id of Entry 
	fb_count
	twitter_count

"""

mongo = PyMongo()

def setupDB(app):
	mongo.init_app(app)

def test():
	print(mongo, '************')
	print('dbbbbb',mongo.db.name)
	online_users = mongo.db.users.find({'online': True})
	print(online_users, '************')
	print(mongo.db)















