var request = require('request'),
	async = require('async'),
	temp = require('temp'),
	AdmZip = require('adm-zip'),
	fs = require('fs'),
	path = require('path'),
	mkdirp = require('mkdirp'),
	http = require('http');

temp.track();

var rdfEndpoint = "http://gutenberg.readingroo.ms/cache/generated/feeds/catalog.rdf.zip";
var fileCache = path.join(__dirname, '/cache');

// Constructor
var gutenberg = function(options) {
	this.options = options || {};
}

// Parms: format
gutenberg.prototype.catalogueGetAllDownloadUrls = function(options, callback) {
	_buildIndex(function(err, results) {
		return callback(err, results);
	});
}

var _buildIndex = function(callback) {
	mkdirp(fileCache, function(err) {
		if (err)
			return callback(err);
		var zipPath = path.join(fileCache, '/gutenburg.rdf.zip');
		fs.exists(zipPath,
			function(exists) {
				async.parallel([

						function(done) {
							if (!exists) {
								var file = fs.createWriteStream(zipPath);
								var request = http.get(rdfEndpoint, function(response) {
									response.pipe(file);
									done();
								});
							} else
								done();
						}
					],
					function(err) {
						if (err)
							return callback(err);

						var zip = new AdmZip(zipPath);
						var contents = zip.readAsText("catalog.rdf");

						var idxOfRDFId = 0;
						var results = [];
						do {
							idxOfRDFId = contents.indexOf('\"etext', idxOfRDFId);
							if (idxOfRDFId > -1) {
								idxOfRDFId += 6;
								var indexOfLastQuote = contents.indexOf('\"', idxOfRDFId);
								var value = contents.substr(idxOfRDFId, indexOfLastQuote - idxOfRDFId);
								idxOfRDFId += 6;

								results.push('http://www.gutenberg.org/ebooks/' + value + '.txt.utf-8');
							}
						} while (idxOfRDFId > 0);

						callback(null, results);
					});
			});
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