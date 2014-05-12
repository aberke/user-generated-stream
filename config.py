import os

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
	MONGO_DBNAME 	= "OPP"
	MONGODB_HOST 	= "oceanic.mongohq.com"
	MONGODB_PORT 	= "10012"
	MONGODB_USERNAME= os.environ.get("heroku")
	MONGODB_PASSWORD= HEROKU_MONGODB_URL.split(':')[2].split('@')[0]


# ---------------------------------- MONGO -

DEBUG = os.getenv('TESTING', True)

SECRET_KEY = os.getenv('SESSION_SECRET', 'OPP')

TWITTER_CONSUMER_KEY = os.environ['TWITTER_CONSUMER_KEY']
TWITTER_CONSUMER_SECRET = os.environ['TWITTER_CONSUMER_SECRET']



del os