import os
from urlparse import urlparse

HOST = os.getenv('HOST', '127.0.0.1')
PORT = os.getenv('PORT', 3000)

# - MONGO ----------------------------------

# set Development defaults
MONGO_DBNAME 		= 'OPP'
MONGODB_HOST 		= "localhost"
MONGODB_PORT 		= "27017"
MONGODB_DB 			= "OPP_database"

# if on Heroku - set heroku variables
HEROKU_MONGODB_URL 	= os.environ.get("MONGOHQ_URL", None)
if HEROKU_MONGODB_URL:
	db_info 		= urlparse(HEROKU_MONGODB_URL)

	MONGO_DBNAME 	= db_info.path.replace('/', '')
	#MONGODB_DB		= "app24775728"
	MONGODB_HOST 	= db_info.hostname
	MONGODB_PORT 	= db_info.port
	MONGODB_USERNAME= db_info.username
	MONGODB_PASSWORD= db_info.password

print('---------------')
print('MONGO_DBNAME',MONGO_DBNAME)
print('MONGODB_HOST',MONGODB_HOST)
print('MONGODB_PORT', MONGODB_PORT)
print('MONGODB_USERNAME',MONGODB_USERNAME)
print('MONGODB_PASSWORD', MONGODB_PASSWORD)
print('MONGODB_DB',MONGODB_DB)

# ---------------------------------- MONGO -

DEBUG = os.getenv('TESTING', True)

SECRET_KEY = os.getenv('SESSION_SECRET', 'OPP')

TWITTER_CONSUMER_KEY = os.environ['TWITTER_CONSUMER_KEY']
TWITTER_CONSUMER_SECRET = os.environ['TWITTER_CONSUMER_SECRET']



del os