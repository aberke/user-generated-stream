from urllib import urlencode

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
			print('-----NOT------------')
			continue
		for m in status['entities']['media']:
			if m['type'] == 'photo':
				filtered_data['img_url'] = m['media_url']
				break
		if 'img_url' not in filtered_data:
			continue

		filtered_data['text'] = status['text']
		filtered_data['tweet_id'] = status['id_str']
		filtered_data['screen_name'] = status['user']['screen_name']
		filtered_data['created_at'] = status['created_at']

		filtered_statuses.append(filtered_data)

	return (filtered_statuses, min_id)



def search(query):
	"""
	twitter paging works by setting max_id=(last-min-id - 1) in next query

	Returns (filtered_statuses, next_max_id)
	"""
	print('----------- search query--------------', query)
	if not query: return (None, None)

	response = twitter.get('search/tweets.json?' + query)

	metadata = response.data['search_metadata']
	next_query = metadata['next_results'] if 'next_results' in metadata else None
	(filtered_statuses, min_id) = filter_data(response.data['statuses'])

	#return (filtered_statuses, next_query)
	return (filtered_statuses, min_id - 1)

def searchHashtag(hashtag, since=None, filter_links=True, max_id=None):
	""" Sets include_entities=true AND count=20 
		Returns everything by using 'next_results'
	"""
	query = {'include_entities': True, 'count': 5}
	query['q'] = ('#' + hashtag)
	if since:
		query['q'] += ('+since:' + since)
	if filter_links:
		query['q'] += ('+filter:links')
	if max_id:
		query['max_id'] = max_id
	
	return search(urlencode(query))








