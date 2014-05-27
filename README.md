user-generated-stream
=====================
<img width='270px' src="http://pool.hesperian.org/w/images/thumb/d/d5/EHB_Ch11_Page_214-2.png/550px-EHB_Ch11_Page_214-2.png"
 alt="stream-drawing" align="right" />

Other People's Photos (OPP), posted to us through twitter, consumed like a slideshow

It's alive <http://user-generated-stream.herokuapp.com/>

Running Locally
---

* Clone repo 

```
$ git clone https://github.com/huffpostlabs/user-generated-stream.git
$ cd /user-generated-stream
```

* Create a virutual environment so that the following installations do not cause conflicts.  Make sure to reactivate this virtual environment each time you want to run the server locally.  All the following installations will be isolated in this environment.

```
$ pip install virtualenv
$ virtualenv venv
$ source venv/bin/activate
```

* Install dependencies: ```$ pip install -r requirements.txt``` (may need to run with sudo)
* Make sure you have mongodb installed ```$ brew install mongodb```
* Make sure mongodb is started ```$ mongod```
* Obtain and set the environment variables that do not have defaults
	- The twitter variables can be found in our user-generated-stream twitter app, or you can create a new twitter app.  They're used for user signin and querying the twitter API
	- The instagram variables can be found in the user-generated-stream instagram app, or you can create a new instagram app.  They're used for querying instagram API

```
$ source TWITTER_CONSUMER_KEY='XXX',TWITTER_CONSUMER_SECRET='XXX', INSTAGRAM_CLIENT_ID='XXX',INSTAGRAM_CLIENT_SECRET='XXX'
```

* Run 'er: ```python run.py```
* Visit <http://127.0.0.1:3000>

Running Tests
---

From base directory ```$ python test.py ```


Admin
---
- Most users are limited to interacting with only the OPP's that they own
- To gain route and API access to all OPP's, user's twitter_screen_name must be added to ADMIN_WHITELIST
	- ADMIN_WHITELIST located in config.py file
- Currently the ADMIN_WHITELIST has only 'HuffpostLabs' and 'AlexandraBerke'


Production Notes
---
- Running on Heroku under the HuffpostLabs account
- Stack:
	- Python Flask backend
	- AngularJS frontend
- 2 Web dynos
- MongoHQ database (using MongoEngine as driver)
	- view logs/info: <https://partners.mongohq.com/app24775728-heroku-com/mongo/app24775728/monitoring>
	- Read preference set to ReadPreference.SECONDARY


TODO
---

- center widget


Necessary Tests
---
- saving date

- error.html shows on error
	- python api tests test the /api/error endpoint (which uses respond500)
	- should hide on route change

- reject/accept entries



Types
---
Slideshow
	- from social campaign
	- from editor












