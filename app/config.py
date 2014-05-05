import os

host = os.getenv('HOST', '127.0.0.1')
port = os.getenv('PORT', 3000)

MONGO_DBNAME = 'OPP'

debug = os.getenv('TESTING', True)

session_secret = os.getenv('SESSION_SECRET', 'OPP')

twitter_consumer_key = os.environ['TWITTER_CONSUMER_KEY']
twitter_consumer_secret = os.environ['TWITTER_CONSUMER_SECRET']



del os