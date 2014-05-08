
from app import app
from flask.ext.mongoengine import MongoEngine
import datetime

"""
With Mongo

User 
	id
	twitter_id
	twitter_screen_name
	OPPlist: [] 	-- list of OPP._id's

OPP
	id
	title
	start 	-- format YYYY-MM-DD
	entryList -- embedded documents
	rejectedEntries -- list of ids of tweets -- tweet_id's

Entry
	id
	_OPP  -- id of OPP
	tweet_id
	twitter_screen_name 		
	tweet_text		
	img_url
	retweets

Stat
	id
	_Entry -- id of Entry 
	fb_count
	twitter_count

"""

db = MongoEngine(app)



class Entry(db.EmbeddedDocument):
	tweet_id = db.IntField()
	twitter_screen_name = db.StringField()
	tweet_text = db.StringField()
	img_url = db.URLField()
	retweets = db.IntField()


class Stat(db.Document):
	_model = db.ObjectIdField()  # The Entry.id
	fb_count = db.IntField()
	twitter_count = db.IntField()

class OPP(db.Document):
	title = db.StringField(required=True, unique=True)
	start = db.DateTimeField(default=datetime.datetime.now)
	entryList = db.ListField(db.EmbeddedDocumentField(Entry))
	rejectedEntries = db.ListField(db.IntField())

	@staticmethod
	def create(data):
		print('----- create', data)
		return None


class User(db.Document):
	twitter_id 			= db.StringField(required=True, unique=True)
	twitter_screen_name = db.StringField(required=True)
	OPPlist 			= db.ListField(db.ReferenceField(OPP))


	@staticmethod
	def find_or_create(twitter_id, twitter_screen_name):
		print ('find_or_create-----', twitter_id, twitter_screen_name)
		user = User.objects(twitter_id=twitter_id).first()
		print('---- found user', user)
		if not user:
			user = User(twitter_id=twitter_id, twitter_screen_name=twitter_screen_name)
			print('----- created user', user)
			user.save()
		return user.__dict__()

	@classmethod
	def find(cls, id):
		""" Returns user with id or None if no such user """
		return User.objects(id=id).first().__dict__()

	@classmethod
	def all(cls):
		""" Returns all of the users in database """
		return [u.__dict__() for u in User.objects.all()]
	
	def __dict__(self):
		return {
			'id': str(self.id),
		    'twitter_id': self.twitter_id,
		    'twitter_screen_name': self.twitter_screen_name,
		    'OPPlist': self.OPPlist
		}














