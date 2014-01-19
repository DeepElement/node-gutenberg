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
	var documentRoot = this._rsyncDir;
	if (keyClean.length > 0) {
		documentRoot = path.join(documentRoot, keyClean[0]);
	}
	if (keyClean.length > 1) {
		documentRoot = path.join(documentRoot, keyClean[1]);
	}

	if (keyClean.length > 2) {
		documentRoot = path.join(documentRoot, keyClean[2]);
	}

	if (keyClean.length > 3) {
		documentRoot = path.join(documentRoot, keyClean[3]);
	}

	var documentRoot = path.join(documentRoot, keyClean);
	var contentZipFile = path.join(documentRoot, keyClean + ".zip");
	try {
		var zip = new AdmZip(contentZipFile);
		var data = zip.readAsText(keyClean + ".txt");
		this._ContentParseRecord(
			data, callback);
	} catch (ex) {
		return callback(ex);
	}
}

// Parms: format
gutenberg.prototype.catalogueGetRecords = function(options, callback) {
	var self = this;
	self._CatalogueParseRecords(function(err, records) {
		return callback(err, records);
	});
}

gutenberg.prototype._ContentParseRecord = function(content, callback) {

	var indexOfHeaderStart = content.indexOf("*** START OF THIS PROJECT GUTENBERG");
	var indexOfHeaderEnd = content.indexOf('\n', indexOfHeaderStart);
	var header = content.substr(0, indexOfHeaderEnd);

	var indexOfFooterStart = content.indexOf("End of the Project Gutenberg");
	var footer = content.substr(indexOfFooterStart, content.length);

	var cleanContent = content.substr(indexOfHeaderEnd, indexOfFooterStart - indexOfHeaderEnd);

	var indexAuthorStart = header.indexOf('Author:');
	var indexAuthorEnd = header.indexOf('\n', indexAuthorStart);
	var authorsList = header.substr(indexAuthorStart, indexAuthorEnd - indexAuthorStart).replace("Author:", "").trim().split('and');
	var authors = [];
	authorsList.forEach(function(a) {
		authors.push(a.trim());
	});

	var indexOfTitleStart = header.indexOf("Title:");
	var indexOfTitleEnd = header.indexOf('\n', indexOfTitleStart);
	var title = header.substr(indexOfTitleStart, indexOfTitleEnd - indexOfTitleStart).replace("Title:", "").trim();

	var indexOfLanguageStart = header.indexOf("Language:");
	var indexOfLanguageEnd = header.indexOf('\n', indexOfLanguageStart);
	var language = header.substr(indexOfLanguageStart, indexOfLanguageEnd - indexOfLanguageStart).replace("Language:", "").trim();

	var result = {
		title: title,
		language: language,
		authors: authors,
		content : cleanContent
	};
	return callback(null, result);
}

gutenberg.prototype._CatalogueParseRecords = function(callback) {
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