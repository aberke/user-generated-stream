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
	_OPP 	 		= db.ObjectIdField(default=None)
	fb_count 		= db.IntField(default=0)
	email_count 	= db.IntField(default=0)
	twitter_count 	= db.IntField(default=0)


	@staticmethod
	def increment(id, count):
		if count == 'facebook':
			Stat.objects(id=id).update_one(inc__fb_count=1)
		elif count == 'twitter':
			Stat.objects(id=id).update_one(inc__twitter_count=1)
		elif count == 'email':
			Stat.objects(id=id).update_one(inc__email_count=1)
		else:
			raise Exception("Invalid count: {0}".format(count))

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
			'email_count':self.email_count,
			'twitter_count': self.twitter_count,
		}



class Entry(db.EmbeddedDocument):
	id = db.StringField(required=True) # id from twitter/instagram - EmbeddedDocuments don't get Id's
	stat = db.ReferenceField(Stat, required=True)
	source = db.StringField() # twitter/instagram
	created_at = db.DateTimeField(default=datetime.now)
	text = db.StringField()
	screen_name = db.StringField()
	text = db.StringField()
	img_url = db.URLField()
	retweet_count = db.IntField(default=0)

	def __init__(self, OPP=None, *args, **kwargs):
		""" OPP is ObjectId to get passed to Stat """
		super(Entry, self).__init__(*args, **kwargs)
		
		if not self.stat:
			self.stat = Stat(_OPP=OPP)
			self.stat.save()
		

	def jsonify(self):
		return {
			'id': 					self.id,
		    'screen_name': 			self.screen_name,
		    'text': 				self.text,
		    'img_url': 				self.img_url,
		    'created_at': 			self.created_at.isoformat(),
		    # stat relevant
		    'retweet_count':		self.retweet_count,
		    'stat': 				self.stat.jsonify(),
		}


class OPP(db.Document):
	_user 				= db.ReferenceField('User', default=None)
	title 				= db.StringField(required=True)
	start 				= db.DateTimeField(default=datetime.now)
	entryList 			= db.ListField(db.EmbeddedDocumentField(Entry))
	rejectEntryIDList 	= db.ListField(db.StringField())
	share_link 			= db.URLField()


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
			{u'start': isoformatted date string, u'share_link': 'URL'}
			throws error for invalid data
		"""
		bad_data_error = Exception('expected OPP data with share_link as URL and start with isoformatted string')
		try:
			if 'start' in data:
				self.start = dateutil.parser.parse(data['start'])
			if 'share_link' in data:
				self.share_link = data['share_link']
		except:
			raise bad_data_error
		return self


	def acceptEntry(self, entry_data):
		# take out of the rejectEntryIDList if it was there
		OPP.objects(id=self.id).update(pull__rejectEntryIDList=entry_data['id'])
		
		bad_data_error = Exception('Must create Entry with text as string and created_at as isoformatted string')
		try:
			created_at = dateutil.parser.parse(entry_data['created_at'])
			entry = Entry(OPP=self.id, id=entry_data['id'], screen_name=entry_data['screen_name'], text=entry_data['text'], img_url=entry_data['img_url'], created_at=created_at)
		except:
			raise bad_data_error
		OPP.objects(id=self.id).update(push__entryList=entry)

	def rejectEntry(self, id):
		OPP.objects(id=self.id).update(pull__entryList__id=id)
		OPP.objects(id=self.id).update(add_to_set__rejectEntryIDList=id) # add value to a list only if its not in the list already

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
		    'entryIDList': [e.jsonify()['id'] for e in self.entryList], 
		    'rejectEntryIDList': self.rejectEntryIDList,
		    'share_link': self.share_link,
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
		    'OPPlist': [str(o.id) if isinstance(o, OPP) else None for o in self.OPPlist],
		}























