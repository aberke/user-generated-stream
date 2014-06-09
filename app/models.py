from mongoengine import *
from pymongo import ReadPreference
from bson.objectid import ObjectId
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
	# for polls
	up_count 		= IntField(default=0)
	down_count 		= IntField(default=0)
	# social
	fb_count 		= IntField(default=0)
	email_count 	= IntField(default=0)
	twitter_count 	= IntField(default=0)

	@staticmethod
	def upvote(id_list):
		""" Takes list of stat ids as argument """
		Stat.increment(id_list, "up_count")


	@staticmethod
	def increment(id_list, count):
		""" Parameters: 
				id_list -- list of string ids of stats to udpate
				count 	-- field to increment 
		"""
		objectId_list = []
		for i in id_list:
			try:
				objectId_list.append(ObjectId(i))
			except Exception as e: continue

		collection = Stat._get_collection()
		query   = { "_id" : { "$in": objectId_list } }
		update  = { "$inc": { count: 1 } }
		try:
			res = collection.update(query, update, upsert=False, multi=True)
		except Exception as e:
			yellERROR(e)
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
			'up_count': self.up_count,
			'down_count': self.down_count,
			'fb_count': self.fb_count,
			'email_count':self.email_count,
			'twitter_count': self.twitter_count,
		}



class Entry(EmbeddedDocument):
	id 				= StringField(required=True) # id from twitter/instagram - EmbeddedDocuments don't get Id's
	stat 			= ReferenceField(Stat, required=True)
	source 			= StringField() # twitter/instagram
	created_at 		= DateTimeField(default=datetime.now)
	screen_name 	= StringField()
	header 			= StringField()
	text 			= StringField()
	img_url 		= URLField()
	retweet_count = IntField(default=0)

	def __init__(self, OPP=None, *args, **kwargs):
		""" OPP is ObjectId to get passed to Stat """
		super(Entry, self).__init__(*args, **kwargs)
		
		if not self.stat: # hasn't yet been instiated
			if not self.id: # entries via social take post id, entries via editor need unique id
				self.id = str(ObjectId())
			self.stat = Stat(_OPP=OPP)
			self.stat.save()
		

	def jsonify(self):
		return {
			'id': 					self.id,
		    'screen_name': 			self.screen_name,
		    'header': 				self.header,
		    'text': 				self.text,
		    'img_url': 				self.img_url,
		    'source': 				self.source,
		    'created_at': 			self.created_at.isoformat(),
		    # stat relevant
		    'retweet_count':		self.retweet_count,
		    'stat': 				self.stat.jsonify(),
		}


class OPP(Document):
	_user 				= ReferenceField('User', default=None)
	widget_type 		= StringField(required=True, default='slideshow', choices=('slideshow', 'poll')) # default for backwards compatibility
	via			 		= StringField(required=True, default='social', choices=('social', 'editor')) # default for backwards compatibility
	title 				= StringField(required=True, max_length=25, unique=False)
	start 				= DateTimeField(default=datetime.now) # only used when via=='social'
	entryList 			= ListField(EmbeddedDocumentField(Entry), default=list)
	rejectEntryIDList 	= ListField(StringField(), default=list) # only used when via=='social'
	share_title 		= StringField()
	share_caption 		= StringField()
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
				if self.via == 'social':
					self.start 		= dateutil.parser.parse(json_data['start'])
			except Exception as e:
				yellERROR(e)
				raise bad_data_error
		self.set_sharing()

	def set_sharing(self):
		""" Set default sharing fields """
		if not self.share_title:
			self.share_title = "Slideshow: "
			if self.widget_type == 'poll':
				self.share_title = "Poll: "
			if self.via == "social":
				self.share_title += "#"
			self.share_title += self.title

		if not self.share_caption:
			self.share_caption = ("The best of " + self.title)


	def update(self, data):
		""" Expects data as dictionary {u'start': isoformatted date string, u'share_link': 'URL'}
			throws error for invalid data
		
			Atomic update with pymongo
		"""
		collection = OPP._get_collection()
		bad_data_error = Exception('OPP update expects data with share_link as URL and start with isoformatted string')
		try:
			update = {}
			if 'start' in data:
				update["start"] = dateutil.parser.parse(data['start'])
			if 'share_link' in data:
				update["share_link"] = data['share_link']
			if 'share_title' in data:
				update["share_title"] = data['share_title']
			if 'share_caption' in data:
				update["share_caption"] = data['share_caption']
			# make update
			res = collection.update({"_id": self.id}, { "$set" :  update})

		except Exception as e:
			yellERROR(e)
			raise bad_data_error

	# - via=='editor' ----------------------------------------------------------------
	#				  (entries are manually created rather than from twitter/instagram) 
	def deleteEntry(self, entryID):
		print('deleteEntry', entryID)
		OPP.objects(id=self.id).update(pull__entryList__id=str(entryID))

	def updateEntry(self, entryID, entry_data):
		""" Atomic update with pymongo """
		collection = OPP._get_collection()
		query = {"_id": self.id, "entryList.id": entryID}
		# build update
		update = {}
		if 'header' in entry_data:
			update["entryList.$.header"] = entry_data['header']
		if 'img_url' in entry_data:
			update["entryList.$.img_url"]= entry_data['img_url']
		if 'text' in entry_data:
			update["entryList.$.text"] 	 = 	entry_data['text']
		if 'source' in entry_data:
			update["entryList.$.source"] = 	entry_data['source']
		# make update
		res = collection.update(query, { "$set" :  update})
		print('update ----------------------', entryID)
		print('update ---- ', update)
		print('entry_data', entry_data)

	def createEntry(self, entry_data):
		bad_data_error = Exception('Expected entry data with header, text, img_url, source as strings')
		try:
			source = entry_data['source'] if 'source' in entry_data else ''
			entry = Entry(OPP=self.id, header=entry_data['header'], text=entry_data['text'], img_url=entry_data['img_url'], source=source)
		except Exception as e:
			yellERROR(e)
			raise bad_data_error
		OPP.objects(id=self.id).update(push__entryList=entry)
		print('------------------- create', entry)
		return entry
	# ---------------------------------------------------------------- via=='editor' -

	# - via=='social' ----------------------------------------------------------------
	# 				  (entry data is from twitter/instagram post)
	def acceptEntry(self, entry_data):
		""" Create new Entry from entry_data and add it to the entryList """
		# take out of the rejectEntryIDList if it was there
		OPP.objects(id=self.id).update(pull__rejectEntryIDList=entry_data['id'])
		bad_data_error = Exception('Must create Entry with text, screen_name, id, img_url, source as strings and created_at as isoformatted string')
		try:
			created_at = dateutil.parser.parse(entry_data['created_at'])
			entry = Entry(OPP=self.id, id=entry_data['id'], screen_name=entry_data['screen_name'], text=entry_data['text'], img_url=entry_data['img_url'], created_at=created_at, source=entry_data['source'])
		except:
			raise bad_data_error
		OPP.objects(id=self.id).update(push__entryList=entry)

	def rejectEntry(self, entryID):
		OPP.objects(id=self.id).update(pull__entryList__id=entryID)
		OPP.objects(id=self.id).update(add_to_set__rejectEntryIDList=entryID) # add_to_set adds value to a list only if its not in the list already	
	# ---------------------------------------------------------------- via=='social' -

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
		    'share_title': self.share_title,
		    'share_caption': self.share_caption,
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























