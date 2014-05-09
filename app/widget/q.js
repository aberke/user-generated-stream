/* name is q.js: let's make the name as short as possible as for easy reference
	
	This is pure javascript - no jQuery

*/


/* wrap in anonymous function as to not interfere with existing function and variable names */
(function() {

	//var domain = static_domain = 'http://127.0.0.1:3000';
	var domain = static_domain = 'http://user-generated-stream.herokuapp.com';


	this.OPPwidgets = {};


	var scripts 	= [
					   	(static_domain + "/widget/OPP-object.js"),
					   	(static_domain + "/widget/HTML-builder.js"),
					   	(static_domain + "/widget/lib/swipe.js"),
					   	(static_domain + "/widget/lib/btn-master.js"),
					   	(static_domain + "/widget/lib/social-network-sharing.js"),
					   ];
	var stylesheets = [(static_domain + "/widget/widget.css")];


	var setupOPPfunctions = function() {
		/* define a set of quiz functions that are global
			- defined functions are callable by 
				quizFunctions.f_name(arguments)
		*/
		this.OPPfunctions = (this.QuizFunctions || {});

		this.OPPfunctions.twitterShare = function(text, share) {
			/* using HuffpostLabs social-network-sharing library */
			HuffpostLabsShareTwitter(text, share.link, function() {
				PUT("/api/share/" + share._id + "/increment-twitter-count", null);
			});
		}
		this.OPPfunctions.fbShare = function(shareData, share) { 
			/* using HuffpostLabs social-network-sharing library */
			HuffpostLabsShareFB(shareData, function() {
				if (share._id) { /* log that it was shared */
					PUT("/api/share/" + share._id + "/increment-fb-count", null);
				}
			});
		}
	}





	var addWindowFunction = function(f_name, f) {
		window[f_name] = f;
	}
	/* helper for 'getting' and 'posting' 
		
		- using static_domain for GET requests and true domain for POSTS
		because I want my POST requests to actually make it to my server rather than getting caught in the cache
		- This is important because of the fact that JSONP is really using a GET	
	*/
	function jsonp(domain, endpoint, callback){
		var f_name = "oppJSONPcallbacks_" + String(endpoint.split('/').join('_'));
		
		var tempscript  = document.createElement('script');
		tempscript.id   = "tempscript-" + f_name;
		tempscript.src  = domain + endpoint + "?callback=" + f_name + "";
		tempscript.type = "text/javascript";
		document.body.appendChild(tempscript);

		addWindowFunction(f_name, function(data) {
			document.body.removeChild(tempscript);
			tempscript = null;
			if (callback) { callback(data); }
		});
	}
	function GET(endpoint, callback) {
		jsonp(static_domain, endpoint, callback);
	}
	/* (cough... jsonp hack to get around cross origin issue...) */
	function PUT(endpoint, callback) {
		jsonp(domain, endpoint, callback);
	}


	var withScripts = function(srcList, callback) {
		var numScripts = srcList.length;
		var numLoaded = 0;
        function scriptLoaded() {
            numLoaded++;
            if (numLoaded === numScripts) {
                callback();
            }
        }
		for (var i=0; i<numScripts; i++) {

			var script_tag = document.createElement('script');
			script_tag.setAttribute("type","text/javascript");
			script_tag.setAttribute("src", srcList[i]);
			if (script_tag.readyState) {
				script_tag.onreadystatechange = function () { // For old versions of IE
					if (this.readyState == 'complete' || this.readyState == 'loaded') {
						scriptLoaded();
					}
				};
			} else {
				script_tag.onload = scriptLoaded;
			}
			// Try to find the head, otherwise default to the documentElement
			(document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
		}
		if (!numScripts) {
			callback();
		}
	};

	var withStyleSheets = function(srcList, callback) {
		for (var i=0; i<srcList.length; i++) {
			if (document.createStyleSheet) {
				document.createStyleSheet(srcList[i]);
			} else {
				var ss = document.createElement("link");
				ss.type = "text/css";
				ss.rel = "stylesheet";
				ss.href = srcList[i];
				document.getElementsByTagName("head")[0].appendChild(ss);
			}
		}
		if (callback) { callback(); }
	};
	function loadDependencies(callback) {
		withStyleSheets(stylesheets);
		withScripts(scripts, callback);
	}
	function disablePinterestBullshit(container) {
		/* Huffpost decided it was a great idea to make EVERY IMAGE PINABLE - no thanks, especially not on the images that are actually my facebook buttons... awkward.. */
		container.className += " no-pin";
	}
	function showLoading(container) {
		if (!container || (container.className.indexOf("quiz-edit") > -1)) { return; }
		/* show only the loading gif */
		container.style.display = "none";
		
		var loadingGif = document.createElement("img");
		loadingGif.src = (static_domain + "/widget/icon/loading.gif");
		loadingGif.className = "huffpostlabs-loading";
		loadingGif.style.display = "block";
		loadingGif.style.margin = "auto";
		container.parentNode.insertBefore(loadingGif, container.nextSibling);
	}
	function doneLoadingCallback(container) {
		/* undoes the work of showLoading - shows widget and removes loading gif */
		container.style.display = 'block';
		if (container.nextSibling.className.indexOf("huffpostlabs-loading") > -1) {
        	container.parentNode.removeChild(container.nextSibling);
		}
	}

	function createOPP(id, container, callback){
		if (!id) { return null; }
		/* load quiz data - create quiz widet object, replace loading display with widget */
        GET("/api/opp/" + id, function(data) {
        	console.log('got', data)
			this.OPPwidgets[id] = new HuffpostLabsOPP(container, data);//, mobile, quizStartedCallback, quizCompletedCallback, quizRestartedCallback);
			doneLoadingCallback(container);
        	if (callback) { callback(); }
		});
	};

	function main(){

		var widgetContainers = document.getElementsByClassName('huffpostlabs-opp');
		
		loadDependencies(function() { /* callback after stylesheets and scripts loaded */
			for (var i=0; i<widgetContainers.length; i++) {
				var container = widgetContainers[i];
				/* create quiz widget object, replace loading display with widget */
				createOPP(container.id, container);
			}
		});
		/* while loading that quizData.... */
		for (var c=0; c<widgetContainers.length; c++) {
			showLoading(widgetContainers[c]);
			disablePinterestBullshit(widgetContainers[c]);
		}
		setupOPPfunctions();
	}
	main();

	return {
		OPPwidgets: this.OPPwidgets,
		OPPfunctions: this.OPPfunctions,
	};	
})();
