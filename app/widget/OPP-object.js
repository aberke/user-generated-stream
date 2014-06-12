/*******************************************************************************
--------------------------------------------------------------------------------

	Author: Alexandra Berke (aberke)
	Written: May 2014

	Notes:
		- HuffpostLabsOPP is base class extended by HuffpostLabsPoll and HuffpostLabsSlideshow.
		- instantiated for each OPP widget on the page by /widget/o.js
		- HuffpostLabsOPP owns a HTMLbuilder (see HTML-builder.js) to handle building HTML
					owns a SwipeCntl (see swipe.js in /vender) to handle slide transitions
--------------------------------------------------------------------------------
*********************************************************************************/



var HuffpostLabsOPP = function(container, data) { // Base Class
	this.container = container;
	this.HTMLbuilder; // instantiated as either a PollBuilder or a SlideshowBuilder class

	/* configured in init() */
	this.data;
	this.SwipeCntl;
	this.slideIndex; // index of the slide element
	this.entryIndex; // index of the entry data in data.entryList
	this.slideMap; // {entryID: slideIndex} for sorting slides - if user got here via share_link, can go right to entry
	this.id;

	if (!container || !data) { return; } // only being called for inheritance definition
	this.init(data);
}
HuffpostLabsOPP.prototype.sortEntries = function() {
	/*  Sort entries based on how popular they are
		also create slideMap so that if user got here via share_link, can go right to entry
	*/
	for (var i=0; i<this.numEntries; i++) {
		var entry = this.data.entryList[i];
		entry.points = entry.retweet_count;
		entry.points+= entry.stat.fb_count;
		entry.points+= entry.stat.twitter_count;
		entry.points+= entry.stat.email_count;
	}
	var comparator = function(entry1, entry2) {
		return entry2.points - entry1.points;
	}
	this.data.entryList = this.data.entryList.sort(comparator);

	this.slideMap = {}; // {entryID: slideIndex} if user got here via share_link, can go right to entry
	for (var i=0; i<this.numEntries; i++) {
		var entry = this.data.entryList[i];
		this.slideMap[entry.id] = i;
	}
}
HuffpostLabsOPP.prototype.getEntry = function() {
	/* get currently shown entry -- only used by sharing functions */
	return this.data.entryList[this.entryIndex];
}
HuffpostLabsOPP.prototype.buildShareLink = function(entry) {
	var link = (this.data.share_link || window.location.href);
		link+= ('?OPPslide=' + entry.id);
	return link;
}
HuffpostLabsOPP.prototype.shareFB = function() {
	var entry = this.getEntry();
	OPPglobals.shareFB({
		'name': this.data.share_title,
		'picture': entry.img_url,
		'link': this.buildShareLink(entry),
		'caption': this.data.share_caption,
		'description': ' ',
		'statID': entry.stat.id,
	});
}
HuffpostLabsOPP.prototype.shareTwitter = function() {
	var entry = this.getEntry();
	OPPglobals.shareTwitter({
		'text': this.data.share_title,
		'link': this.buildShareLink(entry),
		'statID': entry.stat.id,
	});
}

HuffpostLabsOPP.prototype.shareEmail = function() {
	var entry = this.getEntry();

	var subject = "[HuffpostLabs] " + this.data.share_title;
	var body 	= (this.data.share_caption + '\n' + this.buildShareLink(entry));
	var mailto 	= ("mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body));
	
	location.href = mailto;
	OPPglobals.shareEmail({'statID': entry.stat.id})
}

HuffpostLabsOPP.prototype.getStartSlide = function() {
	/* some users navigate to page by following link of shared widget 
		- if so: go to the slide that was shared
		- else: start at slide 0
	*/
	var regex = new RegExp("[\\?&]OPPslide=([^&#]*)");
    var result = regex.exec(location.search);
	if (result) { 
		result = decodeURIComponent(result[1].replace(/\+/g, " "));
		result = this.slideMap[result];
	}
	return (result || 0);
}

HuffpostLabsOPP.prototype.init = function(data) {
	console.log('HuffpostLabsOPP init', this, data)
	this.data = data;
	this.id = data.id;
	this.numEntries = this.data.entryList.length;
	this.sortEntries(); // must come before getStartSlide
	this.slideIndex = 0;
	this.entryIndex = this.getStartSlide();

	/* build widget */
	this.HTMLbuilder.init(this.container, this.data);

	/* do not set up swipe if no entries */
	if (!this.data.entryList.length) {  return; }

	var self = this;

	var onSwipe = function(index, elem){ self.onSwipe(index, elem); }
	var onSwipeEnd = function(index, elem){ self.onSwipeEnd(index, elem); }

	this.HTMLbuilder.getPictureFrameDimension(function(frameDimension) {

		var swipeContainer = self.container.getElementsByClassName('swipe')[0];
		self.SwipeCntl = new Swipe(swipeContainer, {
			frameWidth: frameDimension,
			speed: 400,
			auto: false,
			continuous: true,
			disableScroll: false,
			stopPropagation: false,
			callback: onSwipe,
			transitionEnd: onSwipeEnd,
		});
		self.HTMLbuilder.setImage(self.slideIndex, self.entryIndex);
		self.HTMLbuilder.setupSlide(self.slideIndex, self.entryIndex);
		self.HTMLbuilder.setupNextSlides(self.slideIndex, self.entryIndex);

		self.mobileInstructionsSetup();
	});
}
HuffpostLabsOPP.prototype.cookieName = "OPPmobile";
HuffpostLabsOPP.prototype.mobileInstructionsSetup = function() {
	/* if mobile and mobile cookie not set, show mobile instructions 
		show the instructions once ever to the user
			- don't show once for each OPP -- never show again for as long as cookie persists
			- cookie is set on all pages for domain of this page
	*/
	var noCookie = (document.cookie.indexOf(this.cookieName) == -1);
	noCookie = true;
	if (OPPglobals.mobile && noCookie) {
		this.HTMLbuilder.showMobileInstructions();
	}
}
HuffpostLabsOPP.prototype.mobileInstructionsOnclick = function() {
	/* function fired when the mobile instructions are clicked on 
		- hide instructiosn because user wants to start OPP 
		- set cookie so we don't show them again
	*/
	this.HTMLbuilder.hideMobileInstructions();
	document.cookie = (this.cookieName + "; path=/"); // let cookie persist on all pages of this domain
}
HuffpostLabsOPP.prototype.prev = function() {
	if (this.SwipeCntl) { this.SwipeCntl.prev(); }
}
HuffpostLabsOPP.prototype.next = function() {
	if (this.SwipeCntl) { this.SwipeCntl.next(); }
}
HuffpostLabsOPP.prototype.onSwipe = function(index, element) {
	/* callback for swipe action */
	if (index == (this.slideIndex + 1)%3) { // swipe right
		this.entryIndex += 1;
	} else { // swipe left
		this.entryIndex -= 1;
	}
	this.entryIndex = ((this.entryIndex + this.numEntries) % this.numEntries);
	this.slideIndex = index;
	this.HTMLbuilder.setupSlide(this.slideIndex, this.entryIndex);
}
HuffpostLabsOPP.prototype.onSwipeEnd = function() {
	/* callback for end of swipe action */
	this.HTMLbuilder.setupNextSlides(this.slideIndex, this.entryIndex);
}
var HuffpostLabsSlideshow = function(container, data) {
    // Call the parent constructor
	this.HTMLbuilder = new SlideshowBuilder();
    HuffpostLabsOPP.call(this, container, data);
}
// inherit HuffpostLabsOPP and correct the constructor pointer
HuffpostLabsSlideshow.prototype = new HuffpostLabsOPP();
HuffpostLabsSlideshow.prototype.constructor = HuffpostLabsSlideshow;

HuffpostLabsSlideshow.prototype.init = function(data) {
	HuffpostLabsOPP.prototype.init.call(this, data);
}

var HuffpostLabsPoll = function(container, data) {
	/* At Poll completion, shows results and PUTs users votes */
	this.HTMLbuilder = new PollBuilder();
    HuffpostLabsOPP.call(this, container, data);
    this.complete; // flag that poll is completed and must show results
    this.upvotes; // list of statIDs for entries upvoted
    this.downvotes; // list of statIDs for entries downvoted
    this.results; // [] -- entryList sorted by upvotes to show after this.completed==true
}
// inherit HuffpostLabsOPP and correct the constructor pointer
HuffpostLabsPoll.prototype = new HuffpostLabsOPP();
HuffpostLabsPoll.prototype.constructor = HuffpostLabsPoll;

HuffpostLabsPoll.prototype.init = function(data) {
	HuffpostLabsOPP.prototype.init.call(this, data);
	this.complete = false;
    this.upvotes = []; // list of statIDs for entries upvoted
    this.downvotes = []; // list of statIDs for entries downvoted
    this.resultMap = []; // [] -- entryList sorted by upvotes
}
HuffpostLabsPoll.prototype.onSwipe = function(index) {
	/* called at start of swipe transition */
	this.tallyVote(this.slideIndex, index);
	this.slideIndex = index;
	this.entryIndex += 1;

	if (this.complete || this.numEntries == 1) { // show results -- poll complete
		this.computeResults();
		this.HTMLbuilder.complete(this.results);
		OPPglobals.completeCallback(this.upvotes, this.downvotes);
		this.entryIndex = -1; // flag for getEntry - must set after tallyVote which uses this.entryIndex
	} else if ((this.entryIndex + 1) == this.data.entryList.length) {
		this.complete = true; // this is the last slide -- set complete flag
	}
	this.HTMLbuilder.setupSlide(this.slideIndex, this.entryIndex);
}
HuffpostLabsPoll.prototype.tallyVote = function(prevSlideIndex, newSlideIndex) {
	var stat = this.data.entryList[this.entryIndex].stat;
	if (newSlideIndex == (prevSlideIndex + 1)%3) {
		console.log('upvote')
		this.upvotes.push(stat.id);
		this.data.entryList[this.entryIndex].stat.up_count += 1;
	} else {
		console.log('downvote')
		this.downvotes.push(stat.id);
		this.data.entryList[this.entryIndex].stat.down_count += 1;
	}
	// compute upvote/downvote percentages for results sorting
	var entry = this.data.entryList[this.entryIndex];
	var totalVotes = (entry.stat.up_count + entry.stat.down_count || 1); // avoid division by 0

	this.data.entryList[this.entryIndex].upvotesPercent = Math.round((entry.stat.up_count/totalVotes)*100);
	this.data.entryList[this.entryIndex].downvotesPercent = Math.round((entry.stat.down_count/totalVotes)*100);
}
HuffpostLabsPoll.prototype.computeResults = function() {
	var comparator = function(entry1, entry2) {
		return entry2.upvotesPercent - entry1.upvotesPercent;
	}
	this.results = this.data.entryList.sort(comparator);
}
/* - for sharing ---------------------- */
HuffpostLabsPoll.prototype.buildShareLink = function(entry) {
	return (this.data.share_link || window.location.href);
}
HuffpostLabsPoll.prototype.getEntry = function() {
	/* if in results page, return top result.  Otherwise return current entry */
	if (this.entryIndex < 0) { // on results page 
		return this.results[0];
	}
	return this.data.entryList[this.entryIndex];
}
/* ---------------------- for sharing - */
HuffpostLabsPoll.prototype.refresh = function() {
	this.init(this.data);
}

