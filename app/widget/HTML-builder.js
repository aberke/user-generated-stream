/*******************************************************************************
--------------------------------------------------------------------------------

	Author: Alexandra Berke (aberke)
	Written: May 2014

	Notes:
		- HTMLbuilder is the baseclass for SlideshowBuilder and Pollbuilder classes
		- Owned by OPP-object
		- Job: take an empty div container and OPP data and fill it in appropriately
		- For showing slides, creates 5 image elements and recycles them (see setupNextSlides)

--------------------------------------------------------------------------------
*********************************************************************************/



var HTMLbuilder = function() {
	this._container;
	this._BtnMaster;
	this._data;
	this._entryList;
	this._onclickPrefix;

	this.pictureFrameDimension = 0;
	this.static_domain = OPPglobals.static_domain;
}
HTMLbuilder.prototype._swipeLeftImg = "/widget/icon/left-arrow.png";
HTMLbuilder.prototype._swipeRightImg = "/widget/icon/right-arrow.png";
HTMLbuilder.prototype.numSlides = 5; // recycle 5 img elements

HTMLbuilder.prototype.init = function(container, data){
	this._container = container;
	this._data = data;
	this._entryList = data.entryList;
	this._onclickPrefix = ("OPPwidgets['" + data.id + "']");
	this.buildWidget();

	// if mobile add mobile class to container and use HuffpostLabsBtnMaster
	this._container.className.replace(/\bmobile\b|\bnon-mobile\b/, ''); // in case its a reload after a page resize
	if (OPPglobals.mobile) {
		this._container.className += " mobile";
		this._BtnMaster = new HuffpostLabsBtnMaster(this._container);
	} else {
		this._container.className += " non-mobile";
	}
	// add opp via for stylesheets
	this._container.className += (" via-" + this._data.via);
}
HTMLbuilder.prototype._setImg = function(img, img_url){
	/* Parameters: image element (img)
				   URL of image to set img src to (img_url)
		sets the empty img element's src and aligns the img in its frame
	*/
 	if (!img_url || img.src == img_url) { return; }
 	
 	// take off the previous image dimensions since this is a recycled image element
 	if (img.width) { img.removeAttribute('width'); }
 	if (img.height) { img.removeAttribute('height'); }
 	img.style.marginTop = "0px";

 	var pictureFrameDimension = this.pictureFrameDimension;

	img.onload = function() {
		if (!img.height) { return; }
		// if height > width: horizontally center image
		if (img.height > img.width) {
			img.style.height = (pictureFrameDimension + "px");
			return; // browser will handle the rest
		}
		// else width <= height: vertically center image - handle short img awkwardly sticking to top of container
		var originalWidth = img.width;
		var originalHeight = img.height;
		img.width = pictureFrameDimension;
		img.style.height = ((originalHeight/originalWidth)*pictureFrameDimension) + "px";
		var extra_space = pictureFrameDimension - img.height;
		img.style.marginTop = (extra_space/2).toString() + "px";
	};
	img.src=img_url;
}
HTMLbuilder.prototype.setImage = function(slideIndex, entryIndex) {
	this._setImg(this.imageElements[slideIndex], this._entryList[entryIndex].img_url);
}

/* - hide/show mobile instructions ------------------------------------------ */
HTMLbuilder.prototype.showMobileInstructions = function() {
	this.mobileInstructions.style.display = "block";
	this.mobileInstructions.style.width = (this.pictureFrameDimension + "px");
}
HTMLbuilder.prototype.hideMobileInstructions = function() {
	this.mobileInstructions.style.display = "none";
}
HTMLbuilder.prototype.mobileInstructionsText = "Swipe to navigate"; // overridden by PollBuilder
/* ------------------------------------------ hide/show mobile instructions - */

HTMLbuilder.prototype.buildSlideInfo = function(complete) {
	/* Parameter: complete (boolean)
			complete boolean used by Poll once complete 
				if complete: show refresh instead of prev/next
				elements marked with showOnIncomplete will show iff complete==false
				elements marked with showOnComplete will show iff complete==true
	
	for polls there are thumbs for swipe, for slideshows there are arrows
	*/
	var onclickPrev    = this._onclickPrefix + ".prev()";
	var onclickNext    = this._onclickPrefix + ".next()";
	var onclickRefresh = this._onclickPrefix + ".refresh()";
	// show/hide elements build below base on whether or not to show in the complete opp-frame or not
	var showOnComplete 	=  ("style='display:" + (complete ? "inline-block" : "none") + "'");
	var showOnIncomplete =  ("style='display:" + (complete ? "none" : "inline-block") + "'");

	var html = "<div class='slide-info'>";
		html+= "	<img " + showOnIncomplete + " onclick=" + onclickPrev + " class='touch slide-change-icon left' width='10px' src='" + this.static_domain + this._swipeLeftImg + "'>";
		html+= "	<p class='title'>" + (this._data.via == 'social' ? '#' : '') + this._data.title + "</p>";
		html+= "	<p " + showOnIncomplete + " class='slide-count'>";
		/* entry-index is 0 until setupSlide called */
		html+= "		<span class='entry-index'>0</span>/" + this._entryList.length;
		html+= "	</p>";
		html += "	<img " + showOnComplete + " onclick=" + onclickRefresh + " class='touch refresh' width='15px' src='" + this.static_domain + "/widget/icon/refresh.png'>";
		html+= "	<img " + showOnIncomplete + " onclick=" + onclickNext + " class='touch slide-change-icon right' width='10px' src='" + this.static_domain + this._swipeRightImg + "'>";
		html+= "</div>";
	return html;
}
HTMLbuilder.prototype.buildPicture = function() {
	/* put in 3 image elements that will be recycled  + mobile-instructions */
	var onclickMobileInstructions = this._onclickPrefix + ".mobileInstructionsOnclick()";
	var html = "<div class='picture-frame'>";

		html+= "<div data-huffpostlabs-btn onclick=" + onclickMobileInstructions + " class='mobile-instructions'>";
		html+= "	<p>" + this.mobileInstructionsText + "</p>";
		html+= "	<p>START</p>";
		html+= "</div>";

		html+= "	<div class='picture swipe'>";
		html+= "		<div class='swipe-wrap'>";
	for (var i=0; i<this.numSlides; i++) {
		html+= "			<div class='image-container'>"
		html+= " 				<img class='entry-image'>"; // filled in by setImage
		html+= "			</div>";
	}
		html+= "		</div>";
		html+= "	</div>";
		html+= "</div>";
		html+= "<p class='image-credit'>CREDIT</p>";
	return html;
}
HTMLbuilder.prototype.buildShareContainer = function(complete) {
	/* taken out of buildCaption since poll uses this for results building without caption 
		Parameter: complete (boolean) -- if true: this is for poll results page
	*/
	var onclickShareFB 		= this._onclickPrefix + ".shareFB()";
	var onclickShareEmail 	= this._onclickPrefix + ".shareEmail()";
	var onclickShareTwitter = this._onclickPrefix + ".shareTwitter()";

	var html = "<div class='share-container'>";
		html+= "	<p class='share-text'>" + (complete ? "Share results" : "Share this photo") + "</p>";
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
HTMLbuilder.prototype.getPictureFrameDimension = function(callback) {
	/* this.picture has not expanded to its correct width when its first created
		must wait for it to fully expand in order to correctly size images, slideshow container
			and set this.pictureFrameDimension
		seems to usually take ~2 tries
	*/
	var self = this;
	var attempt = 0;
	var maxAttempts = 50;
	function makeAttempt() {
		attempt ++;
		var dimension = self.picture.offsetWidth;
		if (dimension > 0) { // success
			self.pictureFrameDimension = dimension;
			self.picture.style.height = dimension + "px";
			return callback(dimension);
		}
		if (attempt == maxAttempts) {  // give up with failure
			return callback(0); 
		}
		// wait until css made it wide enough - try again every 1/2 second
		window.setTimeout(makeAttempt, 500);
	}
	makeAttempt();
}

HTMLbuilder.prototype.buildWidget = function() {

	var html = "<div class='opp-frame'>";
		html+= this.buildSlideInfo();
		html+= this.buildPicture();
		html+= this.buildCaption();

		html+="</div>";
	this._container.innerHTML = html;

	// pick up the important reusable pieces
	this.imageElements = this._container.getElementsByClassName('entry-image');
	this.imgCredit     = this._container.getElementsByClassName('image-credit')[0];
	this.entryHeader   = this._container.getElementsByClassName('entry-header')[0];
	this.entryText     = this._container.getElementsByClassName('entry-text')[0];
	this.entryIndexElement    = this._container.getElementsByClassName('entry-index')[0];
	this.picture 	   = this._container.getElementsByClassName('picture')[0];
	this.mobileInstructions = this._container.getElementsByClassName('mobile-instructions')[0];
}
HTMLbuilder.prototype.setCaption = function(entry) {
	if (this._data.via == 'social') {
		this.entryHeader.innerHTML = ('@' + entry.screen_name);
	} else {
		this.entryHeader.innerHTML = entry.header;
	}
	this.entryText.innerHTML = entry.text;
}
HTMLbuilder.prototype.setupSlide = function(slideIndex, entryIndex) {
	var entry = (this._entryList[entryIndex] || {});
	this.imgCredit.innerHTML = (entry.source || '');
	this.setCaption(entry);
	this.entryIndexElement.innerHTML = entryIndex + 1;
}
HTMLbuilder.prototype.prevIndex = function(index, degree, max) {
	/* helper function to setupNextSlides.
		With given index of array, want index of index of element [degree] indices to the left
		Parameters:
			index (integer) -- current index
			degree (integer) -- number of indexes back of desired result
			max (integer) -- number of total elements in the array
	*/
	var newIndex = index - degree;
	if (newIndex < 0) {
		newIndex += max;
	}
	return newIndex;
}
HTMLbuilder.prototype.nextIndex = function(index, degree, max) {
	/* helper function to setupNextSlides.  Converse of prevIndex */
	return ((index + degree) % max);
}

/* - for Slideshows -------------------------------------------- */
var SlideshowBuilder = function() {
    HTMLbuilder.call(this); // Call the parent constructor
}
// inherit HTMLbuilder and correct the constructor pointer
SlideshowBuilder.prototype = new HTMLbuilder();
SlideshowBuilder.prototype.constructor = SlideshowBuilder;

SlideshowBuilder.prototype.init = function(container, data) {
	HTMLbuilder.prototype.init.call(this, container, data);
	this._container.className += (" slideshow");
}	
SlideshowBuilder.prototype.setupNextSlides = function(slideIndex, entryIndex) {
	/*
		load in the next set of images now.  there are [this.numSlides] image elements in total that we're cyclying through
		formation: img_-2 | img_-1 | img_0 | img_1 |img 2...
	 				0 		 1 		 2 		 3 		4
	*/
	var slideIndexLeft1 = this.prevIndex(slideIndex, 1, this.numSlides);					
	var slideIndexLeft2 = this.prevIndex(slideIndex, 2, this.numSlides);			
	var slideIndexRight1 = this.nextIndex(slideIndex, 1, this.numSlides);
	var slideIndexRight2 = this.nextIndex(slideIndex, 2, this.numSlides);

	var entryIndexLeft1 = this.prevIndex(entryIndex, 1, this._entryList.length);
	var entryIndexLeft2 = this.prevIndex(entryIndex, 2, this._entryList.length);
	var entryIndexRight1 = this.nextIndex(entryIndex, 1, this._entryList.length);
	var entryIndexRight2 = this.nextIndex(entryIndex, 2, this._entryList.length);

	this.setImage(slideIndexLeft1, entryIndexLeft1);
	this.setImage(slideIndexLeft2, entryIndexLeft2);
	this.setImage(slideIndexRight1, entryIndexRight1);
	this.setImage(slideIndexRight2, entryIndexRight2);
}
/* -------------------------------------------- for Slideshows - */

/* - for Polls ------------------------------------------------- */
var PollBuilder = function() {
    HTMLbuilder.call(this); // Call the parent constructor
}
// inherit HTMLbuilder and correct the constructor pointer
PollBuilder.prototype = new HTMLbuilder();
PollBuilder.prototype.constructor = PollBuilder;
PollBuilder.prototype._swipeLeftImg = "/widget/icon/thumbs-down.jpeg";
PollBuilder.prototype._swipeRightImg = "/widget/icon/thumbs-up.jpeg";
PollBuilder.prototype.mobileInstructionsText = "Swipe to vote";

PollBuilder.prototype.init = function(container, data) {
	HTMLbuilder.prototype.init.call(this, container, data);
	this._container.className += (" poll");
}
PollBuilder.prototype.setupNextSlides = function(slideIndex, entryIndex) {
	// formation: nextnextSlide | nextSlide | thisSlide | nextSlide | nextnextSlide
	var numEntries = this._entryList.length;

	this.setImage(this.prevIndex(slideIndex, 1, this.numSlides), this.nextIndex(entryIndex, 1, numEntries));
	this.setImage(this.prevIndex(slideIndex, 2, this.numSlides), this.nextIndex(entryIndex, 2, numEntries));
	this.setImage(this.nextIndex(slideIndex, 1, this.numSlides), this.nextIndex(entryIndex, 1, numEntries));
	this.setImage(this.nextIndex(slideIndex, 2, this.numSlides), this.nextIndex(entryIndex, 2, numEntries));
}
PollBuilder.prototype.complete = function(results) {
	/* Parameter: results -- entryList sorted by upvotes */

	var onclickRefresh = this._onclickPrefix + ".refresh()";
	var html = "<div class='opp-frame complete'>";
		html+= 		this.buildSlideInfo(true);

		html+= "<div class='results-container'>";
		html+= "	<p class='results-title'>Results</p>"
	for (var i=0; i<results.length; i++) {
		var entry = results[i];

		html+= "	<div class='result'>";
		html+= "		<div class='result-image-container'>";
		html+= "			<img height='100px' src='" + entry.img_url + "'>";
		html+= "		</div>";

		html+= "		<div class='result-text'>";
	if (this._data.via == 'social') {
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
		html+= this.buildShareContainer(true);

	this._container.innerHTML = html;
}
	
/* ------------------------------------------------- for Polls */



