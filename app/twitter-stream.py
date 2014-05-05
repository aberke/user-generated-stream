import config
import oauth2 as oauth


resource_url_prefix="https://api.twitter.com/1.1"

consumer = oauth.Consumer(key=config.twitter_consumer_key, secret=twitter_consumer_secret)
token = oauth.Token(key=key, secret=secret)
client = oauth.Client(consumer, token)


def GET_resource(endpoint):
    resp, content = client.request(resource_url_prefix + request_token_url, "GET")
    print(resp,content)
    return content


