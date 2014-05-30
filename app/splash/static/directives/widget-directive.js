/* widget directive 
Mimics HTML-builder 

<huffpostlabs-opp-widget opp=opp entryList=[]></huffpostlabs-opp-widget>


Only supports showing one entry
opp and entry should be included as attributes
*/

var oppWidget = function() {
	var pictureFrameDimension = 290;

	function setImg(img, img_url) {
		if (!img_url) { return; }
		/* mimics setImg function in HTML-builder */
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
		img.src = img_url;
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
			var img = element.context.getElementsByClassName('entry-image')[0];
			setImg(img, scope.entry.img_url);
			scope.$watch('entry.img_url', function(newValue, oldValue) {
				setImg(img, newValue);
			});
		}
	}
}






