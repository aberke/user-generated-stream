#********************************************************************************
#--------------------------------------------------------------------------------
#
# 	Author: Alexandra Berke (aberke)
# 	Written: May 2014
#
#
#--------------------------------------------------------------------------------
#*********************************************************************************





import os

# test.py sets environment to TESTING, heroku has environment as PRODUCTION
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'DEVELOPMENT')

HOST = os.getenv('HOST', '127.0.0.1')
PORT = os.getenv('PORT', 3000)
DEBUG= False if ENVIRONMENT == 'PRODUCTION' else True


# - MONGO ----------------------------------
# if development: host is "mongodb://localhost:27017"
# if production: db is set in host URI, host is in "MONGOHQ_URL" env variable found in '$ heroku config' command
# if TESTING: db is 'testing'

MONGODB_HOST 	= "mongodb://localhost:27017"
# required parameter of mongoengine.connect() -- BUT Note that database name from uri has priority over name in :connect()
MONGODB_DB 		= "OPP" 

if ENVIRONMENT == 'PRODUCTION':
	MONGODB_HOST=os.environ.get("MONGOHQ_URL", None)

elif ENVIRONMENT == 'TESTING':
	MONGODB_DB 	= "testing"

# ---------------------------------- MONGO -



SECRET_KEY 				= os.getenv('SESSION_SECRET', 'OPP')

TWITTER_CONSUMER_KEY 	= os.environ['TWITTER_CONSUMER_KEY']
TWITTER_CONSUMER_SECRET = os.environ['TWITTER_CONSUMER_SECRET']

INSTAGRAM_CLIENT_ID 	= os.environ['INSTAGRAM_CLIENT_ID']
INSTAGRAM_CLIENT_SECRET = os.environ['INSTAGRAM_CLIENT_SECRET']

# twitter screen_names of users that have access to all routes and api calls
# see app.auth.route_wrappers or documentation in README
ADMIN_WHITELIST = ['HuffPostLabs', 'AlexandraBerke']



del os