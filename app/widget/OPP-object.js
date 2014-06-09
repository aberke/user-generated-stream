/*
	HuffpostLabsOPP is base class extended by HuffpostLabsPoll and HuffpostLabsSlideshow.

	HuffpostLabsOPP owns a HTMLbuilder (see HTML-builder.js) to handle building HTML
					owns a SwipeCntl (see swipe.js in /vender) to handle slide transitions
*/


var HuffpostLabsOPP = function(container, data) { // Base Class -- HuffpostLabsPoll inherits from it
	this.container = container;
	this.HTMLbuilder;

	/* configured in init() */
	this.data;
	this.SwipeCntl;
	this.entryIndex;
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

HuffpostLabsOPP.prototype.slideTransition = function(index, element) {
	/* callback for swipe action */
	this.entryIndex = (index % this.numEntries);
	this.HTMLbuilder.setSlide(this.entryIndex);
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
	this.entryIndex = 0;
	this.sortEntries();
}
HuffpostLabsOPP.prototype.prev = function() {
	if (this.SwipeCntl) { this.SwipeCntl.prev(); }
}
HuffpostLabsOPP.prototype.next = function() {
	if (this.SwipeCntl) { this.SwipeCntl.next(); }
}
var HuffpostLabsSlideshow = function(container, data) {
    // Call the parent constructor
	this.HTMLbuilder = new HTMLbuilder();
    HuffpostLabsOPP.call(this, container, data);
}
// inherit HuffpostLabsOPP and correct the constructor pointer
HuffpostLabsSlideshow.prototype = new HuffpostLabsOPP();
HuffpostLabsSlideshow.prototype.constructor = HuffpostLabsSlideshow;

HuffpostLabsSlideshow.prototype.init = function(data) {
	HuffpostLabsOPP.prototype.init.call(this, data);

	/* build widget */
	this.HTMLbuilder.init(this.container, this.data);
	/* do not set up swipe if no entries */
	if (!this.data.entryList.length) {  return; }

	var self = this;
	// on swipe event callback
	var slideTransition = function(index, elem){ self.slideTransition(index, elem); }
	
	var startSlide = this.getStartSlide();

	var swipeContainer = this.container.getElementsByClassName('swipe')[0];
	this.SwipeCntl = new Swipe(swipeContainer, {
		frameWidth: 265,
		startSlide: startSlide,
		speed: 400,
		auto: false,
		continuous: true,
		disableScroll: false,
		stopPropagation: false,
		callback: function(index, elem) {},
		transitionEnd: slideTransition
	});
	this.HTMLbuilder.setSlide(startSlide);
}

var HuffpostLabsPoll = function(container, data) {
	/* At Poll completion, shows results and PUTs users votes 
	*/
	this.HTMLbuilder = new PollBuilder();
    HuffpostLabsOPP.call(this, container, data);
    this.slideIndex; // different than this.entryIndex - this is the HTML element, entryIndex is the data
    this.nextEntryIndex;
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
	this.entryIndex = -1;
    this.nextEntryIndex = 0;
	this.complete = false;
    this.upvotes = []; // list of statIDs for entries upvoted
    this.downvotes = []; // list of statIDs for entries downvoted
    this.resultMap = []; // [] -- entryList sorted by upvotes
	
	/* build widget */
	this.HTMLbuilder.init(this.container, this.data);

	/* do not set up swipe if no entries */
	if (!this.data.entryList.length) {  return; }

	var self = this;
	// there are two event callbacks for user swipe - at start and end
	var slideStart = function(index, elem){ self.slideStart(index, elem); }
	var slideEnd = function(index, elem){ self.slideEnd(index, elem); }

	var swipeContainer = this.container.getElementsByClassName('swipe')[0];
	this.SwipeCntl = new Swipe(swipeContainer, {
		frameWidth: 265,
		startSlide: 0,
		speed: 400,
		auto: false,
		continuous: true,
		disableScroll: false,
		stopPropagation: false,
		callback: slideStart,
		transitionEnd: slideEnd,
	});
	this.slideEnd(0);
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
HuffpostLabsPoll.prototype.slideStart = function(index) {
	/* called at START of swipe transition */
	this.tallyVote(this.slideIndex, index);
	if (this.complete) { // show results -- poll complete
		this.computeResults();
		this.HTMLbuilder.complete(this.results);
		OPPglobals.completeCallback(this.upvotes, this.downvotes);
		this.entryIndex = -1; // flag for getEntry - must set after tallyVote which uses this.entryIndex
	}
}
HuffpostLabsPoll.prototype.slideEnd = function(index) {
	/* called at END of swipe transition (or in init) */
	
	this.slideIndex = index;
	this.entryIndex += 1;
	this.nextEntryIndex += 1;
	this.HTMLbuilder.setSlide(this.entryIndex);

	if (this.nextEntryIndex == this.data.entryList.length) {
		// this is the last slide -- set complete flag and compute results
		this.complete = true;
		return;
	}
	// otherwise set up next slide --- nextSlide | thisSlide | nextSlide
	var slideIndexLeft = (this.slideIndex==0 ? 2 : this.slideIndex-1);
	var slideIndexRight = ((this.slideIndex + 1)%3);
	this.HTMLbuilder.setImage(slideIndexLeft, this.nextEntryIndex)
	this.HTMLbuilder.setImage(slideIndexRight, this.nextEntryIndex)
}
HuffpostLabsPoll.prototype.computeResults = function() {
	var comparator = function(entry1, entry2) {
		return entry2.upvotesPercent - entry1.upvotesPercent;
	}
	this.results = this.data.entryList.sort(comparator);
}
HuffpostLabsPoll.prototype.refresh = function() {
	this.init(this.data);
}

