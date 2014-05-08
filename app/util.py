""" 
Utility Methods
"""

from flask import Response
import json


def dumpJSON(data):
	if not isinstance(data, str):
		data = json.dumps(data)
	response_headers = {'Content-Type': 'application/json'}
	return Response(data, 200, response_headers)