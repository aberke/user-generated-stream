
var HuffpostLabsOPP = function(container, data) {
	console.log('HuffpostLabsOPP', data)
	this.container = container;
	this.OPPdata = data;
	this.id = data._id;
	var self = this;

	/* configured in init() */
	this.HTMLbuilder;
	this.SwipeCntl;


	this.slideTransition = function(index, element) {
		self.HTMLbuilder.setSlide(index);
	}
	this.getStartSlide = function() {
    	var regex = new RegExp("[\\?&]OPPslide=([^&#]*)");
        var result = regex.exec(location.search);
        result = (result == null) ? 0 : decodeURIComponent(result[1].replace(/\+/g, " "));
    	result = Number(result);
    	// check that result != NaN and that it is in bounds
    	return (result < this.OPPdata.entryList.length) ? result : 0;
    }


	this.init = function() {
		this.HTMLbuilder = new HTMLbuilder(container, data);
		
		var startSlide = this.getStartSlide();
		console.log('startSlide', startSlide)

		/* must add all slides/setup images before can create Swipe */
		this.HTMLbuilder.buildWidget(function() {
			console.log('************')
			var swipeContainer = self.container.getElementsByClassName('swipe')[0];
			console.log('swipeContainer', swipeContainer)
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
			self.HTMLbuilder.setSlide(startSlide);
		});
	}

	this.init();
}

