import config
from app.auth import twitter



def filter_data(statuses):
	print('-------statuses: ',len(statuses))
	filtered_statuses = []

	for status in statuses:
		filtered_data = {}
		# if no photo - not interested in entry.  else: parse out the url of the photo
		if (('entities' not in status) or ('media' not in status['entities'])):
			print('-----NOT------------')
			continue
		print('status', status)
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
	return filtered_statuses



def search(query):
	print('search query', query)
	if not query: return None
	filtered_statuses = []

	response = twitter.get('search/tweets.json' + query)
	metadata = response.data['search_metadata']
	next_query = metadata['next_results'] if 'next_results' in metadata else None
	filtered_statuses += filter_data(response.data['statuses'])

	return (filtered_statuses, next_query)

def searchHashtag(hashtag, since=None, filter_links=True):
	""" Sets include_entities=true AND count=100 
		Returns everything by using 'next_results'
	"""
	query = '%23' + hashtag
	if since: 
		query += ('%20since%3A' + since)
	if filter_links:
		query += ('%2Bfilter%3Alinks')
	query = ('?q=' + query + '&include_entities=true&count=50')
	
	res = search(query)
	return search(query)








