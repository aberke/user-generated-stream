#********************************************************************************
#--------------------------------------------------------------------------------
#
# 	Author: Alexandra Berke (aberke)
# 	Written: May 2014
#
#--------------------------------------------------------------------------------
#*********************************************************************************




from app import app


###### Run! ######
if __name__ == '__main__':
	app.run(host=app.config['HOST'], port=app.config['PORT'], debug=app.config['DEBUG'])