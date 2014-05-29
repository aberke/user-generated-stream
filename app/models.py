from mongoengine import *
from pymongo import ReadPreference
from datetime import datetime
import dateutil.parser

import config

from util import yellERROR

"""
With Mongo as database, mongoengine as driver

SCHEMAS:
	USER 
		OPPlist
		twitter_id 			
		twitter_screen_name 

	OPP
		_user
		widget_type: slideshow/poll
		via: 		 social/editor 		
		title 		
		start 				
		entryList: [ { (embedded document)	
						id 	 (from twitter/instagram - EmbeddedDocuments don't get Id's)
						stat (Stat)
						source
						created_at
						screen_name
						text
						img_url
						retweet_count
		}, ...] 	
		rejectEntryIDList: [ list of twitter/instagram post ids ] (empty if via=='editor')
		share_link

	STAT 
		_OPP 			(ObjectId of OPP for deleting stats with OPP deletion)
		upvote
		downvote
		fb_count 	
		email_count 
		twitter_count



Read from Secondary 
"""

# need to handle 3 cases: PRODUCTION, DEVELOPMENT, TESTING
if config.ENVIRONMENT == "PRODUCTION":
	db = connect(
			config.MONGODB_DB, # (Required Parameter) From docs: Note that database name from uri has priority over name in :connect()
			host=config.MONGODB_HOST,
			read_preference=ReadPreference.SECONDARY,
			replicaSet='set-5384a00401d11a55b7003af2',
		)
else:	
	db = connect(config.MONGODB_DB)#, host=config.MONGODB_HOST)



class Stat(Document):
	""" _OPP id allows deletion of stat when OPP deleted """
	_OPP 	 		= ObjectIdField(default=None)
	fb_count 		= IntField(default=0)
	email_count 	= IntField(default=0)
	twitter_count 	= IntField(default=0)


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



class Entry(EmbeddedDocument):
	id = StringField(required=True) # id from twitter/instagram - EmbeddedDocuments don't get Id's
	stat = ReferenceField(Stat, required=True)
	source = StringField() # twitter/instagram
	created_at = DateTimeField(default=datetime.now)
	text = StringField()
	screen_name = StringField()
	text = StringField()
	img_url = URLField()
	retweet_count = IntField(default=0)

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


class OPP(Document):
	_user 				= ReferenceField('User', default=None)
	widget_type 		= StringField(default='slideshow', choices=('slideshow', 'poll')) # default for backwards compatibility
	via			 		= StringField(default='social', choices=('social', 'editor')) # default for backwards compatibility
	title 				= StringField(required=True, max_length=25)
	start 				= DateTimeField(default=datetime.now) # only used when via=='social'
	entryList 			= ListField(EmbeddedDocumentField(Entry), default=list)
	rejectEntryIDList 	= ListField(StringField(), default=list) # only used when via=='social'
	share_link 			= URLField()

	def __init__(self, user=None, json_data=None, **kwargs):
		""" Constructor called from API with json_data or called internally by Mongo
				to retrieve document (not instantiating new document and without json_data)
			If start or title not provided, expects them in json_data dictionary:
				{u'start': isoformatted date string, u'title': 'TITLE'}
				throws error for invalid data
		"""
		super(OPP, self).__init__(**kwargs)
		if user: self._user = user # watch out for Mongo calling __init__ without user set
		
		if (json_data): # creating new OPP from API with json data
			bad_data_error = Exception("Must create OPP with widget type ('slideshow'/'poll'), via ('social'/'editor'), title string and start as isoformatted string")
			try:
				self.widget_type= json_data['widget_type']
				self.via 		= json_data['via']
				self.title 		= json_data['title']
				self.start 		= dateutil.parser.parse(json_data['start'])
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
		""" Create new Entry from entry_data and add it to the entryList """
		print('acceptEntry ****', self, entry_data)
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
			'widget_type': self.widget_type,
			'via': self.via,
		    'title': self.title,
		    'start': self.start.isoformat(),
		    'entryList': [e.jsonify() for e in self.entryList],
		    'entryIDList': [e.jsonify()['id'] for e in self.entryList], 
		    'rejectEntryIDList': self.rejectEntryIDList,
		    'share_link': self.share_link,
		}


class User(Document):
	twitter_id 			= StringField(required=True, unique=True)
	twitter_screen_name = StringField(required=True)
	OPPlist 			= ListField(ReferenceField(OPP))


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























