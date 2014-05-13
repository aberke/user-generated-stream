
var HuffpostLabsOPP = function(container, data) {
	console.log('HuffpostLabsOPP', data)
	this.container = container;
	this.OPPdata = data;
	// can't put in this because this.slideTransition needs it and is called by window
	var num_entries = this.OPPdata.entryList.length;
	this.id = data._id;
	var self = this;

	/* configured in init() */
	this.HTMLbuilder;
	this.SwipeCntl;

	// called by window so this==window
	this.slideTransition = function(index, element, f) {
		self.HTMLbuilder.setSlide(index%num_entries);
	}
	this.getStartSlide = function() {
    	var regex = new RegExp("[\\?&]OPPslide=([^&#]*)");
        var result = regex.exec(location.search);
        result = (result == null) ? 0 : decodeURIComponent(result[1].replace(/\+/g, " "));
    	result = Number(result);
    	// check that result != NaN and that it is in bounds
    	return (result < num_entries) ? result : 0;
    }


	this.init = function() {
		this.HTMLbuilder = new HTMLbuilder(container, data);
		
		var startSlide = this.getStartSlide();
		console.log('startSlide', startSlide)

		/* must add all slides/setup images before can create Swipe */
		this.HTMLbuilder.buildWidget(function() {
			var swipeContainer = self.container.getElementsByClassName('swipe')[0];
			self.SwipeCntl = new Swipe(swipeContainer, {
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

	this.init();
}

