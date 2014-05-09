/* widget directive 

<huffpostlabs-opp-widget opp=opp entryList=[]></huffpostlabs-opp-widget>


Only supports showing one entry
opp and entry should be included as attributes
*/

var oppWidget = function() {

	return {
		restrict: 'E',
		scope: {
			opp: '=opp',
			entry: '=entry'
		},
		replace: true,
		templateUrl: '/directives/widget-template.html',
		link: function(scope, element, attrs) {
		}
	}
}