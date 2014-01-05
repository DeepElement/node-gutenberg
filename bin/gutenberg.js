var request = require('request'),
	async = require('async');

// Constructor
var gutenberg = function(options) {
	this.options = options || {};
}

// Parms: format
gutenberg.prototype.catalogueGetAllDownloadUrls = function(options, callback) {
	var format = options.format;
	var urls = [];
	var lastUrlInterval = -1;
	var offset = 0;

	async.whilst(function() {
			var test = lastUrlInterval != 0;
			return test;
		}, function(done) {
			var gutenbergUrl = "http://www.gutenberg.org/robot/harvest?offset=" + offset + "&filetypes[]=" + format;
			request(gutenbergUrl, function(error, response, body) {
				if(error)
					return done(error);
				if (!error && response.statusCode == 200) {
					var candidateUrls = body.match(/href="([^"]*")/g);
					var foundUrls = 0;
					candidateUrls.forEach(function(u) {
						if (u.indexOf('http://www.gutenberg.lib.md.us/') > -1) {
							foundUrls++;
							urls.push(u);
						}
					});
					lastUrlInterval = foundUrls;
					offset += foundUrls;
				}
				return done();
			});
		},
		function(err) {
			callback(null, urls);
		});
}

// export the class
if (typeof exports === 'object') {
	module.exports = new gutenberg();
} else if (typeof define === 'function' && define.amd) {
	define(function() {
		return new gutenberg();
	});
} else {
	this.gutenberg = new gutenberg();
}