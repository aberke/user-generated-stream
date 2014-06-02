from flask import Blueprint, send_file, url_for

from app.auth.route_wrappers import opp_ownership_required



splash = Blueprint('splash', __name__, static_url_path='', static_folder='static')




@splash.route('/')
@splash.route('/opp/<oppID>')
@splash.route('/update/via-social/<oppID>')
@splash.route('/update/via-editor/<oppID>')
def send_base(oppID=None):
	"""
	View protection handled client side
		- if user not logged in, redirected to '/'
	"""
	return send_file('splash/static/html/base.html')

@splash.route('/test')
def test():
	return send_file('splash/static/html/test.html')

