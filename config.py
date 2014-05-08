import os

HOST = os.getenv('HOST', '127.0.0.1')
PORT = os.getenv('PORT', 3000)

MONGO_DBNAME 		= 'OPP'
MONGODB_HOST 		= os.environ.get("DOTCLOUD_API_DB_MONGODB_HOST", "localhost")
MONGODB_PORT 		= os.environ.get("DOTCLOUD_API_DB_MONGODB_PORT", "27017")
MONGODB_USERNAME 	= os.environ.get("API_DB_MONGODB_LOGIN", "")
MONGODB_PASSWORD 	= os.environ.get("API_DB_MONGODB_PASSWORD", "")
MONGODB_DB 			= "OPP_database"

DEBUG = os.getenv('TESTING', True)

SECRET_KEY = os.getenv('SESSION_SECRET', 'OPP')

TWITTER_CONSUMER_KEY = os.environ['TWITTER_CONSUMER_KEY']
TWITTER_CONSUMER_SECRET = os.environ['TWITTER_CONSUMER_SECRET']



del os