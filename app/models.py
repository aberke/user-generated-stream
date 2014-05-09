
from app import app
from flask.ext.mongoengine import MongoEngine
from datetime import datetime

"""
With Mongo
"""

db = MongoEngine(app)



class Entry(db.EmbeddedDocument):
	tweet_id = db.StringField()
	text = db.StringField()
	screen_name = db.StringField()
	text = db.StringField()
	img_url = db.URLField()
	retweets = db.IntField()
	
	def __dict__(self):
		return {
		    'tweet_id': self.tweet_id,
		    'screen_name': self.screen_name,
		    'text': self.text,
		    'img_url': self.img_url,
		    'retweets': self.retweets,
		}

class Stat(db.Document):
	_model = db.ObjectIdField()  # The Entry.id
	fb_count = db.IntField()
	twitter_count = db.IntField()

class OPP(db.Document):
	title 				= db.StringField(required=True, unique=True)
	start 				= db.DateTimeField(default=datetime.now)
	entryList 			= db.ListField(db.EmbeddedDocumentField(Entry))
	# entryIDList 		-- formed in __dict__ from entryList : db.ListField(db.StringField())
	rejectEntryIDList 	= db.ListField(db.StringField())

	start_format = "%Y-%m-%d" # format that twitter expects

	@staticmethod
	def create(data):
		""" Expects data as dictionary
			{u'start': 'MM/DD/YYYY', u'title': 'TITLE'}
			throws error for invalid data
		"""
		bad_data_error = Exception('Must create OPP with title and start with format MM/DD/YYYY')
		if not ('title' in data and 'start' in data): raise bad_data_error
		try:
			start = datetime.strptime(data['start'], "%m/%d/%y")
		except:
			raise bad_data_error

		opp = OPP(title=data['title'], start=start)
		opp.save()
		return opp.__dict__()

	@staticmethod
	def acceptEntry(id, entry_data):
		opp = OPP.objects(id=id).first()
		# take out of the rejectEntryIDList if it was there
		opp.update(pull__rejectEntryIDList=entry_data['tweet_id'])
		
		entry = Entry(tweet_id=entry_data['tweet_id'], screen_name=entry_data['screen_name'], text=entry_data['text'], img_url=entry_data['img_url'])
		opp.update(push__entryList=entry)
		opp.save()
		return opp.__dict__()

	@staticmethod
	def rejectEntry(id, tweet_id):
		opp = OPP.objects(id=id).first()
		opp.update(pull__entryList=Entry(tweet_id=tweet_id))
		opp.update(add_to_set__rejectEntryIDList=tweet_id) # add value to a list only if its not in the list already
		opp.save()
		return opp.__dict__()

	@classmethod
	def remove(cls, id):
		OPP.objects(id=id).delete()

	@classmethod
	def all(cls):
		return [c.__dict__() for c in cls.objects.all()]
	
	@classmethod
	def find(cls, id):
		return cls.objects(id=id).first().__dict__()

	def __dict__(self):
		return {
			'id': str(self.id),
		    'title': self.title,
		    'start': self.start.strftime(self.start_format),
		    'entryList': [e.__dict__() for e in self.entryList],
		    'entryIDList': [e.__dict__()['tweet_id'] for e in self.entryList], 
		    'rejectEntryIDList': self.rejectEntryIDList,
		}


class User(db.Document):
	twitter_id 			= db.StringField(required=True, unique=True)
	twitter_screen_name = db.StringField(required=True)
	OPPlist 			= db.ListField(db.ReferenceField(OPP))


	@staticmethod
	def find_or_create(twitter_id, twitter_screen_name):
		user = User.objects(twitter_id=twitter_id).first()
		if not user:
			user = User(twitter_id=twitter_id, twitter_screen_name=twitter_screen_name)
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














