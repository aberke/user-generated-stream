

var HTMLbuilder = function(container, data) {
	this.container = container;
	this.data = data;
	this.entryList = data.entryList;

	var pictureFrameHeight = 240;
	var static_domain = "http://127.0.0.1:3000";

	// handle short img awkwardly sticking to top of container
	function addImg(container, img_url, callback) {
	 	if (!img_url) { return; }

		var img = document.createElement('img');
		img.onload = function() {
			if (!img.height || img.height > img.width) { return; }
			
			var extra_space = pictureFrameHeight - img.height;
			img.style.marginTop = (extra_space/2).toString() + "px";
			if (callback) { callback(); }
		};
		container.appendChild(img);
		img.src=img_url;
	}

	this.buildSlideInfo = function() {
		var onclickPrev = "OPPwidgets[1].SwipeCntl.prev()";
		var onclickNext = "OPPwidgets[1].SwipeCntl.next()";
		var html = "<div class='slide-info'>"
			html+= "	<p class='campaign-name'>#" + this.data.title + "</p>";
			html+= "	<p class='slide-count'>";
			html+= "		<span class='slide-index'>1</span>/" + this.entryList.length;
			html+= "		<img onclick=" + onclickPrev + " class='touch' width='10px' src='" + static_domain + "/widget/icon/left-arrow.png'>";
			html+= "		<img onclick=" + onclickNext + " class='touch' width='10px' src='" + static_domain + "/widget/icon/right-arrow.png'>";
			html+= "	</p>";
			html+= "</div>";
		return html;
	}
	this.addImages = function(callback) {
		var imageContainers = this.container.getElementsByClassName('image-container');
		var called = 0;
		var waitingOn = this.entryList.length;
		var call = function() {
			called += 1;
			if (called >= waitingOn) { callback(); }
		}
		for (var i=0; i<this.entryList.length; i++) {
			addImg(imageContainers[i], this.entryList[i].img_url, call);
		}
	}
	this.buildPicture = function() {
		var html = "<div class='picture-frame'>";
			html+= "	<div class='picture swipe'>";
			html+= "		<div class='swipe-wrap'>";
		for (var i=0; i<this.entryList.length; i++) {
			html+= "			<div class='image-container image-container-" + i + "'></div>";
		}
			html+= "		</div>";
			html+= "	</div>";
			html+= "</div>";
		return html;
	}
	this.setCaption = function(entry) {
		var html = "<em>@" + entry.username + ": </em>";
			html+= entry.tweet_text;
		this.tweetBody.innerHTML = html;
	}
	this.setSlide = function(index) {
		var entry = this.entryList[index];
		this.setCaption(entry);
		this.slideIndex.innerHTML = index + 1;
	}
	this.buildCaption = function() {
		var html = "<div class='picture-caption'>";
			html+= "<p class='tweet-body'></p>";	
			html+= "	<div class='share-container'>";
			html+= "		<p>Upvote via sharing</p>";
			html+= "		<div class='fb-share share'>";
			html+= "			<img width='30px' height='30px' class='share share-btn' src='" + static_domain + "/widget/icon/fb-icon.png'>";
			html+= "			<img class='share share-btn-swap' width='30px' height='30px' src='" + static_domain + "/widget/icon/fb-icon-blue.png'>";
			html+= "		</div>";
			html+= "		<div class='twitter-share share'>";
			html+= "			<img width='30px' height='30px' class='share share-btn' src='" + static_domain + "/widget/icon/twitter-icon.png'>";
			html+= "			<img class='share share-btn-swap' width='30px' height='30px' src='" + static_domain + "/widget/icon/twitter-icon-blue.png'>";
			html+= "		</div>";
			html+= "		<div class='email-share share'>";
			html+= "			<img width='30px' height='30px' class='share email-share-btn' src='" + static_domain + "/widget/icon/email.png'>";
			html+= "		</div>";
			html+= "	</div>";
			html+= "</div>";
		return html;
	}

	this.buildWidget = function(callback) {

		var html = "<div class='opp-container'>";
			html+= "	<div class='opp-frame'>";
			html+= this.buildSlideInfo();
			html+= this.buildPicture();
			html+= this.buildCaption();

			html+="		</div>";
			html+="</div>";
		this.container.innerHTML = html;

		// add the images to the image-containers
		this.addImages(callback);

		// pick up the important reusable pieces
		this.tweetBody = this.container.getElementsByClassName('tweet-body')[0];
		this.slideIndex = this.container.getElementsByClassName('slide-index')[0];
	}
	
}
	









