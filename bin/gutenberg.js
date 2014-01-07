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
	this._rdfZipFile = this.options.rdfZipFile;
	this._rsyncDir = this.options.catalogDir;
}

gutenberg.prototype.getCatalogueItemByKey = function(key, callback) {
	var keyClean = key.replace('etext', '');
	var documentRoot = path.join(this._rsyncDir, keyClean[0], keyClean[1], keyClean[2],keyClean[3], keyClean);
	var contentZipFile = path.join(documentRoot, keyClean + ".zip");
	var zip = new AdmZip(contentZipFile);
	var data = zip.readAsText(keyClean + ".txt");
	callback(null, data);
}

// Parms: format
gutenberg.prototype.catalogueGetRecords = function(options, callback) {
	var self = this;
	self._parseRecords(function(err, records) {
		return callback(err, records);
	});
}

gutenberg.prototype._parseRecords = function(callback) {
	var results = [];

	var zip = new AdmZip(this._rdfZipFile);
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