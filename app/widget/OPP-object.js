
var HuffpostLabsOPP = function(container, data) { // Base Class -- HuffpostLabsPoll inherits from it
	console.log('HuffpostLabsOPP', this, container, data)
	this.container = container;
	var self = this; // many of objects called by window

	/* configured in init() */
	this.OPPdata;
	this.HTMLbuilder;
	this.SwipeCntl;
	this.num_entries;
	this.current_slide;
	this.slide_map; // {entryID: slideIndex} for sorting slides
	this.id;
}


HuffpostLabsOPP.prototype.sortEntries = function() {
	// also create slide_map so that if user got here via share_link, can go right to entry
	for (var i=0; i<num_entries; i++) {
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


	this.slide_map = {}; // {entryID: slideIndex}
	for (var i=0; i<num_entries; i++) {
		var entry = this.OPPdata.entryList[i];
		this.slide_map[entry.id] = i;
	}
}

HuffpostLabsOPP.prototype.buildShareLink = function(entry) {
	var link = (this.OPPdata.share_link || window.location.href);
		link+= ('?OPPslide=' + entry.id);
	return link;
}
HuffpostLabsOPP.prototype.shareFB = function() {
	var entry = this.OPPdata.entryList[current_slide];
	OPPglobals.shareFB({
		'name': ('#' + this.OPPdata.title),
		'picture': entry.img_url,
		'link': this.buildShareLink(entry),
		'caption': entry.text,
		'description': 'TODO',
		'statID': entry.stat.id,
	});
}
HuffpostLabsOPP.prototype.shareTwitter = function() {
	var entry = this.OPPdata.entryList[current_slide];
	OPPglobals.shareTwitter({
		'text': "Look at this widget!",
		'link': this.buildShareLink(entry),
		'statID': entry.stat.id,
	});
}
HuffpostLabsOPP.prototype.shareEmail = function() {
	var entry = this.OPPdata.entryList[current_slide];

	var subject = "[HuffpostLabs] #" + this.OPPdata.title;
	var body 	= (this.buildShareLink(entry));
	var mailto 	= ("mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body));

	location.href = mailto;
	OPPglobals.shareEmail({'statID': entry.stat.id})
}

HuffpostLabsOPP.prototype.slideTransition = function(index, element) {
	current_slide = (index % num_entries);
	this.HTMLbuilder.setSlide(current_slide);
}
HuffpostLabsOPP.prototype.getStartSlide = function() {
	var regex = new RegExp("[\\?&]OPPslide=([^&#]*)");
    var result = regex.exec(location.search);
	if (result) { 
		result = decodeURIComponent(result[1].replace(/\+/g, " "));
		result = this.slide_map[result];
	}
	return (result || 0);
}

HuffpostLabsOPP.prototype.init = function(data) {
	var self = this;
	// when slideTransition called, this is transition event
	var slideTransition = function(index, elem){ self.slideTransition(index, elem); }
	
	this.OPPdata = data;
	num_entries = this.OPPdata.entryList.length;
	current_slide = 0;
	this.id = data.id;
	this.sortEntries();

	// might be a reload - if so reuse HTMLbuilder
	this.HTMLbuilder = (this.HTMLbuilder || new HTMLbuilder());
	
	var startSlide = this.getStartSlide();

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
		});
		if (num_entries > 0) { self.HTMLbuilder.setSlide(startSlide) };
	});
}
var HuffpostLabsSlideshow = function(container, data) {
    // Call the parent constructor
    HuffpostLabsOPP.call(this, container, data);
    this.init(data);
}
// inherit HuffpostLabsOPP and correct the constructor pointer
HuffpostLabsSlideshow.prototype = new HuffpostLabsOPP();
HuffpostLabsSlideshow.prototype.constructor = HuffpostLabsOPP;

var HuffpostLabsPoll = function(container, data) {
    // Call the parent constructor
    HuffpostLabsOPP.call(this, container, data);
    this.init(data);
    return;

	var entryList = data.entryList;
	var slides = container.getElementsByClassName('image-container');
	var len = entryList.length;
	var e;
	var s;

	var slideIndexElem = container.getElementsByClassName('slide-index')[0];
	var slideCountElem = container.getElementsByClassName('slide-count')[0];
	slideCountElem.innerHTML = len;

	var fillSlide = function(s, e) {
		slides[s].innerHTML += ("<br/>SLIDE " + s + " - ENTRY " + e);
	}
	var slideTransition = function(index, element) {
		console.log('slideTransition', index, element)
		if (index == (s + 1)%len) {
			console.log('upvote')
		} else {
			console.log('downvote')
		}
		s = index;
		slideIndexElem.innerHTML = s + 1;

		var s_less = (s==0 ? len-1 : s-1);

		fillSlide(s_less, e+1);
		fillSlide((s+1)%len, e+1);
		e += 1;
	}
	var setup = function() {
		e = 0;
		s = 0;
		fillSlide(0, 0)
		slideTransition(0)
	}

	var swipeContainer = container.getElementsByClassName('swipe')[0];
	var SwipeCntl = new Swipe(swipeContainer, {
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
	setup();

	window.downvote = function() {
		SwipeCntl.prev();
	}
	window.upvote = function() {
		SwipeCntl.next();
	}
}
// inherit HuffpostLabsOPP and correct the constructor pointer
HuffpostLabsPoll.prototype.constructor = HuffpostLabsOPP;
