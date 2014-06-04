
var HuffpostLabsOPP = function(container, data) {
	console.log('HuffpostLabsOPP', data)
	this.container = container;
	this.OPPdata;
	// can't put in this because this.slideTransition needs it and is called by window
	var num_entries;
	var current_slide;
	this.slide_map; // {entryID: slideIndex}
	this.id;
	var self = this;

	this.sortEntries = function() {
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

	/* configured in init() */
	this.HTMLbuilder;
	this.SwipeCntl;

	this.buildShareLink = function(entry) {
		var link = (this.OPPdata.share_link || window.location.href);
			link+= ('?OPPslide=' + entry.id);
		return link;
	}
	this.shareFB = function() {
		var entry = this.OPPdata.entryList[current_slide];
		OPPglobals.shareFB({
			'name': this.OPPdata.share_title,
			'picture': entry.img_url,
			'link': this.buildShareLink(entry),
			'caption': this.OPPdata.share_caption,
			'description': '',
			'statID': entry.stat.id,
		});
	}
	this.shareTwitter = function() {
		var entry = this.OPPdata.entryList[current_slide];
		console.log('shareTwitter', this.OPPdata.share_title)
		OPPglobals.shareTwitter({
			'text': this.OPPdata.share_title,
			'link': this.buildShareLink(entry),
			'statID': entry.stat.id,
		});
	}
	this.shareEmail = function() {
		var entry = this.OPPdata.entryList[current_slide];

		var subject = "[HuffpostLabs] " + this.OPPdata.share_title;
		var body 	= (this.OPPdata.share_caption + '\n' + this.buildShareLink(entry));
		var mailto 	= ("mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body));

		location.href = mailto;
		OPPglobals.shareEmail({'statID': entry.stat.id})
	}

	// called by window so this==window
	this.slideTransition = function(index, element) {
		current_slide = (index % num_entries);
		self.HTMLbuilder.setSlide(current_slide);
	}
	this.getStartSlide = function() {
    	var regex = new RegExp("[\\?&]OPPslide=([^&#]*)");
        var result = regex.exec(location.search);
    	if (result) { 
    		result = decodeURIComponent(result[1].replace(/\+/g, " "));
    		result = this.slide_map[result];
    	}
    	return (result || 0);
    }

	this.init = function(data) {
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
				transitionEnd: self.slideTransition
			});
			if (num_entries > 0) { self.HTMLbuilder.setSlide(startSlide) };
		});
	}

	this.init(data);
}

