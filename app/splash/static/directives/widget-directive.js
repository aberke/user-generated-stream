/* widget directive 

<huffpostlabs-opp-widget opp=opp entryList=[]></huffpostlabs-opp-widget>


Only supports showing one entry
opp and entry should be included as attributes
*/

var oppWidget = function() {
	/*
	h, w 

	newH = 50 = h*f
	newW = w*g 

	newW/newH = w/h

	newW/50 = w/h 
	newW 	= (w/h)*50
	*/
	var pictureFrameDimension = 290;

	function addImg(scope, element) {
		/* mimics addImg function in HTML-builder
			-- adds image to the image-container and sizes/aligns image properly
		*/
		var container = element.context.getElementsByClassName('image-container')[0];

		var img = document.createElement('img');
		img.onload = function() {
			if (!img.height) { console.log('ERROR: !img.height'); return; }

			// if height > width: horizontally center image
			if (img.height > img.width) {
				img.style.height = (pictureFrameDimension + "px");
				// browser will handle the rest
				return;
			}
			// else width <= height: vertically center image - handle short img awkwardly sticking to top of container
			var originalWidth = img.width;
			var originalHeight = img.height;
			img.width = pictureFrameDimension;
			img.height = (originalHeight/originalWidth)*pictureFrameDimension;
			var extra_space = pictureFrameDimension - img.height;
			img.style.marginTop = (extra_space/2).toString() + "px";
		};
		img.src = scope.entry.img_url;
		container.appendChild(img);
	}

	return {
		restrict: 'E',
		scope: {
			opp: '=opp',
			entry: '=entry'
		},
		replace: true,
		templateUrl: '/directives/widget-template.html',
		link: function(scope, element, attrs) {
			addImg(scope, element);
		}
	}
}