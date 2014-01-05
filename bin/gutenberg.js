// Constructor
var gutenberg = function(options) {
	this.options = options || {};
}

gutenberg.prototype.sampleMethod = function(options, callback) {

}

// export the class
if (typeof exports === 'object') {
	module.exports = gutenberg;
} else if (typeof define === 'function' && define.amd) {
	define(function() {
		return gutenberg;
	});
} else {
	this.gutenberg = gutenberg;
}