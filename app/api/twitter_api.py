from urllib import urlencode
import dateutil.parser
from datetime import datetime

import config
from app.auth import twitter

"""
Fetch and filter 20 at a time 
"""




def filter_data(statuses):
	"""
	Filters the statuses and finds the min_id that should be used as the max_id in the next query
	returns (filtered_statuses, min_id)
	"""
	filtered_statuses = []
	min_id = 0 # well really infinity... see first line of loop

	for status in statuses:
		if min_id == 0 or status['id'] < min_id:
			min_id = status['id']

		filtered_data = {}
		# if no photo - not interested in entry.  else: parse out the url of the photo
		if (('entities' not in status) or ('media' not in status['entities'])):
			continue
		for m in status['entities']['media']:
			if m['type'] == 'photo':
				filtered_data['img_url'] = m['media_url']
				break
		if 'img_url' not in filtered_data:
			continue

		filtered_data['id'] 		   = status['id_str']
		filtered_data['text'] 		   = status['text']
		filtered_data['source'] 	   = 'twitter'
		filtered_data['created_at']    = status['created_at'] # isoformatted string
		filtered_data['screen_name']   = status['user']['screen_name']
		filtered_data['retweet_count'] = status['retweet_count']
		filtered_statuses.append(filtered_data)

	return (filtered_statuses, min_id)



def search(query):
	"""
	Make the request, filter out the desired status data and min status ID
	twitter paging works by setting max_id=(last-min-id - 1) in next query

	Returns (filtered_statuses, next_max_id)
	"""
	if not query: return (None, None)

	response = twitter.get('search/tweets.json?' + query)
	data = response.data 
	if 'errors' in data:
		raise Exception(str(data['errors']))
		
	(filtered_statuses, min_id) = filter_data(response.data['statuses'])
	return (filtered_statuses, min_id - 1)

# format in which twitter wants to accept dates in query
date_format="%Y-%m-%d"

def search_hashtag(hashtag, since, max_id=None, filter_links=True, exclude_retweets=True):
	""" Sets include_entities=true AND count=100 -- the max 
		Returns everything by using 'next_results'
	"""
	query = {'include_entities': True, 'count': 100}
	query['q'] = ('#' + hashtag)

	# since should be an iso formatted date string
	if isinstance(since, datetime): since = since.isoformat()
	since = dateutil.parser.parse(since).strftime(date_format)
	query['q'] += ('+since:' + since)
	
	if max_id:
		query['max_id'] = max_id
	if filter_links:
		query['q'] += ('+filter:links')
	if exclude_retweets:  #  -RT == +exclude:retweets
		query['q'] += ('+exclude:retweets')
	return search(urlencode(query))








