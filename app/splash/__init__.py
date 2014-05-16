from flask import Blueprint, send_file, url_for

from app.auth.route_wrappers import opp_ownership_required



splash = Blueprint('splash', __name__, static_url_path='', static_folder='static')




@splash.route('/')
@splash.route('/opp/<oppID>')
def unprotected_view(oppID=None):
	return send_file('splash/static/html/base.html')


@splash.route('/update/<oppID>')
@opp_ownership_required
def protected_view(opp):
	return send_file('splash/static/html/base.html')


