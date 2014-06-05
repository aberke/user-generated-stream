

var HTMLbuilder = function() {
	this.container;
	this.BtnMaster;
	this.data;
	this.entryList;
	this.onclickPrefix;

	this.pictureFrameDimension = 290;
	this.static_domain = OPPglobals.static_domain;
}

HTMLbuilder.prototype.init = function(container, data, callback) {
	console.log('HTMLbuilder init', data)
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
	// add opp via for style sheets
	this.container.className += (" via-" + this.data.via);
	// TODO -- PUT IN CLASS
	if (this.data.widget_type == 'poll') {
		this.container.className += (" poll");
	} else {
		this.container.className += (" slideshow");
	}
}
HTMLbuilder.prototype.buildSlideInfo = function(complete) {
	/* Parameter: complete (boolean)
			complete boolean used by Poll once complete 
				if complete: show refresh instead of prev/next
				elements marked with showOnIncomplete will show iff complete==false
				elements marked with showOnComplete will show iff complete==true
	*/
	var onclickPrev    = this.onclickPrefix + ".SwipeCntl.prev()";
	var onclickNext    = this.onclickPrefix + ".SwipeCntl.next()";
	var onclickRefresh = this.onclickPrefix + ".refresh()";
	// show/hide elements build below base on whether or not to show in the complete opp-frame or not
	var showOnComplete 	=  ("style='display:" + (complete ? "inline-block" : "none") + "'");
	var showOnIncomplete =  ("style='display:" + (complete ? "none" : "inline-block") + "'");

	// for polls there are thumbs for swipe, for slideshows there are arrows
	var swipeLeftImg = "/widget/icon/left-arrow.png";
	var swipeRightImg = "/widget/icon/right-arrow.png";
	if (this.data.widget_type == 'poll') {
		swipeLeftImg = "/widget/icon/thumbs-down.jpeg";
		swipeRightImg = "/widget/icon/thumbs-up.jpeg";
	}

	var html = "<div class='slide-info'>";
		html+= "	<img " + showOnIncomplete + " onclick=" + onclickPrev + " class='touch slide-change-icon left' width='10px' src='" + this.static_domain + swipeLeftImg + "'>";
		html+= "	<p class='title'>" + (this.data.via == 'social' ? '#' : '') + this.data.title + "</p>";
		html+= "	<p " + showOnIncomplete + " class='slide-count'>";
		/* slide-index is 0 until setSlide called */
		html+= "		<span class='slide-index'>0</span>/" + this.entryList.length;
		html+= "	</p>";
		html += "	<img " + showOnComplete + " onclick=" + onclickRefresh + " class='touch refresh' width='15px' src='" + this.static_domain + "/widget/icon/refresh.png'>";
		html+= "	<img " + showOnIncomplete + " onclick=" + onclickNext + " class='touch slide-change-icon right' width='10px' src='" + this.static_domain + swipeRightImg + "'>";
		html+= "</div>";
	return html;
}	
HTMLbuilder.prototype.setImg = function(img, img_url, callback) {
	/* Parameters: image element (img)
				   URL of image to set img src to (img_url)
				   callback for when done
		sets the empty img element's src and aligns the img in its frame
	*/
 	if (!img_url) { return callback(); }
 	self = this;

	img.onload = function() {
		if (!img.height) { console.log('ERROR: !img.height'); return callback(); }
		// if height > width: horizontally center image
		if (img.height > img.width) {
			img.style.height = (self.pictureFrameDimension + "px");
			// browser will handle the rest
			return callback(); 
		}
		// else width <= height: vertically center image - handle short img awkwardly sticking to top of container
		var originalWidth = img.width;
		var originalHeight = img.height;
		img.width = self.pictureFrameDimension;
		img.height = (originalHeight/originalWidth)*self.pictureFrameDimension;
		var extra_space = self.pictureFrameDimension - img.height;
		img.style.marginTop = (extra_space/2).toString() + "px";
		callback();
	};
	img.src=img_url;
}
HTMLbuilder.prototype.setImages = function(callback) {
	// overridden by PollBuilder
	this.imageElements = this.container.getElementsByClassName('entry-image');
	var called = 0;
	var waitingOn = this.imageElements.length;
	var call = function() {
		called += 1;
		if (called >= waitingOn) { callback(); }
	}
	for (var i=0; i<this.imageElements.length; i++) {
		this.setImg(this.imageElements[i], this.entryList[i].img_url, call);
	}
}
HTMLbuilder.prototype.setImage = function(slideIndex, entryIndex) {
	this.setImg(this.imageElements[slideIndex], this.entryList[entryIndex].img_url, function(){});
}
HTMLbuilder.prototype.buildPicture = function() {
	var html = "<div class='picture-frame'>";
		html+= "	<div class='picture swipe'>";
		html+= "		<div class='swipe-wrap'>";
	for (var i=0; i<this.entryList.length; i++) {
		html+= "			<div class='image-container'>"
		html+= " 				<img class='entry-image'>"; // filled in by setImages
		
		html+= "			</div>";
	}
		html+= "		</div>";
		html+= "	</div>";
		html+= "</div>";
		html+= "<p class='image-credit'>CREDIT</p>";
	return html;
}
HTMLbuilder.prototype.setCaption = function(entry) {
	if (this.data.via == 'social') {
		this.entryHeader.innerHTML = ('@' + entry.screen_name);
	} else {
		this.entryHeader.innerHTML = entry.header;
	}
	this.entryText.innerHTML = entry.text;
}
HTMLbuilder.prototype.setSlide = function(index) {
	var entry = this.entryList[index];
	this.imgCredit.innerHTML = (entry.source || '');
	this.setCaption(entry);
	this.slideIndex.innerHTML = index + 1;
}
HTMLbuilder.prototype.buildShareContainer = function() {
	/* taken out of buildCaption since poll uses this for results building without caption */
	var onclickShareFB 		= this.onclickPrefix + ".shareFB()";
	var onclickShareEmail 	= this.onclickPrefix + ".shareEmail()";
	var onclickShareTwitter = this.onclickPrefix + ".shareTwitter()";

	var html = "<div class='share-container'>";
		html+= "	<p class='share-text'>Share this photo</p>";
		html+= "	<div data-huffpostlabs-btn onclick=" + onclickShareFB + " class='fb-share share'>";
		html+= "		<img width='30px' height='30px' class='share-btn' src='" + this.static_domain + "/widget/icon/fb-icon.png'>";
		html+= "		<img class='share-btn-swap' width='30px' height='30px' src='" + this.static_domain + "/widget/icon/fb-icon-blue.png'>";
		html+= "	</div>";
		html+= "	<div data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share share'>";
		html+= "		<img width='30px' height='30px' class='share-btn' src='" + this.static_domain + "/widget/icon/twitter-icon.png'>";
		html+= "		<img class='share-btn-swap' width='30px' height='30px' src='" + this.static_domain + "/widget/icon/twitter-icon-blue.png'>";
		html+= "	</div>";
		html+= "	<div data-huffpostlabs-btn onclick=" + onclickShareEmail + " class='email-share share'>";
		html+= "		<img width='30px' height='30px' class='email-share-btn' src='" + this.static_domain + "/widget/icon/email.png'>";
		html+= "	</div>";
		html+= "</div>";
	return html;	
}
HTMLbuilder.prototype.buildCaption = function() {
	var html = "<div class='picture-caption'>";
		html+= "	<span class='entry-header'></span>";	
		html+= "	<span class='entry-text'></span>";	
		html+= 		this.buildShareContainer();
		html+= "</div>";
	return html;
}

HTMLbuilder.prototype.buildWidget = function(callback) {

	var html = "<div class='opp-frame'>";
		html+= this.buildSlideInfo();
		html+= this.buildPicture();
		html+= this.buildCaption();

		html+="</div>";
	this.container.innerHTML = html;
	
	// add the images to the image-containers
	this.setImages(callback);

	// pick up the important reusable pieces
	this.imgCredit   = this.container.getElementsByClassName('image-credit')[0];
	this.entryHeader = this.container.getElementsByClassName('entry-header')[0];
	this.entryText   = this.container.getElementsByClassName('entry-text')[0];
	this.slideIndex  = this.container.getElementsByClassName('slide-index')[0];
}

/* for Polls ------------------------------------------------- */
var PollBuilder = function() {
	// Call the parent constructor
    HTMLbuilder.call(this);
}	
// inherit HTHMLbuilder and correct the constructor pointer
PollBuilder.prototype = new HTMLbuilder();
PollBuilder.prototype.constructor = PollBuilder;

PollBuilder.prototype.setImages = function(callback) {
	console.log('PollBuilder setImages')
	/* there are exactly 3 image-containers -- nextSlide | currentSlide | nextSlide
		container[0]: entry_0
		container[1]: entry_1
		container[2]: entry_1 (because this is like container[-1])
	*/
	this.imageElements = this.container.getElementsByClassName('entry-image');
	var called = 0;
	var waitingOn = 3;
	var call = function() {
		called += 1;
		if (called >= waitingOn) { callback(); }
	}
	this.setImg(this.imageElements[0], this.entryList[0].img_url, call);
	this.setImg(this.imageElements[1], this.entryList[1].img_url, call);
	this.setImg(this.imageElements[2], this.entryList[1].img_url, call);
}
PollBuilder.prototype.buildPicture = function() {
	var html = "<div class='picture-frame'>";
		html+= "	<div class='picture swipe'>";
		html+= "		<div class='swipe-wrap'>";
	for (var i=0; i<3; i++) {
		html+= "			<div class='image-container'>"
		html+= " 				<img class='entry-image'>"; // filled in by setImages	
		html+= "			</div>";
	}
		html+= "		</div>";
		html+= "	</div>";
		html+= "</div>";
		html+= "<p class='image-credit'>credit</p>";
	return html;
}
PollBuilder.prototype.complete = function(results) {
	/* Parameter: results -- entryList sorted by upvotes */

	var onclickRefresh = this.onclickPrefix + ".refresh()";
	var html = "<div class='opp-frame complete'>";
		html+= 		this.buildSlideInfo(true);


		html+= "<div class='results-container'>";
		html+= "	<p class='results-title'>Results</p>"
	for (var i=0; i<results.length; i++) {
		var entry = results[i];
		console.log('result', i, entry)

		html+= "	<div class='result'>";
		html+= "		<div class='result-image-container'>";
		html+= "			<img height='100px' src='" + entry.img_url + "'>";
		html+= "		</div>";

		html+= "		<div class='result-text'>";
	if (this.data.via == 'social') {
		html+= 				("<p>@" + entry.screen_name + "</p>");
	} else {
		html+= 		 		("<p>" + entry.header + "</p>");
	}
		html+= "			<img width='16px' src='/widget/icon/thumbs-up.jpeg'>";
		html+= 				(entry.upvotesPercent + "%");
		html+= "			<img width='16px' src='/widget/icon/thumbs-down.jpeg'>";
		html+= 				(entry.downvotesPercent + "%");

		html+= "		</div>";
		html+= "	</div>";
	}
		html+= "</div>";
		html+= this.buildShareContainer();

	this.container.innerHTML = html;
}
	
/* ------------------------------------------------- for Polls */









