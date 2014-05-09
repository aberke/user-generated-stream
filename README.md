user-generated-stream
=====================
<img width='270px' src="http://pool.hesperian.org/w/images/thumb/d/d5/EHB_Ch11_Page_214-2.png/550px-EHB_Ch11_Page_214-2.png"
 alt="stream-drawing" align="right" />

Other People's Photos (OPP), posted to us through twitter, consumed like a slideshow

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
* Run 'er: ```python run.py```
* Visit <http://127.0.0.1:3000>



TODO
---















