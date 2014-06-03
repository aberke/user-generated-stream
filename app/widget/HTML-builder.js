

var HTMLbuilder = function() {
	this.container;
	this.BtnMaster;
	this.data;
	this.entryList;
	this.onclickPrefix;

	var pictureFrameDimension = 290;
	var static_domain = OPPglobals.static_domain;

	/* for Polls ------------------------------------------------- 
	var slides;
	var len = this.entryList.length;
	this.setupPoll = function() {
		slides = container.getElementsByClassName('image-container');
		console.log('setupPoll slides', slides)
	}
	this.fillSlide = function(s, e) {
		slides[s].innerHTML += ("<br/>SLIDE " + s + " - ENTRY " + e);
	}

	/* ------------------------------------------------- for Polls */

	this.init = function(container, data, callback) {
		this.container = container;
		this.data = data;
		this.entryList = data.entryList;
		this.onclickPrefix = ("OPPwidgets['" + data.id + "']");
		this.buildWidget(callback);
		// if mobile add mobile class to container and use HuffpostLabsBtnMaster
		this.container.className.replace(/\bmobile\b|\bnon-mobile\b/, ''); // incase its a reload
		if (OPPglobals.mobile) {
			this.container.className += " mobile";
			this.BtnMaster = new HuffpostLabsBtnMaster(this.container);
		} else {
			this.container.className += " non-mobile";
		}
		// TODO -- MOVE TO CLASS INIT
		// add opp via for style sheets
		this.container.className += (" via-" + this.data.via);
		if (this.data.widget_type == 'poll') {
			this.setupPoll();
		}
	}

	this.buildSlideInfo = function() {
		var onclickPrev = this.onclickPrefix + ".SwipeCntl.prev()";
		var onclickNext = this.onclickPrefix + ".SwipeCntl.next()";
		var html = "<div class='slide-info'>"
			html+= "	<img onclick=" + onclickPrev + " class='touch slide-change-arrow left' width='10px' src='" + static_domain + "/widget/icon/left-arrow.png'>";
			html+= "	<p class='title'>" + (this.data.via == 'social' ? '#' : '') + this.data.title + "</p>";
			html+= "	<p class='slide-count'>";
			/* slide-index is 0 until setSlide called */
			html+= "		<span class='slide-index'>0</span>/" + this.entryList.length;
			html+= "	</p>";
			html+= "	<img onclick=" + onclickNext + " class='touch slide-change-arrow right' width='10px' src='" + static_domain + "/widget/icon/right-arrow.png'>";
			html+= "</div>";
		return html;
	}
	
	function setImg(img, img_url, callback) {
		/* Parameters: image element (img)
					   URL of image to set img src to (img_url)
					   callback for when done
			sets the empty img element's src and aligns the img in its frame
		*/
	 	if (!img_url) { return callback(); }

		img.onload = function() {
			if (!img.height) { console.log('ERROR: !img.height'); return callback(); }

			// if height > width: horizontally center image
			if (img.height > img.width) {
				img.style.height = (pictureFrameDimension + "px");
				// browser will handle the rest
				return callback(); 
			}
			// else width <= height: vertically center image - handle short img awkwardly sticking to top of container
			var originalWidth = img.width;
			var originalHeight = img.height;
			img.width = pictureFrameDimension;
			img.height = (originalHeight/originalWidth)*pictureFrameDimension;
			var extra_space = pictureFrameDimension - img.height;
			img.style.marginTop = (extra_space/2).toString() + "px";
			callback();
		};
		img.src=img_url;
	}
	this.setImages = function(callback) {
		var imageElements = this.container.getElementsByClassName('entry-image');
		var called = 0;
		var waitingOn = this.entryList.length;
		var call = function() {
			called += 1;
			if (called >= waitingOn) { callback(); }
		}
		for (var i=0; i<this.entryList.length; i++) {
			setImg(imageElements[i], this.entryList[i].img_url, call);
		}
	}
	this.buildPicture = function() {
		var html = "<div class='picture-frame'>";
			html+= "	<div class='picture swipe'>";
			html+= "		<div class='swipe-wrap'>";
		for (var i=0; i<this.entryList.length; i++) {
			html+= "			<div class='image-container image-container-" + i + "'>"
			html+= " 				<img class='entry-image'>"; // filled in by setImages
			
			html+= "			</div>";
		}
			html+= "		</div>";
			html+= "	</div>";
			html+= "</div>";
			html+= "<p class='image-credit'>credit</p>";
		return html;
	}
	this.setCaption = function(entry) {
		if (this.data.via == 'social') {
			this.entryHeader.innerHTML = ('@' + entry.screen_name);
		} else {
			this.entryHeader.innerHTML = entry.header;
		}
		this.entryText.innerHTML = entry.text;
	}
	this.setSlide = function(index) {
		var entry = this.entryList[index];
		this.imgCredit.innerHTML = (entry.source || '');
		this.setCaption(entry);
		this.slideIndex.innerHTML = index + 1;
	}
	this.buildCaption = function() {
		var onclickShareFB = this.onclickPrefix + ".shareFB()";
		var onclickShareTwitter = this.onclickPrefix + ".shareTwitter()";

		var onclickShareEmail = this.onclickPrefix + ".shareEmail()";

		var html = "<div class='picture-caption'>";
			html+= "	<span class='entry-header'></span>";	
			html+= "	<span class='entry-text'></span>";	
			html+= "	<div class='share-container'>";
			html+= "		<p>Share this photo</p>";
			html+= "		<div data-huffpostlabs-btn onclick=" + onclickShareFB + " class='fb-share share'>";
			html+= "			<img width='30px' height='30px' class='share-btn' src='" + static_domain + "/widget/icon/fb-icon.png'>";
			html+= "			<img class='share-btn-swap' width='30px' height='30px' src='" + static_domain + "/widget/icon/fb-icon-blue.png'>";
			html+= "		</div>";
			html+= "		<div data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share share'>";
			html+= "			<img width='30px' height='30px' class='share-btn' src='" + static_domain + "/widget/icon/twitter-icon.png'>";
			html+= "			<img class='share-btn-swap' width='30px' height='30px' src='" + static_domain + "/widget/icon/twitter-icon-blue.png'>";
			html+= "		</div>";
			html+= "		<div data-huffpostlabs-btn onclick=" + onclickShareEmail + " class='email-share share'>";
			html+= "			<img width='30px' height='30px' class='email-share-btn' src='" + static_domain + "/widget/icon/email.png'>";
			html+= "		</div>";
			html+= "	</div>";
			html+= "</div>";
		return html;
	}

	this.buildWidget = function(callback) {

		var html = "<div class='opp-frame'>";
			html+= this.buildSlideInfo();
			html+= this.buildPicture();
			html+= this.buildCaption();

			html+="</div>";
		this.container.innerHTML = html;
		
		// add the images to the image-containers
		this.setImages(callback);

		// pick up the important reusable pieces
		this.imgCredit = this.container.getElementsByClassName('image-credit')[0];
		this.entryHeader = this.container.getElementsByClassName('entry-header')[0];
		this.entryText   = this.container.getElementsByClassName('entry-text')[0];
		this.slideIndex  = this.container.getElementsByClassName('slide-index')[0];
	}
}
	









