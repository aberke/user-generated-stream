
var HuffpostLabsOPP = function(container, data) { // Base Class -- HuffpostLabsPoll inherits from it
	console.log('HuffpostLabsOPP', this, container, data)
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
HuffpostLabsOPP.prototype.buildShareLink = function(entry) {
	var link = (this.OPPdata.share_link || window.location.href);
		link+= ('?OPPslide=' + entry.id);
	return link;
}
HuffpostLabsOPP.prototype.shareFB = function() {
	var entry = this.OPPdata.entryList[this.entryIndex];
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
	var entry = this.OPPdata.entryList[this.entryIndex];
	OPPglobals.shareTwitter({
		'text': this.OPPdata.share_title,
		'link': this.buildShareLink(entry),
		'statID': entry.stat.id,
	});
}

HuffpostLabsOPP.prototype.shareEmail = function() {
	var entry = this.OPPdata.entryList[this.entryIndex];

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
	HuffpostLabsOPP.init.call(this, data);

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
    		frameWidth: 290,
			startSlide: startSlide,
			speed: 400,
			auto: 7000,
			continuous: true,
			disableScroll: false,
			stopPropagation: false,
			callback: function(index, elem) {},
			transitionEnd: slideTransition
		if (numEntries > 0) { self.HTMLbuilder.setSlide(startSlide) };
	});
}

var HuffpostLabsPoll = function(container, data) {
    // Call the parent constructor
    HuffpostLabsOPP.call(this, container, data);
    this.slideIndex;
    this.init(data);
}
// inherit HuffpostLabsOPP and correct the constructor pointer
HuffpostLabsPoll.prototype = new HuffpostLabsOPP();
HuffpostLabsPoll.prototype.constructor = HuffpostLabsPoll;

HuffpostLabsPoll.prototype.init = function(data) {
	HuffpostLabsOPP.prototype.init.call(this, data);
	this.slideIndex = 0;
    this.nextEntryIndex = 1;

	var self = this;
	// when slideTransition called, this is transition event
	var slideTransition = function(index, elem){ self.slideTransition(index, elem); }
	
	// might be a reload - if so reuse HTMLbuilder
	this.HTMLbuilder= new PollBuilder();

	
	/* must add all slides/setup images before can create Swipe */
	this.HTMLbuilder.init(this.container, this.OPPdata, function() {
		var swipeContainer = self.container.getElementsByClassName('swipe')[0];
		self.SwipeCntl = new Swipe(swipeContainer, {
			frameWidth: 290,
			startSlide: 0,
			speed: 400,
			auto: false,
			continuous: true,
			disableScroll: false,
			stopPropagation: false,
			callback: function(index, elem) {},
			transitionEnd: slideTransition
		});
		if (self.numEntries > 0) { self.HTMLbuilder.setSlide(0) };
	});
}
HuffpostLabsPoll.prototype.slideTransition = function(index, element) {
	console.log("slideTransition", index, 'this.entryIndex', this.entryIndex)
		// console.log('slideTransition', index, element)
		if (index == (this.slideIndex + 1)%3) {
			console.log('upvote')
		} else {
			console.log('downvote')
		}
		this.slideIndex = index;

	var slideIndexLeft = (this.slideIndex==0 ? 2 : this.slideIndex-1);
	var slideIndexRight = ((this.slideIndex + 1)%3);
	console.log('slideIndex', this.slideIndex, slideIndexLeft, slideIndexRight)


	this.HTMLbuilder.setSlide(this.nextEntryIndex);
	this.entryIndex += 1;
	this.nextEntryIndex += 1;
	console.log('this.nextEntryIndex', this.nextEntryIndex, this.OPPdata.entryList.length)
	if (this.nextEntryIndex < this.OPPdata.entryList.length) {
		// setup next slide
		this.HTMLbuilder.setImage(slideIndexLeft, this.nextEntryIndex)
		this.HTMLbuilder.setImage(slideIndexRight, this.nextEntryIndex)
	} else {
		console.log('DONE -- TODO')
	}
}

