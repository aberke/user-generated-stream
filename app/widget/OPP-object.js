
var HuffpostLabsOPP = function(container, data) { // Base Class -- HuffpostLabsPoll inherits from it
	this.container = container;

	/* configured in init() */
	this.OPPdata;
	this.HTMLbuilder;
	this.SwipeCntl;
	this.entryIndex;
	this.slideMap; // {entryID: slideIndex} for sorting slides - if user got here via share_link, can go right to entry
	this.id;
}

HuffpostLabsOPP.prototype.sortEntries = function() {
	// also create slideMap so that if user got here via share_link, can go right to entry
	for (var i=0; i<this.numEntries; i++) {
		var entry = this.OPPdata.entryList[i];
		entry.points = entry.retweet_count;
		entry.points+= entry.stat.fb_count;
		entry.points+= entry.stat.twitter_count;
		entry.points+= entry.stat.email_count;
	}
	var comparator = function(entry1, entry2) {
		return entry2.points - entry1.points;
	}
	this.OPPdata.entryList = this.OPPdata.entryList.sort(comparator);

	this.slideMap = {}; // {entryID: slideIndex} if user got here via share_link, can go right to entry
	for (var i=0; i<this.numEntries; i++) {
		var entry = this.OPPdata.entryList[i];
		this.slideMap[entry.id] = i;
	}
}
HuffpostLabsOPP.prototype.getEntry = function() {
	return this.OPPdata.entryList[this.entryIndex];
}
HuffpostLabsOPP.prototype.buildShareLink = function(entry) {
	var link = (this.OPPdata.share_link || window.location.href);
		link+= ('?OPPslide=' + entry.id);
	return link;
}
HuffpostLabsOPP.prototype.shareFB = function() {
	var entry = this.getEntry();
	OPPglobals.shareFB({
		'name': this.OPPdata.share_title,
		'picture': entry.img_url,
		'link': this.buildShareLink(entry),
		'caption': this.OPPdata.share_caption,
		'description': ' ',
		'statID': entry.stat.id,
	});
}
HuffpostLabsOPP.prototype.shareTwitter = function() {
	var entry = this.getEntry();
	OPPglobals.shareTwitter({
		'text': this.OPPdata.share_title,
		'link': this.buildShareLink(entry),
		'statID': entry.stat.id,
	});
}

HuffpostLabsOPP.prototype.shareEmail = function() {
	var entry = this.getEntry();

	var subject = "[HuffpostLabs] " + this.OPPdata.share_title;
	var body 	= (this.OPPdata.share_caption + '\n' + this.buildShareLink(entry));
	var mailto 	= ("mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body));
	
	location.href = mailto;
	OPPglobals.shareEmail({'statID': entry.stat.id})
}

HuffpostLabsOPP.prototype.slideTransition = function(index, element) {
	this.entryIndex = (index % this.numEntries);
	this.HTMLbuilder.setSlide(this.entryIndex);
}
HuffpostLabsOPP.prototype.getStartSlide = function() {
	var regex = new RegExp("[\\?&]OPPslide=([^&#]*)");
    var result = regex.exec(location.search);
	if (result) { 
		result = decodeURIComponent(result[1].replace(/\+/g, " "));
		result = this.slideMap[result];
	}
	return (result || 0);
}

HuffpostLabsOPP.prototype.init = function(data) {
	this.OPPdata = data;
	this.id = data.id;
	this.numEntries = this.OPPdata.entryList.length;
	this.entryIndex = 0;
	this.sortEntries();
}
var HuffpostLabsSlideshow = function(container, data) {
    // Call the parent constructor
    HuffpostLabsOPP.call(this, container, data);
    this.init(data);
}
// inherit HuffpostLabsOPP and correct the constructor pointer
HuffpostLabsSlideshow.prototype = new HuffpostLabsOPP();
HuffpostLabsSlideshow.prototype.constructor = HuffpostLabsSlideshow;

HuffpostLabsSlideshow.prototype.init = function(data) {
	HuffpostLabsOPP.prototype.init.call(this, data);

	var self = this;
	// when slideTransition called, this is transition event
	var slideTransition = function(index, elem){ self.slideTransition(index, elem); }
	
	var startSlide = this.getStartSlide();

	// might be a reload - if so reuse HTMLbuilder
	this.HTMLbuilder = (this.HTMLbuilder || new HTMLbuilder());
	
	/* must add all slides/setup images before can create Swipe */
	this.HTMLbuilder.init(this.container, this.OPPdata, function() {
		var swipeContainer = self.container.getElementsByClassName('swipe')[0];
		self.SwipeCntl = new Swipe(swipeContainer, {
    		frameWidth: 265,
			startSlide: startSlide,
			speed: 400,
			auto: 7000,
			continuous: true,
			disableScroll: false,
			stopPropagation: false,
			callback: function(index, elem) {},
			transitionEnd: slideTransition
		});
		if (self.numEntries > 0) { self.HTMLbuilder.setSlide(startSlide) };
	});
}

var HuffpostLabsPoll = function(container, data) {
	/* At Poll completion, shows results and PUTs users votes */
    // Call the parent constructor
    HuffpostLabsOPP.call(this, container, data);
    this.slideIndex;
    this.nextEntryIndex;
    this.complete;
    this.upvotes; // list of statIDs for entries upvoted
    this.downvotes; // list of statIDs for entries downvoted
    this.results; // [] -- entryList sorted by upvotes
    this.init(data);
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

	var self = this;
	// when slideTransition called, this is transition event
	var slideEnd = function(index, elem){ self.slideEnd(index, elem); }
	var slideStart = function(index, elem){ self.slideStart(index, elem); }
	
	// might be a reload - if so reuse HTMLbuilder
	this.HTMLbuilder = new PollBuilder();

	/* must add all slides/setup images before can create Swipe */
	this.HTMLbuilder.init(this.container, this.OPPdata, function() {
		var swipeContainer = self.container.getElementsByClassName('swipe')[0];
		self.SwipeCntl = new Swipe(swipeContainer, {
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
		self.slideEnd(0);
	});
}
/* ---- for sharing ------- */
HuffpostLabsPoll.prototype.buildShareLink = function(entry) {
	return (this.OPPdata.share_link || window.location.href);
}
HuffpostLabsPoll.prototype.getEntry = function() {
	/* of in results page, return top result.  Otherwise return current entry */
	if (this.entryIndex < 0) { // on results page 
		return this.results[0];
	}
	return this.OPPdata.entryList[this.entryIndex];
}
/* ---- for sharing ------- */
HuffpostLabsPoll.prototype.tallyVote = function(prevSlideIndex, newSlideIndex) {
	if (this.entryIndex >= 0) {
		var stat = this.OPPdata.entryList[this.entryIndex].stat;
		if (newSlideIndex == (prevSlideIndex + 1)%3) {
			this.upvotes.push(stat.id);
			this.OPPdata.entryList[this.entryIndex].stat.up_count += 1;
		} else {
			this.downvotes.push(stat.id);
			this.OPPdata.entryList[this.entryIndex].stat.down_count += 1;
		}
	}
}
HuffpostLabsPoll.prototype.slideStart = function(index) {
	if (this.complete) {
		this.tallyVote(this.slideIndex, index); // won't get to slideEnd
		this.entryIndex = -1; // flag for getEntry - must set after tallyVote which uses this.entryIndex
		this.HTMLbuilder.complete(this.results);
		OPPglobals.completeCallback(this.upvotes, this.downvotes);
	}
}
HuffpostLabsPoll.prototype.slideEnd = function(index) {
	if (this.complete) { return; } // should/will NOT be called

	this.tallyVote(this.slideIndex, index);

	this.slideIndex = index;
	this.entryIndex += 1;
	this.nextEntryIndex += 1;
	this.HTMLbuilder.setSlide(this.entryIndex);

	if (this.nextEntryIndex == this.OPPdata.entryList.length) {
		// this is the last slide -- set complete flag and compute results
		this.complete = true;
		this.computeResults();
		return;
	}
	// otherwise set up next slide
	var slideIndexLeft = (this.slideIndex==0 ? 2 : this.slideIndex-1);
	var slideIndexRight = ((this.slideIndex + 1)%3);
	this.HTMLbuilder.setImage(slideIndexLeft, this.nextEntryIndex)
	this.HTMLbuilder.setImage(slideIndexRight, this.nextEntryIndex)
}
HuffpostLabsPoll.prototype.computeResults = function() {
	// compute upvotesPercent/downvotesPercent
	for (var i=0; i<this.OPPdata.entryList.length; i++) {
		var entry = this.OPPdata.entryList[i];
		var totalVotes = entry.stat.up_count + entry.stat.down_count;

		this.OPPdata.entryList[i].upvotesPercent = Math.round((entry.stat.up_count/totalVotes)*100);
		this.OPPdata.entryList[i].downvotesPercent = Math.round((entry.stat.down_count/totalVotes)*100);
	}
	var comparator = function(entry1, entry2) {
		return entry2.upvotesPercent - entry1.upvotesPercent;
	}
	this.results = this.OPPdata.entryList.sort(comparator);
}
HuffpostLabsPoll.prototype.refresh = function() {
	this.init(this.OPPdata);
}

