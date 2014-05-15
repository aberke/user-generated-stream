import os
from urlparse import urlparse

HOST = os.getenv('HOST', '127.0.0.1')
PORT = os.getenv('PORT', 3000)


# - MONGO ----------------------------------

# set Development defaults
MONGODB_HOST 		= "localhost"
MONGODB_PORT 		= "27017"
MONGODB_DB 			= "OPP"
MONGODB_USERNAME	= ""
MONGODB_PASSWORD	= ""


# if on Heroku - set heroku variables
HEROKU_MONGODB_URL 	= os.environ.get("MONGOHQ_URL", None)
if HEROKU_MONGODB_URL:
	db_info 		= urlparse(HEROKU_MONGODB_URL)

	MONGODB_DB		= db_info.path.replace('/', '')
	MONGODB_HOST 	= db_info.hostname
	MONGODB_PORT 	= db_info.port
	MONGODB_USERNAME= db_info.username
	MONGODB_PASSWORD= db_info.password

# ---------------------------------- MONGO -


DEBUG = os.getenv('TESTING', True)

SECRET_KEY = os.getenv('SESSION_SECRET', 'OPP')

TWITTER_CONSUMER_KEY = os.environ['TWITTER_CONSUMER_KEY']
TWITTER_CONSUMER_SECRET = os.environ['TWITTER_CONSUMER_SECRET']

# twitter screen_names of users that have access to all routes and api calls
# see app.auth.route_wrappers or documentation in README
ADMIN_WHITELIST = ['HuffPostLabs', 'AlexandraBerke']



del os