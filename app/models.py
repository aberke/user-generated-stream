from flask.ext.mongoengine import MongoEngine
from datetime import datetime
import dateutil.parser

from app import app
from util import yellERROR

"""
With Mongo
"""

db = MongoEngine(app)


class Stat(db.Document):
	""" _OPP id allows deletion of stat when OPP deleted """
	_OPP 	 = db.ObjectIdField(default=None)
	fb_count = db.IntField(default=0)
	twitter_count = db.IntField(default=0)

	@classmethod
	def all(cls):
		return cls.objects.all()
	
	@classmethod
	def find(cls, id):
		return cls.objects(id=id).first()

	def jsonify(self):
		return {
			'id': str(self.id),
			'_OPP': str(self._OPP),
			'fb_count': self.fb_count,
			'twitter_count': self.twitter_count,
		}



class Entry(db.EmbeddedDocument):
	id = db.StringField(required=True) # EmbeddedDocuments don't get Id's
	stat = db.ReferenceField(Stat, required=True)
	tweet_id = db.StringField()
	created_at = db.DateTimeField(default=datetime.now)
	text = db.StringField()
	screen_name = db.StringField()
	text = db.StringField()
	img_url = db.URLField()
	retweet_count = db.IntField(default=0)

	def __init__(self, OPP=None, *args, **kwargs):
		""" OPP is ObjectId to get passed to Stat """
		super(Entry, self).__init__(*args, **kwargs)
		
		if not self.id:
			self.id = self.tweet_id
		if not self.stat:
			self.stat = Stat(_OPP=OPP)
			self.stat.save()
		

	def jsonify(self):
		return {
			'id': 					self.id,
		    'tweet_id': 			self.tweet_id,
		    'screen_name': 			self.screen_name,
		    'text': 				self.text,
		    'img_url': 				self.img_url,
		    'created_at': 			self.created_at.isoformat(),
		    # stat relevant
		    'retweet_count':		self.retweet_count,
		    'stat_fb_count': 		self.stat.fb_count,
		    'stat_twitter_count':	self.stat.twitter_count,
		}


class OPP(db.Document):
	_user 				= db.ReferenceField('User', default=None)
	title 				= db.StringField(required=True, unique=True)
	start 				= db.DateTimeField(default=datetime.now)
	entryList 			= db.ListField(db.EmbeddedDocumentField(Entry))
	rejectEntryIDList 	= db.ListField(db.StringField())


	def __init__(self, user=None, json_data=None, start=None, title=None, **kwargs):
		""" Constructor called from API with json_data or called internally by Mongo
				to retrieve document (not instantiating new document and without json_data)
			If start or title not provided, expects them in json_data dictionary:
				{u'start': isoformatted date string, u'title': 'TITLE'}
				throws error for invalid data
		"""
		super(OPP, self).__init__(**kwargs)
		if user: self._user = user # watch out for Mongo calling __init__ without user set
		
		bad_data_error = Exception('Must create OPP title string and start as isoformatted string')
		try:
			self.title = json_data['title'] if not title else title
			self.start = dateutil.parser.parse(json_data['start']) if not start else start
		except Exception as e:
			yellERROR(e)
			raise bad_data_error

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
		return self


	def acceptEntry(self, entry_data):
		# take out of the rejectEntryIDList if it was there
		OPP.objects(id=self.id).update(pull__rejectEntryIDList=entry_data['tweet_id'])
		
		bad_data_error = Exception('Must create Entry with text as string and created_at as isoformatted string')
		try:
			created_at = dateutil.parser.parse(entry_data['created_at'])
			entry = Entry(tweet_id=entry_data['tweet_id'], screen_name=entry_data['screen_name'], text=entry_data['text'], img_url=entry_data['img_url'], created_at=created_at)
		except:
			raise bad_data_error
		OPP.objects(id=self.id).update(push__entryList=entry)

	def rejectEntry(self, tweet_id):
		OPP.objects(id=self.id).update(pull__entryList__tweet_id=tweet_id)
		OPP.objects(id=self.id).update(add_to_set__rejectEntryIDList=tweet_id) # add value to a list only if its not in the list already

	def remove(self):
		""" OPP responsible for removing all Stats of its Entries """
		Stat.objects(_OPP=self.id).delete()
		self.delete()

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














