var request = require('request'),
	async = require('async'),
	AdmZip = require('adm-zip'),
	fs = require('fs'),
	path = require('path'),
	mkdirp = require('mkdirp'),
	http = require('http'),
	libxmljs = require("libxmljs");

// Constructor
var gutenberg = function(options) {
	this.options = options || {};

	this._endpoints = {
		catalogue: this.options.catalogue || "http://gutenberg.readingroo.ms/cache/generated/feeds/catalog.rdf.zip"
	};
	this._cacheDir = this.options.cacheDir || path.join(__dirname, '/cache');
	this._zipFile = this.options.rdfFile || path.join(this._cacheDir, 'gutenberg.rdf.zip');
}

// Parms: format
gutenberg.prototype.catalogueGetRecords = function(options, callback) {
	var self = this;
	this._fetchCatalogue(function(err) {
		self._parseRecords(function(err, records) {
			return callback(err, records);
		});
	});
}

gutenberg.prototype._parseRecords = function(callback) {
	var results = [];

	var zip = new AdmZip(this._zipFile);
	var data = zip.readAsText("catalog.rdf");

	var startMatch = "<pgterms:etext";
	var endMatch = "</pgterms:etext>";
	var startIndex = 0;
	while (startIndex > -1) {
		startIndex = data.indexOf(startMatch, startIndex);
		if (startIndex > -1) {
			var endIndex = data.indexOf(endMatch, startIndex + startMatch.length);
			var fragment = data.substr(startIndex, endIndex - startIndex + endMatch.length);
			var parsed = this._parseRecord(fragment);
			startIndex = endIndex + endMatch.length;
			results.push(parsed);
		}
	}

	return callback(null, results);
}


gutenberg.prototype._parseRecord = function(record) {
	var response = {};
	try {
		var cleanRecord = record.replace(/dc:/g, '').replace(/pgterms:/g, '').replace(/rdf:/g, '').replace(/xsd:/g, '').replace(/&lic;/g, 'public').replace(/dcterms:/g, '').replace(/&pg;/g, 'gutenberg');

		var xmlDoc = libxmljs.parseXml(cleanRecord);
		response.id = xmlDoc.root().attr('ID').value();
		xmlDoc.root().childNodes().forEach(function(c) {
			if (c.name() != null && c.name() != 'text')
				response[c.name()] = c.text();
		});
	} catch (ex) {
		console.log("not able to parse fragment");
	}
	return response;
}

gutenberg.prototype._fetchCatalogue = function(callback) {
	var self = this;
	mkdirp(this._cacheDir, function(err) {
		if (err)
			return callback(err);

		async.waterfall([

				function(done) {
					// download the zip if needed
					fs.exists(self._zipFile,
						function(exists) {
							if (!exists) {
								console.log('fetching rdf');
								http.get(self._endpoints.catalogue, function(response) {
									if (response.statusCode !== 200) {
										return done(response.statusCode);
									}

									var fd = fs.openSync(self._zipFile, 'w');
									response.on("data", function(chunk) {
										fs.write(fd, chunk, 0, chunk.length, null, function(err, written, buffer) {
											if (err) {
												return done(err);
											}
										});
									});

									response.on("end", function() {
										fs.closeSync(fd);
										done();
									});
								}).on('error', function(e) {
									return done(e);
								});
							} else
								done();
						});
				}
			],
			function(err) {
				if (err)
					return callback(err);
				return callback(null);
			});
	});
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