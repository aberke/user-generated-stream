from flask import Blueprint, send_file, url_for



splash = Blueprint('splash', __name__, static_url_path='', static_folder='static')




@splash.route('/')
@splash.route('/new')
@splash.route('/update/<id>')
def base(id=None):
	return send_file('splash/static/html/base.html')






@splash.route('/w')
def widget():
	return send_file('static/widget/widget.html')

