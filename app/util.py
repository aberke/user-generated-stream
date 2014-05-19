""" 
Utility Methods
"""

from flask import Response
import json


def yellERROR(err=None):
	print '-------------- ERROR --------------'
	print err
	print '-------------- ERROR --------------'
	return err


def dumpJSON(data):
	if not isinstance(data, str):
		data = json.dumps(data)
	response_headers = {'Content-Type': 'application/json'}
	return Response(data, 200, response_headers)

def respond500(err='ERROR'):
	yellERROR(err)
	data = json.dumps({'message': 'Error: {0}'.format(str(err))})
	response_headers = {'Content-Type': 'application/json'}
	return Response(data, 500, response_headers)
