from flask import Flask
from flask.ext.compress import Compress



# Configuration ----------------------------------------------

app = Flask('app', static_url_path='/widget', static_folder='widget')
app.config.from_object('config')
Compress(app)

# register /auth/* endpoints
from splash import splash as splash_blueprint
app.register_blueprint(splash_blueprint, url_prefix='')

# register /auth/* endpoints
from auth import auth as auth_blueprint
app.register_blueprint(auth_blueprint, url_prefix='/auth')

# register /api/* endpoints
from api import api as api_blueprint
app.register_blueprint(api_blueprint, url_prefix='/api')

#---------------------------------------------- Configuration #




    