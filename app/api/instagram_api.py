"""
Instagram API Wrapper

api returns 20 entries at a time 
	some are video rather than image - wrapper returns <= 20 each search

"""


import requests
import dateutil.parser
from datetime import datetime

import config

from app.util import yellERROR


CLIENT_ID = config.INSTAGRAM_CLIENT_ID
URL_BASE = 'https://api.instagram.com/v1'



def make_request(endpoint):
	""" Return data JSON """
	try: 
		results = requests.get(URL_BASE + endpoint)
		results = results.json()
		meta = results['meta']
		if meta['code'] != 200:
			raise Exception("Instagram API - {0}".format(meta['error_message'] if 'error_message' in meta else meta['code']))
		return results
	except Exception as e:
		yellERROR(e) # "log error" loudly, return polite message to front end
		raise Exception("Error requesting data from Instagram API")


def craft_endpoint(hashtag, max_id):
	endpoint = "/tags/{0}/media/recent?client_id={1}".format(hashtag, CLIENT_ID)
	if max_id:
		endpoint += "&max_tag_id={0}".format(max_id)
	return endpoint

def filter_data(results, since):
	""" Extract what is needed from each entry
		Return (list filtered_entries, int next_max_id)
		next_max_id is 0 once entries extend beyond since
	"""
	# since is either datetime object or isoformatted string from front end
	if not isinstance(since, datetime):
		since = dateutil.parser.parse(since)
	since = since.replace(tzinfo=None) # need to make datetime naive to compare with other naive date

	next_max_id = results['pagination']['next_max_tag_id'] if 'next_max_tag_id' in results['pagination'] else 0
	raw_entries = results['data']

	filtered_entries = []
	for e in raw_entries:
		filtered_e = {'source': 'instagram'}
		
		# as soon as post older than since date found, stop looking
		created_time = datetime.fromtimestamp(int(e['created_time']))
		if created_time < since:
			next_max_id = 0
			break
		filtered_e['created_at'] = created_time.isoformat()
		
		# only take images -- type could be image OR video
		if e['type'] != 'image':
			continue

		filtered_e['id'] 		  = e['id']
		# e['caption'] sometimes null -- avoid error
		filtered_e['text'] 		  = e['caption']['text'] if (e['caption'] and 'text' in e['caption']) else None
		filtered_e['source'] 	  = 'instagram'
		filtered_e['img_url']     = e['images']['low_resolution']['url']
		filtered_e['screen_name'] = e['user']['username']
		
		filtered_entries.append(filtered_e)
	return (filtered_entries, next_max_id)


def search_hashtag(hashtag, since, max_id=None):
	endpoint = craft_endpoint(hashtag, max_id)
	results = make_request(endpoint)
	(filtered_entries, next_max_id) = filter_data(results, since)
	return (filtered_entries, next_max_id)












