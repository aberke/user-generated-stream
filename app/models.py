
from flask.ext.mongoengine import MongoEngine
from datetime import datetime
import dateutil.parser

from app import app

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
	
	def jsonify(self):
		return {
		    'tweet_id': 	self.tweet_id,
		    'screen_name': 	self.screen_name,
		    'text': 		self.text,
		    'img_url': 		self.img_url,
		    'retweets': 	self.retweets,
		}

class Stat(db.Document):
	_model = db.ObjectIdField()  # The Entry.id
	fb_count = db.IntField()
	twitter_count = db.IntField()

class OPP(db.Document):
	_user 				= db.ReferenceField('User', default=None)
	title 				= db.StringField(required=True, unique=True)
	start 				= db.DateTimeField(default=datetime.now)
	entryList 			= db.ListField(db.EmbeddedDocumentField(Entry))
	# entryIDList 		-- formed in jsonify from entryList : db.ListField(db.StringField())
	rejectEntryIDList 	= db.ListField(db.StringField())


	def update(self, data):
		""" Expects data as dictionary
			{u'start': isoformatted date string, u'title': 'TITLE'}
			throws error for invalid data
		"""
		bad_data_error = Exception('expected OPP data with title string and start with isoformatted string')
		try:
			if 'start' in data:
				self.start = dateutil.parser.parse(data['start'])
			if 'title in data':
				self.title = data['title']
		except:
			raise bad_data_error
		self.save()
		return self


	@staticmethod
	def create(data):
		""" Expects data as dictionary
			{u'start': isoformatted date string, u'title': 'TITLE'}
			throws error for invalid data
		"""
		bad_data_error = Exception('Must create OPP with user as userID, title string and start with isoformatted string')
		if not ('user' in data and 'title' in data and 'start' in data): raise bad_data_error
		try:
			start = dateutil.parser.parse(data['start'])
			#start = datetime.strptime(data['start'], "%m/%d/%y")
			opp = OPP(_user=data['user'], title=data['title'], start=start)
		except:
			raise bad_data_error

		opp.save()
		return opp

	def acceptEntry(self, entry_data):
		# take out of the rejectEntryIDList if it was there
		self.update(pull__rejectEntryIDList=entry_data['tweet_id'])
		
		entry = Entry(tweet_id=entry_data['tweet_id'], screen_name=entry_data['screen_name'], text=entry_data['text'], img_url=entry_data['img_url'])
		self.update(push__entryList=entry)
		self.save()
		return self

	def rejectEntry(self, tweet_id):
		self.update(pull__entryList=Entry(tweet_id=tweet_id))
		self.update(add_to_set__rejectEntryIDList=tweet_id) # add value to a list only if its not in the list already
		self.save()
		return self

	@classmethod
	def remove(cls, id):
		OPP.objects(id=id).delete()

	@classmethod
	def all(cls):
		return cls.objects.all()
	
	@classmethod
	def find(cls, id):
		return cls.objects(id=id).first()

	def jsonify(self):
		return {
			'_user': str(self._user.id) if self._user else None, # don't want str(None) -- want null
			'_user_name': self._user.twitter_screen_name if self._user else None,
			
			'id': str(self.id),
		    'title': self.title,
		    'start': self.start.isoformat(),
		    'entryList': [e.jsonify() for e in self.entryList],
		    'entryIDList': [e.jsonify()['tweet_id'] for e in self.entryList], 
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
		return user

	@classmethod
	def find(cls, id):
		""" Returns user with id or None if no such user """
		return User.objects(id=id).first()

	@classmethod
	def all(cls):
		""" Returns all of the users in database """
		return cls.objects.all()
	
	def jsonify(self):
		return {
			'id': str(self.id),
		    'twitter_id': self.twitter_id,
		    'twitter_screen_name': self.twitter_screen_name,
		    # check for potential issue with corrupted data: if OPP deleted but still remains in list
		    'OPPlist': [o.jsonify() if isinstance(o, OPP) else None for o in self.OPPlist],
		}














