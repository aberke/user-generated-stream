import os
import json
import unittest
from datetime import datetime

# Set ENVIRONMENT=TESTING before loading any packages so that they load with the TESTING configuration
# config.py checks environment variable ENVIRONMENT for setting: MONGODB_DB,
os.environ["ENVIRONMENT"] = "TESTING"

from app import app
from app.auth import session_insert_user, login_required, opp_ownership_required
from app.models import db, OPP, User, Stat



# the test data that will be injected
test_user_data = {
	'twitter_id': '0',
	'twitter_screen_name': 'test_screen_name',
}
test_opp_data = {
	'title': 'test_title',
	'start': datetime.today().isoformat(),
	'via': 'social',
	'widget_type': 'slideshow',
}



class OPPTestCase(unittest.TestCase):

	user = None

	# - Setup/Teardown -----------------------------------------------
	def setUp(self):
		app.config['TESTING'] = True
		app.config.from_object('config')
		self.app = app.test_client()

	def tearDown(self):
		db.drop_database(app.config['MONGODB_DB'])
	# ----------------------------------------------- Setup/Teardown -

	# - Utility Methods ----------------------------------------------
	def assertDataMatch(self, test_data, response_data):
		for (test_key, test_value) in test_data.items():
			self.assertEqual(test_value, response_data[test_key])

	def login(self):
		self.app.post('/auth/login', data=json.dumps(test_user_data))
		self.user = self.GETdata('/auth/user')

	def logout(self):
		self.app.get('/auth/logout', follow_redirects=True)
		self.user = None

	def GETdata(self, endpoint):
		rv = self.app.get(endpoint)
		self.assertEqual(rv.status_code, 200)
		return json.loads(rv.data)
	# ----------------------------------------------- Utility Methods -

	def test_views(self):
		rv = self.app.get('/')
		self.assertEqual(rv.status_code, 200)
		self.assertTrue(int(rv.headers['Content-Length']) > 500)


class TestAPI(OPPTestCase):

	# - Utility Methods ----------------------------------------------
	def POSTopp(self):
		""" Helper to test methods
			posts test_opp_data 
			Returns data returned from POST
		"""
		if not self.user: 
			self.login()
		rv = self.app.post('/api/opp', data=json.dumps(test_opp_data))
		return json.loads(rv.data)
	# ----------------------------------------------- Utility Methods -


	# - Error Tests ----------------------------------------------------
	# Expect errors to return with 500 error code and JSON with 'message'
	def assertAPIerror(self, endpoint="/api/error", method="GET"):
		""" Helper for Error Tests """
		if method == 'PUT':
			rv = self.app.put(endpoint)
		elif method == 'POST':
			rv = self.app.post(endpoint)
		elif method == 'DELETE':
			rv = self.app.delete(endpoint)
		else:
			rv = self.app.get(endpoint)
		self.assertEqual(rv.status_code, 500)
		data = json.loads(rv.data)
		self.assertTrue('message' in data)
		return data

	def test_GETerror(self):
		self.assertAPIerror()
	def test_POSTerror(self):
		self.assertAPIerror(method='POST')
	def test_PUTerror(self):
		self.assertAPIerror(method='PUT')
	def test_DELETEerror(self):
		self.assertAPIerror(method='DELETE')
	# ---------------------------------------------------- Error Tests -


	# - User Tests ----------------------------------------------------
	def test_GETallUsers(self):
		# no users should return []
		users = self.GETdata('/api/user/all')
		self.assertEqual(users, [])
		# insert user and get list of one
		self.login()
		users = self.GETdata('/api/user/all')
		self.assertEqual(len(users), 1)
		self.assertDataMatch(test_user_data, users[0])

	def test_GETuser(self):
		# GET non existant user should return null
		user = self.GETdata('/api/user/53726fde8f4a0f55769476da')
		self.assertEqual(user, None)
		# insert user and GET it
		self.login()
		user = self.GETdata('/api/user/{0}'.format(self.user['id']))
		self.assertDataMatch(test_user_data, user)

	def test_PUTassignOPP_PUTresignOPP(self):
		""" Test both endpoints 
				PUT /user/userID/assign-opp/oppID
				PUT /user/userID/resign-opp/oppID
		"""
		self.login()
		user = self.GETdata('/api/user/{0}'.format(self.user['id']))
		self.assertEqual(user['OPPlist'], [])

		# post opp and verify ownership
		opp = self.POSTopp()
		self.assertEqual(opp['_user'], self.user['id'])
		user = self.GETdata('/api/user/{0}'.format(self.user['id']))
		self.assertEqual(len(user['OPPlist']), 1)
		self.assertEqual(opp['id'], user['OPPlist'][0])

		# resign opp and verify no ownership
		rv = self.app.put('/api/user/{0}/resign-opp/{1}'.format(self.user['id'], opp['id']))
		self.assertEqual(rv.status_code, 200)
		opp = self.GETdata('/api/opp/{0}'.format(opp['id']))
		self.assertEqual(opp['_user'], None)
		user = self.GETdata('/auth/user')
		self.assertEqual(user['OPPlist'], [])

		# assign opp and verify ownership
		rv = self.app.put('/api/user/{0}/assign-opp/{1}'.format(self.user['id'], opp['id']))
		self.assertEqual(rv.status_code, 200)
		opp = self.GETdata('/api/opp/{0}'.format(opp['id']))
		self.assertEqual(opp['_user'], self.user['id'])
		user = self.GETdata('/api/user/{0}'.format(self.user['id']))
		self.assertEqual(len(user['OPPlist']), 1)
		self.assertEqual(opp['id'], user['OPPlist'][0])
	# ----------------------------------------------------- User Tests -

	# - OPP Tests -------------------------------------------------------
	def test_GETallOPP(self):
		opp = self.GETdata('/api/opp/all')
		self.assertEqual(opp, [])
		opp = self.POSTopp()
		data = self.GETdata('/api/opp/all')
		self.assertEqual(len(data), 1)
		self.assertEqual(data[0]['title'], test_opp_data['title'])

	def test_GETopp(self):
		# test with id of nonexistant should get null
		opp = self.GETdata('/api/opp/5374c9578f4a0fa59b884bd1')
		self.assertEqual(opp, None)
		opp = self.POSTopp()
		opp = self.GETdata('/api/opp/{0}'.format(opp['id']))
		self.assertEqual(opp['title'], test_opp_data['title'])
		self.assertEqual(opp['entryList'], [])
		self.assertEqual(opp['rejectEntryIDList'], [])

	def test_POSTopp(self):
		"""
		Despite having POSTopp helper, necessary to check that OPP added to User's OPPlist
		"""
		self.login()
		user = self.GETdata('/api/user/{0}'.format(self.user['id']))
		self.assertEqual(user['OPPlist'], [])
		# post opp and verify its added to OPPlist
		opp = self.POSTopp()
		user = self.GETdata('/api/user/{0}'.format(self.user['id']))
		self.assertEqual(len(user['OPPlist']), 1)
		self.assertEqual(user['OPPlist'][0], opp['id'])

	def test_DELETEopp(self):
		""" 
		Not only needs to delete OPP, but also needs to remove from its User's OPPlist
		"""
		# post it and delete it
		opp = self.POSTopp()
		rv = self.app.delete('/api/opp/{0}'.format(opp['id']))
		self.assertEqual(rv.status_code, 200)
		# verify can't GET it -- GET methods tested above
		allOPP = self.GETdata('/api/opp/all')
		self.assertEqual(allOPP, [])
		opp = self.GETdata('/api/opp/{0}'.format(opp['id']))
		self.assertEqual(opp, None)
		# verify not in User OPPlist -- POSTopp tests that it was added
		user = self.GETdata('/api/user/{0}'.format(self.user['id']))
		self.assertEqual(user['OPPlist'], [])
	# ------------------------------------------------------- OPP Tests -



class TestStats(TestAPI):
	""" Child of TestAPI that focuses on just testing stats 


		Tests stats outside of Entries
		TODO: make sure works with entries
	"""
	
	def create_stat(self):
		""" Create stat without creating entry 
			need to create OPP for _OPP and OPP.id 
			Then can delete stat with delete OPP
		"""
		opp = self.POSTopp()
		stat = Stat(_OPP=opp['id'])
		stat.save()
		return stat

	def test_GETstat(self):
		# GET non existant stat should return null
		data = self.GETdata('/api/stat/53726fde8f4a0f55769476da')
		self.assertEqual(data, None)
		stat = self.create_stat()
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data, stat.jsonify())


	def test_GETallStats(self):
		data = self.GETdata('/api/stat/all')
		self.assertEqual(data, [])
		stat = self.create_stat()
		data = self.GETdata('/api/stat/all')
		self.assertEqual(len(data), 1)
		self.assertDataMatch(data[0], stat.jsonify())

	def test_delete_stat(self):
		""" Stat should be deleted when OPP referenced by stat._OPP deleted """
		stat = self.create_stat()
		self.app.delete('/api/opp/{0}'.format(str(stat._OPP)))
		data = self.GETdata('/api/stat/all')
		self.assertEqual(data, [])
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data, None)

	def test_PUTstatIncrement_facebook(self):
		""" endpoint needs to be able to get hit by both PUT and GET for JSONP """
		stat = self.create_stat()
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['fb_count'], 0)
		# ensure PUT works
		for i in range(2):
			self.app.put('/api/stat/{0}/increment/fb_count'.format(str(stat.id)))
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['fb_count'], 2)
		# ensure GET (JSONP) works
		for i in range(2):
			self.app.get('/api/stat/{0}/increment/fb_count'.format(str(stat.id)))
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['fb_count'], 4)

	def test_PUTstatIncrement_twitter(self):
		""" endpoint needs to be able to get hit by both PUT and GET for JSONP """
		stat = self.create_stat()
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['twitter_count'], 0)
		# ensure PUT works
		for i in range(3):
			self.app.put('/api/stat/{0}/increment/twitter_count'.format(str(stat.id)))
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['twitter_count'], 3)
		# ensure GET (JSONP) works
		for i in range(3):
			self.app.get('/api/stat/{0}/increment/twitter_count'.format(str(stat.id)))
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['twitter_count'], 6)

	def test_PUTstatIncrement_email(self):
		""" endpoint needs to be able to get hit by both PUT and GET for JSONP """
		stat = self.create_stat()
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['email_count'], 0)
		# ensure PUT works
		for i in range(3):
			self.app.put('/api/stat/{0}/increment/email_count'.format(str(stat.id)))
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['email_count'], 3)
		# ensure GET (JSONP) works
		for i in range(3):
			self.app.get('/api/stat/{0}/increment/email_count'.format(str(stat.id)))
		data = self.GETdata('/api/stat/{0}'.format(str(stat.id)))
		self.assertEqual(data['email_count'], 6)




class TestAuth(OPPTestCase):

	def test_endpoints(self):
		rv = self.app.get('/auth/user')
		self.assertEqual(rv.status_code, 200)
		self.assertEqual(rv.data, "null")

		# login and test /auth/user
		self.login()
		user = self.GETdata('/auth/user')
		self.assertDataMatch(test_user_data, user)

		# test /auth/logout
		self.logout()
		user = self.GETdata('/auth/user')
		self.assertEqual(user, None)

	def test_login_required(self):
		""" Some routes such as POST /api/opp are wrapped with @login_required """
		rv = self.app.post('/api/opp', data=json.dumps(test_opp_data))
		self.assertEqual(rv.status_code, 401)
		
		self.login()
		rv = self.app.post('/api/opp', data=json.dumps(test_opp_data))
		self.assertEqual(rv.status_code, 200)

	def test_opp_ownership_required(self):
		""" 
		Some routes, such as PUT /opp/<oppID> are wrapped with @opp_ownership_required 
		"""
		self.login()
		rv = self.app.post('/api/opp', data=json.dumps(test_opp_data))
		opp = json.loads(rv.data)

		# successfully pass through opp_ownership_required
		data = test_opp_data.copy()
		data['title'] = 'NEW-TITLE' 
		rv = self.app.put('/api/opp/{0}'.format(opp['id']), data=json.dumps(data))
		self.assertEqual(rv.status_code, 200)

		# get blocked by opp_ownership_required
		rv = self.app.put('/api/user/{0}/resign-opp/{1}'.format(self.user['id'], opp['id']))
		rv = self.app.put('/api/opp/{0}'.format(opp['id']), data=json.dumps(data))
		self.assertEqual(rv.status_code, 401)




if __name__ == '__main__':
    unittest.main()